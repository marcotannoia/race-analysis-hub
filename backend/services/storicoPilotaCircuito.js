const TIPI=Object.freeze(['RACE_RESULT','QUALIFYING_RESULT','SPRINT_RACE_RESULT','SPRINT_QUALIFYING_RESULT']);
async function leggiStoricoPilotaCircuito({pilotaSlug,circuitoId=null,primaDel=null,sessioni=TIPI,soloRegolari=false,limite=1000},db=require('../relational/connessione').database()){
 if(typeof pilotaSlug!=='string'||!pilotaSlug.trim())throw new Error('Pilota obbligatorio');
 if(circuitoId!==null&&(typeof circuitoId!=='string'||!circuitoId))throw new Error('Circuito non valido');
 if(primaDel!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(primaDel)||!Number.isFinite(Date.parse(primaDel))||new Date(primaDel).toISOString().slice(0,10)!==primaDel))throw new Error('Data limite non valida');
 if(!Array.isArray(sessioni)||!sessioni.length||sessioni.some(s=>!TIPI.includes(s)))throw new Error('Sessioni non valide');
 if(!Number.isInteger(limite)||limite<1||limite>10000)throw new Error('Limite non valido');
 const q=await db.query(`select h.*,p.profile from catalog.driver_circuit_history h
   left join lateral (
     select to_jsonb(cp)-'created_at'-'updated_at' as profile
     from catalog.circuit_similarity_profile cp
     where cp.circuit_id=h.circuit_id and ($3::date is null or cp.snapshot_date<$3::date)
     order by cp.snapshot_date desc,cp.season desc,cp.methodology_version desc limit 1
   ) p on true
   where h.driver_slug=$1 and ($2::text is null or h.circuit_id=$2)
     and ($3::date is null or h.race_date<$3::date) and h.session_type=any($4::text[])
     and (not $5::boolean or h.regular_result)
   order by h.race_date desc,h.round desc,h.session_type,h.position_display_order limit $6`,
 [pilotaSlug,circuitoId,primaDel,sessioni,soloRegolari,limite]);
 return q.rows;
}
module.exports={TIPI,leggiStoricoPilotaCircuito};
