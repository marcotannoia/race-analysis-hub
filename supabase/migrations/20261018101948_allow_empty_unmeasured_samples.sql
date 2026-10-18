alter table ratings.driver_score drop constraint driver_score_sample_size_check;
alter table ratings.driver_score add constraint driver_score_sample_size_check
  check (sample_size >= 0 and (score is null or sample_size > 0));
alter table ratings.team_score drop constraint team_score_sample_size_check;
alter table ratings.team_score add constraint team_score_sample_size_check
  check (sample_size >= 0 and (score is null or sample_size > 0));
