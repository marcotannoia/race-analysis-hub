const test = require('node:test');
const assert = require('node:assert/strict');
const {CRITERI, confrontaCircuiti, confrontaCalendario, valutaRisultatiSimili} = require('../services/similaritaCircuiti');
const catalogo = require('../data/similarita-circuiti-2026.json');
function completo() {
  return {campi:Object.fromEntries(CRITERI.map(c => [c.chiave, {
    valore:c.chiave==='tipologia'?'permanente':c.chiave==='caricoAerodinamico'?'medio':c.chiave==='meteoMedio'?'no':Math.max(c.minimo,Math.min(c.massimo, c.scala/2)),
    stato:'documentato',fonti:['https://example.org/misura'],sistema:c.chiave==='zoneSorpasso'?'overtake-2026':undefined,
  }]))};
}
test('22 criteri equiponderati; identità completa e simmetria',()=>{
  assert.equal(CRITERI.length,22);
  assert.ok(Math.abs(CRITERI.reduce((s,c)=>s+c.pesoPercentuale,0)-100)<1e-10);
  const a=completo(),b=completo();b.campi.numeroCurve.valore+=10;
  assert.equal(confrontaCircuiti(a,a).similaritaPercentuale,100);
  assert.equal(confrontaCircuiti(a,b).dettagli[0].similaritaPercentuale,50);
  assert.equal(confrontaCircuiti(a,b).similaritaPercentuale,confrontaCircuiti(b,a).similaritaPercentuale);
  assert.equal(confrontaCircuiti(a,b).similaritaPercentuale,97.7273);
});
test('dati mancanti non diventano zero né una somiglianza totale fittizia',()=>{
  const a=completo(),b=completo();delete b.campi.numeroCurve;
  const r=confrontaCircuiti(a,b);
  assert.equal(r.similaritaPercentuale,null);
  assert.equal(r.similaritaParzialePercentuale,100);
  assert.equal(r.utilizzabileInPrevisione,false);
  assert.equal(r.intervalloPercentuale.minimo,95.4545);
  assert.equal(r.intervalloPercentuale.massimo,100);
  assert.equal(confrontaCircuiti({},{}).similaritaParzialePercentuale,null);
});
test('zero valido, negativi fisici ammessi, fonti e regime necessari',()=>{
  const a=completo(),b=completo();
  a.campi.altitudineMetri.valore=-23;b.campi.altitudineMetri.valore=-23;
  a.campi.ventoMs.valore=0;b.campi.ventoMs.valore=0;
  assert.equal(confrontaCircuiti(a,b).similaritaPercentuale,100);
  b.campi.zoneSorpasso.sistema='drs-2025';
  assert.equal(confrontaCircuiti(a,b).campiConfrontati,21);
  b.campi.temperaturaAriaC.anni=[2027];
  b.campi.numeroCurve.fonti=[];
  assert.equal(confrontaCircuiti(a,b).campiConfrontati,19);
});
test('catalogo 2026: tutte le piste e tutti i campi, nessun riempimento implicito',()=>{
  assert.equal(Object.keys(catalogo.circuiti).length,23);
  for(const c of Object.values(catalogo.circuiti)) {
    assert.deepEqual(Object.keys(c.campi).sort(),CRITERI.map(c=>c.chiave).sort());
    for(const v of Object.values(c.campi)) if(v.valore!==null) assert.ok(v.fonti.length);
  }
  assert.equal(confrontaCalendario('messico-citta-del-messico').length,22);
  assert.deepEqual(confrontaCalendario('assente'),[]);
});
test('risultati simili: esclusi futuro e gare senza dati completi',()=>{
  const confronti=[{circuitId:'a',utilizzabileInPrevisione:true,similaritaPercentuale:80}];
  const risultati=[{year:2026,raceId:1,circuitId:'a',round:1,driverId:'pil',positionNumber:1}, {year:2026,raceId:1,circuitId:'a',round:1,driverId:'alt',positionNumber:2}, {year:2026,raceId:2,circuitId:'a',round:2,driverId:'pil',positionNumber:2}];
  assert.equal(valutaRisultatiSimili(confronti,risultati,'pil',2).valore,100);
  assert.equal(valutaRisultatiSimili([],risultati,'pil',2).valore,null);
});

test('carico a tre enum e pioggia binaria producono percentuali esplicite',()=>{
  const a=completo(),b=completo();
  a.campi.caricoAerodinamico.valore='basso';b.campi.caricoAerodinamico.valore='alto';
  b.campi.meteoMedio.valore='si';
  const dettagli=confrontaCircuiti(a,b).dettagli;
  assert.equal(dettagli.find(d=>d.chiave==='caricoAerodinamico').similaritaPercentuale,0);
  assert.equal(dettagli.find(d=>d.chiave==='meteoMedio').similaritaPercentuale,0);
  b.campi.caricoAerodinamico.valore='medio';
  assert.equal(confrontaCircuiti(a,b).dettagli.find(d=>d.chiave==='caricoAerodinamico').similaritaPercentuale,50);
});

test('tutti i 506 campi sono compilati e tutte le 253 coppie sono simmetriche e complete',()=>{
  const circuiti=Object.values(catalogo.circuiti);let coppie=0;
  for(const [i,a] of circuiti.entries()){
    assert.equal(Object.values(a.campi).filter(v=>v.valore!==null).length,22,a.slug);
    assert.equal(a.campi.richiestaAccelerazione,undefined);
    assert.equal(confrontaCircuiti(a,a).similaritaPercentuale,100,a.slug);
    for(const b of circuiti.slice(i+1)){
      const r=confrontaCircuiti(a,b);coppie++;
      assert.equal(r.coperturaPercentuale,100,`${a.slug}/${b.slug}`);
      assert.equal(r.similaritaPercentuale,confrontaCircuiti(b,a).similaritaPercentuale);
      assert.ok(r.similaritaPercentuale>=0&&r.similaritaPercentuale<=100);
      assert.equal(r.dettagli.length,22);
      assert.ok(r.dettagli.every(d=>Number.isFinite(d.similaritaPercentuale)));
      assert.ok(r.criteriConStime>0);
    }
  }
  assert.equal(coppie,253);
});

test('le stime sono ammesse ma rimangono riconoscibili nei dettagli pubblici',()=>{
  const a=completo(),b=completo();b.campi.numeroCurve.stato='stimato';b.campi.numeroCurve.metodo='Riferimento approssimato.';
  const r=confrontaCircuiti(a,b);
  assert.equal(r.similaritaPercentuale,100);
  assert.equal(r.dettagli[0].qualitaSecondo,'stimato');
  assert.equal(r.dettagli[0].metodoSecondo,'Riferimento approssimato.');
  assert.equal(r.criteriConStime,1);
});

test('risultati: un anno futuro è escluso e un round alto di un anno precedente rimane utilizzabile',()=>{
  const confronti=[{circuitId:'a',utilizzabileInPrevisione:true,similaritaPercentuale:80}];
  const risultati=[
    {year:2025,round:22,raceId:1,circuitId:'a',driverId:'pil',positionNumber:1},
    {year:2025,round:22,raceId:1,circuitId:'a',driverId:'alt',positionNumber:2},
    {year:2027,round:1,raceId:2,circuitId:'a',driverId:'pil',positionNumber:2},
    {year:2027,round:1,raceId:2,circuitId:'a',driverId:'alt',positionNumber:1},
  ];
  assert.deepEqual(valutaRisultatiSimili(confronti,risultati,'pil',2,2026),{valore:100,campione:1});
});
