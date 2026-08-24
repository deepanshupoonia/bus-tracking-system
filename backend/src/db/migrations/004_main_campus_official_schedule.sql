-- Official IIT Ropar main-campus city timetable supplied by the institute, effective 27-07-2026.
-- Schedules are associated with BUS-12 as a demonstrator until Operations assigns the actual vehicles.
DO $$ BEGIN
  ALTER TABLE schedule_stop_times DROP CONSTRAINT IF EXISTS schedule_stop_times_pkey;
  ALTER TABLE schedule_stop_times DROP CONSTRAINT IF EXISTS schedule_stop_times_schedule_id_stop_order_key;
  ALTER TABLE schedule_stop_times ADD COLUMN IF NOT EXISTS id BIGSERIAL;
  ALTER TABLE schedule_stop_times ADD PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION add_main_campus_trip(p_name TEXT,p_days TEXT,p_departure TIME,p_stops TEXT[],p_times TIME[]) RETURNS VOID AS $$
DECLARE schedule_key BIGINT; i INTEGER;
BEGIN
  SELECT id INTO schedule_key FROM bus_schedules WHERE bus_id=(SELECT id FROM buses WHERE bus_number='BUS-12') AND schedule_name=p_name AND days_of_week=p_days AND departure_time=p_departure;
  IF schedule_key IS NULL THEN INSERT INTO bus_schedules(bus_id,schedule_name,days_of_week,departure_time) VALUES((SELECT id FROM buses WHERE bus_number='BUS-12'),p_name,p_days,p_departure) RETURNING id INTO schedule_key; END IF;
  DELETE FROM schedule_stop_times WHERE schedule_id=schedule_key;
  FOR i IN 1..array_length(p_stops,1) LOOP
    INSERT INTO stops(name,latitude,longitude) SELECT p_stops[i],30.975500,76.539500 WHERE NOT EXISTS(SELECT 1 FROM stops WHERE name=p_stops[i]);
    INSERT INTO schedule_stop_times(schedule_id,stop_id,stop_order,expected_arrival_time) VALUES(schedule_key,(SELECT id FROM stops WHERE name=p_stops[i] LIMIT 1),i,p_times[i]);
  END LOOP;
END; $$ LANGUAGE plpgsql;

