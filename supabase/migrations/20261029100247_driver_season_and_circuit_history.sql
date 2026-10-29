-- La scheda pilota non possiede una scuderia. Le associazioni appartengono alla stagione.
alter table catalog.team add constraint team_id_constructor_unique unique (id, f1db_constructor_id);
create table catalog.season_driver (
  id bigint generated always as identity primary key,
  season smallint not null check (season >= 1950),
  driver_id bigint not null references catalog.driver(id),
  constructor_id varchar(100) references f1db.constructor(id),
  team_id bigint references catalog.team(id),
  created_at timestamptz not null default now(),
  check (constructor_id is not null or team_id is not null),
  unique nulls not distinct (season, driver_id, constructor_id, team_id),
  unique (id, season),
  unique (id, driver_id, team_id, season),
  foreign key (team_id, constructor_id) references catalog.team(id, f1db_constructor_id)
);
create index season_driver_driver_idx on catalog.season_driver(driver_id, season);
create index season_driver_constructor_idx on catalog.season_driver(constructor_id);
create index season_driver_team_idx on catalog.season_driver(team_id);

-- Conserva l'assegnazione corrente, comprese eventuali riserve senza risultati.
insert into catalog.season_driver(season,driver_id,constructor_id,team_id)
select coalesce((select season from catalog.grand_prix where state='attuale' limit 1),2026),d.id,t.f1db_constructor_id,t.id
from catalog.driver d join catalog.team t on t.id=d.current_team_id
on conflict do nothing;

