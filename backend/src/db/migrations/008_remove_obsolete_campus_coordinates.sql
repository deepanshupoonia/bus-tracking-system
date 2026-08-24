-- Remove placeholder coordinates from the former/incorrect campus area.
-- These stops remain in the timetable, but will not be pinned until Operations supplies verified coordinates.
ALTER TABLE stops ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE stops ALTER COLUMN longitude DROP NOT NULL;
UPDATE stops
SET latitude=NULL, longitude=NULL
WHERE latitude BETWEEN 30.970000 AND 30.980000
  AND longitude BETWEEN 76.530000 AND 76.550000;
