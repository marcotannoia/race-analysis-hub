const fs = require('node:fs');
const path = require('node:path');
const c = require('../data/calibrazione-pesi-2026-10-05.json');
const d = require('../data/dati-iniziali.json');
const {CHIAVI} = require('../services/calibrazionePesi');
const input = require('../data/campioni-previsionali-2026.json');
const slug = new Map(Object.entries(input.mappingPiloti).map(([s,id])=>[id,s]));
const nome = id => d.piloti.find(p=>p.slug===slug.get(id))?.codice || id;
const n = x => String(x).replace('.',',');
const out = path.join(__dirname,'../../docs/revisione-database-2026-10-05');
const dir = path.join(out,'weekend-calibrazione');
fs.mkdirSync(dir,{recursive:true});
const pesi = p => CHIAVI.map(k=>p[k]).join(' / ');
const lines = ['# Calibrazione dei pesi — 5 ottobre 2026',
'**16 GP, 4.598.126 combinazioni, pesi interi a passi dell’1%.** Ricerca esaustiva sul simplesso di cinque fattori con somma 100: rendimento recente, qualifica recente, scuderia recente, storico circuito e mondiale precedente.',
'## Risultato',
`Migliore combinazione comune: **${pesi(c.pesiOttimiInteraStagione)}%**. Ordine dei fattori: rendimento / qualifica / scuderia / storico / mondiale.`,
'| Confronto | MAE esiti regolari | MAE classifica completa |\n|---|---:|---:|',
...['iniziali','globale','ottimoWeekend','mondiale'].map(k=>`| ${k} | ${n(c.complessivo[k].regolari.erroreAssolutoMedio)} | ${n(c.complessivo[k].completa.erroreAssolutoMedio)} |`),
'Il fit comune riduce l’errore regolare da 2,420 a 2,239 posizioni. Gli ottimi per singolo GP arrivano a 1,841, ma usano il risultato di quel weekend per scegliere i pesi: sono ricostruzioni del passato e non previsioni.',
'## Verifica temporale e metodo attivo',
`Walk-forward round 4–16, con training solo sui GP precedenti: errore regolare ${n(c.progressivo.progressivo.regolari.erroreAssolutoMedio)} contro ${n(c.progressivo.mondiale.regolari.erroreAssolutoMedio)} del riferimento mondiale. Sulla classifica completa: ${n(c.progressivo.progressivo.completa.erroreAssolutoMedio)} contro ${n(c.progressivo.mondiale.completa.erroreAssolutoMedio)}.`,
`Controllo fisso: pesi congelati dopo round 12, test sui round 13–16. Errore regolare **${n(c.holdout.congelatoHoldout.regolari.erroreAssolutoMedio)} contro ${n(c.holdout.mondiale.regolari.erroreAssolutoMedio)}**; completa ${n(c.holdout.congelatoHoldout.completa.erroreAssolutoMedio)} contro ${n(c.holdout.mondiale.completa.erroreAssolutoMedio)}.`,
'La regola di adozione richiede miglioramento in entrambi i controlli. Il candidato non è promosso. La previsione attiva usa **100% mondiale**, con gli altri sette campi ordinari a peso zero per preservare il contratto API. Il mondiale è normalizzato tra i partecipanti; assenti dai dati ricevono la prior neutra 50. Non è una probabilità. Le penalità confermate riducono l’indice separatamente, fino al 35%.',
'Per i GP correnti/futuri il mondiale viene letto dal database aggiornato; per scenari passati resta il limite temporale esclusivo. Confidenza bassa. Meteo, richieste tecniche e aggiornamenti restano contesto senza bonus numerici non verificati.',
'## Ogni weekend',
'| Round | Circuito | Pesi R/Q/S/H/M % | MAE regolare ottimo | Esclusi | Dossier |\n|---|---|---|---:|---:|---|',
...c.gp.map(g=>`| ${g.round} | ${g.circuito} | ${pesi(g.pesiOttimoWeekend)} | ${n(g.valutazioni.ottimoWeekend.regolari.erroreAssolutoMedio)} | ${g.esclusi.length} | [Classifiche e cause](weekend-calibrazione/${g.round}-${g.circuito}.md) |`),
'## Esclusioni e limiti',
...Object.entries(c.protocollo).map(([k,v])=>`**${k}:** ${Array.isArray(v)?v.join('; '):v}`),
'Le esclusioni sono 76 su 352 classificazioni: restano 276 esiti regolari. Non vengono eliminati errori grandi del modello né risultati sfavorevoli del favorito senza causa documentata. Danni o incidenti di piloti classificati senza causa registrata non sono esclusi arbitrariamente.',
'La release è revisionata dopo le gare; l’entry list finale è usata come universo del weekend. Si analizzano i sedici Gran Premi principali, non una previsione separata delle Sprint. Qualifica significa i GP precedenti, senza la qualifica del target. Il primo GP non ha input sportivi 2026, quindi usa lo storico disponibile e prior neutre.',
'## Riproduzione e aggiornamento',
'`node backend/scripts/calibraPesiPrevisionali.js /percorso/f1db-v2026.16.0 1`\n\n`node backend/scripts/aggiornaPrevisioniCalibrate.js`',
'[Dati completi della ricerca](../../backend/data/calibrazione-pesi-2026-10-05.json), [campioni verificati](../../backend/data/campioni-previsionali-2026.json), [migrazione Atlas](migrazione-calibrazione.json). Hash delle fonti e del corpus conservati nel risultato; verifica in avvio fra corpus e calibrazione.',
'Atlas conserva il nuovo metodo e, per le 12 gare del prodotto, la previsione selezionata e il candidato non promosso. Test backend e decodifica Swift nelle sei lingue; nessuna modifica nativa necessaria. Push e verifica della distribuzione backend seguono i controlli del codice.'];
fs.writeFileSync(path.join(out,'CALIBRAZIONE.md'),lines.join('\n\n').replace(/\|\n\n\|/g,'|\n|')+'\n');
for(const g of c.gp){
 const previsione=new Map(g.valutazioni.ottimoWeekend.classifica.map(p=>[p.driverId,p]));
 const progressivo=new Map(g.valutazioni.progressivo.classifica.map(p=>[p.driverId,p]));
 const reale=new Map(g.classificazioneReale.map(p=>[p.driverId,p]));
 const esclusi=new Map(g.esclusi.map(p=>[p.driverId,p]));
 const doc=[`# Round ${g.round} — ${g.circuito}`,'[Rapporto completo](../CALIBRAZIONE.md)',
 `**Data:** ${g.data}. **Pesi ottimi a posteriori R/Q/S/H/M:** ${pesi(g.pesiOttimoWeekend)}%. **Pesi progressivi disponibili prima del GP:** ${pesi(g.pesiProgressivi)}%.`,
 `Errore medio regolare dell’ottimo a posteriori: ${n(g.valutazioni.ottimoWeekend.regolari.erroreAssolutoMedio)}. Classifica completa: ${n(g.valutazioni.ottimoWeekend.completa.erroreAssolutoMedio)}.`,
 'I pesi ottimi usano l’esito del GP per il fit. Le posizioni nella tabella sono sull’intero schieramento; la metrica filtrata riordina entrambi gli elenchi sugli stessi esiti regolari.',
 '| Pilota | Ottimo a posteriori | Progressivo prima del GP | Ordine reale | Stato / causa | Escluso dal fit |\n|---|---:|---:|---:|---|---|',
 ...[...previsione.values()].map(p=>{const r=reale.get(p.driverId);return `| ${nome(p.driverId)} | ${p.posizione} | ${progressivo.get(p.driverId).posizione} | ${r.posizioneOrdine} | ${r.stato}${r.causaRitiro?' / '+r.causaRitiro:''} | ${esclusi.has(p.driverId)?'Sì':'No'} |`}),
 '[Fonte F1DB v2026.16.0, CC BY 4.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0). Nessuna attribuzione inventata di responsabilità o guasto.'];
 fs.writeFileSync(path.join(dir,`${g.round}-${g.circuito}.md`),doc.join('\n\n').replace(/\|\n\n\|/g,'|\n|')+'\n');
}
console.log('Rapporto e 16 dossier creati');
