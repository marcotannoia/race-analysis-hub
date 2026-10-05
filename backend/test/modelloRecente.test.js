const test=require('node:test'),assert=require('node:assert/strict');
const campioni=require('../data/campioni-previsionali-2026.json'),evidenze=require('../data/evidenze-giri-2023-2026.json'),report=require('../data/valutazione-forma-recente-2026-10-05.json');
const {fattoriRecenti,ordinaRecenti}=require('../services/modelloRecente');
const {selezionaEvidenze,aggregaEvidenze}=require('../services/evidenzePrestazioni');
test('giri, qualifiche e risultati futuri non cambiano la forma precedente al GP',()=>{
 const gara=campioni.gare.find(g=>g.round===12),partecipanti=campioni.risultati.filter(r=>r.raceId===gara.id),parametri=report.parametri;
 const base={campioni,evidenze,gara,partecipanti,parametri};const expected=fattoriRecenti(base);
 const cc=structuredClone(campioni),ee=structuredClone(evidenze);
 for(const r of [...cc.risultati,...cc.qualifiche])if(r.year===2026&&r.round>=12)r.positionNumber=1;
 for(const s of ee.sessioni)if(s.year===2026&&s.round>=12)for(const p of s.piloti)p.passo.overall=100;
 assert.deepEqual(fattoriRecenti({...base,campioni:cc,evidenze:ee}),expected);
});
test('le classifiche salvate sono riproducibili con il modello pubblico e i parametri anteriori',()=>{
 for(const row of report.gp){const gara=campioni.gare.find(g=>g.round===row.round),partecipanti=campioni.risultati.filter(r=>r.raceId===gara.id);
  const f=fattoriRecenti({campioni,evidenze,gara,partecipanti,parametri:row.parametriProgressivi});
  assert.deepEqual(ordinaRecenti(f,row.pesiProgressivi).map(p=>p.driverId),row.progressivo.classifica.map(p=>p.driverId));
  assert.ok(row.pesiProgressivi[3]>=50);}
});
test('copertura sessioni, identità e qualità degli indicatori sono coerenti',()=>{
 assert.equal(evidenze.sessioni.length,46);
 assert.equal(evidenze.sessioni.filter(s=>s.year===2026).length,16);
 for(const s of evidenze.sessioni){assert.equal(new Set(s.piloti.map(p=>p.driverId)).size,s.piloti.length);
  for(const p of s.piloti){assert.ok(p.driverId&&p.constructorId);for(const k of ['passo','gomme'])if(p[k].overall!==null)assert.ok(Number.isFinite(p[k].overall)&&p[k].overall>=0&&p[k].overall<=100);
   if(p.passo.overall!==null)assert.ok(p.passo.campione>=8);for(const st of p.gomme.stintComparabili)assert.ok(st.giriComparabili>=10);}}
});
test('le schede future hanno evidenze anteriori al target e testi specifici nelle sei lingue',()=>{
 const d=require('../data/dati-iniziali.json');
 for(const a of [...d.analisiGare,...d.analisiScuderie]){
  const g=d.gare.find(g=>g.slug===a.garaSlug);
  assert.ok(a.overallSemantici.evidenzeGiri.recenti.every(s=>s.round<g.ordineCalendario));
  for(const lang of ['it','en','fr','pt','es','de'])for(const k of ['passoGara','gestioneGomme','andamentoPerAnno','aggiornamentiInArrivo','considerazioniFinali'])assert.ok(a.traduzioni[lang][k].length>20);
  assert.ok(!a.passoGara.includes('Passo gara non misurato: mancano'));
  assert.ok(!a.gestioneGomme.includes('Gestione gomme non misurata: mancano'));
 }
 const sessions=selezionaEvidenze(evidenze,{driverId:'kimi-antonelli',roundEsclusivo:17});
 assert.ok(aggregaEvidenze(sessions,'passo').overall!==null);
});
