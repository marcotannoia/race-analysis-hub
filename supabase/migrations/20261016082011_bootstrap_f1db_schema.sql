-- F1DB v2026.17.0, CC BY 4.0: https://github.com/f1db/f1db/releases/tag/v2026.17.0
-- Schema sorgente privato; il backend Express resta l'unica API pubblica.
create schema if not exists f1db;
revoke all on schema f1db from public, anon, authenticated;
set search_path = f1db;

CREATE TABLE "continent" (
  "id" varchar(100) NOT NULL,
  "code" varchar(2) NOT NULL,
  "name" varchar(100) NOT NULL,
  "demonym" varchar(100) NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("code"),
  UNIQUE ("name")
);

CREATE TABLE "country" (
  "id" varchar(100) NOT NULL,
  "alpha2_code" varchar(2) NOT NULL,
  "alpha3_code" varchar(3) NOT NULL,
  "ioc_code" varchar(3),
  "name" varchar(100) NOT NULL,
  "demonym" varchar(100),
  "continent_id" varchar(100) NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("alpha2_code"),
  UNIQUE ("alpha3_code"),
  UNIQUE ("name"),
  FOREIGN KEY ("continent_id") REFERENCES "continent" ("id")
);

CREATE INDEX "cntr_continent_id_idx" ON "country"("continent_id");

CREATE TABLE "driver" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  "abbreviation" varchar(3) NOT NULL,
  "permanent_number" varchar(2),
  "gender" varchar(6) NOT NULL,
  "date_of_birth" date NOT NULL,
  "date_of_death" date,
  "place_of_birth" varchar(100) NOT NULL,
  "country_of_birth_country_id" varchar(100) NOT NULL,
  "nationality_country_id" varchar(100) NOT NULL,
  "second_nationality_country_id" varchar(100),
  "best_championship_position" int,
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_championship_wins" int NOT NULL,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_points" decimal(8, 2) NOT NULL,
  "total_championship_points" decimal(8, 2) NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  "total_driver_of_the_day" int NOT NULL,
  "total_grand_slams" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("country_of_birth_country_id") REFERENCES "country" ("id"),
  FOREIGN KEY ("nationality_country_id") REFERENCES "country" ("id"),
  FOREIGN KEY ("second_nationality_country_id") REFERENCES "country" ("id")
);

CREATE INDEX "drvr_abbreviation_idx" ON "driver"("abbreviation");
CREATE INDEX "drvr_country_of_birth_country_id_idx" ON "driver"("country_of_birth_country_id");
CREATE INDEX "drvr_date_of_birth_idx" ON "driver"("date_of_birth");
CREATE INDEX "drvr_date_of_death_idx" ON "driver"("date_of_death");
CREATE INDEX "drvr_first_name_idx" ON "driver"("first_name");
CREATE INDEX "drvr_full_name_idx" ON "driver"("full_name");
CREATE INDEX "drvr_gender_idx" ON "driver"("gender");
CREATE INDEX "drvr_last_name_idx" ON "driver"("last_name");
CREATE INDEX "drvr_name_idx" ON "driver"("name");
CREATE INDEX "drvr_nationality_country_id_idx" ON "driver"("nationality_country_id");
CREATE INDEX "drvr_permanent_number_idx" ON "driver"("permanent_number");
CREATE INDEX "drvr_place_of_birth_idx" ON "driver"("place_of_birth");
CREATE INDEX "drvr_second_nationality_country_id_idx" ON "driver"("second_nationality_country_id");

CREATE TABLE "driver_family_relationship" (
  "driver_id" varchar(100) NOT NULL,
  "position_display_order" int NOT NULL,
  "other_driver_id" varchar(100) NOT NULL,
  "type" varchar(50) NOT NULL,
  PRIMARY KEY ("driver_id", "position_display_order"),
  UNIQUE ("driver_id", "other_driver_id", "type"),
  FOREIGN KEY ("driver_id") REFERENCES "driver" ("id"),
  FOREIGN KEY ("other_driver_id") REFERENCES "driver" ("id")
);

CREATE INDEX "dfrl_driver_id_idx" ON "driver_family_relationship"("driver_id");
CREATE INDEX "dfrl_other_driver_id_idx" ON "driver_family_relationship"("other_driver_id");
CREATE INDEX "dfrl_position_display_order_idx" ON "driver_family_relationship"("position_display_order");

CREATE TABLE "constructor" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  "country_id" varchar(100) NOT NULL,
  "best_championship_position" int,
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_championship_wins" int NOT NULL,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_1_and_2_finishes" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_podium_races" int NOT NULL,
  "total_points" decimal(8, 2) NOT NULL,
  "total_championship_points" decimal(8, 2) NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("country_id") REFERENCES "country" ("id")
);

CREATE INDEX "cnst_country_id_idx" ON "constructor"("country_id");
CREATE INDEX "cnst_full_name_idx" ON "constructor"("full_name");
CREATE INDEX "cnst_name_idx" ON "constructor"("name");

