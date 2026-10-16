// Confronta le risposte pubbliche di due istanze API, ignorando solo requestId.
const first = process.argv[2];
const second = process.argv[3];
if (!first || !second) {
  console.error('Uso: node scripts/verificaParitaApi.js http://127.0.0.1:5013 http://127.0.0.1:5012');
  process.exit(1);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.keys(value).filter((key)=>key!=='requestId').sort()
      .map((key)=>[key,canonical(value[key])]));
  return value;
}
async function get(base, path, language) {
  const url = new URL(path,base);
  if (language) url.searchParams.set('lingua',language);
  const response = await fetch(url);
  return { status: response.status, body: canonical(await response.json()) };
}
async function compare(path, language) {
  const [a,b] = await Promise.all([get(first,path,language),get(second,path,language)]);
  if (a.status!==b.status || JSON.stringify(a.body)!==JSON.stringify(b.body)) {
    const error = new Error(`Risposte diverse: ${path} [${language||'default'}] HTTP ${a.status}/${b.status}`);
    error.detail = { keysMongo:Object.keys(a.body),keysPostgres:Object.keys(b.body) };
    throw error;
  }
  if (a.status!==200 && !(a.status===404 && (path.includes('inesistente') || path.endsWith('/analisi'))))
    throw new Error(`HTTP ${a.status}: ${path}`);
  return a.body;
}
async function main() {
  const current = await compare('/api/v1/gare/attuale','it');
  const gp = current.gara.slug;
  const drivers = (await compare('/api/v1/piloti','it')).piloti.map((x)=>x.slug);
  const teams = (await compare('/api/v1/scuderie','it')).scuderie.map((x)=>x.slug);
  const base = ['/api/v1','/api/v1/health','/api/v1/home','/api/v1/stagione',
    '/api/v1/lingue','/api/v1/piloti',`/api/v1/piloti/${drivers[0]}`,
    '/api/v1/scuderie',`/api/v1/scuderie/${teams[0]}`,
    '/api/v1/gare','/api/v1/gare/attuale',`/api/v1/gare/${gp}`,
    '/api/v1/classifiche/piloti','/api/v1/classifiche/scuderie',
    '/api/v1/previsioni/piloti',
    `/api/v1/confronti/piloti/${drivers[0]}/${drivers[1]}`,
    `/api/v1/confronti/scuderie/${teams[0]}/${teams[1]}`,
    `/api/v1/gare/${gp}/piloti/${drivers[0]}/analisi`,
    `/api/v1/gare/${gp}/scuderie/${teams[0]}/analisi`,
    '/api/v1/piloti/inesistente','/api/v1/gare/inesistente'];
  let checked=1;
  for (const language of ['it','en','fr','pt','es','de'])
    for (const path of base) { await compare(path,language); checked++; }
  for (const driver of drivers) {
    await compare(`/api/v1/piloti/${driver}`,'it'); checked++;
    await compare(`/api/v1/gare/${gp}/piloti/${driver}/analisi`,'it'); checked++;
  }
  for (const team of teams) {
    await compare(`/api/v1/scuderie/${team}`,'it'); checked++;
    await compare(`/api/v1/gare/${gp}/scuderie/${team}/analisi`,'it'); checked++;
  }
  console.log(JSON.stringify({ checked,drivers:drivers.length,teams:teams.length,grandPrix:gp,identical:true }));
}
main().catch((error)=>{ console.error(error.message,error.detail||''); process.exitCode=1; });
