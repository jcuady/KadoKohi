import { describe, expect, it } from 'vitest';
import {
  buildKukiBoxLines,
  buildKukiBoxMerchVariants,
  expectedKukiBoxPrice,
  kukiBoxItemsNeedFlavors,
  kukiBoxSizeFromProductId,
  mapKukiBoxRpcError,
  parseKukiCookieQtysFromVariants,
  sumCookieQtys,
  validateKukiBoxFill,
} from './kukiBoxOrder';
import { KUKIDO_COOKIE_IDS } from './kukido';

describe('kukiBoxOrder', () => {
  it('maps product ids to box sizes and fixed collab prices (₱90 from 6 pcs)', () => {
    expect(kukiBoxSizeFromProductId('kuki_box_4')).toBe(4);
    expect(kukiBoxSizeFromProductId('kuki_box_5')).toBe(5);
    expect(kukiBoxSizeFromProductId('kuki_box_6')).toBe(6);
    expect(kukiBoxSizeFromProductId('kuki_box_10')).toBe(10);
    expect(kukiBoxSizeFromProductId('cookie_klassic')).toBeNull();

    expect(expectedKukiBoxPrice(4)).toBe(400);
    expect(expectedKukiBoxPrice(5)).toBe(500);
    expect(expectedKukiBoxPrice(6)).toBe(540);
    expect(expectedKukiBoxPrice(10)).toBe(900);
  });

  it('requires exact cookie quantity for the selected box size', () => {
    const allowed = [...KUKIDO_COOKIE_IDS];
    const empty = validateKukiBoxFill(4, {}, allowed);
    expect(empty.ok).toBe(false);
    expect(empty.filled).toBe(0);
    expect(empty.remaining).toBe(4);

    const under = validateKukiBoxFill(4, { cookie_klassic: 2, cookie_campfire: 1 }, allowed);
    expect(under.ok).toBe(false);
    expect(under.filled).toBe(3);
    expect(under.remaining).toBe(1);

    const exact = validateKukiBoxFill(
      4,
      { cookie_klassic: 2, cookie_campfire: 1, cookie_blondie: 1 },
      allowed,
    );
    expect(exact.ok).toBe(true);
    expect(exact.filled).toBe(4);
    expect(exact.remaining).toBe(0);

    const over = validateKukiBoxFill(4, { cookie_klassic: 5 }, allowed);
    expect(over.ok).toBe(false);
    expect(over.filled).toBe(5);

    const unknown = validateKukiBoxFill(4, { cookie_klassic: 4, not_a_cookie: 0 }, allowed);
    expect(unknown.ok).toBe(true);

    const badId = validateKukiBoxFill(4, { prod_latte: 4 }, allowed);
    expect(badId.ok).toBe(false);
    expect(badId.error).toMatch(/unknown cookie/i);
  });

  it('builds merch variants with optionId + qty for server validation', () => {
    const variants = buildKukiBoxMerchVariants(
      { cookie_klassic: 2, cookie_campfire: 2 },
      { cookie_klassic: 'Klassic Cookie', cookie_campfire: 'Campfire' },
    );
    expect(variants).toEqual([
      {
        groupName: 'Cookies',
        optionId: 'cookie_campfire',
        optionLabel: 'Campfire ×2',
        priceDelta: 0,
        qty: 2,
      },
      {
        groupName: 'Cookies',
        optionId: 'cookie_klassic',
        optionLabel: 'Klassic Cookie ×2',
        priceDelta: 0,
        qty: 2,
      },
    ]);
    expect(sumCookieQtys(parseKukiCookieQtysFromVariants(variants))).toBe(4);
  });

  it('builds cart lines for box + optional packaging at collab prices', () => {
    const { box, packaging } = buildKukiBoxLines({
      size: 6,
      qtys: {
        cookie_klassic: 3,
        cookie_double_dark: 2,
        cookie_blondie: 1,
      },
      labels: {
        cookie_klassic: 'Klassic Cookie',
        cookie_double_dark: 'Double Dark',
        cookie_blondie: 'Blondie',
      },
      pack: 'big',
    });

    expect(box.productId).toBe('kuki_box_6');
    expect(box.unitPrice).toBe(540);
    expect(box.lineTotal).toBe(540);
    expect(box.selectedVariants).toHaveLength(3);
    expect(sumCookieQtys(parseKukiCookieQtysFromVariants(box.selectedVariants ?? []))).toBe(6);

    expect(packaging?.productId).toBe('kuki_pack_big');
    expect(packaging?.unitPrice).toBe(25);
    expect(packaging?.lineTotal).toBe(25);
  });

  it('uses admin catalog price overrides when provided', () => {
    const { box, packaging } = buildKukiBoxLines({
      size: 4,
      qtys: { cookie_klassic: 4 },
      labels: { cookie_klassic: 'Klassic Cookie' },
      pack: 'single',
      boxPrice: 420,
      packSinglePrice: 15,
    });
    expect(box.unitPrice).toBe(420);
    expect(box.lineTotal).toBe(420);
    expect(packaging?.unitPrice).toBe(15);
  });

  it('omits packaging when none selected and rejects incomplete fills', () => {
    expect(() =>
      buildKukiBoxLines({
        size: 4,
        qtys: { cookie_klassic: 1 },
        labels: { cookie_klassic: 'Klassic Cookie' },
        pack: 'none',
      }),
    ).toThrow(/fill/i);

    const { packaging } = buildKukiBoxLines({
      size: 4,
      qtys: { cookie_klassic: 4 },
      labels: { cookie_klassic: 'Klassic Cookie' },
      pack: 'none',
    });
    expect(packaging).toBeUndefined();
  });

  it('blocks checkout when a box has no cookie flavors', () => {
    expect(kukiBoxItemsNeedFlavors([{ productId: 'cookie_klassic' }])).toBeNull();
    expect(kukiBoxItemsNeedFlavors([{ productId: 'kuki_box_10', merchVariants: [] }])).toMatch(
      /10 cookie flavors/i,
    );
    expect(
      kukiBoxItemsNeedFlavors([
        {
          productId: 'kuki_box_10',
          selectedVariants: [
            { groupName: 'Cookies', optionId: 'cookie_klassic', optionLabel: 'Klassic ×10', qty: 10 },
          ],
        },
      ]),
    ).toBeNull();
    expect(
      kukiBoxItemsNeedFlavors([
        {
          productId: 'kuki_box_5',
          customizations: [
            { groupName: 'Cookies', optionId: 'cookie_klassic', optionLabel: 'Klassic ×2', qty: 2 },
          ],
        },
      ]),
    ).toMatch(/exactly 5 cookies/i);
  });

  it('maps server fill errors to flavor-first copy', () => {
    expect(mapKukiBoxRpcError('Kuki Box kuki_box_10 requires exactly 10 cookies (got 0)')).toMatch(
      /tap \+/i,
    );
    expect(mapKukiBoxRpcError('Kuki Box cookie selection is missing optionId')).toMatch(/flavors/i);
    expect(mapKukiBoxRpcError('Menu is still syncing')).toBeNull();
  });
});