-- Monday to Thursday
SELECT add_main_campus_trip('Railway Station pickup','MON,TUE,WED,THU','05:05',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Main Campus'],ARRAY['05:05','05:17','05:20','05:40']::time[]);
SELECT add_main_campus_trip('Local Round Trip 08:15','MON,TUE,WED,THU','08:15',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Surjit Hospital Light Point','Over Bridge','Main Campus'],ARRAY['08:15','08:27','08:30','08:37','08:42','08:45','08:50']::time[]);
SELECT add_main_campus_trip('Local Round Trip 09:05','MON,TUE,WED,THU','09:05',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Bela Chowk','Surjit Hospital Light Point','Over Bridge','Main Campus'],ARRAY['09:05','09:17','09:20','09:27','09:37','09:42','09:45','09:50']::time[]);
SELECT add_main_campus_trip('Bela Chowk 15:10','MON,TUE,WED,THU','15:10',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['15:10','15:20','15:22','15:25','16:30','16:33','16:35','16:43']::time[]);
SELECT add_main_campus_trip('Bela Chowk 17:00','MON,TUE,WED,THU','17:00',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['17:00','17:10','17:12','17:15','17:18','17:21','17:23','17:31']::time[]);
SELECT add_main_campus_trip('Bus Stand & Police Lines 17:50','MON,TUE,WED,THU','17:50',ARRAY['Main Campus','Over Bridge','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Surjit Hospital Light Point','Main Campus'],ARRAY['17:50','17:55','18:02','18:05','18:12','18:17','18:25']::time[]);
SELECT add_main_campus_trip('Local Round Trip 19:00','MON,TUE,WED,THU','19:00',ARRAY['Main Campus','Surjit Hospital Light Point','Police Lines','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['19:00','19:10','19:20','19:30','19:33','19:35','19:43']::time[]);
-- Friday
SELECT add_main_campus_trip('Friday Local 08:15','FRI','08:15',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Surjit Hospital Light Point','Over Bridge','Main Campus'],ARRAY['08:15','08:27','08:30','08:37','08:42','08:45','08:50']::time[]);
SELECT add_main_campus_trip('Friday Bela Chowk 09:05','FRI','09:05',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Bela Chowk','Surjit Hospital Light Point','Over Bridge','Main Campus'],ARRAY['09:05','09:17','09:20','09:27','09:37','09:42','09:45','09:50']::time[]);
SELECT add_main_campus_trip('Friday Railway & Bela 14:30','FRI','14:30',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Bela Chowk','Bela Chowk','Surjit Hospital Light Point','Over Bridge','Main Campus'],ARRAY['14:30','14:42','14:45','14:52','15:02','16:30','16:33','16:38','16:43']::time[]);
SELECT add_main_campus_trip('Friday Bela Chowk 17:00','FRI','17:00',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['17:00','17:10','17:12','17:15','17:18','17:21','17:23','17:31']::time[]);
SELECT add_main_campus_trip('Friday Bela Chowk 17:30','FRI','17:30',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['17:30','17:38','17:40','17:43','17:44','17:47','17:49','17:57']::time[]);
SELECT add_main_campus_trip('Friday Local 17:50','FRI','17:50',ARRAY['Main Campus','Over Bridge','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Surjit Hospital Light Point','Main Campus'],ARRAY['17:50','17:55','18:02','18:05','18:12','18:17','18:25']::time[]);
SELECT add_main_campus_trip('Friday Bela Chowk 18:15','FRI','18:15',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['18:15','18:25','18:27','18:29','19:15','19:18','19:21','19:28']::time[]);
SELECT add_main_campus_trip('Friday Local 19:10','FRI','19:10',ARRAY['Main Campus','Surjit Hospital Light Point','Police Lines','Bela Chowk','GS Resort (near HMT)','Main Campus'],ARRAY['19:10','19:20','19:30','19:40','19:43','19:53']::time[]);
SELECT add_main_campus_trip('Friday Late Local 22:00','FRI','22:00',ARRAY['Main Campus','Over Bridge','New Bus Stand','Old Bus Stand / Railway Station','New Bus Stand','Main Campus'],ARRAY['22:00','22:05','22:12','22:15','22:18','22:30']::time[]);
-- Saturday, holiday and Sunday trips
SELECT add_main_campus_trip('Weekend Local 08:30','SAT,SUN,HOLIDAY','08:30',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Surjit Hospital Light Point','Main Campus'],ARRAY['08:30','08:42','08:45','08:52','08:57','09:05']::time[]);
SELECT add_main_campus_trip('Weekend Bela Chowk 10:30','SAT,SUN,HOLIDAY','10:30',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['10:30','10:40','10:42','10:45','10:48','10:50','10:58']::time[]);
SELECT add_main_campus_trip('Weekend Bela Chowk 11:10','SAT,SUN,HOLIDAY','11:10',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['11:10','11:20','11:22','11:25','13:25','13:38','13:40','13:48']::time[]);
SELECT add_main_campus_trip('Weekend Bela Chowk 15:00','SAT,SUN,HOLIDAY','15:00',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['15:00','15:10','15:12','15:15','15:18','15:20','15:28']::time[]);
SELECT add_main_campus_trip('Weekend Bela Chowk 16:00','SAT,SUN,HOLIDAY','16:00',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['16:00','16:10','16:12','16:15','16:17','16:20','16:22','16:30']::time[]);
SELECT add_main_campus_trip('Weekend Local 17:30','SAT,SUN,HOLIDAY','17:30',ARRAY['Main Campus','Surjit Hospital Light Point','GS Resort (near HMT)','Bela Chowk','GS Resort (near HMT)','Police Lines','Surjit Hospital Light Point','Main Campus'],ARRAY['17:30','17:40','17:42','17:45','17:48','17:55','18:00','18:08']::time[]);
SELECT add_main_campus_trip('Weekend Police Lines 18:40','SAT,SUN,HOLIDAY','18:40',ARRAY['Main Campus','New Bus Stand','Old Bus Stand / Railway Station','Police Lines','Surjit Hospital Light Point','Bela Chowk','GS Resort (near HMT)','Surjit Hospital Light Point','Main Campus'],ARRAY['18:40','18:52','18:55','19:02','19:07','19:12','19:15','19:17','19:25']::time[]);
DROP FUNCTION add_main_campus_trip(TEXT,TEXT,TIME,TEXT[],TIME[]);
