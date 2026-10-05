"""Estrae i nomi dei componenti dalle tabelle FIA, incluse le continuazioni.
Richiede pdfplumber. Uso: python3 script.py /cartella/pdf
"""
import hashlib,json,pathlib,sys
import pdfplumber
cache=pathlib.Path(sys.argv[1]);out=[]
TEAM={'McLaren':'mclaren','Mercedes-AMG':'mercedes','Oracle Red Bull':'red_bull','FERRARI':'ferrari','Ferrari':'ferrari','Williams':'williams','Visa Cash App Racing Bulls':'rb','Aston Martin':'aston_martin','HAAS':'haas','Audi Revolut':'audi','BWT Alpine':'alpine','Cadillac':'cadillac'}
for name,round_,slug in [('dutch',12,'olanda-zandvoort'),('italian',13,'italia-monza'),('spanish',14,'spagna-madring'),('azerbaijan',15,'azerbaigian-baku'),('sepang',16,'bahrein-sepang')]:
 p=cache/(name+'-updates.pdf');url='https://www.fia.com/system/files/decision-document/2026_'+('bahrain_grand_prix_in_malaysia' if name=='sepang' else name+'_grand_prix')+'_-_car_presentation_submissions.pdf'
 records={};current=None
 with pdfplumber.open(p) as pdf:
  for i,page in enumerate(pdf.pages):
   txt=page.extract_text() or '';heading='\n'.join(txt.splitlines()[:3])
   found=next((slug for title,slug in TEAM.items() if title in heading),None)
   if found:current=found;records.setdefault(current,{'scuderiaSlug':current,'componenti':[],'pagine':[]})
   if not current:continue
   parts=[]
   for table in page.extract_tables():
    for row in table:
     if row and str(row[0] or '').strip().isdigit():parts.append({'numero':int(row[0]),'componente':' '.join(str(row[1]).split())})
   if parts or found:records[current]['pagine'].append(i+1)
   records[current]['componenti'].extend(parts)
 if len(records)!=11:raise ValueError('Copertura squadre: '+name+str(records.keys()))
 out.append({'garaSlug':slug,'round':round_,'fonte':url,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'scuderie':list(records.values())})
p=pathlib.Path(__file__).resolve().parents[1]/'data/aggiornamenti-fia-documentati-2026.json';p.write_text(json.dumps({'versione':'componenti-fia-v1','documenti':out},ensure_ascii=False,indent=2)+'\n')
print([(g['garaSlug'],sum(len(t['componenti']) for t in g['scuderie'])) for g in out])