CREATE TABLE "constructor_chronology" (
  "constructor_id" varchar(100) NOT NULL,
  "position_display_order" int NOT NULL,
  "other_constructor_id" varchar(100) NOT NULL,
  "year_from" int NOT NULL,
  "year_to" int,
  PRIMARY KEY ("constructor_id", "position_display_order"),
  UNIQUE ("constructor_id", "other_constructor_id", "year_from", "year_to"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("other_constructor_id") REFERENCES "constructor" ("id")
);

CREATE INDEX "cnch_constructor_id_idx" ON "constructor_chronology"("constructor_id");
CREATE INDEX "cnch_other_constructor_id_idx" ON "constructor_chronology"("other_constructor_id");
CREATE INDEX "cnch_position_display_order_idx" ON "constructor_chronology"("position_display_order");

CREATE TABLE "chassis" (
  "id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id")
);

CREATE INDEX "chss_constructor_id_idx" ON "chassis"("constructor_id");
CREATE INDEX "chss_full_name_idx" ON "chassis"("full_name");
CREATE INDEX "chss_name_idx" ON "chassis"("name");

CREATE TABLE "engine_manufacturer" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "country_id" varchar(100) NOT NULL,
  "best_championship_position" int,
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_championship_wins" int NOT NULL,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_podium_races" int NOT NULL,
  "total_points" decimal(8, 2) NOT NULL,
  "total_championship_points" decimal(8, 2) NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("country_id") REFERENCES "country" ("id")
);

CREATE INDEX "enmf_country_id_idx" ON "engine_manufacturer"("country_id");
CREATE INDEX "enmf_name_idx" ON "engine_manufacturer"("name");

CREATE TABLE "engine" (
  "id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  "capacity" decimal(2, 1),
  "configuration" varchar(100),
  "aspiration" varchar(100),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id")
);

CREATE INDEX "engn_aspiration_idx" ON "engine"("aspiration");
CREATE INDEX "engn_capacity_idx" ON "engine"("capacity");
CREATE INDEX "engn_configuration_idx" ON "engine"("configuration");
CREATE INDEX "engn_engine_manufacturer_id_idx" ON "engine"("engine_manufacturer_id");
CREATE INDEX "engn_full_name_idx" ON "engine"("full_name");
CREATE INDEX "engn_name_idx" ON "engine"("name");

CREATE TABLE "tyre_manufacturer" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "country_id" varchar(100) NOT NULL,
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_podium_races" int NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("country_id") REFERENCES "country" ("id")
);

CREATE INDEX "tymf_country_id_idx" ON "tyre_manufacturer"("country_id");
CREATE INDEX "tymf_name_idx" ON "tyre_manufacturer"("name");

CREATE TABLE "entrant" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "entr_name_idx" ON "entrant"("name");

CREATE TABLE "circuit" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  "previous_names" varchar(255),
  "type" varchar(6) NOT NULL,
  "direction" varchar(14) NOT NULL,
  "place_name" varchar(100) NOT NULL,
  "country_id" varchar(100) NOT NULL,
  "latitude" decimal(10, 6) NOT NULL,
  "longitude" decimal(10, 6) NOT NULL,
  "length" decimal(6, 3) NOT NULL,
  "turns" int NOT NULL,
  "total_races_held" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("country_id") REFERENCES "country" ("id")
);

CREATE INDEX "crct_country_id_idx" ON "circuit"("country_id");
CREATE INDEX "crct_direction_idx" ON "circuit"("direction");
CREATE INDEX "crct_full_name_idx" ON "circuit"("full_name");
CREATE INDEX "crct_name_idx" ON "circuit"("name");
CREATE INDEX "crct_place_name_idx" ON "circuit"("place_name");
CREATE INDEX "crct_type_idx" ON "circuit"("type");

CREATE TABLE "circuit_layout" (
  "id" varchar(100) NOT NULL,
  "circuit_id" varchar(100) NOT NULL,
  "effective" boolean NOT NULL,
  "length" decimal(6, 3) NOT NULL,
  "turns" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("circuit_id") REFERENCES "circuit" ("id")
);

CREATE INDEX "ctlt_circuit_id_idx" ON "circuit_layout"("circuit_id");

CREATE TABLE "grand_prix" (
  "id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "full_name" varchar(100) NOT NULL,
  "short_name" varchar(100) NOT NULL,
  "abbreviation" varchar(3) NOT NULL,
  "country_id" varchar(100),
  "total_races_held" int NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("country_id") REFERENCES "country" ("id")
);

CREATE INDEX "grpx_abbreviation_idx" ON "grand_prix"("abbreviation");
CREATE INDEX "grpx_country_id_idx" ON "grand_prix"("country_id");
CREATE INDEX "grpx_full_name_idx" ON "grand_prix"("full_name");
CREATE INDEX "grpx_name_idx" ON "grand_prix"("name");
CREATE INDEX "grpx_short_name_idx" ON "grand_prix"("short_name");

CREATE TABLE "season" (
  "year" int NOT NULL,
  PRIMARY KEY ("year")
);

