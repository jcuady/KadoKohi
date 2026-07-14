-- Schema integrity & performance hardening (additive / non-destructive).
-- Verified against live data on idwtlujcdfnnndxmlaco before apply:
--   - 0 phone duplicates; phones present already match +639XXXXXXXXX
--   - 0 lower(email) duplicates; 0 orphan branch_id on profiles/events/push
--   - 0 orphan loyalty_voucher_id on orders
-- Deliberately NOT adding: kk_order_items.product_id FK (82 historical orphans;
--   line items keep product_name_snapshot), profiles.id → auth.users FK
--   (Clerk-era profiles intentionally lack auth.users rows; see 0064).

-- ── 1. Lock destructive admin reset off public / anon ───────────────────
REVOKE ALL ON FUNCTION public.kk_admin_reset_data(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kk_admin_reset_data(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.kk_admin_reset_data(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kk_admin_reset_data(text, text) TO service_role;

-- Trigger handlers must not be callable as RPCs
REVOKE ALL ON FUNCTION public.kk_handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kk_handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.kk_handle_new_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kk_handle_new_auth_user() FROM anon, authenticated;

-- ── 2. Pin mutable search_path (advisor) ────────────────────────────────
ALTER FUNCTION public.kk_is_mix_match_cookie(public.kk_products)
  SET search_path = public;

-- ── 3. Branch FK integrity (nullable = shared / unscoped rows) ──────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_profiles_branch_id_fkey'
  ) THEN
    ALTER TABLE public.kk_profiles
      ADD CONSTRAINT kk_profiles_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.kk_branches(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_events_branch_id_fkey'
  ) THEN
    ALTER TABLE public.kk_events
      ADD CONSTRAINT kk_events_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.kk_branches(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_products_branch_id_fkey'
  ) THEN
    ALTER TABLE public.kk_products
      ADD CONSTRAINT kk_products_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.kk_branches(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_push_subscriptions_branch_id_fkey'
  ) THEN
    ALTER TABLE public.kk_push_subscriptions
      ADD CONSTRAINT kk_push_subscriptions_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.kk_branches(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_orders_loyalty_voucher_id_fkey'
  ) THEN
    ALTER TABLE public.kk_orders
      ADD CONSTRAINT kk_orders_loyalty_voucher_id_fkey
      FOREIGN KEY (loyalty_voucher_id) REFERENCES public.kk_loyalty_vouchers(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_loyalty_vouchers_redeemed_order_id_fkey'
  ) THEN
    ALTER TABLE public.kk_loyalty_vouchers
      ADD CONSTRAINT kk_loyalty_vouchers_redeemed_order_id_fkey
      FOREIGN KEY (redeemed_order_id) REFERENCES public.kk_orders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Profile uniqueness / phone validation ────────────────────────────
-- No username column in this app — identity is email (+ optional phone).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_profiles_phone_e164_check'
  ) THEN
    ALTER TABLE public.kk_profiles
      ADD CONSTRAINT kk_profiles_phone_e164_check
      CHECK (phone IS NULL OR phone ~ '^\+639\d{9}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS kk_profiles_phone_unique
  ON public.kk_profiles (phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS kk_profiles_email_lower_unique
  ON public.kk_profiles (lower(email));

CREATE INDEX IF NOT EXISTS kk_profiles_branch_id_idx
  ON public.kk_profiles (branch_id)
  WHERE branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_profiles_role_idx
  ON public.kk_profiles (role);

-- ── 5. Line-item quantity integrity ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kk_order_items_qty_positive'
  ) THEN
    ALTER TABLE public.kk_order_items
      ADD CONSTRAINT kk_order_items_qty_positive
      CHECK (qty > 0);
  END IF;
END $$;

-- ── 6. Covering indexes for unindexed FKs (advisor) ─────────────────────
CREATE INDEX IF NOT EXISTS kk_booth_bookings_assigned_staff_id_idx
  ON public.kk_booth_bookings (assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_career_applications_customer_id_idx
  ON public.kk_career_applications (customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_event_date_blockouts_created_by_idx
  ON public.kk_event_date_blockouts (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_event_registrations_customer_id_idx
  ON public.kk_event_registrations (customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_events_signup_form_id_idx
  ON public.kk_events (signup_form_id)
  WHERE signup_form_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_loyalty_vouchers_reward_id_idx
  ON public.kk_loyalty_vouchers (reward_id);

CREATE INDEX IF NOT EXISTS kk_payment_transactions_created_by_idx
  ON public.kk_payment_transactions (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_promo_codes_created_by_idx
  ON public.kk_promo_codes (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_orders_loyalty_voucher_id_idx
  ON public.kk_orders (loyalty_voucher_id)
  WHERE loyalty_voucher_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_loyalty_vouchers_redeemed_order_id_idx
  ON public.kk_loyalty_vouchers (redeemed_order_id)
  WHERE redeemed_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS kk_products_branch_id_idx
  ON public.kk_products (branch_id)
  WHERE branch_id IS NOT NULL;

COMMENT ON CONSTRAINT kk_profiles_phone_e164_check ON public.kk_profiles IS
  'Philippine mobile E.164 (+639XXXXXXXXX); null allowed for staff and guests without SMS.';

NOTIFY pgrst, 'reload schema';
