"""Completa il catalogo con le approssimazioni autorizzate il 29/10/2026.
Fonti di ogni valore, formule e qualità restano esplicite. Nessun accesso al DB.
"""
import bisect
import concurrent.futures
import datetime as dt
import json
import math
import statistics as stats
import urllib.parse
from raccogliDatiCircuiti import ROOT, acquisisci, voce

FILE = ROOT/'data/similarita-circuiti-2026.json'
LIMITE = dt.datetime(2026,10,29,23,59,59,tzinfo=dt.timezone.utc)
MAPPE = dict(zip(
 ['melbourne','shanghai','suzuka','miami','montreal','monaco','catalunya','spielberg','silverstone','spa-francorchamps','hungaroring','zandvoort','monza','madring','baku','sepang','marina-bay','austin','mexico-city','interlagos','las-vegas','lusail','yas-marina'],
 ['au-1953','cn-2004','jp-1962','us-2022','ca-1978','mc-1929','es-1991','at-1969','gb-1948','be-1925','hu-1986','nl-1948','it-1922','es-2026','az-2016','my-1999','sg-2008','us-2012','mx-1962','br-1940','us-2023','qa-2004','ae-2009']))
ALIAS = {'monaco':'monte-carlo','marina-bay':'singapore','lusail':'losail','yas-marina':'yas-marina-circuit'}
ALIAS_API = {'madring':'Madring','sepang':'Kuala Lumpur','baku':'Baku'}
FONTE_DISLIVELLO = 'https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc'
DISLIVELLI = {'melbourne':2.6,'shanghai':7.4,'suzuka':40.4,'montreal':5.2,'monaco':42,'catalunya':29.6,'spielberg':63.5,'silverstone':11.3,'spa-francorchamps':102.2,'hungaroring':34.7,'monza':12.8,'baku':26.8,'sepang':22,'marina-bay':5.3,'austin':30.9,'mexico-city':2.8,'interlagos':43,'yas-marina':10.7}
ALTRI_DISLIVELLI = {
 'madring':(26,'https://www.madring.com/en/circuit'),
 'zandvoort':(15,'https://www.shell.nl/over-ons/nieuws/shell-venster-2025/zandvoort.html'),
 'miami':(3,'https://perencz.hu/f1/circuit/miami/info/'),
 'las-vegas':(12,'https://paddockweather.com/circuits.php'),
 'lusail':(4.2,'https://oversteer48.com/lusail-international-circuit-layout/'),
}
CARICO = dict(zip(MAPPE, ['alto','medio','alto','medio','basso','alto','alto','medio','alto','basso','alto','alto','basso','medio','basso','alto','alto','alto','alto','alto','basso','alto','medio']))
FONTE_OVERTAKE = 'https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa'


def interp(xs,ys,t):
    i=bisect.bisect_right(xs,t)
    if i==0:return ys[0]
    if i==len(xs):return ys[-1]
    f=(t-xs[i-1])/(xs[i]-xs[i-1])
    return ys[i-1]+f*(ys[i]-ys[i-1])


def smooth(xs,r=2):
    return [stats.mean(xs[max(0,i-r):min(len(xs),i+r+1)]) for i in range(len(xs))]


def gruppi_circolari(mask):
    """Indici dei tratti veri, ricucendo il tratto a cavallo del traguardo."""
    if not mask or not any(mask):return []
    if all(mask):return [list(range(len(mask)))]
    inizio=next(i for i,x in enumerate(mask) if not x)
    gruppi=[];corrente=[]
    for k in range(1,len(mask)+1):
        i=(inizio+k)%len(mask)
        if mask[i]:corrente.append(i)
        elif corrente:gruppi.append(corrente);corrente=[]
    if corrente:gruppi.append(corrente)
    return gruppi