CREATE TABLE "season_entrant" (
  "year" int NOT NULL,
  "entrant_id" varchar(100) NOT NULL,
  "country_id" varchar(100) NOT NULL,
  PRIMARY KEY ("year", "entrant_id"),
  FOREIGN KEY ("country_id") REFERENCES "country" ("id"),
  FOREIGN KEY ("entrant_id") REFERENCES "entrant" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "sent_country_id_idx" ON "season_entrant"("country_id");
CREATE INDEX "sent_entrant_id_idx" ON "season_entrant"("entrant_id");
CREATE INDEX "sent_year_idx" ON "season_entrant"("year");

CREATE TABLE "season_entrant_constructor" (
  "year" int NOT NULL,
  "entrant_id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  PRIMARY KEY ("year", "entrant_id", "constructor_id", "engine_manufacturer_id"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("entrant_id") REFERENCES "entrant" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "secn_constructor_id_idx" ON "season_entrant_constructor"("constructor_id");
CREATE INDEX "secn_engine_manufacturer_id_idx" ON "season_entrant_constructor"("engine_manufacturer_id");
CREATE INDEX "secn_entrant_id_idx" ON "season_entrant_constructor"("entrant_id");
CREATE INDEX "secn_year_idx" ON "season_entrant_constructor"("year");

CREATE TABLE "season_entrant_chassis" (
  "year" int NOT NULL,
  "entrant_id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "chassis_id" varchar(100) NOT NULL,
  PRIMARY KEY (
    "year",
    "entrant_id",
    "constructor_id",
    "engine_manufacturer_id",
    "chassis_id"
  ),
  FOREIGN KEY ("chassis_id") REFERENCES "chassis" ("id"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("entrant_id") REFERENCES "entrant" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "sech_chassis_id_idx" ON "season_entrant_chassis"("chassis_id");
CREATE INDEX "sech_constructor_id_idx" ON "season_entrant_chassis"("constructor_id");
CREATE INDEX "sech_engine_manufacturer_id_idx" ON "season_entrant_chassis"("engine_manufacturer_id");
CREATE INDEX "sech_entrant_id_idx" ON "season_entrant_chassis"("entrant_id");
CREATE INDEX "sech_year_idx" ON "season_entrant_chassis"("year");

CREATE TABLE "season_entrant_engine" (
  "year" int NOT NULL,
  "entrant_id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "engine_id" varchar(100) NOT NULL,
  PRIMARY KEY (
    "year",
    "entrant_id",
    "constructor_id",
    "engine_manufacturer_id",
    "engine_id"
  ),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("engine_id") REFERENCES "engine" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("entrant_id") REFERENCES "entrant" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "seen_constructor_id_idx" ON "season_entrant_engine"("constructor_id");
CREATE INDEX "seen_engine_id_idx" ON "season_entrant_engine"("engine_id");
CREATE INDEX "seen_engine_manufacturer_id_idx" ON "season_entrant_engine"("engine_manufacturer_id");
CREATE INDEX "seen_entrant_id_idx" ON "season_entrant_engine"("entrant_id");
CREATE INDEX "seen_year_idx" ON "season_entrant_engine"("year");

CREATE TABLE "season_entrant_tyre_manufacturer" (
  "year" int NOT NULL,
  "entrant_id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "tyre_manufacturer_id" varchar(100) NOT NULL,
  PRIMARY KEY (
    "year",
    "entrant_id",
    "constructor_id",
    "engine_manufacturer_id",
    "tyre_manufacturer_id"
  ),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("entrant_id") REFERENCES "entrant" ("id"),
  FOREIGN KEY ("tyre_manufacturer_id") REFERENCES "tyre_manufacturer" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "setm_constructor_id_idx" ON "season_entrant_tyre_manufacturer"("constructor_id");
CREATE INDEX "setm_engine_manufacturer_id_idx" ON "season_entrant_tyre_manufacturer"("engine_manufacturer_id");
CREATE INDEX "setm_entrant_id_idx" ON "season_entrant_tyre_manufacturer"("entrant_id");
CREATE INDEX "setm_tyre_manufacturer_id_idx" ON "season_entrant_tyre_manufacturer"("tyre_manufacturer_id");
CREATE INDEX "setm_year_idx" ON "season_entrant_tyre_manufacturer"("year");

CREATE TABLE "season_entrant_driver" (
  "year" int NOT NULL,
  "entrant_id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "driver_id" varchar(100) NOT NULL,
  "rounds" varchar(100),
  "rounds_text" varchar(100),
  "test_driver" boolean NOT NULL,
  PRIMARY KEY (
    "year",
    "entrant_id",
    "constructor_id",
    "engine_manufacturer_id",
    "driver_id"
  ),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("driver_id") REFERENCES "driver" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("entrant_id") REFERENCES "entrant" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "sedr_constructor_id_idx" ON "season_entrant_driver"("constructor_id");
CREATE INDEX "sedr_driver_id_idx" ON "season_entrant_driver"("driver_id");
CREATE INDEX "sedr_engine_manufacturer_id_idx" ON "season_entrant_driver"("engine_manufacturer_id");
CREATE INDEX "sedr_entrant_id_idx" ON "season_entrant_driver"("entrant_id");
CREATE INDEX "sedr_year_idx" ON "season_entrant_driver"("year");

CREATE TABLE "season_constructor" (
  "year" int NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "position_number" int,
  "position_text" varchar(4),
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_1_and_2_finishes" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_podium_races" int NOT NULL,
  "total_points" decimal(8, 2) NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  PRIMARY KEY ("year", "constructor_id"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "sscn_constructor_id_idx" ON "season_constructor"("constructor_id");
CREATE INDEX "sscn_year_idx" ON "season_constructor"("year");

CREATE TABLE "season_engine_manufacturer" (
  "year" int NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "position_number" int,
  "position_text" varchar(4),
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_podium_races" int NOT NULL,
  "total_points" decimal(8, 2) NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  PRIMARY KEY ("year", "engine_manufacturer_id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "ssem_engine_manufacturer_id_idx" ON "season_engine_manufacturer"("engine_manufacturer_id");
CREATE INDEX "ssem_year_idx" ON "season_engine_manufacturer"("year");

CREATE TABLE "season_tyre_manufacturer" (
  "year" int NOT NULL,
  "tyre_manufacturer_id" varchar(100) NOT NULL,
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_podium_races" int NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  PRIMARY KEY ("year", "tyre_manufacturer_id"),
  FOREIGN KEY ("tyre_manufacturer_id") REFERENCES "tyre_manufacturer" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "sstm_tyre_manufacturer_id_idx" ON "season_tyre_manufacturer"("tyre_manufacturer_id");
CREATE INDEX "sstm_year_idx" ON "season_tyre_manufacturer"("year");

CREATE TABLE "season_driver" (
  "year" int NOT NULL,
  "driver_id" varchar(100) NOT NULL,
  "position_number" int,
  "position_text" varchar(4),
  "best_starting_grid_position" int,
  "best_race_result" int,
  "best_sprint_race_result" int,
  "total_race_entries" int NOT NULL,
  "total_race_starts" int NOT NULL,
  "total_race_wins" int NOT NULL,
  "total_race_laps" int NOT NULL,
  "total_podiums" int NOT NULL,
  "total_points" decimal(8, 2) NOT NULL,
  "total_pole_positions" int NOT NULL,
  "total_fastest_laps" int NOT NULL,
  "total_sprint_race_starts" int NOT NULL,
  "total_sprint_race_wins" int NOT NULL,
  "total_driver_of_the_day" int NOT NULL,
  "total_grand_slams" int NOT NULL,
  PRIMARY KEY ("year", "driver_id"),
  FOREIGN KEY ("driver_id") REFERENCES "driver" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "ssdr_driver_id_idx" ON "season_driver"("driver_id");
CREATE INDEX "ssdr_year_idx" ON "season_driver"("year");

CREATE TABLE "season_driver_standing" (
  "year" int NOT NULL,
  "position_display_order" int NOT NULL,
  "position_number" int,
  "position_text" varchar(4) NOT NULL,
  "driver_id" varchar(100) NOT NULL,
  "points" decimal(8, 2) NOT NULL,
  "championship_won" boolean NOT NULL,
  PRIMARY KEY ("year", "position_display_order"),
  FOREIGN KEY ("driver_id") REFERENCES "driver" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "ssds_driver_id_idx" ON "season_driver_standing"("driver_id");
CREATE INDEX "ssds_position_display_order_idx" ON "season_driver_standing"("position_display_order");
CREATE INDEX "ssds_position_number_idx" ON "season_driver_standing"("position_number");
CREATE INDEX "ssds_position_text_idx" ON "season_driver_standing"("position_text");
CREATE INDEX "ssds_year_idx" ON "season_driver_standing"("year");

CREATE TABLE "season_constructor_standing" (
  "year" int NOT NULL,
  "position_display_order" int NOT NULL,
  "position_number" int,
  "position_text" varchar(4) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "points" decimal(8, 2) NOT NULL,
  "championship_won" boolean NOT NULL,
  PRIMARY KEY ("year", "position_display_order"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "sscs_constructor_id_idx" ON "season_constructor_standing"("constructor_id");
CREATE INDEX "sscs_engine_manufacturer_id_idx" ON "season_constructor_standing"("engine_manufacturer_id");
CREATE INDEX "sscs_position_display_order_idx" ON "season_constructor_standing"("position_display_order");
CREATE INDEX "sscs_position_number_idx" ON "season_constructor_standing"("position_number");
CREATE INDEX "sscs_position_text_idx" ON "season_constructor_standing"("position_text");
CREATE INDEX "sscs_year_idx" ON "season_constructor_standing"("year");

CREATE TABLE "race" (
  "id" int NOT NULL,
  "year" int NOT NULL,
  "round" int NOT NULL,
  "date" date NOT NULL,
  "time" varchar(5),
  "grand_prix_id" varchar(100) NOT NULL,
  "official_name" varchar(100) NOT NULL,
  "qualifying_format" varchar(20) NOT NULL,
  "sprint_qualifying_format" varchar(20),
  "circuit_id" varchar(100) NOT NULL,
  "circuit_layout_id" varchar(100) NOT NULL,
  "circuit_type" varchar(6) NOT NULL,
  "direction" varchar(14) NOT NULL,
  "course_length" decimal(6, 3) NOT NULL,
  "turns" int NOT NULL,
  "laps" int NOT NULL,
  "distance" decimal(6, 3) NOT NULL,
  "scheduled_laps" int,
  "scheduled_distance" decimal(6, 3),
  "drivers_championship_decider" boolean NOT NULL,
  "constructors_championship_decider" boolean NOT NULL,
  "pre_qualifying_date" date,
  "pre_qualifying_time" varchar(5),
  "free_practice_1_date" date,
  "free_practice_1_time" varchar(5),
  "free_practice_2_date" date,
  "free_practice_2_time" varchar(5),
  "free_practice_3_date" date,
  "free_practice_3_time" varchar(5),
  "free_practice_4_date" date,
  "free_practice_4_time" varchar(5),
  "qualifying_1_date" date,
  "qualifying_1_time" varchar(5),
  "qualifying_2_date" date,
  "qualifying_2_time" varchar(5),
  "qualifying_date" date,
  "qualifying_time" varchar(5),
  "sprint_qualifying_date" date,
  "sprint_qualifying_time" varchar(5),
  "sprint_race_date" date,
  "sprint_race_time" varchar(5),
  "sprint_race_laps" int,
  "sprint_race_distance" decimal(6, 3),
  "sprint_race_scheduled_laps" int,
  "sprint_race_scheduled_distance" decimal(6, 3),
  "warming_up_date" date,
  "warming_up_time" varchar(5),
  PRIMARY KEY ("id"),
  UNIQUE ("year", "round"),
  FOREIGN KEY ("circuit_id") REFERENCES "circuit" ("id"),
  FOREIGN KEY ("circuit_layout_id") REFERENCES "circuit_layout" ("id"),
  FOREIGN KEY ("grand_prix_id") REFERENCES "grand_prix" ("id"),
  FOREIGN KEY ("year") REFERENCES "season" ("year")
);

CREATE INDEX "race_circuit_id_idx" ON "race"("circuit_id");
CREATE INDEX "race_circuit_layout_id_idx" ON "race"("circuit_layout_id");
CREATE INDEX "race_circuit_type_idx" ON "race"("circuit_type");
CREATE INDEX "race_date_idx" ON "race"("date");
CREATE INDEX "race_direction_idx" ON "race"("direction");
CREATE INDEX "race_grand_prix_id_idx" ON "race"("grand_prix_id");
CREATE INDEX "race_official_name_idx" ON "race"("official_name");
CREATE INDEX "race_qualifying_format_idx" ON "race"("qualifying_format");
CREATE INDEX "race_round_idx" ON "race"("round");
CREATE INDEX "race_sprint_qualifying_format_idx" ON "race"("sprint_qualifying_format");
CREATE INDEX "race_year_idx" ON "race"("year");

CREATE TABLE "race_data" (
  "race_id" int NOT NULL,
  "type" varchar(50) NOT NULL,
  "position_display_order" int NOT NULL,
  "position_number" int,
  "position_text" varchar(4) NOT NULL,
  "driver_number" varchar(3) NOT NULL,
  "driver_id" varchar(100) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "tyre_manufacturer_id" varchar(100) NOT NULL,
  "practice_time" varchar(20),
  "practice_time_millis" int,
  "practice_gap" varchar(20),
  "practice_gap_millis" int,
  "practice_interval" varchar(20),
  "practice_interval_millis" int,
  "practice_laps" int,
  "qualifying_time" varchar(20),
  "qualifying_time_millis" int,
  "qualifying_q1" varchar(20),
  "qualifying_q1_millis" int,
  "qualifying_q2" varchar(20),
  "qualifying_q2_millis" int,
  "qualifying_q3" varchar(20),
  "qualifying_q3_millis" int,
  "qualifying_gap" varchar(20),
  "qualifying_gap_millis" int,
  "qualifying_interval" varchar(20),
  "qualifying_interval_millis" int,
  "qualifying_laps" int,
  "starting_grid_position_qualification_position_number" int,
  "starting_grid_position_qualification_position_text" varchar(4),
  "starting_grid_position_grid_penalty" varchar(20),
  "starting_grid_position_grid_penalty_positions" int,
  "starting_grid_position_time" varchar(20),
  "starting_grid_position_time_millis" int,
  "race_shared_car" boolean,
  "race_laps" int,
  "race_time" varchar(20),
  "race_time_millis" int,
  "race_time_penalty" varchar(20),
  "race_time_penalty_millis" int,
  "race_gap" varchar(20),
  "race_gap_millis" int,
  "race_gap_laps" int,
  "race_interval" varchar(20),
  "race_interval_millis" int,
  "race_reason_retired" varchar(100),
  "race_points" decimal(8, 2),
  "race_pole_position" boolean,
  "race_qualification_position_number" int,
  "race_qualification_position_text" varchar(4),
  "race_grid_position_number" int,
  "race_grid_position_text" varchar(2),
  "race_positions_gained" int,
  "race_pit_stops" int,
  "race_fastest_lap" boolean,
  "race_driver_of_the_day" boolean,
  "race_grand_slam" boolean,
  "fastest_lap_lap" int,
  "fastest_lap_time" varchar(20),
  "fastest_lap_time_millis" int,
  "fastest_lap_gap" varchar(20),
  "fastest_lap_gap_millis" int,
  "fastest_lap_interval" varchar(20),
  "fastest_lap_interval_millis" int,
  "pit_stop_stop" int,
  "pit_stop_lap" int,
  "pit_stop_time" varchar(20),
  "pit_stop_time_millis" int,
  "driver_of_the_day_percentage" decimal(5, 2),
  PRIMARY KEY ("race_id", "type", "position_display_order"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("driver_id") REFERENCES "driver" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("race_id") REFERENCES "race" ("id"),
  FOREIGN KEY ("tyre_manufacturer_id") REFERENCES "tyre_manufacturer" ("id")
);

CREATE INDEX "rcda_constructor_id_idx" ON "race_data"("constructor_id");
CREATE INDEX "rcda_driver_id_idx" ON "race_data"("driver_id");
CREATE INDEX "rcda_driver_number_idx" ON "race_data"("driver_number");
CREATE INDEX "rcda_engine_manufacturer_id_idx" ON "race_data"("engine_manufacturer_id");
CREATE INDEX "rcda_position_display_order_idx" ON "race_data"("position_display_order");
CREATE INDEX "rcda_position_number_idx" ON "race_data"("position_number");
CREATE INDEX "rcda_position_text_idx" ON "race_data"("position_text");
CREATE INDEX "rcda_race_id_idx" ON "race_data"("race_id");
CREATE INDEX "rcda_type_idx" ON "race_data"("type");
CREATE INDEX "rcda_tyre_manufacturer_id_idx" ON "race_data"("tyre_manufacturer_id");

CREATE TABLE "race_driver_standing" (
  "race_id" int NOT NULL,
  "position_display_order" int NOT NULL,
  "position_number" int,
  "position_text" varchar(4) NOT NULL,
  "driver_id" varchar(100) NOT NULL,
  "points" decimal(8, 2) NOT NULL,
  "positions_gained" int,
  "championship_won" boolean NOT NULL,
  PRIMARY KEY ("race_id", "position_display_order"),
  FOREIGN KEY ("driver_id") REFERENCES "driver" ("id"),
  FOREIGN KEY ("race_id") REFERENCES "race" ("id")
);

CREATE INDEX "rcds_driver_id_idx" ON "race_driver_standing"("driver_id");
CREATE INDEX "rcds_position_display_order_idx" ON "race_driver_standing"("position_display_order");
CREATE INDEX "rcds_position_number_idx" ON "race_driver_standing"("position_number");
CREATE INDEX "rcds_position_text_idx" ON "race_driver_standing"("position_text");
CREATE INDEX "rcds_race_id_idx" ON "race_driver_standing"("race_id");

CREATE TABLE "race_constructor_standing" (
  "race_id" int NOT NULL,
  "position_display_order" int NOT NULL,
  "position_number" int,
  "position_text" varchar(4) NOT NULL,
  "constructor_id" varchar(100) NOT NULL,
  "engine_manufacturer_id" varchar(100) NOT NULL,
  "points" decimal(8, 2) NOT NULL,
  "positions_gained" int,
  "championship_won" boolean NOT NULL,
  PRIMARY KEY ("race_id", "position_display_order"),
  FOREIGN KEY ("constructor_id") REFERENCES "constructor" ("id"),
  FOREIGN KEY ("engine_manufacturer_id") REFERENCES "engine_manufacturer" ("id"),
  FOREIGN KEY ("race_id") REFERENCES "race" ("id")
);

CREATE INDEX "rccs_constructor_id_idx" ON "race_constructor_standing"("constructor_id");
CREATE INDEX "rccs_engine_manufacturer_id_idx" ON "race_constructor_standing"("engine_manufacturer_id");
CREATE INDEX "rccs_position_display_order_idx" ON "race_constructor_standing"("position_display_order");
CREATE INDEX "rccs_position_number_idx" ON "race_constructor_standing"("position_number");
CREATE INDEX "rccs_position_text_idx" ON "race_constructor_standing"("position_text");
CREATE INDEX "rccs_race_id_idx" ON "race_constructor_standing"("race_id");

CREATE VIEW "pre_qualifying_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."qualifying_time" AS "time",
  "race_data"."qualifying_time_millis" AS "time_millis",
  "race_data"."qualifying_gap" AS "gap",
  "race_data"."qualifying_gap_millis" AS "gap_millis",
  "race_data"."qualifying_interval" AS "interval",
  "race_data"."qualifying_interval_millis" AS "interval_millis",
  "race_data"."qualifying_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'PRE_QUALIFYING_RESULT';

CREATE VIEW "free_practice_1_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."practice_time" AS "time",
  "race_data"."practice_time_millis" AS "time_millis",
  "race_data"."practice_gap" AS "gap",
  "race_data"."practice_gap_millis" AS "gap_millis",
  "race_data"."practice_interval" AS "interval",
  "race_data"."practice_interval_millis" AS "interval_millis",
  "race_data"."practice_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'FREE_PRACTICE_1_RESULT';

CREATE VIEW "free_practice_2_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."practice_time" AS "time",
  "race_data"."practice_time_millis" AS "time_millis",
  "race_data"."practice_gap" AS "gap",
  "race_data"."practice_gap_millis" AS "gap_millis",
  "race_data"."practice_interval" AS "interval",
  "race_data"."practice_interval_millis" AS "interval_millis",
  "race_data"."practice_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'FREE_PRACTICE_2_RESULT';

CREATE VIEW "free_practice_3_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."practice_time" AS "time",
  "race_data"."practice_time_millis" AS "time_millis",
  "race_data"."practice_gap" AS "gap",
  "race_data"."practice_gap_millis" AS "gap_millis",
  "race_data"."practice_interval" AS "interval",
  "race_data"."practice_interval_millis" AS "interval_millis",
  "race_data"."practice_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'FREE_PRACTICE_3_RESULT';

CREATE VIEW "free_practice_4_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."practice_time" AS "time",
  "race_data"."practice_time_millis" AS "time_millis",
  "race_data"."practice_gap" AS "gap",
  "race_data"."practice_gap_millis" AS "gap_millis",
  "race_data"."practice_interval" AS "interval",
  "race_data"."practice_interval_millis" AS "interval_millis",
  "race_data"."practice_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'FREE_PRACTICE_4_RESULT';

CREATE VIEW "qualifying_1_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."qualifying_time" AS "time",
  "race_data"."qualifying_time_millis" AS "time_millis",
  "race_data"."qualifying_gap" AS "gap",
  "race_data"."qualifying_gap_millis" AS "gap_millis",
  "race_data"."qualifying_interval" AS "interval",
  "race_data"."qualifying_interval_millis" AS "interval_millis",
  "race_data"."qualifying_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'QUALIFYING_1_RESULT';

CREATE VIEW "qualifying_2_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."qualifying_time" AS "time",
  "race_data"."qualifying_time_millis" AS "time_millis",
  "race_data"."qualifying_gap" AS "gap",
  "race_data"."qualifying_gap_millis" AS "gap_millis",
  "race_data"."qualifying_interval" AS "interval",
  "race_data"."qualifying_interval_millis" AS "interval_millis",
  "race_data"."qualifying_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'QUALIFYING_2_RESULT';

CREATE VIEW "qualifying_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "q1",
  "q1_millis",
  "q2",
  "q2_millis",
  "q3",
  "q3_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."qualifying_time" AS "time",
  "race_data"."qualifying_time_millis" AS "time_millis",
  "race_data"."qualifying_q1" AS "q1",
  "race_data"."qualifying_q1_millis" AS "q1_millis",
  "race_data"."qualifying_q2" AS "q2",
  "race_data"."qualifying_q2_millis" AS "q2_millis",
  "race_data"."qualifying_q3" AS "q3",
  "race_data"."qualifying_q3_millis" AS "q3_millis",
  "race_data"."qualifying_gap" AS "gap",
  "race_data"."qualifying_gap_millis" AS "gap_millis",
  "race_data"."qualifying_interval" AS "interval",
  "race_data"."qualifying_interval_millis" AS "interval_millis",
  "race_data"."qualifying_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'QUALIFYING_RESULT';

CREATE VIEW "sprint_qualifying_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "q1",
  "q1_millis",
  "q2",
  "q2_millis",
  "q3",
  "q3_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."qualifying_time" AS "time",
  "race_data"."qualifying_time_millis" AS "time_millis",
  "race_data"."qualifying_q1" AS "q1",
  "race_data"."qualifying_q1_millis" AS "q1_millis",
  "race_data"."qualifying_q2" AS "q2",
  "race_data"."qualifying_q2_millis" AS "q2_millis",
  "race_data"."qualifying_q3" AS "q3",
  "race_data"."qualifying_q3_millis" AS "q3_millis",
  "race_data"."qualifying_gap" AS "gap",
  "race_data"."qualifying_gap_millis" AS "gap_millis",
  "race_data"."qualifying_interval" AS "interval",
  "race_data"."qualifying_interval_millis" AS "interval_millis",
  "race_data"."qualifying_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'SPRINT_QUALIFYING_RESULT';

CREATE VIEW "sprint_starting_grid_position"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "qualification_position_number",
  "qualification_position_text",
  "grid_penalty",
  "grid_penalty_positions",
  "time",
  "time_millis"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."starting_grid_position_qualification_position_number" AS "qualification_position_number",
  "race_data"."starting_grid_position_qualification_position_text" AS "qualification_position_text",
  "race_data"."starting_grid_position_grid_penalty" AS "grid_penalty",
  "race_data"."starting_grid_position_grid_penalty_positions" AS "grid_penalty_positions",
  "race_data"."starting_grid_position_time" AS "time",
  "race_data"."starting_grid_position_time_millis" AS "time_millis"
FROM "race_data"
WHERE "race_data"."type" = 'SPRINT_STARTING_GRID_POSITION';

CREATE VIEW "sprint_race_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "laps",
  "time",
  "time_millis",
  "time_penalty",
  "time_penalty_millis",
  "gap",
  "gap_millis",
  "gap_laps",
  "interval",
  "interval_millis",
  "reason_retired",
  "points",
  "qualification_position_number",
  "qualification_position_text",
  "grid_position_number",
  "grid_position_text",
  "positions_gained"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."race_laps" AS "laps",
  "race_data"."race_time" AS "time",
  "race_data"."race_time_millis" AS "time_millis",
  "race_data"."race_time_penalty" AS "time_penalty",
  "race_data"."race_time_penalty_millis" AS "time_penalty_millis",
  "race_data"."race_gap" AS "gap",
  "race_data"."race_gap_millis" AS "gap_millis",
  "race_data"."race_gap_laps" AS "gap_laps",
  "race_data"."race_interval" AS "interval",
  "race_data"."race_interval_millis" AS "interval_millis",
  "race_data"."race_reason_retired" AS "reason_retired",
  "race_data"."race_points" AS "points",
  "race_data"."race_qualification_position_number" AS "qualification_position_number",
  "race_data"."race_qualification_position_text" AS "qualification_position_text",
  "race_data"."race_grid_position_number" AS "grid_position_number",
  "race_data"."race_grid_position_text" AS "grid_position_text",
  "race_data"."race_positions_gained" AS "positions_gained"
FROM "race_data"
WHERE "race_data"."type" = 'SPRINT_RACE_RESULT';

CREATE VIEW "warming_up_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis",
  "laps"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."practice_time" AS "time",
  "race_data"."practice_time_millis" AS "time_millis",
  "race_data"."practice_gap" AS "gap",
  "race_data"."practice_gap_millis" AS "gap_millis",
  "race_data"."practice_interval" AS "interval",
  "race_data"."practice_interval_millis" AS "interval_millis",
  "race_data"."practice_laps" AS "laps"
FROM "race_data"
WHERE "race_data"."type" = 'WARMING_UP_RESULT';

CREATE VIEW "starting_grid_position"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "qualification_position_number",
  "qualification_position_text",
  "grid_penalty",
  "grid_penalty_positions",
  "time",
  "time_millis"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."starting_grid_position_qualification_position_number" AS "qualification_position_number",
  "race_data"."starting_grid_position_qualification_position_text" AS "qualification_position_text",
  "race_data"."starting_grid_position_grid_penalty" AS "grid_penalty",
  "race_data"."starting_grid_position_grid_penalty_positions" AS "grid_penalty_positions",
  "race_data"."starting_grid_position_time" AS "time",
  "race_data"."starting_grid_position_time_millis" AS "time_millis"
FROM "race_data"
WHERE "race_data"."type" = 'STARTING_GRID_POSITION';

CREATE VIEW "race_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "shared_car",
  "laps",
  "time",
  "time_millis",
  "time_penalty",
  "time_penalty_millis",
  "gap",
  "gap_millis",
  "gap_laps",
  "interval",
  "interval_millis",
  "reason_retired",
  "points",
  "pole_position",
  "qualification_position_number",
  "qualification_position_text",
  "grid_position_number",
  "grid_position_text",
  "positions_gained",
  "pit_stops",
  "fastest_lap",
  "driver_of_the_day",
  "grand_slam"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."race_shared_car" AS "shared_car",
  "race_data"."race_laps" AS "laps",
  "race_data"."race_time" AS "time",
  "race_data"."race_time_millis" AS "time_millis",
  "race_data"."race_time_penalty" AS "time_penalty",
  "race_data"."race_time_penalty_millis" AS "time_penalty_millis",
  "race_data"."race_gap" AS "gap",
  "race_data"."race_gap_millis" AS "gap_millis",
  "race_data"."race_gap_laps" AS "gap_laps",
  "race_data"."race_interval" AS "interval",
  "race_data"."race_interval_millis" AS "interval_millis",
  "race_data"."race_reason_retired" AS "reason_retired",
  "race_data"."race_points" AS "points",
  "race_data"."race_pole_position" AS "pole_position",
  "race_data"."race_qualification_position_number" AS "qualification_position_number",
  "race_data"."race_qualification_position_text" AS "qualification_position_text",
  "race_data"."race_grid_position_number" AS "grid_position_number",
  "race_data"."race_grid_position_text" AS "grid_position_text",
  "race_data"."race_positions_gained" AS "positions_gained",
  "race_data"."race_pit_stops" AS "pit_stops",
  "race_data"."race_fastest_lap" AS "fastest_lap",
  "race_data"."race_driver_of_the_day" AS "driver_of_the_day",
  "race_data"."race_grand_slam" AS "grand_slam"
FROM "race_data"
WHERE "race_data"."type" = 'RACE_RESULT';

CREATE VIEW "fastest_lap"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "lap",
  "time",
  "time_millis",
  "gap",
  "gap_millis",
  "interval",
  "interval_millis"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."fastest_lap_lap" AS "lap",
  "race_data"."fastest_lap_time" AS "time",
  "race_data"."fastest_lap_time_millis" AS "time_millis",
  "race_data"."fastest_lap_gap" AS "gap",
  "race_data"."fastest_lap_gap_millis" AS "gap_millis",
  "race_data"."fastest_lap_interval" AS "interval",
  "race_data"."fastest_lap_interval_millis" AS "interval_millis"
FROM "race_data"
WHERE "race_data"."type" = 'FASTEST_LAP';

CREATE VIEW "pit_stop"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "stop",
  "lap",
  "time",
  "time_millis"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."pit_stop_stop" AS "stop",
  "race_data"."pit_stop_lap" AS "lap",
  "race_data"."pit_stop_time" AS "time",
  "race_data"."pit_stop_time_millis" AS "time_millis"
FROM "race_data"
WHERE "race_data"."type" = 'PIT_STOP';

CREATE VIEW "driver_of_the_day_result"(
  "race_id",
  "position_display_order",
  "position_number",
  "position_text",
  "driver_number",
  "driver_id",
  "constructor_id",
  "engine_manufacturer_id",
  "tyre_manufacturer_id",
  "percentage"
)
AS
SELECT
  "race_data"."race_id",
  "race_data"."position_display_order",
  "race_data"."position_number",
  "race_data"."position_text",
  "race_data"."driver_number",
  "race_data"."driver_id",
  "race_data"."constructor_id",
  "race_data"."engine_manufacturer_id",
  "race_data"."tyre_manufacturer_id",
  "race_data"."driver_of_the_day_percentage" AS "percentage"
FROM "race_data"
WHERE "race_data"."type" = 'DRIVER_OF_THE_DAY_RESULT';


reset search_path;
