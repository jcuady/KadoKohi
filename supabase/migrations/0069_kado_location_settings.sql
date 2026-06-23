-- Canonical Marikina cafe address + working Google Maps embed in site settings JSON.
UPDATE public.kk_app_settings
SET
  order_hours = COALESCE(order_hours, '{}'::jsonb) || jsonb_build_object(
    'contactAddress', 'J.P. Laurel St. corner Mt. Everest, Marikina City, Philippines 1807',
    'mapsEmbedUrl',
    'https://maps.google.com/maps?q=Kado%20Coffee%2C%20J.P.%20Laurel%20St.%20corner%20Mt.%20Everest%2C%20Marikina%20City%2C%20Philippines%201807&hl=en&z=18&iwloc=near&output=embed'
  ),
  updated_at = now()
WHERE id = true;
