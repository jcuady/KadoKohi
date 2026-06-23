-- Remove legacy migration seed events so deleted listings never reappear from old rows.
DELETE FROM public.kk_events
WHERE id IN ('evt_latte_art', 'evt_cupping', 'evt_greenhills_opening');
