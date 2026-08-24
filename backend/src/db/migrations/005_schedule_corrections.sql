-- Railway Station pickup is Monday-only; the source timetable explicitly limits it to Mondays.
UPDATE bus_schedules SET days_of_week='MON' WHERE schedule_name='Railway Station pickup' AND departure_time='05:05';
-- The 08:30 round trip is listed for Saturdays and holidays, not Sundays.
UPDATE bus_schedules SET days_of_week='SAT,HOLIDAY' WHERE schedule_name='Weekend Local 08:30' AND departure_time='08:30';
