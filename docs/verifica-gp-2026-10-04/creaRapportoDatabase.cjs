const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const d = require('../../backend/utils/datiEffettivi').creaDatiEffettivi(require('../../backend/data/dati-iniziali.json'));
const b = require('../../backend/data/backtest-semantico-2026-10-05.json');
const c = require('./correzioni-archivi-2026-10-05.json');
const m = require('./migrazione-database-2026-10-05.json');
const out = path.join(root, 'docs/revisione-database-2026-10-05');
fs.mkdirSync(out, {recursive:true});
const link = (label, file) => `[${label}](${path.join(out,file)})`;
const fileLink = (label, file) => `[${label}](${path.join(root,file)})`;
const clean = s => String(s ?? 'ND').replace(/\|/g, '/').replace(/\n/g,'; ');
const n = x => x === null || x === undefined ? 'ND' : new Intl.NumberFormat('it', {maximumFractionDigits:3}).format(x);
const cod = slug => d.piloti.find(p=>p.slug===slug)?.codice || slug;
const top = g => g.risultati.slice(0,3).map(p=>cod(p.pilota)).join(' / ');
const actual = g => g.risultati.filter(p=>p.realeOrdineClassificazione<=3).sort((a,b)=>a.realeOrdineClassificazione-b.realeOrdineClassificazione).map(p=>cod(p.pilota)).join(' / ');
const lines = [
'# Database e confronto storico — 5 ottobre 2026',
'**Atlas aggiornato e riletto: zero differenze. I nuovi indici sono sperimentali: il confronto non dimostra una precisione maggiore del riferimento mondiale.**',
'Questa revisione aggiorna quella del 4 ottobre: riguarda tutte le 396 schede dei 12 circuiti, non soltanto i GP futuri. Copertura: 23 piloti, 11 scuderie, 12 gare, 264 analisi pilota e 132 analisi scuderia. Nelle analisi sono presenti 5.016 campi semantici; gli overall globali e i campi del circuito sono aggiuntivi.',
'## Che cosa è stato aggiornato',
'- Fonte sportiva portata a [F1DB v2026.16.0, CC BY 4.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0), fino a Sepang. Serie 2026 unica a 16 GP; rimosso il duplicato Sepang dalla lista delle integrazioni allo snapshot.\n- Riscontrati 2.376 risultati storici 2023–2025, 34 classifiche correnti e 110 schede pilota con gara/qualifica 2026 negli eventi conclusi.\n- Corrette 63 posizioni di qualifica negli archivi e 6 classificazioni di gara rispetto ai dati precedenti. Fase Q1/Q2/Q3, posizione e griglia ora sono distinte. Russell a Sepang è P20 con ritiro, non una gara completata.\n- Corretto lo schieramento storico di Zandvoort: Tsunoda partecipante, Hadjar assente e Lawson in Red Bull. Aggiunto l’archivio Monza.\n- Riscritti N.B., passo, gomme, affidabilità, aggiornamenti e conclusioni delle 396 schede nelle sei lingue: eliminate deduzioni causali non sostenute dai dati e riferimenti vecchi ai punti o alla Sprint di Austin.\n- Salvati overall con campione, metodo, stato e limite temporale. Nei cinque GP conclusi le conclusioni indicano esplicitamente il ricalcolo retrospettivo.',
'## Significato dei campi',
'| Campo | Overall / significato | Limite |\n|---|---|---|\n| Risultati gara / qualifica | Media di 100×(N−posizione)/(N−1), da 0 a 100 | Esiti regolari per la gara; non è una misura del pilota isolata dalla vettura |\n| Andamento / trend | Ultimi 3 GP con presenza contro i 3 precedenti; delta dell’indice | Vettura, pista e condizioni possono cambiare |\n| Affidabilità | Percentuale di esiti regolari fra le partenze documentate | Include incidenti e squalifiche; non è affidabilità meccanica |\n| N.B. | Contesto documentato; overall numerico null | Note e responsabilità non sono voti prestazionali |\n| Passo gara | null / non misurato | Occorrono giri comparabili |\n| Gestione gomme | null / non misurata | Occorrono stint e degrado comparabili |\n| Aggiornamenti | null per il beneficio isolato | Installazione o annuncio non dimostrano un guadagno |\n| Compatibilità tecnica | Stima editoriale distinta dal valore osservato | Esclusa dal modello semantico |\n| Conclusioni | Indice sperimentale aggregato dai risultati | Non è probabilità di vittoria o arrivo |',
'**ND/null non significa zero né prestazione media.** Solo durante il calcolo il modello usa una prior convenzionale 50 e due osservazioni per attenuare i campioni piccoli; gli overall mancanti restano null nel database. Gli overall non sono valori telemetrici e non giustificano causalmente potenza, trazione, frenata o degrado.',
'## Pesi e valutazione cronologica',
'Pesi fissati per questo esperimento, prima del calcolo: rendimento recente 45%, qualifica recente 30%, rendimento della scuderia 20%, storico personale sul circuito 5%. Nessuna ricerca dei pesi che meglio descrivono le gare appena viste. Il modello è salvato in metodiPrevisionali con stato **sperimentale_non_promosso**.',
'I primi 3 GP servono da warm-up. Per ogni gara successiva i fattori utilizzano soltanto round precedenti e storico 2023–2025. Non vengono usati risultato, qualifica o griglia del GP target. L’universo dei partecipanti è quello finale del weekend. È una simulazione ricostruita oggi su una release revisionata dopo gli eventi, non una prova delle previsioni effettivamente pubblicate prima delle gare.',
'| Metrica su 13 GP / 286 classificazioni | Nuovi indici | Mondiale precedente al GP |\n|---|---:|---:|',
`| Errore medio assoluto, posizioni | ${n(b.totale.semantico.erroreAssolutoMedio)} | ${n(b.totale.mondiale.erroreAssolutoMedio)} |`,
`| Correlazione Spearman media | ${n(b.totale.semantico.spearmanMedio)} | ${n(b.totale.mondiale.spearmanMedio)} |`,
`| Vincitori corretti | ${b.totale.semantico.vincitoriIndovinati}/13 | ${b.totale.mondiale.vincitoriIndovinati}/13 |`,
`| Piloti del podio riconosciuti, senza richiedere ordine | ${b.totale.semantico.podiIndovinati}/39 | ${b.totale.mondiale.podiIndovinati}/39 |`,
`| Piloti della top 10 riconosciuti | ${b.totale.semantico.top10Indovinati}/130 | ${b.totale.mondiale.top10Indovinati}/130 |`,
'\nLa differenza media fra gli indici nuovi e il mondiale è piccola e non è stata sottoposta a un test di significatività. Il mondiale fa meglio su vincitori e podi in questo campione: non si può affermare che i nuovi pesi aumentino l’accuratezza. Negli ultimi cinque GP l’errore medio è '+n(b.ultimiCinque.semantico.erroreAssolutoMedio)+' contro '+n(b.ultimiCinque.mondiale.erroreAssolutoMedio)+' posizioni.',
'## Cinque GP conclusi presenti nel database',
'| GP | Podio previsto dagli indici | Podio reale | Vincitore corretto | Errore medio |\n|---|---|---|---|---:|',
...b.gp.slice(-5).map(g=>`| ${clean(g.circuito)} | ${top(g)} | ${actual(g)} | ${g.modelloSemantico.vincitoreCorretto?'Sì':'No'} | ${n(g.modelloSemantico.erroreAssolutoMedio)} |`),
'\nLe classifiche complete, le differenze per ogni pilota e i confronti su tutti i 13 GP sono nel '+fileLink('backtest strutturato','backend/data/backtest-semantico-2026-10-05.json')+'. Include anche il filtro diagnostico degli esiti regolari, che usa un’informazione post-gara e non va presentato come nuova previsione.',
'## Ricalcolo con i pesi correnti del modello editoriale',
'È stato effettuato anche sui cinque GP coperti dai profili del progetto, usando classifiche e risultati anteriori alla gara. I profili tecnici sono però quelli aggiornati oggi; etichette e bonus senza snapshot precedente sono resi neutri. Per questo il risultato seguente è **diagnostico con informazione editoriale successiva**, non validazione fuori campione e non ricostruzione della classifica pubblicata allora.',
'| GP | Errore medio | Vincitore corretto | Piloti del podio riconosciuti |\n|---|---:|---|---:|',
...b.gp.slice(-5).map(g=>`| ${g.circuito} | ${n(g.pesiCorrentiDiagnostico.metriche.erroreAssolutoMedio)} | ${g.pesiCorrentiDiagnostico.metriche.vincitoreCorretto?'Sì':'No'} | ${g.pesiCorrentiDiagnostico.metriche.podioIndovinati}/3 |`),
'\nI pesi correnti senza meteo sono 42% compatibilità, 28% circuiti simili, 10% aggiornamenti, 8% rendimento pilota recente, 5% andamento mondiale, 3% qualifica, 2% storico personale, 2% scuderia recente. Questi pesi restano editoriali e non calibrati. La successiva revisione del codice corregge la formula di penalità nel modello v4.1; dettagli in ALGORITMI.md. Il nuovo modello semantico resta sperimentale.',
'## Overall e schede per tutti i circuiti',
'| Circuito / GP | Stato | Dossier |\n|---|---|---|',
...d.gare.map(g=>`| ${clean(g.nome)} | ${g.stato || 'futura'} | ${link('22 piloti e 11 scuderie',g.slug+'.md')} |`),
'## Raccolta per i prossimi GP',
'Il database conserva un protocollo per ogni circuito. Prima della gara: snapshot datato di input, pesi e previsione; entry list e specifiche per vettura; decisioni FIA; nomine e prescrizioni Pirelli; meteo nella fascia di sessione. Per ogni giro: tempo/settori, mescola ed età, stint, condizioni, traffico, SC/VSC/red flag, in/out lap e limiti della stima carburante. I confronti devono registrare i giri esclusi e il motivo. Senza campioni comparabili, il relativo overall resta null. Queste misure sono **da acquisire**, non risultati già raccolti.',
'## Limiti ancora presenti',
'- Benefici prestazionali degli aggiornamenti e nomine/prescrizioni dei weekend futuri non sono tutti verificabili oggi.\n- Il registro di errori del pilota e gare bagnate non è completo: gli indici semantici li marcano da verificare. Le percentuali preesistenti di statistiche-contesto.json non sono certificate da questa migrazione; quel file non è una collezione Atlas.\n- Geometria e dati di contesto sono marcati riscontrati/editoriali/conflitto. Restano documentate le divergenze fra F1 e F1DB per FP1 Singapore e distanza Abu Dhabi; carico, stress e richieste 0–100 non sono misure validate.\n- Dati e metodi nuovi sono salvati su Atlas. Nessuna distribuzione del backend è stata eseguita: l’algoritmo pubblico non diventa automaticamente il modello semantico.',
'## Applicazione e verifiche',
'La prima transazione ha aggiornato 442 documenti nelle cinque collezioni del prodotto e salvato il metodo/backtest. Una seconda transazione ha aggiunto il protocollo di raccolta alle 12 gare; dopo la revisione degli algoritmi sono stati aggiornati altri 52 documenti e il backtest. Backup privati prima delle operazioni; guardia updatedAt e rilettura completa dopo il commit. Ultima rilettura: '+m.stato+', '+m.differenzeDopo.length+' differenze. verify-db: zero differenze e copertura 23/11/12/264/132. Test: 92 passati; qualità, traduzioni e documentazione verificate.',
'Evidenze: '+fileLink('ultime modifiche Atlas','docs/verifica-gp-2026-10-04/migrazione-database-2026-10-05.json')+'; '+fileLink('correzioni degli archivi','docs/verifica-gp-2026-10-04/correzioni-archivi-2026-10-05.json')+'; '+fileLink('5.016 campi semantici','backend/data/revisione-semantica-2026-10-05.json')+'; '+fileLink('hash delle fonti','backend/data/fonti-f1db-v2026.16.0.json')+'.',
'Per riprodurre: usare i JSON della release verificata; eseguire rivediDatiSemantici.js e valutaPrevisioniStoriche.js. aggiornaDatabaseSemantico.js prepara l’anteprima senza --applica; applica soltanto con --applica, backup e controlli di concorrenza. Nessuna cancellazione o seed globale.',
];
fs.writeFileSync(path.join(out,'RAPPORTO.md'),lines.join('\n\n').replace(/\|\n\n\|/g,'|\n|')+'\n');
for(const g of d.gare){
 const testo=[`# ${g.nome} — overall semantici`,link('Rapporto e significato dei punteggi','RAPPORTO.md'),
  `**Stato: ${g.stato || 'futura'}.** Metodo ${g.previsioneSemantica.versione}, sperimentale. Input 2026 fino al round ${g.previsioneSemantica.ultimoRoundIncluso}. ${g.previsioneSemantica.retrospettivo?'Ricostruzione retrospettiva: non è la previsione conservata prima della gara.':'Indice preparatorio: il risultato futuro non è ancora osservabile.'}`,
  'ND = non determinabile. Gara e qualifica storiche sono indici descrittivi 2023–2025; il trend è sugli ultimi tre GP con presenza contro i tre precedenti. Il completamento include incidenti/DSQ e non misura affidabilità meccanica. Indice e posizione sono stime del modello dai risultati, non voti telemetrici o probabilità.',
  '## Piloti',
  '| Pilota | Storico gara | Storico qualifica | Trend Δ | Esiti regolari % | Indice / posizione | Passo / gomme / beneficio upgrade |\n|---|---:|---:|---:|---:|---|---|'];
 for(const a of d.analisiGare.filter(a=>a.garaSlug===g.slug).sort((a,b)=>a.overallSemantici.campi.considerazioniFinali.posizione-b.overallSemantici.campi.considerazioniFinali.posizione)){
  const s=a.overallSemantici.campi;
  testo.push(`| ${cod(a.pilotaSlug)} | ${n(s.risultatiGara.overall)} (n=${s.risultatiGara.campione}) | ${n(s.risultatiQualifica.overall)} (n=${s.risultatiQualifica.campione}) | ${n(s.andamentoPerAnno.deltaOverall)} | ${n(s.affidabilita.overall)} (${s.affidabilita.completate}/${s.affidabilita.campione}) | ${n(s.considerazioniFinali.overall)} / P${s.considerazioniFinali.posizione} | ND / ND / ND |`);
 }
 testo.push('\n## Scuderie','| Scuderia | Storico gara | Storico qualifica | Trend Δ | Esiti regolari % | Indice / posizione | Passo / gomme / beneficio upgrade |\n|---|---:|---:|---:|---:|---|---|');
 for(const a of d.analisiScuderie.filter(a=>a.garaSlug===g.slug).sort((a,b)=>a.overallSemantici.campi.considerazioniFinali.posizione-b.overallSemantici.campi.considerazioniFinali.posizione)){
  const s=a.overallSemantici.campi;
  testo.push(`| ${d.scuderie.find(t=>t.slug===a.scuderiaSlug).nome} | ${n(s.risultatiGara.overall)} (n=${s.risultatiGara.campione}) | ${n(s.risultatiQualifica.overall)} (n=${s.risultatiQualifica.campione}) | ${n(s.andamentoPerAnno.deltaOverall)} | ${n(s.affidabilita.overall)} (${s.affidabilita.completate}/${s.affidabilita.campione}) | ${n(s.considerazioniFinali.overall)} / P${s.considerazioniFinali.posizione} | ND / ND / ND |`);
 }
 testo.push('\n## N.B. e riscontri per ogni pilota');
 for(const a of d.analisiGare.filter(a=>a.garaSlug===g.slug)){
  testo.push(`**${cod(a.pilotaSlug)}**`,...a.notaBene.split('\n').map(r=>'- '+r),
    ...(a.storicoEdizioni?.length ? a.storicoEdizioni.map(e=>`- ${e.stagione}: ${e.posizioneGara} / ${e.posizioneQualifica}; stato ${e.statoGara}; griglia ${e.griglia}; causa ${e.causaRitiro||'non registrata'}.`) : []));
 }
 testo.push('\n## Dati del circuito','| Campo | Valore locale | Riscontro F1DB | Stato |\n|---|---|---|---|',
  ...Object.entries(g.overallSemantici.geometria).map(([k,v])=>`| ${k} | ${clean(v.valore)} | ${clean(v.valoreF1db)} | ${v.stato} |`),
  '\nLe richieste e i pattern tecnici restano ipotesi editoriali, esclusi dal modello semantico. Il protocollo per acquisire giri, stint e documenti è salvato nel database.',
  '[Fonte sportiva F1DB, CC BY 4.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0).');
 fs.writeFileSync(path.join(out,g.slug+'.md'),testo.join('\n\n').replace(/\|\n\n\|/g,'|\n|')+'\n');
}
console.log(`Rapporto e 12 dossier in ${out}`);
