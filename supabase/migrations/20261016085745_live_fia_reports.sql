create schema live_fia;
revoke all on schema live_fia from public, anon, authenticated;

create table live_fia.report (
  id bigint generated always as identity primary key,
  grand_prix_id bigint not null unique references catalog.grand_prix(id),
  gara_slug text not null unique,
  payload jsonb not null,
  checked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table live_fia.team_upgrade (
  report_id bigint not null references live_fia.report(id) on delete cascade,
  team_id bigint not null references catalog.team(id),
  fia_name text not null,
  no_upgrade boolean not null,
  components text[] not null default '{}',
  description text not null default '',
  primary key (report_id,team_id)
);
create index team_upgrade_team_id_idx on live_fia.team_upgrade(team_id);

insert into live_fia.report(grand_prix_id,gara_slug,payload,checked_at)
select gp.id,a.payload->>'garaSlug',a.payload,
  nullif(a.payload->>'ultimoControlloIl','')::timestamptz
from archive.mongo_document a join catalog.grand_prix gp
  on gp.slug=a.payload->>'garaSlug'
where a.collection_name='dati_live_fia';

insert into live_fia.team_upgrade(report_id,team_id,fia_name,no_upgrade,components,description)
select r.id,t.id,item->>'nomeFia',(item->>'nessunAggiornamento')::boolean,
  coalesce(array(select jsonb_array_elements_text(item->'componenti')),'{}'),
  coalesce(item->>'descrizione','')
from live_fia.report r
cross join lateral jsonb_array_elements(coalesce(r.payload->'aggiornamenti'->'scuderie','[]'::jsonb)) item
join catalog.team t on t.slug=item->>'slug';
