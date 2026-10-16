-- Conserva le raccolte Mongo operative e storiche durante la sostituzione
-- dei relativi servizi. Schema privato, mai esposto dalla Data API.
create schema archive;
revoke all on schema archive from public, anon, authenticated;

create table archive.mongo_document (
  collection_name text not null check (collection_name in
    ('metodiPrevisionali', 'rilasci_dati', 'backup_rilasci_dati', 'dati_live_fia')),
  mongo_id text not null,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  primary key (collection_name, mongo_id)
);