def geometria(coordinate,lunghezza_km):
    """Centrolinea pubblica: campionamento a 10 m e rettifili >=150 m.
    La soglia è una convenzione esplicita per stimare tratti quasi rettilinei.
    """
    lat0=math.radians(stats.mean(p[1] for p in coordinate));lon0=coordinate[0][0];la0=coordinate[0][1]
    punti=[((p[0]-lon0)*111320*math.cos(lat0),(p[1]-la0)*111320) for p in coordinate]
    if punti[-1]!=punti[0]:punti.append(punti[0])
    dist=[0.0];xs=[punti[0][0]];ys=[punti[0][1]]
    for a,b in zip(punti,punti[1:]):
        ds=math.hypot(b[0]-a[0],b[1]-a[1])
        if ds<0.01:continue
        dist.append(dist[-1]+ds);xs.append(b[0]);ys.append(b[1])
    lunghezza=dist[-1];n=max(100,round(lunghezza/10));passo=lunghezza/n
    x=[interp(dist,xs,i*passo) for i in range(n)];y=[interp(dist,ys,i*passo) for i in range(n)]
    theta=[math.atan2(y[(i+3)%n]-y[(i-3)%n],x[(i+3)%n]-x[(i-3)%n]) for i in range(n)]
    angoli=[math.atan2(math.sin(theta[(i+3)%n]-theta[(i-3)%n]),math.cos(theta[(i+3)%n]-theta[(i-3)%n])) for i in range(n)]
    mask=[abs(a)<math.radians(8) for a in angoli]
    # Chiude brevi interruzioni <=30 m dovute alla discretizzazione della mappa.
    for g in gruppi_circolari([not x for x in mask]):
        if len(g)*passo<=30:
            for i in g:mask[i]=True
    gruppi=[g for g in gruppi_circolari(mask) if len(g)*passo>=150]
    segni=[]
    for a in angoli:
        s=1 if a>math.radians(8) else -1 if a<math.radians(-8) else 0
        if s and (not segni or s!=segni[-1]):segni.append(s)
    cambi=sum(a!=b for a,b in zip(segni,segni[1:]+segni[:1]))
    return {'numeroRettilinei':len(gruppi),'lunghezzaRettilineiKm':round(sum(len(g)*passo for g in gruppi)/lunghezza*lunghezza_km,4),'cambiDirezionePerKm':round(cambi/lunghezza_km,4),'lunghezzaMappaKm':round(lunghezza/1000,4),'rettilineiKm':[round(len(g)*passo/lunghezza*lunghezza_km,4) for g in gruppi]}


def metrica_telemetrica(car,location):
    """Medie cinematiche indicative; campioni irregolari, non sensori IMU."""
    car=sorted({r['date']:r for r in car if isinstance(r.get('speed'),(int,float)) and 10<r['speed']<450}.values(),key=lambda r:r['date'])
    if len(car)<30:raise ValueError('Telemetria insufficiente')
    t=[dt.datetime.fromisoformat(r['date']).timestamp() for r in car]
    velocita=[r['speed'] for r in car];v=smooth([x/3.6 for x in velocita])
    frenate=[]
    for i in range(1,len(t)-1):
        delta=t[i+1]-t[i-1]
        if not 0<delta<2:continue
        g=(v[i+1]-v[i-1])/delta/9.80665
        if car[i].get('brake') and -6.5<=g<-.2:frenate.append(-g)
    res={'gFrenataMedia':stats.mean(frenate) if frenate else None,'campioniFrenata':len(frenate),'velocitaMassimaKmh':max(velocita),'velocitaMinimaKmh':min(velocita)}
    if not location:return res
    loc=sorted({r['date']:r for r in location if all(isinstance(r.get(k),(int,float)) for k in ('x','y'))}.values(),key=lambda r:r['date'])
    if len(loc)<30:return res
    lt=[dt.datetime.fromisoformat(r['date']).timestamp() for r in loc]
    x=smooth([r['x'] for r in loc]);y=smooth([r['y'] for r in loc])
    heading=[math.atan2(y[i+1]-y[i-1],x[i+1]-x[i-1]) for i in range(1,len(loc)-1)]
    gs=[];vs=[]
    for i in range(1,len(heading)-1):
        j=i+1;delta=lt[j+1]-lt[j-1]
        if not 0<delta<2:continue
        d=math.atan2(math.sin(heading[i+1]-heading[i-1]),math.cos(heading[i+1]-heading[i-1]))
        speed=interp(t,velocita,lt[j]);g=abs(d/delta)*(speed/3.6)/9.80665
        if .2<=g<=6.5:gs.append(g)
        if .5<=g<=6.5:vs.append(speed)
    if len(gs)>=20:res.update(gLateraleMedia=stats.mean(gs),campioniLaterali=len(gs))
    if len(vs)>=20:res['velocitaCurveKmh']=stats.mean(vs)
    return res


def stima(valore,fonti,metodo,**extra):
    return voce(round(valore,4) if isinstance(valore,(int,float)) and not isinstance(valore,bool) else valore,fonti,metodo,stato='stimato',**extra)


