-- Align default table seed codes with buildTableCode() (marikina → mar-t01, not mrk-t01).

CREATE OR REPLACE FUNCTION public.kk_ensure_default_tables()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.kk_tables WHERE branch_id = 'branch_marikina'
  ) THEN
    INSERT INTO public.kk_tables (id, branch_id, code, label, qr_payload, active)
    VALUES
      (
        'tbl_mar_01',
        'branch_marikina',
        'mar-t01',
        'Table 1',
        'https://www.kadokohi.com/order/qr/mar-t01',
        true
      ),
      (
        'tbl_mar_02',
        'branch_marikina',
        'mar-t02',
        'Table 2',
        'https://www.kadokohi.com/order/qr/mar-t02',
        true
      ),
      (
        'tbl_mar_03',
        'branch_marikina',
        'mar-t03',
        'Table 3',
        'https://www.kadokohi.com/order/qr/mar-t03',
        true
      ),
      (
        'tbl_mar_04',
        'branch_marikina',
        'mar-t04',
        'Table 4',
        'https://www.kadokohi.com/order/qr/mar-t04',
        true
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT count(*)::int INTO v_count
  FROM public.kk_tables
  WHERE branch_id = 'branch_marikina' AND active = true;

  RETURN jsonb_build_object('tables', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_ensure_default_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_ensure_default_tables() TO anon, authenticated;
