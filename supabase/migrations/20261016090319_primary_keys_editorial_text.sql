alter table editorial.driver_analysis_text
  add column id bigint generated always as identity primary key;
alter table editorial.team_analysis_text
  add column id bigint generated always as identity primary key;