def main():
    catalogo=json.loads(FILE.read_text());riferimenti=json.loads((ROOT/'data/fonti-similarita/riferimenti-curve-web.json').read_text())
    sessions=acquisisci('https://api.openf1.org/v1/sessions?year=2026&session_name=Qualifying') or []
    races=acquisisci('https://api.openf1.org/v1/sessions?year=2026&session_name=Race') or []
    races_storiche={}
    for anno in (2023,2024,2025):
        for race in acquisisci(f'https://api.openf1.org/v1/sessions?year={anno}&session_name=Race') or []:
            races_storiche[race['session_key']]=race
    def completa(c):
        cid=c['circuitId'];campi=c['campi'];km=c['lunghezzaKm'];campi.pop('richiestaAccelerazione',None)
        fonte_geo=f'https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/{MAPPE[cid]}.geojson'
        geo=acquisisci(fonte_geo)
        if geo:
            feature=next(f for f in geo['features'] if f['geometry']['type']=='LineString')
            dati=geometria(feature['geometry']['coordinates'],km)
            for k in ('numeroRettilinei','lunghezzaRettilineiKm','cambiDirezionePerKm'):
                campi[k]=stima(dati[k],[fonte_geo],'Stima dalla centrolinea pubblica: campioni ~10 m, svolta <8° su 60 m, tratto rettilineo >=150 m, interruzioni <=30 m ricucite; lunghezze riscalate al giro ufficiale.',attribuzione='Copyright 2019–2025 Tomislav Bacinger; MIT licence')
            c['geometriaIndicativa']=dati
        ref=riferimenti.get(ALIAS.get(cid,cid))
        if ref and ref['direzioni']:
            ds=ref['direzioni'];cambi=sum(a!=b for a,b in zip(ds,ds[1:]+ds[:1]))
            campi['cambiDirezionePerKm']=stima(cambi/km,[ref['fonte']],'Conteggio delle alternanze sinistra/destra delle curve pubblicate, incluso il passaggio ultima–prima, diviso per km.',alternanzePerGiro=cambi)
        if ref and ref.get('gMedia'):
            campi['gLateralePerKm']=stima(ref['gMedia']/km,[ref['fonte']],'Media dei carichi laterali delle curve pubblicate / km del giro. Valori indicativi da un giro di riferimento; non media temporale di tutto il giro.',gRiferimento=round(ref['gMedia'],4),campione=ref['gCampione'])
        if ref and ref.get('velocitaCurveMedia'):
            campi['velocitaCurveKmh']=stima(ref['velocitaCurveMedia'],[ref['fonte']],'Media delle velocità minime delle curve pubblicate. Riferimento indicativo della velocità in curva; non media ponderata sulla distanza.')
        if cid in DISLIVELLI:h,fonte=DISLIVELLI[cid],FONTE_DISLIVELLO
        else:h,fonte=ALTRI_DISLIVELLI[cid]
        campi['dislivelloMedio']=stima(h,[fonte],'Dislivello di riferimento pubblicato, punto più alto meno punto più basso (metri). Sostituisce la pendenza media, come approssimazione autorizzata.',tipoMisura='massimo_meno_minimo')
        # Tre categorie: classificazione indicativa basata sulle guide e sul profilo pista.
        fonte_carico = 'https://www.renault.jp/information/pdf/factfile_2017Malaysia.pdf' if cid=='sepang' else campi['numeroCurve']['fonti'][0]
        if cid in ('monaco','hungaroring','zandvoort','monza','baku','spa-francorchamps','las-vegas'):
            fonte_carico='https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained'
        campi['caricoAerodinamico']=stima(CARICO[cid],[fonte_carico],'Classificazione tecnica indicativa in tre categorie; interpretazione del profilo geometrico e delle guide, non misura di forza aerodinamica.',classificazioneEditoriale=True)
        campi['zoneSorpasso']=stima(1,[FONTE_OVERTAKE],'Configurazione standard Overtake 2026: un punto di rilevamento e una linea di attivazione per giro. Non è il numero di zone DRS storiche né quello delle zone Straight Mode.',sistema='overtake-2026',verifica='regola_generale_non_mappa_evento')
        # Le due sedi prive di storico OpenF1 usano la gara 2026 già conclusa.
        if cid in ('madring','sepang'):
            race=next((s for s in races if s['circuit_short_name']==ALIAS_API[cid] and dt.datetime.fromisoformat(s['date_end'])<=LIMITE),None)
            if race:
                url=f"https://api.openf1.org/v1/weather?session_key={race['session_key']}";rows=acquisisci(url) or []
                rows=[r for r in rows if race['date_start']<=r.get('date','')<=race['date_end']]
                for key,api in [('temperaturaAsfaltoC','track_temperature'),('temperaturaAriaC','air_temperature'),('umiditaPercentuale','humidity'),('ventoMs','wind_speed')]:
                    vals=[r[api] for r in rows if isinstance(r.get(api),(int,float))]
                    if vals:campi[key]=stima(stats.mean(vals),[url],'Media della gara 2026 già conclusa: sostituto esplicito dello storico F1 2023–2025 non disponibile.',anni=[2026],campione=len(vals),periodoAlternativo=True)
                c['meteoEdizioni']=[{'anno':2026,'pioggia':any(r.get('rainfall')==1 for r in rows),'fonte':url}]
        else:
            fonti=campi['meteoMedio']['fonti'];edizioni=[]
            for url in fonti:
                rows=acquisisci(url) or []
                key=int(urllib.parse.parse_qs(urllib.parse.urlparse(url).query)['session_key'][0]);race=races_storiche.get(key)
                if race:rows=[r for r in rows if race['date_start']<=r.get('date','')<=race['date_end']]
                if rows:
                    pioggia=any(r.get('rainfall')==1 for r in rows)
                    edizioni.append({'anno':race['year'] if race else None,'pioggia':pioggia,'fonte':url})
            c['meteoEdizioni']=edizioni
        edizioni=c.get('meteoEdizioni',[])
        if edizioni:
            p=stats.mean(int(e['pioggia']) for e in edizioni)
            fonti=[e['fonte'] for e in edizioni]
            campi['meteoMedio']=stima('si' if p>=.5 else 'no',fonti,'Pioggia sì/no: maggioranza delle edizioni osservate; parità classificata come sì. Dettagli per edizione conservati.',frazioneEdizioniPiovose=p)
            campi['variabilitaMeteo']=stima(100*4*p*(1-p),fonti,'Variabilità pioggia/asciutto: 4×p×(1−p)×100. Zero con tutte le edizioni uguali; 100 con metà piovose. Una sola edizione dà zero osservato, non stabilità climatica.',edizioni=len(edizioni),campioneLimitato=len(edizioni)<2)
        # Telemetria di riferimento già acquisita, o qualifica 2026 per Baku/Madrid/Sepang.
        carurl=next(iter(campi['velocitaMassimaKmh'].get('fonti',[])),None)
        lap=None;session=None
        if not carurl:
            session=next((s for s in sessions if s['circuit_short_name']==ALIAS_API.get(cid) and dt.datetime.fromisoformat(s['date_end'])<=LIMITE),None)
            if session:
                url=f"https://api.openf1.org/v1/laps?session_key={session['session_key']}";laps=acquisisci(url) or []
                validi=[l for l in laps if l.get('lap_duration') and l.get('date_start') and not l.get('is_pit_out_lap')]
                if validi:
                    lap=min(validi,key=lambda l:l['lap_duration']);start=dt.datetime.fromisoformat(lap['date_start']);end=start+dt.timedelta(seconds=lap['lap_duration'])
                    query=urllib.parse.urlencode({'session_key':session['session_key'],'driver_number':lap['driver_number'],'date>':start.isoformat(),'date<':end.isoformat()})
                    carurl='https://api.openf1.org/v1/car_data?'+query
                    campi['velocitaMediaKmh']=stima(km*3600/lap['lap_duration'],[url],'Velocità media del giro di riferimento Q 2026 già disputato; lunghezza / tempo.',anni=[2026])
        if carurl:
            car=acquisisci(carurl) or [];locurl=carurl.replace('/car_data?','/location?')
            necessita_posizioni=campi['gLateralePerKm']['valore'] is None or campi['velocitaCurveKmh']['valore'] is None
            loc=(acquisisci(locurl) or []) if necessita_posizioni else []
            if car:
                m=metrica_telemetrica(car,loc)
                for key in ('velocitaMassimaKmh','velocitaMinimaKmh'):
                    if campi[key]['valore'] is None:campi[key]=stima(m[key],[carurl],'Estremo dei campioni nel giro di riferimento già disputato; non record assoluto della pista.')
                if m['gFrenataMedia'] is not None:
                    campi['gFrenataPerKm']=stima(m['gFrenataMedia']/km,[carurl],'Decelerazione media dei campioni con freno attivo e 0,2–6,5 g, derivata dalla velocità filtrata, divisa per km del giro. Non picco né somma delle frenate.',gRiferimento=round(m['gFrenataMedia'],4),campione=m['campioniFrenata'])
                if campi['gLateralePerKm']['valore'] is None and m.get('gLateraleMedia'):
                    campi['gLateralePerKm']=stima(m['gLateraleMedia']/km,[carurl,locurl],'Media indicativa |dθ/dt|×v/g dei campioni sotto carico (0,2–6,5 g), da posizioni e velocità filtrate, divisa per km. Stima cinematica, non sensore IMU.',gRiferimento=round(m['gLateraleMedia'],4),campione=m['campioniLaterali'])
                if campi['velocitaCurveKmh']['valore'] is None and m.get('velocitaCurveKmh'):
                    campi['velocitaCurveKmh']=stima(m['velocitaCurveKmh'],[carurl,locurl],'Velocità media dei campioni con carico laterale stimato >=0,5 g. Stima delle sezioni in curva, non media degli apici.')
        # API posizioni 2025 non disponibile per le ultime tre sedi: fallback 2024.
        if cid in ('las-vegas','lusail','yas-marina') and (campi['gLateralePerKm']['valore'] is None or campi['velocitaCurveKmh']['valore'] is None):
            nome={'las-vegas':'Las Vegas','lusail':'Lusail','yas-marina':'Yas Marina Circuit'}[cid]
            ss=acquisisci('https://api.openf1.org/v1/sessions?year=2024&session_name=Qualifying') or []
            se=next((s for s in ss if s['circuit_short_name']==nome),None)
            if se:
                u=f"https://api.openf1.org/v1/laps?session_key={se['session_key']}";ls=acquisisci(u) or []
                validi=[l for l in ls if l.get('lap_duration') and l.get('date_start') and not l.get('is_pit_out_lap')]
                if validi:
                    l=min(validi,key=lambda l:l['lap_duration']);st=dt.datetime.fromisoformat(l['date_start']);en=st+dt.timedelta(seconds=l['lap_duration'])
                    query=urllib.parse.urlencode({'session_key':se['session_key'],'driver_number':l['driver_number'],'date>':st.isoformat(),'date<':en.isoformat()})
                    ucar='https://api.openf1.org/v1/car_data?'+query;uloc='https://api.openf1.org/v1/location?'+query
                    car=acquisisci(ucar) or [];loc=acquisisci(uloc) or []
                    if car and loc:
                        m=metrica_telemetrica(car,loc)
                        if m.get('gLateraleMedia'):campi['gLateralePerKm']=stima(m['gLateraleMedia']/km,[ucar,uloc],'Media cinematica indicativa del giro Q 2024 / km. Fallback perché le posizioni 2025 non sono disponibili; campioni laterali 0,2–6,5 g.',gRiferimento=round(m['gLateraleMedia'],4),anni=[2024],campione=m['campioniLaterali'])
                        if m.get('velocitaCurveKmh'):campi['velocitaCurveKmh']=stima(m['velocitaCurveKmh'],[ucar,uloc],'Media delle velocità nei campioni con carico laterale stimato >=0,5 g, nel giro Q 2024. Fallback esplicito alle posizioni 2025 mancanti.',anni=[2024])
        mancanti=[k for k,v in campi.items() if v['valore'] is None]
        print(cid, f'{len(campi)-len(mancanti)}/{len(campi)}',mancanti,flush=True)
        return c
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        circuiti=list(pool.map(completa,catalogo['circuiti'].values()))
    precedenti=catalogo.get('avvisiAcquisizionePrecedenti',[])+catalogo.pop('erroriAcquisizione',[])
    catalogo['avvisiAcquisizionePrecedenti']=list({json.dumps(e,sort_keys=True):e for e in precedenti}.values())
    catalogo['erroriAcquisizione'] = [] if all(v['valore'] is not None for c in circuiti for v in c['campi'].values()) else ['Raccolta incompleta: vedere i campi mancanti.']
    catalogo.update(versione='similarita-multicriterio-v2',aggiornatoIl='2026-10-29',criteriAttivi=22,approssimazioniAutorizzate=True,circuiti={c['slug']:c for c in circuiti})
    temp=FILE.with_suffix('.tmp');temp.write_text(json.dumps(catalogo,ensure_ascii=False,indent=2)+'\n');temp.replace(FILE)

if __name__=='__main__':main()
