
-- Add JSONB column for per-day schedule overrides
-- Format: { "0": {"start_time":"09:00","end_time":"14:00"}, "6": {"start_time":"09:00","end_time":"16:00"} }
-- Days without entries use the global start_time/end_time defaults
ALTER TABLE public.work_settings
ADD COLUMN day_schedules jsonb NOT NULL DEFAULT '{}'::jsonb;
