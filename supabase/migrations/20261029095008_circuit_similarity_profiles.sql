-- Profili e confronti versionati: valori tipizzati, fonti e approssimazioni esplicite.
-- Si collegano ai 23 circuiti F1DB senza modificare il catalogo GP dell'app.
create table catalog.circuit_similarity_profile (
  season smallint not null check (season >= 1950),
  methodology_version text not null check (length(methodology_version) > 0),
  circuit_id varchar(100) not null references f1db.circuit(id),
  snapshot_date date not null,
  lap_length_km numeric(9,4) not null check (lap_length_km > 0),
  turn_count smallint not null check (turn_count between 0 and 50),
  altitude_m numeric(10,4) not null check (altitude_m between -500 and 5000),
  track_temperature_c numeric(8,4) not null check (track_temperature_c between -20 and 90),
  air_temperature_c numeric(8,4) not null check (air_temperature_c between -20 and 60),
  straight_count smallint not null check (straight_count between 0 and 30),
  total_straights_km numeric(9,4) not null check (total_straights_km between 0 and lap_length_km),
  overtake_detection_count smallint not null check (overtake_detection_count between 0 and 10),
  circuit_type text not null check (circuit_type in ('cittadino','ibrido','permanente')),
  lateral_g_per_km numeric(9,4) not null check (lateral_g_per_km between 0 and 5),
  direction_changes_per_km numeric(9,4) not null check (direction_changes_per_km between 0 and 20),
  average_speed_kmh numeric(9,4) not null check (average_speed_kmh between 50 and 400),
  average_corner_speed_kmh numeric(9,4) not null check (average_corner_speed_kmh between 20 and 350),
  maximum_speed_kmh numeric(9,4) not null check (maximum_speed_kmh between 100 and 450),
  minimum_speed_kmh numeric(9,4) not null check (minimum_speed_kmh between 10 and 250),
  braking_g_per_km numeric(9,4) not null check (braking_g_per_km between 0 and 5),
  elevation_change_m numeric(10,4) not null check (elevation_change_m between 0 and 300),
  downforce_level text not null check (downforce_level in ('basso','medio','alto')),
  humidity_percent numeric(9,4) not null check (humidity_percent between 0 and 100),
  wind_speed_ms numeric(9,4) not null check (wind_speed_ms between 0 and 100),
  rain_prevalent boolean not null,
  weather_variability_percent numeric(9,4) not null check (weather_variability_percent between 0 and 100),
  race_distance_km numeric(10,4) not null check (race_distance_km between 200 and 350),
  source_observations jsonb not null check (jsonb_typeof(source_observations) = 'object'),
  profile_context jsonb not null check (jsonb_typeof(profile_context) = 'object'),
  dataset_metadata jsonb not null check (jsonb_typeof(dataset_metadata) = 'object'),
  criteria_definitions jsonb not null check (jsonb_typeof(criteria_definitions) = 'array' and jsonb_array_length(criteria_definitions) = 22),
  dataset_sha256 text not null check (dataset_sha256 ~ '^[0-9a-f]{64}$'),
  profile_sha256 text not null check (profile_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season, methodology_version, circuit_id),
  check (minimum_speed_kmh <= average_speed_kmh and average_speed_kmh <= maximum_speed_kmh),
  check (source_observations ?& array[
    'numeroCurve','altitudineMetri','temperaturaAsfaltoC','temperaturaAriaC','numeroRettilinei',
    'lunghezzaRettilineiKm','zoneSorpasso','tipologia','gLateralePerKm','cambiDirezionePerKm',
    'velocitaMediaKmh','velocitaCurveKmh','velocitaMassimaKmh','velocitaMinimaKmh',
    'gFrenataPerKm','dislivelloMedio','caricoAerodinamico','umiditaPercentuale','ventoMs',
    'meteoMedio','variabilitaMeteo','distanzaGaraKm'
  ]),
  check ((source_observations - array[
    'numeroCurve','altitudineMetri','temperaturaAsfaltoC','temperaturaAriaC','numeroRettilinei',
    'lunghezzaRettilineiKm','zoneSorpasso','tipologia','gLateralePerKm','cambiDirezionePerKm',
    'velocitaMediaKmh','velocitaCurveKmh','velocitaMassimaKmh','velocitaMinimaKmh',
    'gFrenataPerKm','dislivelloMedio','caricoAerodinamico','umiditaPercentuale','ventoMs',
    'meteoMedio','variabilitaMeteo','distanzaGaraKm'
  ]) = '{}'::jsonb)
);
create index circuit_similarity_profile_circuit_idx on catalog.circuit_similarity_profile(circuit_id);

create table ratings.circuit_similarity (
  season smallint not null,
  methodology_version text not null,
  circuit_a_id varchar(100) not null,
  circuit_b_id varchar(100) not null,
  snapshot_date date not null,
  similarity_percent numeric(7,4) not null check (similarity_percent between 0 and 100),
  partial_similarity_percent numeric(7,4) not null check (partial_similarity_percent between 0 and 100),
  coverage_percent numeric(7,4) not null check (coverage_percent between 0 and 100),
  interval_min_percent numeric(7,4) not null check (interval_min_percent between 0 and 100),
  interval_max_percent numeric(7,4) not null check (interval_max_percent between 0 and 100),
  compared_criteria smallint not null check (compared_criteria = 22),
  total_criteria smallint not null check (total_criteria = 22),
  criteria_with_estimates smallint not null check (criteria_with_estimates between 0 and total_criteria),
  usable_in_prediction boolean not null check (usable_in_prediction),
  details jsonb not null check (jsonb_typeof(details) = 'array' and jsonb_array_length(details) = total_criteria),
  dataset_sha256 text not null check (dataset_sha256 ~ '^[0-9a-f]{64}$'),
  comparison_sha256 text not null check (comparison_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season, methodology_version, circuit_a_id, circuit_b_id),
  foreign key (season, methodology_version, circuit_a_id)
    references catalog.circuit_similarity_profile(season, methodology_version, circuit_id),
  foreign key (season, methodology_version, circuit_b_id)
    references catalog.circuit_similarity_profile(season, methodology_version, circuit_id),
  check (circuit_a_id < circuit_b_id),
  check (interval_min_percent <= similarity_percent and similarity_percent <= interval_max_percent),
  check (coverage_percent = 100)
);
create index circuit_similarity_b_idx on ratings.circuit_similarity(season, methodology_version, circuit_b_id);

-- Schemi privati già usati dall'app: nessuna nuova esposizione REST o scrittura client.
alter table catalog.circuit_similarity_profile enable row level security;
alter table ratings.circuit_similarity enable row level security;
revoke all on catalog.circuit_similarity_profile, ratings.circuit_similarity from public, anon, authenticated;

comment on table catalog.circuit_similarity_profile is '22 criteri di confronto per circuito, stagione e versione; source_observations conserva valori originali, fonti, metodo e qualità. Include stime autorizzate, non tutte misure ufficiali.';
comment on column catalog.circuit_similarity_profile.elevation_change_m is 'Dislivello di riferimento massimo-meno-minimo, non pendenza media.';
comment on column catalog.circuit_similarity_profile.overtake_detection_count is 'Configurazione standard Overtake 2026; non conteggio zone DRS storiche o Straight Mode.';
comment on column catalog.circuit_similarity_profile.downforce_level is 'Classificazione indicativa basso/medio/alto; vedere qualità e metodo nelle osservazioni.';
comment on table ratings.circuit_similarity is 'Una sola riga per coppia canonica di circuiti; media equiponderata dei 22 criteri, con dettaglio e fonti. Non probabilità di vittoria.';
