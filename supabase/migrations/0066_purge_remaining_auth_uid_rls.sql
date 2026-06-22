-- More legacy auth.uid() duplicates (push + promo).

DROP POLICY IF EXISTS push_subs_owner_all ON public.kk_push_subscriptions;
DROP POLICY IF EXISTS claims_insert_auth ON public.kk_promo_claims;

NOTIFY pgrst, 'reload schema';
