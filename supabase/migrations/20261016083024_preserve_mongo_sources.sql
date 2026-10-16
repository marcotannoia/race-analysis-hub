-- Traduzioni anagrafiche e snapshot di migrazione per verificare parita' API.
create table editorial.team_text (
  team_id bigint not null references catalog.team(id) on delete cascade,
  locale varchar(2) not null check (locale in ('it', 'en', 'fr', 'pt', 'es', 'de')),
  field text not null,
  content text not null,
  primary key (team_id, locale, field)
);

create table editorial.driver_text (
  driver_id bigint not null references catalog.driver(id) on delete cascade,
  locale varchar(2) not null check (locale in ('it', 'en', 'fr', 'pt', 'es', 'de')),
  field text not null,
  content text not null,
  primary key (driver_id, locale, field)
);

create table editorial.source_document (
  collection_name text not null check (collection_name in
    ('piloti', 'scuderie', 'gare', 'analisiGare', 'analisiScuderie')),
  mongo_id char(24) not null,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  primary key (collection_name, mongo_id)
);