create function catalog.ensure_season_driver(p_driver bigint,p_season smallint,p_constructor varchar(100),p_team bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare v_constructor varchar(100):=p_constructor; v_team bigint:=p_team; v_id bigint; v_mapped varchar(100);
begin
  if v_team is not null then
    select f1db_constructor_id into v_mapped from catalog.team where id=v_team;
    if not found then raise exception 'Scuderia inesistente'; end if;
    if v_constructor is not null and v_mapped is distinct from v_constructor then
      raise exception 'Scuderia e costruttore non corrispondono';
    end if;
    v_constructor:=v_mapped;
  elsif v_constructor is not null then
    select id into v_team from catalog.team where f1db_constructor_id=v_constructor;
  end if;
  insert into catalog.season_driver(season,driver_id,constructor_id,team_id)
  values(p_season,p_driver,v_constructor,v_team)
  on conflict (season,driver_id,constructor_id,team_id) do update set season=excluded.season
  returning id into v_id;
  return v_id;
end $$;
revoke all on function catalog.ensure_season_driver(bigint,smallint,varchar,bigint) from public,anon,authenticated;

-- L'iscrizione del GP punta all'associazione stagionale effettiva, non alla squadra odierna.
alter table catalog.entry add column season_driver_id bigint;
alter table catalog.entry add column season smallint;
update catalog.entry e set season=g.season,
  season_driver_id=catalog.ensure_season_driver(e.driver_id,g.season::smallint,null,e.team_id)
from catalog.grand_prix g where g.id=e.grand_prix_id;
alter table catalog.entry alter column season_driver_id set not null;
alter table catalog.entry alter column season set not null;
alter table catalog.grand_prix add constraint grand_prix_id_season_unique unique(id,season);
alter table catalog.entry add constraint entry_gp_season_fk foreign key(grand_prix_id,season) references catalog.grand_prix(id,season);
alter table catalog.entry add constraint entry_season_driver_fk foreign key(season_driver_id,driver_id,team_id,season)
  references catalog.season_driver(id,driver_id,team_id,season);
create index entry_gp_season_idx on catalog.entry(grand_prix_id,season);
create index entry_season_driver_idx on catalog.entry(season_driver_id,driver_id,team_id,season);

create function catalog.assign_entry_season_driver() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_season smallint;
begin
  select season into v_season from catalog.grand_prix where id=new.grand_prix_id;
  if not found then raise exception 'Gran premio inesistente'; end if;
  new.season:=v_season;
  if tg_op='INSERT' then
    if new.season_driver_id is null then
      new.season_driver_id:=catalog.ensure_season_driver(new.driver_id,v_season,null,new.team_id);
    end if;
  elsif new.driver_id is distinct from old.driver_id or new.team_id is distinct from old.team_id
    or new.grand_prix_id is distinct from old.grand_prix_id or new.season_driver_id is null then
    new.season_driver_id:=catalog.ensure_season_driver(new.driver_id,v_season,null,new.team_id);
  end if;
  return new;
end $$;
revoke all on function catalog.assign_entry_season_driver() from public,anon,authenticated;
create trigger entry_assign_season_driver before insert or update on catalog.entry
for each row execute function catalog.assign_entry_season_driver();

-- FK esplicite verso il circuito e verso la stessa gara/stagione del risultato.
alter table f1db.race add constraint race_id_year_circuit_unique unique(id,year,circuit_id);
create table catalog.driver_circuit_result (
  race_id integer not null,
  session_type varchar(50) not null check(session_type in ('RACE_RESULT','QUALIFYING_RESULT','SPRINT_RACE_RESULT','SPRINT_QUALIFYING_RESULT')),
  position_display_order integer not null,
  season smallint not null,
  season_driver_id bigint not null,
  circuit_id varchar(100) not null references f1db.circuit(id),
  position_number integer,
  position_text varchar(4) not null,
  points numeric(8,2),
  laps integer,
  time_millis integer,
  retirement_reason text,
  source_payload jsonb not null check(jsonb_typeof(source_payload)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(race_id,session_type,position_display_order),
  foreign key(season_driver_id,season) references catalog.season_driver(id,season),
  foreign key(race_id,season,circuit_id) references f1db.race(id,year,circuit_id) on update cascade,
  foreign key(race_id,session_type,position_display_order)
    references f1db.race_data(race_id,type,position_display_order) on delete cascade deferrable initially deferred
);
create index driver_circuit_result_race_context_idx on catalog.driver_circuit_result(race_id,season,circuit_id);
create index driver_circuit_result_assignment_idx on catalog.driver_circuit_result(season_driver_id,season,circuit_id);
create index driver_circuit_result_circuit_idx on catalog.driver_circuit_result(circuit_id,season);

-- Un trasferimento crea un'altra associazione: non riscrive quella storica.
create function catalog.keep_season_driver_identity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (new.season,new.driver_id,new.constructor_id,new.team_id) is distinct from (old.season,old.driver_id,old.constructor_id,old.team_id) then
    raise exception 'Associazione stagionale immutabile: creare una nuova season_driver';
  end if;
  return new;
end $$;
revoke all on function catalog.keep_season_driver_identity() from public,anon,authenticated;
create trigger season_driver_keep_identity before update on catalog.season_driver
for each row execute function catalog.keep_season_driver_identity();

create function catalog.validate_driver_result_assignment() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not exists(
    select 1 from catalog.season_driver sd join catalog.driver d on d.id=sd.driver_id
    join f1db.race_data rd on rd.driver_id=d.f1db_driver_id and rd.constructor_id=sd.constructor_id
    where sd.id=new.season_driver_id and sd.season=new.season
      and rd.race_id=new.race_id and rd.type=new.session_type and rd.position_display_order=new.position_display_order
  ) then raise exception 'Risultato e associazione stagionale non corrispondono'; end if;
  return new;
end $$;
revoke all on function catalog.validate_driver_result_assignment() from public,anon,authenticated;
create trigger driver_result_validate_assignment before insert or update on catalog.driver_circuit_result
for each row execute function catalog.validate_driver_result_assignment();

create function catalog.refresh_driver_circuit_history(p_driver bigint default null)
returns integer language plpgsql security invoker set search_path='' as $$
declare v_count integer;
begin
  insert into catalog.season_driver(season,driver_id,constructor_id,team_id)
  select distinct r.year,d.id,rd.constructor_id,t.id
  from f1db.race_data rd join f1db.race r on r.id=rd.race_id
  join catalog.driver d on d.f1db_driver_id=rd.driver_id
  left join catalog.team t on t.f1db_constructor_id=rd.constructor_id
  where rd.type in ('RACE_RESULT','QUALIFYING_RESULT','SPRINT_RACE_RESULT','SPRINT_QUALIFYING_RESULT')
    and (p_driver is null or d.id=p_driver)
  on conflict do nothing;
  insert into catalog.driver_circuit_result as target
    (race_id,session_type,position_display_order,season,season_driver_id,circuit_id,position_number,position_text,points,laps,time_millis,retirement_reason,source_payload)
  select rd.race_id,rd.type,rd.position_display_order,r.year,sd.id,r.circuit_id,rd.position_number,rd.position_text,
    rd.race_points,rd.race_laps,coalesce(rd.race_time_millis,rd.qualifying_time_millis),rd.race_reason_retired,to_jsonb(rd)
  from f1db.race_data rd join f1db.race r on r.id=rd.race_id
  join catalog.driver d on d.f1db_driver_id=rd.driver_id
  left join catalog.team t on t.f1db_constructor_id=rd.constructor_id
  join catalog.season_driver sd on sd.driver_id=d.id and sd.season=r.year and sd.constructor_id=rd.constructor_id and sd.team_id is not distinct from t.id
  where rd.type in ('RACE_RESULT','QUALIFYING_RESULT','SPRINT_RACE_RESULT','SPRINT_QUALIFYING_RESULT')
    and (p_driver is null or d.id=p_driver)
  on conflict(race_id,session_type,position_display_order) do update set
    season=excluded.season,season_driver_id=excluded.season_driver_id,circuit_id=excluded.circuit_id,
    position_number=excluded.position_number,position_text=excluded.position_text,points=excluded.points,
    laps=excluded.laps,time_millis=excluded.time_millis,retirement_reason=excluded.retirement_reason,
    source_payload=excluded.source_payload,updated_at=now()
  where target.source_payload is distinct from excluded.source_payload or target.season_driver_id is distinct from excluded.season_driver_id
    or target.circuit_id is distinct from excluded.circuit_id or target.season is distinct from excluded.season;
  get diagnostics v_count=row_count;
  return v_count;
end $$;
revoke all on function catalog.refresh_driver_circuit_history(bigint) from public,anon,authenticated;

-- Gli aggiornamenti F1DB futuri mantengono lo storico coerente nello stesso commit.
create function catalog.sync_driver_circuit_result() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_driver bigint; v_season smallint; v_circuit varchar(100); v_assignment bigint;
begin
  if tg_op='UPDATE' and (old.race_id,old.type,old.position_display_order) is distinct from (new.race_id,new.type,new.position_display_order) then
    delete from catalog.driver_circuit_result where race_id=old.race_id and session_type=old.type and position_display_order=old.position_display_order;
  end if;
  if new.type not in ('RACE_RESULT','QUALIFYING_RESULT','SPRINT_RACE_RESULT','SPRINT_QUALIFYING_RESULT') then return new; end if;
  select id into v_driver from catalog.driver where f1db_driver_id=new.driver_id;
  if not found then
    delete from catalog.driver_circuit_result where race_id=new.race_id and session_type=new.type and position_display_order=new.position_display_order;
    return new;
  end if;
  select year,circuit_id into v_season,v_circuit from f1db.race where id=new.race_id;
  v_assignment:=catalog.ensure_season_driver(v_driver,v_season,new.constructor_id,null);
  insert into catalog.driver_circuit_result
    (race_id,session_type,position_display_order,season,season_driver_id,circuit_id,position_number,position_text,points,laps,time_millis,retirement_reason,source_payload)
  values(new.race_id,new.type,new.position_display_order,v_season,v_assignment,v_circuit,new.position_number,new.position_text,
    new.race_points,new.race_laps,coalesce(new.race_time_millis,new.qualifying_time_millis),new.race_reason_retired,to_jsonb(new))
  on conflict(race_id,session_type,position_display_order) do update set
    season=excluded.season,season_driver_id=excluded.season_driver_id,circuit_id=excluded.circuit_id,
    position_number=excluded.position_number,position_text=excluded.position_text,points=excluded.points,laps=excluded.laps,
    time_millis=excluded.time_millis,retirement_reason=excluded.retirement_reason,source_payload=excluded.source_payload,updated_at=now();
  return new;
end $$;
revoke all on function catalog.sync_driver_circuit_result() from public,anon,authenticated;
create trigger race_data_sync_driver_circuit after insert or update on f1db.race_data
for each row execute function catalog.sync_driver_circuit_result();

create function catalog.sync_new_driver_history() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' and old.f1db_driver_id is distinct from new.f1db_driver_id
    and exists(select 1 from catalog.driver_circuit_result h join catalog.season_driver sd on sd.id=h.season_driver_id where sd.driver_id=new.id) then
    raise exception 'Un pilota con storico non può cambiare identità F1DB';
  end if;
  perform catalog.refresh_driver_circuit_history(new.id);
  return new;
end $$;
revoke all on function catalog.sync_new_driver_history() from public,anon,authenticated;
create trigger driver_sync_history after insert or update of f1db_driver_id on catalog.driver
for each row execute function catalog.sync_new_driver_history();

-- Le associazioni appartengono ora a season_driver; nessuna squadra nell'anagrafica.
alter table catalog.driver drop column current_team_id;

create view catalog.driver_circuit_history with(security_invoker=true) as
select d.id driver_id,d.slug driver_slug,d.name driver_name,sd.id season_driver_id,sd.season,
  sd.constructor_id,con.name constructor_name,sd.team_id,
  h.race_id,r.round,r.date race_date,h.session_type,h.position_display_order,h.position_number,h.position_text,
  h.points,h.laps,h.time_millis,h.retirement_reason,h.circuit_id,c.name circuit_name,r.circuit_layout_id,
  (h.position_number is not null and h.retirement_reason is null and h.position_text not in ('DNF','DNS','DSQ','EX','NC')) regular_result,
  h.source_payload
from catalog.driver_circuit_result h join catalog.season_driver sd on sd.id=h.season_driver_id
join catalog.driver d on d.id=sd.driver_id join f1db.race r on r.id=h.race_id
join f1db.circuit c on c.id=h.circuit_id join f1db.constructor con on con.id=sd.constructor_id;

alter table catalog.season_driver enable row level security;
alter table catalog.driver_circuit_result enable row level security;
revoke all on catalog.season_driver,catalog.driver_circuit_result,catalog.driver_circuit_history from public,anon,authenticated;
comment on table catalog.driver is 'Scheda anagrafica indipendente dalla scuderia; le associazioni stagionali risiedono in catalog.season_driver.';
comment on table catalog.season_driver is 'Associazione pilota/stagione/scuderia. Un pilota può avere più righe nella stessa stagione; i GP identificano la squadra effettiva. Un ritorno alla stessa squadra riusa la stessa associazione.';
comment on column catalog.season_driver.constructor_id is 'Scuderia storica F1DB; team_id collega la scheda editoriale quando disponibile.';
comment on table catalog.driver_circuit_result is 'Storico gara, qualifica e sprint dei piloti catalogati; FK al circuito F1DB, la stessa entità referenziata dai profili di somiglianza.';

-- Backfill dopo il DDL: evita di alterare tabelle con eventi FK differiti pendenti.
select catalog.refresh_driver_circuit_history();
