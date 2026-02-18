
-- Add theme_id column to work_settings for per-tenant theme persistence
ALTER TABLE public.work_settings 
ADD COLUMN IF NOT EXISTS theme_id text NOT NULL DEFAULT 'galaxy';

-- Enable realtime for work_settings so theme changes propagate instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_settings;
