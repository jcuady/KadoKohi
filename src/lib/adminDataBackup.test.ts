import { describe, expect, it } from 'vitest';
import {
  adminBackupFilename,
  buildAdminBackupSheets,
  mergeOrdersWithItems,
} from './adminDataBackup';
import type { AdminBackupInput } from './adminDataBackup';

describe('adminDataBackup', () => {
  it('builds sales + ops sheets from a mini bundle', () => {
    const input: AdminBackupInput = {
      generatedAt: '2026-07-14T00:00:00.000Z',
      branches: [
        {
          id: 'branch_marikina',
          slug: 'marikina',
          name: 'Marikina',
          address: 'x',
          city: 'Marikina',
          status: 'active',
          hours: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      categories: [{ id: 'cat_coffee', name: 'Coffee', order: 0, visible: true }],
      products: [
        {
          id: 'p1',
          categoryId: 'cat_coffee',
          name: 'Latte',
          basePrice: 150,
          temperature: 'both',
          sizes: [],
          milks: [],
          visible: true,
          order: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      orders: [
        {
          id: 'o1',
          shortCode: 'K-1',
          channel: 'pos',
          branchId: 'branch_marikina',
          paymentStatus: 'paid',
          status: 'completed',
          items: [
            {
              id: 'i1',
              productId: 'p1',
              productNameSnapshot: 'Latte',
              unitPrice: 150,
              qty: 2,
              lineTotal: 300,
            },
          ],
          subtotal: 300,
          modifiersTotal: 0,
          tax: 0,
          total: 300,
          createdAt: '2026-07-10T08:00:00.000Z',
          updatedAt: '2026-07-10T09:00:00.000Z',
        },
      ],
      users: [],
      tables: [],
      merchCategories: [],
      merchProducts: [],
      events: [],
      eventRegistrations: [],
      bookings: [],
      loyaltyRewards: [],
      loyaltyVouchers: [],
      promoCodes: [],
      promoClaims: [],
      payments: [],
      auditLogs: [],
      careers: [],
      blogPosts: [],
    };

    const sheets = buildAdminBackupSheets(input);
    const names = sheets.map((s) => s.name);
    expect(names).toContain('Summary');
    expect(names).toContain('Sales_By_Branch');
    expect(names).toContain('Orders');
    expect(names).toContain('Order_Items');

    const summary = sheets.find((s) => s.name === 'Summary')!;
    const net = summary.rows.find((r) => r.metric === 'Net sales (excl. cancelled) PHP');
    expect(net?.value).toBe(300);

    const branchSales = sheets.find((s) => s.name === 'Sales_By_Branch')!;
    expect(branchSales.rows[0]?.revenue_php).toBe(300);
  });

  it('merges paged orders with separately fetched line items', () => {
    const merged = mergeOrdersWithItems(
      [
        {
          id: 'o1',
          short_code: 'A',
          channel: 'pos',
          branch_id: 'branch_marikina',
          payment_status: 'paid',
          status: 'completed',
          subtotal: 100,
          modifiers_total: 0,
          tax: 0,
          total: 100,
          created_at: '2026-07-10T08:00:00.000Z',
          updated_at: '2026-07-10T08:00:00.000Z',
        },
        {
          id: 'o2',
          short_code: 'B',
          channel: 'online',
          branch_id: 'branch_marikina',
          payment_status: 'unpaid',
          status: 'pending',
          subtotal: 50,
          modifiers_total: 0,
          tax: 0,
          total: 50,
          created_at: '2026-07-11T08:00:00.000Z',
          updated_at: '2026-07-11T08:00:00.000Z',
        },
      ],
      [
        {
          id: 'i1',
          order_id: 'o1',
          product_id: 'p1',
          product_name_snapshot: 'Latte',
          unit_price: 100,
          qty: 1,
          line_total: 100,
        },
        {
          id: 'i2',
          order_id: 'o2',
          product_id: 'p2',
          product_name_snapshot: 'Cookie',
          unit_price: 50,
          qty: 1,
          line_total: 50,
        },
        {
          id: 'orphan',
          order_id: 'missing',
          product_name_snapshot: 'Gone',
          unit_price: 1,
          qty: 1,
          line_total: 1,
        },
      ],
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]!.items).toHaveLength(1);
    expect(merged[0]!.items[0]!.productNameSnapshot).toBe('Latte');
    expect(merged[1]!.items[0]!.lineTotal).toBe(50);
  });

  it('names backup files with timestamp', () => {
    expect(adminBackupFilename(new Date('2026-07-14T12:34:56.000Z'))).toMatch(
      /^kado-kohi-admin-backup-2026-07-14T12-34-56\.xlsx$/,
    );
  });
});
