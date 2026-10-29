const fs = require('node:fs');
const path = require('node:path');
const catalogo = require('../data/similarita-circuiti-2026.json');
const {CRITERI,confrontaCircuiti,confrontaCalendario} = require('../services/similaritaCircuiti');
const dir=path.join(__dirname,'../../docs/similarita-circuiti');
fs.mkdirSync(dir,{recursive:true});
const circuiti=Object.values(catalogo.circuiti);
const cell=x=>x===null||x===undefined?'':String(x);
const csv=rows=>rows.map(r=>r.map(x=>'"'+cell(x).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const coppie=[['circuitoA','circuitoB','somiglianzaCompletaPercentuale','somiglianzaParzialePercentuale','coperturaPercentuale','minimoPossibile','massimoPossibile',...CRITERI.map(c=>c.chiave)]];
for(let i=0;i<circuiti.length;i++)for(let j=i+1;j<circuiti.length;j++){
 const r=confrontaCircuiti(circuiti[i],circuiti[j]);
 coppie.push([circuiti[i].slug,circuiti[j].slug,r.similaritaPercentuale,r.similaritaParzialePercentuale,r.coperturaPercentuale,r.intervalloPercentuale.minimo,r.intervalloPercentuale.massimo,...r.dettagli.map(d=>d.similaritaPercentuale)]);
}
fs.writeFileSync(path.join(dir,'confronti-2026.csv'),csv(coppie));
const dati=[['circuito','criterio','valore','unita','stato','metodo','fonti']];
for(const c of circuiti)for(const k of CRITERI){const v=c.campi[k.chiave];dati.push([c.slug,k.chiave,v.valore,k.unita,v.stato,v.metodo||v.motivo,v.fonti.join(' | ')]);}
fs.writeFileSync(path.join(dir,'dati-2026.csv'),csv(dati));
const lines=['# Copertura dati — 29 ottobre 2026','','Tutte le 23 sedi hanno 22 criteri compilati. Il campo accelerazione è stato rimosso. Dati pubblicati, medie da API e stime autorizzate restano distinguibili; completezza non significa precisione uniforme.','','| Circuito | Campi con valore | Campi mancanti |','|---|---:|---:|'];
for(const c of circuiti){const n=Object.values(c.campi).filter(v=>v.valore!==null).length;lines.push(`| ${c.slug} | ${n}/${CRITERI.length} | ${CRITERI.length-n} |`);}
lines.push('','## Scale per criterio','','Le scale indicano la differenza che porta la somiglianza a zero, non il peso. Ogni criterio pesa 100/22.','','| Criterio | Scala | Unità |','|---|---:|---|');
for(const c of CRITERI)lines.push(`| ${c.nome} | ${c.scala??'Matrice categorie'} | ${c.unita} |`);
lines.push('','## Esempio: confronto del Messico','','Si mostra la somiglianza indicativa completa sui 22 criteri. Non è una probabilità di vittoria.','','| Circuito | Somiglianza | Copertura | Intervallo completo |','|---|---:|---:|---:|');
for(const c of confrontaCalendario('messico-citta-del-messico'))lines.push(`| ${c.slug} | ${c.similaritaParzialePercentuale??'—'}% | ${c.coperturaPercentuale}% | ${c.intervalloPercentuale.minimo}–${c.intervalloPercentuale.massimo}% |`);
lines.push('','## Fonti non acquisite','','Gli errori riportati sono tentativi non riusciti dell’ultimo arricchimento; i dati mancanti non vengono interpolati.','');
for(const e of catalogo.erroriAcquisizione)lines.push(`- ${e.url}: ${e.errore}`);
lines.push('','Dettagli e definizioni in [METODO.md](METODO.md). Fonti e percentuali per tutti i 253 confronti in `confronti-2026.csv`; valori e fonti dei 506 campi in `dati-2026.csv`.');
fs.writeFileSync(path.join(dir,'COPERTURA.md'),lines.join('\n')+'\n');
console.log(`${circuiti.length} circuiti, ${dati.length-1} campi, ${coppie.length-1} coppie esportate.`);

const schede=['# Schede dei 23 circuiti — 29 ottobre 2026','','22 criteri uguali per tutte le piste. **Stimato** indica le approssimazioni autorizzate; **derivato** indica un calcolo da dati acquisiti. Consultare METODO.md per le diverse definizioni e finestre temporali.'];
const formatta=v=>typeof v==='number'?new Intl.NumberFormat('it-IT',{maximumFractionDigits:3}).format(v):v;
for(const c of circuiti){
 schede.push('',`## ${c.slug}`,'',`Lunghezza giro: **${formatta(c.lunghezzaKm)} km**. Carico: **${c.campi.caricoAerodinamico.valore}**.`, '', '| Criterio | Valore | Unità | Qualità | Fonti |','|---|---:|---|---|---|');
 for(const k of CRITERI){const v=c.campi[k.chiave];schede.push(`| ${k.nome} | ${formatta(v.valore)} | ${k.unita} | ${v.stato} | ${v.fonti.map((u,i)=>`[${i+1}](${u})`).join(' ')} |`);}
 if(c.circuitId==='madring'||c.circuitId==='sepang')schede.push('','Temperature e meteo: gara 2026 già conclusa, usata come riferimento alternativo esplicito allo storico 2023–2025.');
 if(['las-vegas','lusail','yas-marina'].includes(c.circuitId))schede.push('','G laterale e velocità in curva: telemetria Q 2024, perché le posizioni 2025 non erano disponibili dalla fonte.');
 const simili=confrontaCalendario(c.slug).slice(0,3);schede.push('','Piste più simili nel catalogo: '+simili.map(r=>`**${r.slug}: ${formatta(r.similaritaPercentuale)}%**`).join(' · ')+'.');
}
fs.writeFileSync(path.join(dir,'SCHEDE.md'),schede.join('\n')+'\n');
