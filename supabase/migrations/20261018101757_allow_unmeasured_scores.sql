-- Un dato insufficiente non è uno zero misurato. I vincoli 0–100 rimangono attivi.
alter table ratings.driver_score alter column score drop not null;
alter table ratings.team_score alter column score drop not null;
