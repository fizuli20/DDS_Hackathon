BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_activity_payload(p_type TEXT, p_payload JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RETURN FALSE;
  END IF;

  CASE p_type
    WHEN 'pld' THEN
      RETURN (p_payload ? 'sessionId')
         AND (p_payload ? 'attended')
         AND jsonb_typeof(p_payload->'sessionId') = 'string'
         AND jsonb_typeof(p_payload->'attended') = 'boolean';
    WHEN 'exam' THEN
      RETURN (p_payload ? 'examKey')
         AND (p_payload ? 'name')
         AND (p_payload ? 'score')
         AND (p_payload ? 'maxScore')
         AND jsonb_typeof(p_payload->'examKey') = 'string'
         AND jsonb_typeof(p_payload->'name') = 'string'
         AND jsonb_typeof(p_payload->'score') = 'number'
         AND jsonb_typeof(p_payload->'maxScore') = 'number';
    WHEN 'task' THEN
      RETURN (p_payload ? 'taskKey')
         AND (p_payload ? 'name')
         AND (p_payload ? 'status')
         AND jsonb_typeof(p_payload->'taskKey') = 'string'
         AND jsonb_typeof(p_payload->'name') = 'string'
         AND jsonb_typeof(p_payload->'status') = 'string'
         AND (p_payload->>'status') IN ('pending', 'in_progress', 'completed', 'failed');
    WHEN 'attendance' THEN
      RETURN (p_payload ? 'classKey')
         AND (p_payload ? 'attended')
         AND jsonb_typeof(p_payload->'classKey') = 'string'
         AND jsonb_typeof(p_payload->'attended') = 'boolean';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'mentor', 'student')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('cyber_security', 'computer_science', 'full_stack', 'ml')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE CHECK (student_id ~ '^HB-[0-9]{4}-[0-9]{3}$'),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  track TEXT NOT NULL CHECK (track IN ('cyber_security', 'computer_science', 'full_stack', 'ml')),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  mentor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'dropped_out')),
  enrollment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  track TEXT CHECK (track IN ('cyber_security', 'computer_science', 'full_stack', 'ml')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'sync')),
  type TEXT NOT NULL CHECK (type IN ('pld', 'exam', 'task', 'attendance')),
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (validate_activity_payload(type, payload))
);

CREATE TABLE IF NOT EXISTS score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL,
  window_days INTEGER NOT NULL CHECK (window_days IN (7, 30, 90)),
  pld_pct NUMERIC(5,2) CHECK (pld_pct BETWEEN 0 AND 100),
  exam_pct NUMERIC(5,2) CHECK (exam_pct BETWEEN 0 AND 100),
  task_pct NUMERIC(5,2) CHECK (task_pct BETWEEN 0 AND 100),
  attendance_pct NUMERIC(5,2) CHECK (attendance_pct BETWEEN 0 AND 100),
  overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('strong', 'medium', 'weak', 'at_risk')),
  trend TEXT NOT NULL CHECK (trend IN ('up', 'stable', 'down')),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'in_app')),
  template_key TEXT,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('students', 'pld', 'exams', 'tasks', 'attendance')),
  source TEXT NOT NULL CHECK (source IN ('upload', 'sync')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed', 'partial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  stats JSONB,
  error_sample JSONB,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (finished_at IS NULL OR finished_at >= started_at)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cohorts_set_updated_at ON cohorts;
CREATE TRIGGER trg_cohorts_set_updated_at
BEFORE UPDATE ON cohorts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_students_set_updated_at ON students;
CREATE TRIGGER trg_students_set_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS ux_students_student_id ON students(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_students_email ON students(email);
CREATE INDEX IF NOT EXISTS ix_students_cohort_track_status ON students(cohort_id, track, status);
CREATE INDEX IF NOT EXISTS ix_activity_events_student_occurred_at ON activity_events(student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_activity_events_cohort_type_occurred_at ON activity_events(cohort_id, type, occurred_at);
CREATE INDEX IF NOT EXISTS ix_activity_events_payload_gin ON activity_events USING GIN (payload);
CREATE UNIQUE INDEX IF NOT EXISTS ux_score_snapshots_student_date_window ON score_snapshots(student_id, snapshot_date, window_days);
CREATE INDEX IF NOT EXISTS ix_notification_logs_student_created_at ON notification_logs(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_imports_created_at ON imports(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_created_at ON audit_logs(actor_user_id, created_at DESC);

COMMIT;
