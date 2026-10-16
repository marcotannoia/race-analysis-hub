-- Il dataset pubblicato non contiene una confidenza calibrata: non inventarla.
alter table ratings.driver_score alter column confidence drop not null;
alter table ratings.team_score alter column confidence drop not null;
