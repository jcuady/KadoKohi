-- Default dine-in tables for Marikina (QR codes / kk_place_order dine-in validation).

CREATE OR REPLACE FUNCTION public.kk_ensure_default_tables()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.kk_tables (id, branch_id, code, label, qr_payload, active)
  VALUES
    (
      'tbl_mrk_01',
      'branch_marikina',
      'mrk-t01',
      'Table 1',
      'https://www.kadokohi.com/order/qr/mrk-t01',
      true
    ),
    (
      'tbl_mrk_02',
      'branch_marikina',
      'mrk-t02',
      'Table 2',
      'https://www.kadokohi.com/order/qr/mrk-t02',
      true
    ),
    (
      'tbl_mrk_03',
      'branch_marikina',
      'mrk-t03',
      'Table 3',
      'https://www.kadokohi.com/order/qr/mrk-t03',
      true
    ),
    (
      'tbl_mrk_04',
      'branch_marikina',
      'mrk-t04',
      'Table 4',
      'https://www.kadokohi.com/order/qr/mrk-t04',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    branch_id = EXCLUDED.branch_id,
    code = EXCLUDED.code,
    label = EXCLUDED.label,
    qr_payload = EXCLUDED.qr_payload,
    active = EXCLUDED.active,
    updated_at = now();

  SELECT count(*)::int INTO v_count
  FROM public.kk_tables
  WHERE branch_id = 'branch_marikina' AND active = true;

  RETURN jsonb_build_object('tables', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_ensure_default_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_ensure_default_tables() TO anon, authenticated;
