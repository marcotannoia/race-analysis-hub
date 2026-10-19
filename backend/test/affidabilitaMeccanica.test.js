const test=require('node:test'),assert=require('node:assert/strict');
const {affidabilitaMeccanica}=require('../services/affidabilitaMeccanica');
test('affidabilità distingue guasti, incidenti, DNS e cause ignote',()=>{
 const m=affidabilitaMeccanica([{positionText:'1'},{positionText:'DNF',reasonRetired:'Engine'},
  {positionText:'DNF',reasonRetired:'Collision'},{positionText:'DNS',reasonRetired:'Gearbox'},
  {positionText:'NC'},{positionText:'DNF',reasonRetired:'Unknown'}]);
 assert.equal(m.overall,66.7);assert.equal(m.campione,3);assert.equal(m.guasti,1);assert.equal(m.causeNonClassificate,2);
 assert.equal(affidabilitaMeccanica([]).overall,null);
 assert.equal(affidabilitaMeccanica([{positionText:'DNF',reasonRetired:'Engine'}]).overall,0);
});
test('v2 espone affidabilità numerica e conserva note e considerazioni come testi',()=>{
 const {presentaRisposta}=require('../relational/applicazione');
 const r=presentaRisposta({gara:{slug:'usa-austin'},valutazioni:{},prestazioni:{affidabilita:'testo v1'},notaBene:'nota',considerazioniFinali:'considerazioni',affidabilitaNumerica:{overall:75,campione:4}});
 assert.equal(r.affidabilita,75);assert.equal(r.prestazioni.affidabilita,75);assert.equal(r.valutazioni.affidabilita,75);
 assert.equal(r.nota_bene,'nota');assert.equal(r.considerazioni_finali,'considerazioni');
 assert.equal(r.recapNumerici.affidabilita.valore,75);assert.equal(r.recapNumerici.notaBene.testo,'nota');
});
