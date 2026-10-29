"""Raccolta riproducibile: geometria F1DB, riscontro F1, meteo OpenF1 2023–2025.
Non interroga database e non sostituisce dati mancanti con stime.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import statistics
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/fonti-similarita'
OUT.mkdir(exist_ok=True)
ERRORI = []

def acquisisci(url):
    file = OUT / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if file.exists():
        return json.loads(file.read_text())['contenuto']
    for tentativo in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'RaceAnalysisHub/1.16 data research'})
            raw = urllib.request.urlopen(req, timeout=35).read().decode()
            try:
                contenuto = json.loads(raw)
            except ValueError:
                contenuto = raw
            file.write_text(json.dumps({'url': url, 'acquisitoIl': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'sha256': hashlib.sha256(raw.encode()).hexdigest(), 'contenuto': contenuto}, ensure_ascii=False))
            return contenuto
        except Exception as exc:
            if tentativo == 2:
                ERRORI.append({'url': url, 'errore': str(exc)})
                return None
            time.sleep(2 * (tentativo + 1))

SLUG = {'australia': 'australia-melbourne', 'china': 'cina-shanghai', 'japan': 'giappone-suzuka', 'miami': 'usa-miami', 'canada': 'canada-montreal', 'monaco': 'monaco-montecarlo', 'barcelona-catalunya': 'spagna-barcellona', 'austria': 'austria-spielberg', 'great-britain': 'gran-bretagna-silverstone', 'belgium': 'belgio-spa', 'hungary': 'ungheria-hungaroring', 'netherlands': 'olanda-zandvoort', 'italy': 'italia-monza', 'spain': 'spagna-madring', 'azerbaijan': 'azerbaigian-baku', 'bahrain': 'bahrein-sepang', 'singapore': 'singapore-marina-bay', 'united-states': 'usa-austin', 'mexico': 'messico-citta-del-messico', 'sao-paulo': 'brasile-interlagos', 'las-vegas': 'usa-las-vegas', 'qatar': 'qatar-lusail', 'abu-dhabi': 'abu-dhabi-yas-marina'}
OPENF1 = {'melbourne': 'Melbourne', 'shanghai': 'Shanghai', 'suzuka': 'Suzuka', 'miami': 'Miami', 'montreal': 'Montreal', 'monaco': 'Monte Carlo', 'catalunya': 'Catalunya', 'spielberg': 'Spielberg', 'silverstone': 'Silverstone', 'spa-francorchamps': 'Spa-Francorchamps', 'hungaroring': 'Hungaroring', 'zandvoort': 'Zandvoort', 'monza': 'Monza', 'baku': 'Baku', 'marina-bay': 'Singapore', 'austin': 'Austin', 'mexico-city': 'Mexico City', 'interlagos': 'Interlagos', 'las-vegas': 'Las Vegas', 'lusail': 'Lusail', 'yas-marina': 'Yas Marina Circuit'}
CAMPI = ['numeroCurve','altitudineMetri','temperaturaAsfaltoC','temperaturaAriaC','numeroRettilinei','lunghezzaRettilineiKm','zoneSorpasso','tipologia','gLateralePerKm','cambiDirezionePerKm','velocitaMediaKmh','velocitaCurveKmh','velocitaMassimaKmh','velocitaMinimaKmh','richiestaAccelerazione','gFrenataPerKm','dislivelloMedio','caricoAerodinamico','umiditaPercentuale','ventoMs','meteoMedio','variabilitaMeteo','distanzaGaraKm']

def voce(v, fonti, metodo, **extra):
    return {'valore': v, 'stato': 'derivato' if metodo.startswith('Media') or metodo.startswith('Deviazione') or metodo.startswith('Frazione') else 'documentato', 'fonti': fonti, 'metodo': metodo, **extra}

def main():
    campioni = json.loads((ROOT/'data/campioni-previsionali-2026.json').read_text())
    gare = [g for g in campioni['gare'] if g['year'] == 2026]
    sessioni = []
    for anno in (2023, 2024, 2025):
        d = acquisisci(f'https://api.openf1.org/v1/sessions?year={anno}&session_name=Race')
        if isinstance(d, list): sessioni.extend(d)
    def circuito(g):
        cid = g['circuitId']
        fonte = f'https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/{cid}.yml'
        yaml = acquisisci(fonte)
        campi = {k: {'valore': None, 'stato': 'mancante', 'fonti': [], 'motivo': 'Nessuna misura verificata e omogenea acquisita.'} for k in CAMPI}
        campi['numeroCurve'] = voce(g['turns'], [fonte], 'Geometria del layout F1DB v2026.17.0.')
        campi['tipologia'] = voce('ibrido' if cid in ('madring', 'miami') else ('cittadino' if g['circuitType']=='STREET' else 'permanente'), [fonte], 'Classificazione del tracciato; ibridi separati dai cittadini.')
        # Distanza programmata, non quella effettivamente percorsa in gare accorciate.
        distanza = g.get('scheduledDistance') or g['distance']
        campi['distanzaGaraKm'] = voce(distanza, [campioni['fonte']], 'Distanza programmata F1DB; non distanza effettiva di una gara accorciata.')
        if cid in ('madring','sepang'):
            for k in ('temperaturaAsfaltoC','temperaturaAriaC','umiditaPercentuale','ventoMs','meteoMedio','variabilitaMeteo'):
                campi[k]['motivo'] = 'Nessuna precedente edizione F1 su questo layout prima del 2026.' if cid=='madring' else 'Nessuna gara F1 a Sepang negli anni 2023–2025 coperti dalla fonte OpenF1.'
        stagioni = []
        for s in sessioni:
            if s.get('circuit_short_name') != OPENF1.get(cid) or s.get('is_cancelled'): continue
            url = f"https://api.openf1.org/v1/weather?session_key={s['session_key']}"
            rows = acquisisci(url)
            if not isinstance(rows, list) or not rows: continue
            # Esclude misure fuori sessione e valori nulli; conserva un solo campione per timestamp.
            rows = list({r['date']:r for r in rows if s['date_start'] <= r.get('date','') <= s['date_end']}.values())
            if rows: stagioni.append((s, url, rows))
        for key, api, lo, hi in [('temperaturaAsfaltoC','track_temperature',-20,90),('temperaturaAriaC','air_temperature',-20,60),('umiditaPercentuale','humidity',0,100),('ventoMs','wind_speed',0,100)]:
            medie, urls, ns = [], [], []
            for s, url, rows in stagioni:
                vals = [r[api] for r in rows if isinstance(r.get(api),(int,float)) and lo <= r[api] <= hi]
                if vals: medie.append(statistics.mean(vals)); urls.append(url); ns.append(len(vals))
            if medie: campi[key] = voce(round(statistics.mean(medie),4), urls, 'Media delle medie di gara 2023–2025; uguale peso per edizione.', anni=[s['year'] for s,u,r in stagioni if u in urls], campioniPerEdizione=ns)
        piogge = []
        for s,url,rows in stagioni:
            vals = [r['rainfall'] for r in rows if r.get('rainfall') in (0,1)]
            if vals: piogge.append((statistics.mean(vals),url,len(vals),s['year']))
        if piogge:
            campi['meteoMedio'] = voce(round(100*statistics.mean(p[0] for p in piogge),4), [p[1] for p in piogge], 'Frazione percentuale di campioni piovosi, media per edizione; non probabilità di pioggia futura.', anni=[p[3] for p in piogge], campioniPerEdizione=[p[2] for p in piogge])
        # Una variabilità tra edizioni richiede almeno due gare.
        medie = [statistics.mean([r['air_temperature'] for r in rows if isinstance(r.get('air_temperature'),(int,float)) and -20<=r['air_temperature']<=60]) for s,u,rows in stagioni if any(isinstance(r.get('air_temperature'),(int,float)) and -20<=r['air_temperature']<=60 for r in rows)]
        if len(medie)>=2:
            campi['variabilitaMeteo'] = voce(round(statistics.pstdev(medie),4), [u for s,u,r in stagioni], 'Deviazione standard tra le temperature medie aria delle edizioni; proxy termica, non variabilità meteorologica completa.')
        c = {'slug':SLUG[g['grandPrixId']], 'grandPrixId':g['grandPrixId'], 'circuitId':cid, 'layoutId':g['circuitLayoutId'], 'nome':g['officialName'], 'round':g['round'], 'lunghezzaKm':g['courseLength'], 'campi':campi}
        if isinstance(yaml,str):
            c['coordinate']={k:float(re.search(r'^'+k+r': ([\d.\-]+)',yaml,re.M)[1]) for k in ('latitude','longitude') if re.search(r'^'+k+r': ([\d.\-]+)',yaml,re.M)}
        print(cid, sum(v['valore'] is not None for v in campi.values()), '/', len(CAMPI), flush=True)
        return c
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        circuiti = list(pool.map(circuito,gare))
    output = {'versione':'similarita-multicriterio-v1','stagione':2026,'aggiornatoIl':'2026-10-29','anniMeteo':[2023,2024,2025],'calendarioFonte':'https://www.formula1.com/en/racing/2026','circuiti':{c['slug']:c for c in circuiti},'erroriAcquisizione':ERRORI}
    (ROOT/'data/similarita-circuiti-2026.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')

if __name__ == '__main__': main()
