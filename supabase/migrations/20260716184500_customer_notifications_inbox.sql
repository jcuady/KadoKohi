-- In-app notification inbox for customers (orders, payments, marketing, system).

CREATE TABLE IF NOT EXISTS public.kk_customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.kk_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'system'
    CHECK (kind IN ('order', 'payment', 'marketing', 'system')),
  title text NOT NULL,
  body text NOT NULL,
  url text,
  tag text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_customer_notifications_customer_created
  ON public.kk_customer_notifications (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kk_customer_notifications_unread
  ON public.kk_customer_notifications (customer_id)
  WHERE read_at IS NULL;

ALTER TABLE public.kk_customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_customer_notifications_select_own ON public.kk_customer_notifications;
CREATE POLICY kk_customer_notifications_select_own
  ON public.kk_customer_notifications
  FOR SELECT TO authenticated
  USING (customer_id = public.requesting_profile_id());

DROP POLICY IF EXISTS kk_customer_notifications_update_own ON public.kk_customer_notifications;
CREATE POLICY kk_customer_notifications_update_own
  ON public.kk_customer_notifications
  FOR UPDATE TO authenticated
  USING (customer_id = public.requesting_profile_id())
  WITH CHECK (customer_id = public.requesting_profile_id());

DROP POLICY IF EXISTS kk_customer_notifications_admin_all ON public.kk_customer_notifications;
CREATE POLICY kk_customer_notifications_admin_all
  ON public.kk_customer_notifications
  FOR ALL TO authenticated
  USING (public.kk_current_role() = 'admin')
  WITH CHECK (public.kk_current_role() = 'admin');

-- Admin (or service) broadcast helper for marketing / system notices.
CREATE OR REPLACE FUNCTION public.kk_notify_customers(
  p_title text,
  p_body text,
  p_kind text DEFAULT 'marketing',
  p_url text DEFAULT '/account',
  p_tag text DEFAULT NULL,
  p_customer_ids uuid[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_count integer := 0;
BEGIN
  IF public.kk_current_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can broadcast notifications';
  END IF;

  v_kind := lower(nullif(trim(p_kind), ''));
  IF v_kind IS NULL OR v_kind NOT IN ('order', 'payment', 'marketing', 'system') THEN
    v_kind := 'marketing';
  END IF;

  IF p_title IS NULL OR length(trim(p_title)) < 1 OR length(p_title) > 120 THEN
    RAISE EXCEPTION 'Invalid title';
  END IF;
  IF p_body IS NULL OR length(trim(p_body)) < 1 OR length(p_body) > 500 THEN
    RAISE EXCEPTION 'Invalid body';
  END IF;

  INSERT INTO public.kk_customer_notifications (customer_id, kind, title, body, url, tag)
  SELECT p.id, v_kind, trim(p_title), trim(p_body), nullif(trim(p_url), ''), nullif(trim(p_tag), '')
  FROM public.kk_profiles p
  WHERE p.role = 'customer'
    AND (p_customer_ids IS NULL OR p.id = ANY (p_customer_ids));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.kk_notify_customers(text, text, text, text, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_notify_customers(text, text, text, text, text, uuid[]) TO authenticated;
