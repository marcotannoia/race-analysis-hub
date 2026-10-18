const test=require('node:test');
const assert=require('node:assert/strict');
const {punteggio,valutazioniNumeriche}=require('../services/valutazioniNumeriche');
const express=require('express');
const {creaRouter}=require('../relational/api');

test('i punteggi non sono estratti dalla prosa e non sostituiscono i mancanti con zero',()=>{
  for(const v of [-1,101,NaN,Infinity,'50',true])assert.throws(()=>punteggio(v));
  assert.equal(punteggio(0),0);assert.equal(punteggio(null),null);
  assert.equal(valutazioniNumeriche({gestioneGomme:'indice 80/100'}).gestioneGomme,null);
});

test('API v2: filtri, paginazione, errori, sola lettura e nessuna dipendenza MongoDB',async()=>{
  let ricevuto;
  const app=express();
  app.use('/api/v2',creaRouter({readImpl:async (tabella,parametri)=>{
    ricevuto={tabella,parametri};return [{valore:0,campione:2}];
  }}));
  const server=app.listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api/v2`;
  try {
    const risposta=await fetch(`${base}/valutazioni?pilota=leclerc&anno=2026&limit=10`);
    assert.equal(risposta.status,200);
    assert.equal((await risposta.json()).dati[0].valore,0);
    assert.equal(ricevuto.parametri['f1_analisi.pilota_slug'],'eq.leclerc');
    for(const q of ['limit=101','offset=-1','pilota=x%26or=1','anno=2026&anno=2025','foo=1'])
      assert.equal((await fetch(`${base}/valutazioni?${q}`)).status,400);
    assert.equal((await fetch(`${base}/piloti`,{method:'POST'})).status,405);
  } finally {await new Promise(r=>server.close(r));}
});


test('DATABASE_CONNECTION è supportato con TLS verificato e precedenza della variabile specifica',()=>{
  const {configurazione,connectionString}=require('../relational/connessione');
  const env={DATABASE_CONNECTION:'postgresql://user:password@example.com:5432/postgres'};
  assert.equal(connectionString(env),env.DATABASE_CONNECTION);
  assert.equal(configurazione(env).ssl.rejectUnauthorized,true);
  assert.equal(connectionString({...env,SUPABASE_DATABASE_URL:'specifico'}),'specifico');
  assert.throws(()=>configurazione({DATABASE_CONNECTION:env.DATABASE_CONNECTION+'?sslmode=disable'}));
});

test('la v2 elimina la prosa delle prestazioni anche nei confronti e conserva zero e null',()=>{
  const {presentaRisposta}=require('../relational/applicazione');
  const analisi={gara:{slug:'usa-austin'},valutazioni:{passoGara:0,gestioneGomme:null},
    valutazioniPerAnno:{2025:{passoGara:42}},prestazioni:{gestioneGomme:'testo legacy'},
    considerazioniFinali:'testo legacy',datiPerAnno:{risultatiGara:{2024:'P1 (Ferrari)'},risultatiQualifica:{2024:'Q4 (Ferrari)'}},
    storicoEdizioni:[],fonti:['https://openf1.org/docs/']};
  const dato=presentaRisposta({elementi:[{analisi}]}).elementi[0].analisi;
  assert.equal(dato.valutazioni.passoGara,0);
  assert.equal(dato.valutazioni.gestioneGomme,null);
  assert.equal(dato.prestazioni,undefined);
  assert.equal(dato.considerazioniFinali,undefined);
  assert.deepEqual(dato.storicoEdizioni,[{stagione:2024,posizioneGara:'P1',posizioneQualifica:'Q4'}]);
  assert.equal(analisi.prestazioni.gestioneGomme,'testo legacy');
  assert.equal(presentaRisposta({analisiPiloti:[analisi]}).analisiPiloti[0].prestazioni,undefined);
});

test('servizi v2: lingua, errori, cache e contratto numerico condiviso col client',async()=>{
  const {creaRouterApplicazione,percorsi}=require('../relational/applicazione');
  const api=express();let chiamate=0;
  api.use('/api/v2',creaRouterApplicazione({dettaglioPilota:async(req,res)=>{
    chiamate++;
    res.json({lingua:res.locals.lingua,pilota:{slug:req.params.pilotaSlug},analisi:{gara:{slug:'usa-austin'},
      valutazioni:{passoGara:0,gestioneGomme:null},valutazioniPerAnno:{},
      prestazioni:{passoGara:'non esporre'},storicoEdizioni:[],fonti:[]}});
  }}));
  const server=api.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api/v2`;
  try{
    const r=await fetch(`${base}/piloti/leclerc?lingua=en`);
    assert.equal(r.status,200);assert.equal(r.headers.get('content-language'),'en');
    const dati=await r.json();assert.equal(dati.analisi.prestazioni,undefined);
    assert.equal(dati.analisi.valutazioni.passoGara,0);
    const cached=await fetch(`${base}/piloti/leclerc?lingua=en`);
    assert.deepEqual(await cached.json(),dati);assert.equal(chiamate,1);
    assert.equal((await fetch(`${base}/piloti/leclerc?foo=1`)).status,400);
    assert.equal((await fetch(`${base}/piloti/leclerc?lingua=xx`)).status,400);
    assert.equal((await fetch(`${base}/piloti/invalid.slug`)).status,400);
    const spec=require('../relational/openapi');
    for(const [p] of percorsi)assert.ok(spec.paths['/api/v2'+p.replace(/:([A-Za-z]+)/g,'{$1}')]);
  }finally{await new Promise(r=>server.close(r));}
});
