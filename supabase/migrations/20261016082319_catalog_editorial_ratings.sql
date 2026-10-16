-- Tabelle applicative private. Gli endpoint pubblici restano nel backend Express.
create schema if not exists catalog;
create schema if not exists editorial;
create schema if not exists ratings;

revoke all on schema catalog, editorial, ratings from public, anon, authenticated;

create table catalog.team (
  id bigint generated always as identity primary key,
  slug text not null unique,
  f1db_constructor_id varchar(100) unique references f1db.constructor(id),
  name text not null,
  standings_name text not null,
  abbreviation varchar(3) not null unique,
  colour char(7) not null check (colour ~ '^#[0-9A-F]{6}$'),
  nationality text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.driver (
  id bigint generated always as identity primary key,
  slug text not null unique,
  f1db_driver_id varchar(100) unique references f1db.driver(id),
  current_team_id bigint not null references catalog.team(id),
  name text not null,
  code varchar(3) not null unique,
  car_number varchar(3) not null,
  nationality text not null,
  nationality_iso2 char(2) not null check (nationality_iso2 ~ '^[A-Z]{2}$'),
  nationality_iso3 char(3) not null check (nationality_iso3 ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index driver_current_team_id_idx on catalog.driver(current_team_id);

create table catalog.circuit (
  id bigint generated always as identity primary key,
  slug text not null unique,
  f1db_circuit_id varchar(100) unique references f1db.circuit(id),
  name text not null
);

create table catalog.grand_prix (
  id bigint generated always as identity primary key,
  slug text not null unique,
  f1db_race_id integer unique references f1db.race(id),
  circuit_id bigint references catalog.circuit(id),
  name text not null,
  circuit_name text not null,
  country_name text not null,
  season integer not null check (season >= 1950),
  analysis_order integer not null,
  calendar_order integer not null,
  state text not null check (state in ('conclusa', 'attuale', 'futura')),
  concluded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season, calendar_order)
);
create index grand_prix_circuit_id_idx on catalog.grand_prix(circuit_id);
create index grand_prix_season_state_idx on catalog.grand_prix(season, state);
create unique index one_current_grand_prix_idx on catalog.grand_prix((state)) where state = 'attuale';

create table catalog.entry (
  grand_prix_id bigint not null references catalog.grand_prix(id) on delete cascade,
  driver_id bigint not null references catalog.driver(id),
  team_id bigint not null references catalog.team(id),
  primary key (grand_prix_id, driver_id)
);
create index entry_driver_id_idx on catalog.entry(driver_id);
create index entry_team_id_idx on catalog.entry(team_id);

create table catalog.driver_standing_snapshot (
  season integer not null check (season >= 1950),
  driver_id bigint not null references catalog.driver(id),
  position integer not null check (position > 0),
  points numeric(8,2) not null check (points >= 0),
  wins integer not null check (wins >= 0),
  source_version text not null,
  primary key (season, driver_id)
);
create index driver_standing_driver_id_idx on catalog.driver_standing_snapshot(driver_id);

create table catalog.team_standing_snapshot (
  season integer not null check (season >= 1950),
  team_id bigint not null references catalog.team(id),
  position integer not null check (position > 0),
  points numeric(8,2) not null check (points >= 0),
  wins integer not null check (wins >= 0),
  source_version text not null,
  primary key (season, team_id)
);
create index team_standing_team_id_idx on catalog.team_standing_snapshot(team_id);

create table editorial.grand_prix_text (
  grand_prix_id bigint not null references catalog.grand_prix(id) on delete cascade,
  locale varchar(2) not null check (locale in ('it', 'en', 'fr', 'pt', 'es', 'de')),
  field text not null,
  content text not null,
  primary key (grand_prix_id, locale, field)
);

create table editorial.driver_analysis (
  id bigint generated always as identity primary key,
  grand_prix_id bigint not null,
  driver_id bigint not null,
  team_id bigint not null references catalog.team(id),
  technical_upgrade_advantage smallint check (technical_upgrade_advantage between 0 and 100),
  technical_upgrade_state text,
  updated_at timestamptz not null default now(),
  unique (grand_prix_id, driver_id),
  foreign key (grand_prix_id, driver_id)
    references catalog.entry(grand_prix_id, driver_id)
);
create index driver_analysis_driver_id_idx on editorial.driver_analysis(driver_id);
create index driver_analysis_team_id_idx on editorial.driver_analysis(team_id);

create table editorial.driver_analysis_text (
  analysis_id bigint not null references editorial.driver_analysis(id) on delete cascade,
  locale varchar(2) not null check (locale in ('it', 'en', 'fr', 'pt', 'es', 'de')),
  season integer check (season >= 1950),
  field text not null,
  content text not null,
  unique nulls not distinct (analysis_id, locale, season, field)
);

create table editorial.team_analysis (
  id bigint generated always as identity primary key,
  grand_prix_id bigint not null references catalog.grand_prix(id) on delete cascade,
  team_id bigint not null references catalog.team(id),
  updated_at timestamptz not null default now(),
  unique (grand_prix_id, team_id)
);
create index team_analysis_team_id_idx on editorial.team_analysis(team_id);

create table editorial.team_analysis_text (
  analysis_id bigint not null references editorial.team_analysis(id) on delete cascade,
  locale varchar(2) not null check (locale in ('it', 'en', 'fr', 'pt', 'es', 'de')),
  season integer check (season >= 1950),
  field text not null,
  content text not null,
  unique nulls not distinct (analysis_id, locale, season, field)
);

create table ratings.dimension (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text not null
);

insert into ratings.dimension(slug, name, description) values
  ('performance', 'Rendimento', 'Indice dai risultati di gara'),
  ('race_pace', 'Passo gara', 'Valutazione da dati di prestazione verificabili'),
  ('tyre_management', 'Gestione gomme', 'Richiede dati di stint e degrado verificabili'),
  ('qualifying', 'Qualifica', 'Valutazione dalle sessioni di qualifica'),
  ('trend', 'Trend', 'Andamento sulle gare recenti'),
  ('completion', 'Completamento', 'Quota di gare concluse'),
  ('race_results', 'Risultati gara', 'Risultati storici del pilota o della scuderia sul circuito'),
  ('qualifying_results', 'Risultati qualifica', 'Risultati storici in qualifica sul circuito'),
  ('annual_trend', 'Andamento annuale', 'Andamento per stagione sul circuito'),
  ('final_assessment', 'Valutazione finale', 'Stima del modello previsionale attivo'),
  ('wet_weather', 'Bagnato', 'Valutazione da gare in condizioni di bagnato'),
  ('reliability', 'Affidabilità', 'Valutazione da eventi tecnici documentati');

create table ratings.driver_score (
  id bigint generated always as identity primary key,
  driver_id bigint not null references catalog.driver(id),
  grand_prix_id bigint references catalog.grand_prix(id),
  dimension_id smallint not null references ratings.dimension(id),
  model_version text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  sample_size integer not null check (sample_size > 0),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  source_release text not null,
  calculated_at timestamptz not null default now(),
  unique nulls not distinct (driver_id, grand_prix_id, dimension_id, model_version)
);
create index driver_score_grand_prix_id_idx on ratings.driver_score(grand_prix_id);
create index driver_score_dimension_id_idx on ratings.driver_score(dimension_id);

create table ratings.team_score (
  id bigint generated always as identity primary key,
  team_id bigint not null references catalog.team(id),
  grand_prix_id bigint references catalog.grand_prix(id),
  dimension_id smallint not null references ratings.dimension(id),
  model_version text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  sample_size integer not null check (sample_size > 0),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  source_release text not null,
  calculated_at timestamptz not null default now(),
  unique nulls not distinct (team_id, grand_prix_id, dimension_id, model_version)
);
create index team_score_grand_prix_id_idx on ratings.team_score(grand_prix_id);
create index team_score_dimension_id_idx on ratings.team_score(dimension_id);

create table ratings.driver_score_evidence (
  score_id bigint not null references ratings.driver_score(id) on delete cascade,
  f1db_race_id integer not null,
  race_data_type varchar(50) not null,
  position_display_order integer not null,
  primary key (score_id, f1db_race_id, race_data_type, position_display_order),
  foreign key (f1db_race_id, race_data_type, position_display_order)
    references f1db.race_data(race_id, type, position_display_order)
);
create index driver_score_evidence_race_data_idx on ratings.driver_score_evidence(
  f1db_race_id, race_data_type, position_display_order
);

create table ratings.team_score_evidence (
  score_id bigint not null references ratings.team_score(id) on delete cascade,
  f1db_race_id integer not null,
  race_data_type varchar(50) not null,
  position_display_order integer not null,
  primary key (score_id, f1db_race_id, race_data_type, position_display_order),
  foreign key (f1db_race_id, race_data_type, position_display_order)
    references f1db.race_data(race_id, type, position_display_order)
);
create index team_score_evidence_race_data_idx on ratings.team_score_evidence(
  f1db_race_id, race_data_type, position_display_order
);

create table ratings.driver_score_source (
  score_id bigint not null references ratings.driver_score(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  primary key (score_id, url)
);

create table ratings.team_score_source (
  score_id bigint not null references ratings.team_score(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  primary key (score_id, url)
);
