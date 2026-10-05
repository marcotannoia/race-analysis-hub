"""Acquisizione riprendibile OpenF1; nessuna scrittura su Atlas.
Uso: python3 backend/scripts/raccogliEvidenzeGiri.py /cartella/cache
30 richieste/minuto: intervallo prudenziale 2.2 s, retry con backoff.
"""
import datetime, hashlib, json, pathlib, sys, time, urllib.error, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = pathlib.Path(sys.argv[1]); CACHE.mkdir(parents=True, exist_ok=True)
NOMI = {'Zandvoort':'zandvoort','Monza':'monza','Madring':'madring','Baku':'baku','Kuala Lumpur':'sepang','Singapore':'marina-bay','Austin':'austin','Mexico City':'mexico-city','Interlagos':'interlagos','Las Vegas':'las-vegas','Lusail':'lusail','Yas Marina Circuit':'yas-marina'}
base = json.loads((ROOT/'data/campioni-previsionali-2026.json').read_text())
last = 0
manifest = []
def get(endpoint, query, filename):
 global last
 url = 'https://api.openf1.org/v1/'+endpoint+'?'+query
 p = CACHE/filename
 if p.exists():
  raw=p.read_bytes(); return json.loads(raw),url,hashlib.sha256(raw).hexdigest()
 for attempt in range(5):
  time.sleep(max(0,2.2-(time.monotonic()-last))); last=time.monotonic()
  try:
   raw=urllib.request.urlopen(url,timeout=40).read(); data=json.loads(raw)
   p.write_bytes(raw); return data,url,hashlib.sha256(raw).hexdigest()
  except urllib.error.HTTPError as e:
   if e.code==404: return [],url,None
   if e.code not in [429,500,502,503,504]: raise
   time.sleep(10*(attempt+1))
 raise RuntimeError('Acquisizione fallita: '+url)
sessions,_,_=get('sessions','year>=2023&session_name=Race','sessions.json')
cutoff=datetime.datetime.fromisoformat(sys.argv[2]) if len(sys.argv)>2 else datetime.datetime.now(datetime.timezone.utc)
if cutoff.tzinfo is None:cutoff=cutoff.replace(tzinfo=datetime.timezone.utc)
selected=[]
for s in sessions:
 year=s['year']; cid=NOMI.get(s['circuit_short_name'])
 if year not in [2023,2024,2025,2026] or s.get('is_cancelled') or datetime.datetime.fromisoformat(s['date_end'])>=cutoff:continue
 if year<2026 and not cid:continue
 if year==2026:
  gp=next((g for g in base['gare'] if g['year']==year and g['date'][:10] in [s['date_start'][:10],(datetime.datetime.fromisoformat(s['date_start'])-datetime.timedelta(days=1)).date().isoformat()] and (not cid or g['circuitId']==cid)),None)
  if not gp or gp['round']>base['ultimoRoundIncluso']:continue
  cid=gp['circuitId']
 else: gp=None
 selected.append({**s,'circuitId':cid,'round':gp['round'] if gp else None})
print('Sessioni selezionate:',len(selected),flush=True)
for i,s in enumerate(selected):
 files={}
 for endpoint in ['drivers','laps','stints','pit','race_control','weather','intervals']:
  data,url,sha=get(endpoint,'session_key='+str(s['session_key']),str(s['session_key'])+'-'+endpoint+'.json')
  files[endpoint]={'url':url,'sha256':sha,'record':len(data)}
 manifest.append({'sessione':s,'file':files})
 (CACHE/'manifest.json').write_text(json.dumps({'acquisitoIlUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'fonte':'https://openf1.org/docs/','sessioni':manifest},indent=2)+'\n')
 print(f"{i+1}/{len(selected)} {s['year']} {s['circuitId']} {s['session_key']}: "+', '.join(k+'='+str(v['record']) for k,v in files.items()),flush=True)
