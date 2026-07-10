-- Speed up branch-filtered event queries (client-side filter at current scale; index for growth).
CREATE INDEX IF NOT EXISTS idx_kk_events_branch_id ON public.kk_events(branch_id);
