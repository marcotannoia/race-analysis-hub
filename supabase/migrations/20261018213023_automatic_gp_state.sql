-- Stato operativo separato dai rapporti FIA, che richiedono un GP reale.
create table editorial.automation_state (
  job_name text primary key,
  status jsonb not null check (jsonb_typeof(status) = 'object'),
  checked_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table editorial.automation_state enable row level security;
revoke all on editorial.automation_state from public, anon, authenticated;
