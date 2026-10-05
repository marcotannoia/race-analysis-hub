"""Deriva indicatori descrittivi dai giri OpenF1, con filtri espliciti.
Non stima il degrado fisico: la pendenza relativa conserva limiti di
carburante, assetto e modalità di guida. Nessuna scrittura su MongoDB.
"""
import bisect, collections, hashlib, json, math, pathlib, statistics, sys
from datetime import datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
DRY={'SOFT','MEDIUM','HARD'}
def stamp(s):return datetime.fromisoformat(s).timestamp()
def med(xs):return statistics.median(xs) if xs else None
def rnd(x,n=3):return round(x,n) if x is not None else None
def pendenza(xs):
 if len(xs)<10 or max(x[0] for x in xs)-min(x[0] for x in xs)<8:return None
 return med([(b[1]-a[1])/(b[0]-a[0]) for i,a in enumerate(xs) for b in xs[i+1:] if b[0]-a[0]>=5])
def analizza(sessione,raw,ids):
 laps=raw['laps']; stints=raw['stints']; pit=raw['pit'];weather=sorted(raw['weather'],key=lambda r:r['date']);wt=[stamp(r['date']) for r in weather]
 intervals=collections.defaultdict(list)
 for x in raw['intervals']:intervals[x['driver_number']].append(x)
 for seq in intervals.values():seq.sort(key=lambda x:x['date'])
 it={d:[stamp(x['date']) for x in seq] for d,seq in intervals.items()}
 windows=[];deployed=None
 for r in sorted(raw['race_control'],key=lambda x:x['date']):
  t=stamp(r['date']);m=r['message'].upper()
  if r.get('flag')=='YELLOW':windows.append((t-5,t+60))
  if r.get('flag')=='RED' or ('DEPLOYED' in m and 'SAFETY CAR' in m):
   if deployed is None:deployed=t
  if deployed is not None and (r.get('flag')=='GREEN' or 'SAFETY CAR IN THIS LAP' in m or 'VIRTUAL SAFETY CAR ENDING' in m):
   windows.append((deployed,t+240));deployed=None
 if deployed is not None:windows.append((deployed,float('inf')))
 bydriver=collections.defaultdict(list);excluded=collections.defaultdict(collections.Counter)
 pits=collections.defaultdict(set)
 for p in pit:
  if isinstance(p.get('lap_number'),int):pits[p['driver_number']].update([p['lap_number']-1,p['lap_number'],p['lap_number']+1])
 stintmap=collections.defaultdict(list)
 for s in stints:stintmap[s['driver_number']].append(s)
 for l in laps:
  d=l['driver_number'];n=l['lap_number'];duration=l.get('lap_duration');ss=[s for s in stintmap[d] if isinstance(s.get('lap_start'),int) and isinstance(s.get('lap_end'),int) and s['lap_start']<=n<=s['lap_end']]
  reason=None
  if not isinstance(duration,(int,float)) or not math.isfinite(duration) or duration<=0 or not l.get('date_start'):reason='tempo_incompleto'
  elif n<=2 or l.get('is_pit_out_lap') or n in pits[d]:reason='partenza_o_pit'
  elif len(ss)!=1 or ss[0]['compound'] not in DRY:reason='mescola_non_asciutta_o_stint_ambiguo'
  if reason:excluded[d][reason]+=1;continue
  start=stamp(l['date_start']);end=start+duration
  if any(start<=b and end>=a for a,b in windows):reason='bandiere_o_neutralizzazione'
  wi=bisect.bisect_right(wt,start)-1
  if wi<0 or start-wt[wi]>120 or weather[wi].get('rainfall')!=0:reason='meteo_bagnato_o_non_verificato'
  ii=bisect.bisect_right(it.get(d,[]),start)-1
  interval=intervals[d][ii].get('interval') if ii>=0 else None
  if ii<0 or start-it[d][ii]>10:reason='traffico_non_verificato'
  elif interval is not None and (not isinstance(interval,(int,float)) or interval<1.5):reason='traffico'
  # null è previsto per il leader; il gap leader deve confermarlo.
  elif interval is None and intervals[d][ii].get('gap_to_leader') not in [None,0,0.0]:reason='traffico_non_verificato'
  if reason:excluded[d][reason]+=1;continue
  s=ss[0];age=s.get('tyre_age_at_start')
  if not isinstance(age,(int,float)) or age<0:excluded[d]['eta_non_verificata']+=1;continue
  bydriver[d].append({'giro':n,'mescola':s['compound'],'eta':age+n-s['lap_start'],'tempo':duration,'stint':s['stint_number']})
 # Confronto sulla stessa tornata, mescola e fascia di età (+/-5 giri).
 allrows=[(d,x) for d,xs in bydriver.items() for x in xs];bylap=collections.defaultdict(list)
 for d,x in allrows:bylap[x['giro']].append((d,x))
 comparable=collections.defaultdict(list)
 for d,x in allrows:
  others=[y['tempo'] for dd,y in bylap[x['giro']] if dd!=d and y['mescola']==x['mescola'] and abs(y['eta']-x['eta'])<=5]
  if len(others)<3:excluded[d]['riferimento_insufficiente']+=1;continue
  ref=med(others);delta=100*(x['tempo']/ref-1)
  if abs(delta)>12:excluded[d]['anomalia_cronometrica']+=1;continue
  comparable[d].append({**x,'deltaPercentuale':delta,'riferimentoSecondi':ref,'altriPiloti':len(others)})
 out=[]
 for driver in raw['drivers']:
  d=driver['driver_number'];xs=comparable[d];sx=collections.defaultdict(list)
  for x in xs:sx[x['stint']].append((x['eta'],x['deltaPercentuale']))
  slopes=[{'stint':s,'giriComparabili':len(v),'pendenzaPercentualePerGiro':rnd(pendenza(sorted(v)))} for s,v in sx.items() if pendenza(sorted(v)) is not None]
  full=[{'numero':s['stint_number'],'mescola':s['compound'],'giroInizio':s['lap_start'],'giroFine':s['lap_end'],'etaIniziale':s.get('tyre_age_at_start'),'giri':max(0,(s.get('lap_end') or 0)-(s.get('lap_start') or 1)+1)} for s in stintmap[d]]
  out.append({'driverId':ids.get(driver['name_acronym']),'codice':driver['name_acronym'],'numero':d,'teamOpenF1':driver['team_name'],
    'giriRegistrati':sum(1 for l in laps if l['driver_number']==d),'giriComparabili':len(xs),'giriEsclusi':dict(excluded[d]),
    'passo':{'deltaMedianoPercentuale':rnd(med([x['deltaPercentuale'] for x in xs])) if len(xs)>=8 else None,'tempoMedianoSecondi':rnd(med([x['tempo'] for x in xs])),'campione':len(xs),'overall':None},
    'gomme':{'stint':full,'stintComparabili':slopes,'pendenzaRelativaPercentualePerGiro':rnd(med([x['pendenzaPercentualePerGiro'] for x in slopes])),'campione':len(slopes),'overall':None}})
 for key,measure in [('passo','deltaMedianoPercentuale'),('gomme','pendenzaRelativaPercentualePerGiro')]:
  valid=sorted([p for p in out if p[key][measure] is not None],key=lambda p:(p[key][measure],p['driverId'] or p['codice']))
  for p in valid:
   # Pareggi: rango medio, indipendente dall'ordine alfabetico.
   rank=med([i for i,x in enumerate(valid) if x[key][measure]==p[key][measure]])
   p[key]['overall']=rnd(100*(len(valid)-1-rank)/(len(valid)-1),1) if len(valid)>1 else None
 return out

