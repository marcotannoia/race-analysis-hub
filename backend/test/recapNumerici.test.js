const test=require('node:test');
const assert=require('node:assert/strict');
const {creaRecapNumerici,DEFINIZIONI}=require('../services/recapNumerici');
const overall=values=>Object.fromEntries(Object.keys(DEFINIZIONI).map((k,i)=>[k,values[i]===undefined?null:{valore:values[i],campione:3,fonti:['https://example.com/results']} ]));
test('recap finale conserva zero e cento e documenta copertura e fonti',()=>{
 const zero=creaRecapNumerici(overall(Array(8).fill(0)));
 assert.equal(zero.sintesiNumerica.valore,0);assert.equal(zero.sintesiNumerica.coperturaPercentuale,100);
 assert.equal(zero.recapNumerici.passoGara.valore,0);
 assert.equal(creaRecapNumerici(overall(Array(8).fill(100))).sintesiNumerica.valore,100);
 assert.equal(zero.sintesiNumerica.fonti.length,1);
});
test('nessuna sintesi fittizia con dati insufficienti; copertura parziale esplicita',()=>{
 assert.equal(creaRecapNumerici(overall([])).sintesiNumerica.valore,null);
 assert.equal(creaRecapNumerici(overall([80,60,40])).sintesiNumerica.valore,null);
 const r=creaRecapNumerici(overall([80,60,40,20])).sintesiNumerica;
 assert.equal(r.valore,50);assert.equal(r.coperturaPercentuale,50);assert.equal(r.metricheMancanti.length,4);
});
test('la mappa non spaccia completamento per affidabilità o sanzioni per prestazioni',()=>{
 const r=creaRecapNumerici(overall(Array(8).fill(80))).recapNumerici;
 assert.equal(r.risultatiGara.metrica,'storicoGara');assert.equal(r.andamentoPerAnno.metrica,'formaRecente');
 for(const key of ['affidabilita','notaBene','penalita','aggiornamentiInArrivo']){
  assert.equal(r[key].valore,null);assert.equal(r[key].stato,'non_quantificabile');assert.ok(r[key].motivo);
 }
});
