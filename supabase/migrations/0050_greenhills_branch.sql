-- Seed active Greenhills branch + dine-in tables for multi-branch ordering tests.

INSERT INTO public.kk_branches (
  id,
  slug,
  name,
  address,
  city,
  status,
  hours,
  lat,
  lng
)
VALUES (
  'branch_greenhills',
  'greenhills',
  'Kado Kohi — Greenhills Mall',
  'Connecticut St, Greenhills Shopping Center',
  'San Juan City',
  'active',
  '[
    {"day":"mon","open":"07:00","close":"23:00"},
    {"day":"tue","open":"07:00","close":"23:00"},
    {"day":"wed","open":"07:00","close":"23:00"},
    {"day":"thu","open":"07:00","close":"23:00"},
    {"day":"fri","open":"07:00","close":"23:00"},
    {"day":"sat","open":"07:00","close":"23:00"},
    {"day":"sun","open":"07:00","close":"23:00"}
  ]'::jsonb,
  14.6018,
  121.0492
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  status = 'active',
  hours = EXCLUDED.hours,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  updated_at = now();

INSERT INTO public.kk_tables (id, branch_id, code, label, qr_payload, active)
SELECT v.id, v.branch_id, v.code, v.label, v.qr_payload, true
FROM (
  VALUES
    (
      'tbl_gh_01',
      'branch_greenhills',
      'gre-t01',
      'Table 1',
      'https://www.kadokohi.com/order/qr/gre-t01'
    ),
    (
      'tbl_gh_02',
      'branch_greenhills',
      'gre-t02',
      'Table 2',
      'https://www.kadokohi.com/order/qr/gre-t02'
    ),
    (
      'tbl_gh_03',
      'branch_greenhills',
      'gre-t03',
      'Table 3',
      'https://www.kadokohi.com/order/qr/gre-t03'
    ),
    (
      'tbl_gh_04',
      'branch_greenhills',
      'gre-t04',
      'Table 4',
      'https://www.kadokohi.com/order/qr/gre-t04'
    )
) AS v(id, branch_id, code, label, qr_payload)
WHERE NOT EXISTS (
  SELECT 1 FROM public.kk_tables t WHERE t.branch_id = 'branch_greenhills'
)
ON CONFLICT (id) DO NOTHING;