def main(cache,rawdir):
 cache=pathlib.Path(cache);manifest=json.loads((cache/'manifest.json').read_text());rawdir=pathlib.Path(rawdir)
 rr=json.loads((rawdir/'f1db-races-race-results.json').read_text());gps=json.loads((rawdir/'f1db-races.json').read_text());drivers=json.loads((rawdir/'f1db-drivers.json').read_text());ids={d['abbreviation']:d['id'] for d in drivers if d.get('abbreviation')}
 output={'versione':'giri-comparabili-v1','acquisitoIlUTC':manifest['acquisitoIlUTC'],'fonte':'https://openf1.org/docs/','metodo':{'passo':'Mediana del delta % rispetto ad almeno 3 altri piloti nella stessa tornata e mescola, età gomme entro +/-5 giri; >=8 giri per indice. Rango medio inverso nel campione della sessione.','gomme':'Pendenza Theil-Sen del delta relativo per età, entro stint asciutto con >=10 giri comparabili e ampiezza >=8; mediana delle pendenze. Rango inverso descrittivo, non misura del degrado fisico.','filtri':['prime due tornate','pit in/out e tornate adiacenti','mescole wet/intermediate','pioggia o meteo oltre 120 s','traffico sotto 1.5 s o dato oltre 10 s','yellow +/- margine, SC/VSC/red e 240 s dopo fine','stint/età mancanti o ambigui','meno di 3 confronti','delta assoluto oltre 12%'],'limiti':'Carburante, carico, gestione, danni, doppiaggi e temperature non isolati. Traffico verificato solo all’inizio del giro. Indice descrittivo condizionato ai giri selezionati, non potenziale assoluto né previsione certa.'},'sessioni':[]}
 for m in manifest['sessioni']:
  s=m['sessione'];s['circuitId']={'americas':'austin','rodriguez':'mexico-city'}.get(s['circuitId'],s['circuitId']);g=next((g for g in gps if g['year']==s['year'] and g['circuitId']==s['circuitId']),None)
  if not g:raise ValueError('Circuito F1DB non trovato '+str(s))
  raw={}
  for endpoint,meta in m['file'].items():
   p=cache/(str(s['session_key'])+'-'+endpoint+'.json');data=p.read_bytes() if p.exists() else b'[]'
   if meta['sha256'] and hashlib.sha256(data).hexdigest()!=meta['sha256']:raise ValueError('Hash errato '+str(p))
   raw[endpoint]=json.loads(data)
  sport={r['driverId']:r['constructorId'] for r in rr if r['raceId']==g['id']}
  idsSessione={d['abbreviation']:d['id'] for d in drivers if d['id'] in sport}
  ps=analizza(s,raw,idsSessione)
  for p in ps:
   if p['driverId'] not in sport:raise ValueError('Pilota/sessione non riscontrato '+str(p))
   p['constructorId']=sport[p['driverId']]
  output['sessioni'].append({'sessionKey':s['session_key'],'raceId':g['id'],'year':s['year'],'round':g['round'],'circuitId':s['circuitId'],'data':g['date'],'fonti':m['file'],'riepilogo':{'safetyCar':sum('SAFETY CAR DEPLOYED' in r['message'] and 'VIRTUAL' not in r['message'] for r in raw['race_control']),'vsc':sum('VIRTUAL SAFETY CAR DEPLOYED' in r['message'] for r in raw['race_control']),'bandiereRosse':sum(r.get('flag')=='RED' for r in raw['race_control']),'pioggiaRegistrata':any(w.get('rainfall') for w in raw['weather']),'temperaturaPistaMin':min((w['track_temperature'] for w in raw['weather'] if isinstance(w.get('track_temperature'),(int,float))),default=None),'temperaturaPistaMax':max((w['track_temperature'] for w in raw['weather'] if isinstance(w.get('track_temperature'),(int,float))),default=None)},'piloti':ps})
 dest=ROOT/'data/evidenze-giri-2023-2026.json';dest.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 print('Sessioni:',len(output['sessioni']),'piloti:',sum(len(s['piloti']) for s in output['sessioni']))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
