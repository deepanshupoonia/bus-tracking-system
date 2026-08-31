CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id BIGINT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS schedule_overrides (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES bus_schedules(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('CANCELLED','ACTIVE')),
  note VARCHAR(500),
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schedule_id, service_date)
);

CREATE INDEX IF NOT EXISTS idx_schedule_overrides_date ON schedule_overrides(service_date, schedule_id);
