const fs = require('node:fs');
const path = require('node:path');
const { caricaFonti } = require('./lib/caricaFontiSemantiche');
const { descriviCampione, completamento, trend } = require('../services/overallSemantici');
function aggiorna(cartella) {
  const f = caricaFonti(cartella), file = path.join(__dirname, '../data/dati-iniziali.json');
  const d = JSON.parse(fs.readFileSync(file)), ultimo = f.ultimiGp.at(-1).round;
  const rows = (a, team, qualifica, cutoff) => (qualifica ? f.qualifiche : f.risultati).filter(r => r.year === 2026 && r.round < cutoff &&
    (team ? r.constructorId === f.scuderieF1db2026[a.scuderiaSlug || a.slug] : r.driverId === f.pilotiF1db[a.pilotaSlug || a.slug]));
  for (const [section,team] of [['piloti',false],['scuderie',true]]) for (const p of d[section]) {
    const rs=rows(p,team,false,ultimo+1), qs=rows(p,team,true,ultimo+1), o=p.overallSemantici;
    Object.assign(o.campi,{rendimento:descriviCampione(rs,'gara',f.numerosita),qualifica:descriviCampione(qs,'qualifica',f.numerosita),trend:trend(rs,f.numerosita),completamento:completamento(rs)});
    o.ultimoRoundIncluso=ultimo;o.verificatoIl=new Date().toISOString().slice(0,10);
  }
  for (const [section,team] of [['analisiGare',false],['analisiScuderie',true]]) for (const a of d[section]) {
    const cutoff=d.gare.find(g=>g.slug===a.garaSlug).ordineCalendario,rs=rows(a,team,false,cutoff),qs=rows(a,team,true,cutoff),o=a.overallSemantici;
    o.stagioneCorrente={rendimento:descriviCampione(rs,'gara',f.numerosita),qualifica:descriviCampione(qs,'qualifica',f.numerosita),completamento:completamento(rs)};
    o.campi.andamentoPerAnno=trend(rs,f.numerosita);o.campi.affidabilita={...completamento(rs),utilizzabilePrevisione:false};o.ultimoRoundIncluso=Math.min(cutoff-1,ultimo);
    o.verificatoIl=new Date().toISOString().slice(0,10);
  }
  d.metadati.aggiornamentoSportivo={verificatoIl:new Date().toISOString().slice(0,10),ultimoRoundIncluso:ultimo,fonte:d.metadati.f1db.releaseUrl||d.metadati.f1db.url};
  fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
  console.log(`Indicatori sportivi aggiornati fino al round ${ultimo}, rispettando il cutoff di ogni GP.`);
}
if(require.main===module)aggiorna(process.argv[2]);
module.exports={aggiorna};
