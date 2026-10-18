const path=require('node:path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
process.env.DATA_PROVIDER='postgres';
const db=require('../config/database');
(async()=>{
 await db();
 try{
  const r=await require('../services/aggiornamentoAutomaticoGp').controllaAggiornamentoGp({dryRun:!process.argv.includes('--apply')});
  console.log(JSON.stringify({stato:r.stato,gara:r.garaAttuale,esito:r.esito,piccoMemoriaMiB:Math.round(process.resourceUsage().maxRSS/1024)},null,2));
 }finally{await db.chiudiDatabase();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
