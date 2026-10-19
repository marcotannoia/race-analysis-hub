// Indice osservato sui risultati, distinto da completamento e probabilità futura.
const TECNICI = new Set(['Battery','Brakes','Broken seat','Clutch','Coolant leak','Electrical','Engine','Fuel system','Gearbox','Handling','Hydraulics','Mechanical','Overheating','Power loss','Safety switch','Suspension','Transmission','Vibrations','Water pressure']);
const ESTERNI = new Set(['Accident','Collision','Collision damage','Spun off']);
function affidabilitaMeccanica(righe) {
  const partenze=righe.filter(r=>!['DNS','DNP','DNQ','DNPQ'].includes(r.positionText));
  const ignoti=partenze.filter(r=>(r.reasonRetired&&!TECNICI.has(r.reasonRetired)&&!ESTERNI.has(r.reasonRetired))||(!r.reasonRetired&&['DNF','NC'].includes(r.positionText)));
  const guasti=partenze.filter(r=>TECNICI.has(r.reasonRetired)).length;
  const campione=partenze.length-ignoti.length;
  return {overall:campione?Math.round(1000*(campione-guasti)/campione)/10:null,campione,guasti,
    causeNonClassificate:ignoti.length,osservazioni:partenze.length,stato:campione?'disponibile':'dati_insufficienti',
    metodo:'100 × (partenze con causa nota − guasti tecnici) / partenze con causa nota. DNS esclusi; incidenti e collisioni non sono guasti. Esiti ambigui esclusi dal campione. Indice storico, non probabilità futura.',
    fonti:[require('./overallSemantici').FONTE]};
}
module.exports={affidabilitaMeccanica};
