create table ratings.driver_context (
  driver_id bigint primary key references catalog.driver(id),
  races_started integer not null check (races_started >= 0),
  wet_races integer not null check (wet_races >= 0),
  positive_wet_races integer not null check (positive_wet_races between 0 and wet_races),
  wet_wins integer not null check (wet_wins between 0 and positive_wet_races),
  driver_errors integer not null check (driver_errors >= 0),
  fatal_errors integer not null check (fatal_errors between 0 and driver_errors),
  updated_at timestamptz not null default now()
);

create table ratings.context_metadata (
  singleton boolean primary key default true check (singleton),
  methodology_version text not null,
  last_grand_prix_key text,
  description text not null,
  wet_methodology jsonb not null,
  sources text[] not null,
  applied_grand_prix_keys text[] not null,
  updated_at timestamptz not null default now()
);

create table editorial.post_gp_update (
  grand_prix_id bigint primary key references catalog.grand_prix(id),
  payload jsonb not null,
  applied_at timestamptz not null default now()
);
