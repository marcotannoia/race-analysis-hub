"""Riscontri ufficiali, quote DEM e velocità di riferimento da OpenF1.
Le velocità sono del miglior giro Q 2025: descrivono un riferimento osservato,
non una proprietà immutabile della pista o le prestazioni 2026.
"""
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import re
import urllib.parse
import urllib.request
from raccogliDatiCircuiti import ROOT, OUT, OPENF1, acquisisci, voce, ERRORI

FILE = ROOT/'data/similarita-circuiti-2026.json'

def main():
    catalogo = json.loads(FILE.read_text())
    circuiti = list(catalogo['circuiti'].values())
    url = 'https://api.open-meteo.com/v1/elevation?' + urllib.parse.urlencode({'latitude':','.join(str(c['coordinate']['latitude']) for c in circuiti),'longitude':','.join(str(c['coordinate']['longitude']) for c in circuiti)})
    quote = acquisisci(url)
    if isinstance(quote,dict) and len(quote.get('elevation',[])) == len(circuiti):
        for c,h in zip(circuiti,quote['elevation']):
            c['campi']['altitudineMetri'] = voce(h,[url],'Modello digitale Copernicus DEM GLO-90 via Open-Meteo, quota del punto di riferimento F1DB; risoluzione 90 m, non rilievo del piano pista.', attribuzione='Copernicus programme / ESA; Open-Meteo', stato='derivato')
    sessioni = acquisisci('https://api.openf1.org/v1/sessions?year=2025&session_name=Qualifying') or []
    def completa(c):
        paese = {'sao-paulo':'brazil','abu-dhabi':'united-arab-emirates'}.get(c['grandPrixId'],c['grandPrixId'])
        u = f'https://www.formula1.com/en/racing/2026/{paese}'
        cache = OUT/('geometria-ufficiale-'+c['circuitId']+'.json')
        try:
            if cache.exists(): record = json.loads(cache.read_text())
            else:
                raw = urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'RaceAnalysisHub/1.16'}),timeout=25).read().decode()
                record = {'url':u,'sha256':hashlib.sha256(raw.encode()).hexdigest(),'acquisitoIl':datetime.datetime.now(datetime.timezone.utc).isoformat()}
                for label,key in [('Circuit Length','lunghezzaKm'),('Race Distance','distanzaGaraKm')]:
                    m = re.search(label+r'</dt><dd[^>]*>([\d.]+)km',raw)
                    if m: record[key] = float(m[1])
                cache.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
            if record.get('distanzaGaraKm'):
                old = c['campi']['distanzaGaraKm']['valore']
                c['campi']['distanzaGaraKm'] = voce(record['distanzaGaraKm'],[u],'Distanza gara indicata nella scheda ufficiale Formula 1 2026.', valoreSnapshotPrecedente=old)
            if record.get('lunghezzaKm'):
                c['lunghezzaKmSnapshot'] = c['lunghezzaKm']; c['lunghezzaKm'] = record['lunghezzaKm']
        except Exception as exc: ERRORI.append({'url':u,'errore':str(exc)})
        s = next((s for s in sessioni if s['circuit_short_name']==OPENF1.get(c['circuitId'])),None)
        if not s: return c
        u = f"https://api.openf1.org/v1/laps?session_key={s['session_key']}"
        laps = acquisisci(u)
        if not isinstance(laps,list): return c
        validi = [l for l in laps if isinstance(l.get('lap_duration'),(int,float)) and l['lap_duration']>30 and not l.get('is_pit_out_lap') and l.get('date_start')]
        if not validi: return c
        lap = min(validi,key=lambda l:l['lap_duration'])
        start = datetime.datetime.fromisoformat(lap['date_start'])
        end = start+datetime.timedelta(seconds=lap['lap_duration'])
        query = urllib.parse.urlencode({'session_key':s['session_key'],'driver_number':lap['driver_number'],'date>':start.isoformat(),'date<':end.isoformat()})
        carurl = 'https://api.openf1.org/v1/car_data?'+query
        car = acquisisci(carurl)
        c['riferimentoVelocita'] = {'anno':2025,'sessionKey':s['session_key'],'pilotaNumero':lap['driver_number'],'giro':lap['lap_number'],'durataSecondi':lap['lap_duration'],'nota':'Miglior giro cronometrato Q, singola vettura. Non confronto di vetture 2026. Eventuali giri cancellati non certificati da questa fonte.'}
        if not isinstance(car,list): return c
        velocita = [r['speed'] for r in car if isinstance(r.get('speed'),(int,float)) and 10<r['speed']<450]
        if len(velocita)<100: return c
        ts = sorted(datetime.datetime.fromisoformat(r['date']) for r in car)
        if (ts[-1]-ts[0]).total_seconds() < 0.95*lap['lap_duration']: return c
        # La lunghezza è quella del layout del giro 2025, verificata sul corpus locale.
        url2025 = f'https://www.formula1.com/en/racing/2025/{"spain" if paese == "barcelona-catalunya" else paese}'
        cache2025 = OUT/('geometria-2025-'+c['circuitId']+'.json')
        geometria = {}
        try:
            if cache2025.exists(): geometria=json.loads(cache2025.read_text())
            else:
                raw = urllib.request.urlopen(url2025,timeout=25).read().decode()
                m = re.search(r'Circuit Length</dt><dd[^>]*>([\d.]+)km',raw)
                geometria={'url':url2025,'lunghezzaKm':float(m[1]) if m else None,'sha256':hashlib.sha256(raw.encode()).hexdigest(),'acquisitoIl':datetime.datetime.now(datetime.timezone.utc).isoformat()}
                cache2025.write_text(json.dumps(geometria,indent=2)+'\n')
        except Exception as exc: ERRORI.append({'url':url2025,'errore':str(exc)})
        if geometria.get('lunghezzaKm') and abs(geometria['lunghezzaKm']-c['lunghezzaKm'])<0.03:
            c['campi']['velocitaMediaKmh'] = voce(round(geometria['lunghezzaKm']*3600/lap['lap_duration'],4),[u,url2025],'Velocità media del miglior giro Q 2025: lunghezza layout / tempo sul giro.',anni=[2025],regime='F1-2025',stato='derivato')
            for k,v,metodo in [('velocitaMassimaKmh',max(velocita),'Massimo dei campioni di velocità nel miglior giro Q 2025; non record assoluto della pista.'),('velocitaMinimaKmh',min(velocita),'Minimo dei campioni di velocità nel miglior giro Q 2025, esclusi valori <=10 km/h; non include pit lane.')]:
                c['campi'][k] = voce(v,[carurl],metodo,anni=[2025],regime='F1-2025',campioni=len(velocita),stato='derivato')
        print(c['circuitId'],sum(v['valore'] is not None for v in c['campi'].values()),'/23',flush=True)
        return c
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        circuiti=list(pool.map(completa,circuiti))
    # Override con fonte diretta del team: quota ambientale dichiarata anziché DEM.
    fonte='https://www.mercedesamgf1.com/news/what-impact-does-high-altitude-have-on-an-f1-car'
    for c in circuiti:
        if c['circuitId'] in ('mexico-city','interlagos'):
            c['campi']['altitudineMetri']=voce(2285 if c['circuitId']=='mexico-city' else 800,[fonte],'Altitudine ambientale dichiarata da Mercedes; quota DEM conservata nelle fonti grezze.')
    catalogo['circuiti']={c['slug']:c for c in circuiti}
    catalogo['erroriAcquisizione'] = ERRORI
    FILE.write_text(json.dumps(catalogo,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__': main()
