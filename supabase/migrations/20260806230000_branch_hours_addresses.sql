-- Align Marikina + Greenhills addresses, hours, and pins for public /branches + footer.
-- Hours: Mon-Thu 10:00-21:00, Fri-Sun 10:00-22:00

UPDATE public.kk_branches
SET
  address = 'Corner Mt Everest',
  city = 'Marikina, 1801 Metro Manila',
  hours = '[
    {"day":"mon","open":"10:00","close":"21:00"},
    {"day":"tue","open":"10:00","close":"21:00"},
    {"day":"wed","open":"10:00","close":"21:00"},
    {"day":"thu","open":"10:00","close":"21:00"},
    {"day":"fri","open":"10:00","close":"22:00"},
    {"day":"sat","open":"10:00","close":"22:00"},
    {"day":"sun","open":"10:00","close":"22:00"}
  ]'::jsonb,
  lat = 14.6507,
  lng = 121.1029,
  updated_at = now()
WHERE id = 'branch_marikina';

UPDATE public.kk_branches
SET
  address = 'Promenade Greenhills Ortigas Ave, Connecticut',
  city = 'San Juan City, 1503 Metro Manila',
  hours = '[
    {"day":"mon","open":"10:00","close":"21:00"},
    {"day":"tue","open":"10:00","close":"21:00"},
    {"day":"wed","open":"10:00","close":"21:00"},
    {"day":"thu","open":"10:00","close":"21:00"},
    {"day":"fri","open":"10:00","close":"22:00"},
    {"day":"sat","open":"10:00","close":"22:00"},
    {"day":"sun","open":"10:00","close":"22:00"}
  ]'::jsonb,
  lat = 14.602979,
  lng = 121.0520935,
  status = 'active',
  updated_at = now()
WHERE id = 'branch_greenhills';
