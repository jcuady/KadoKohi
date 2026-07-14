import { describe, expect, it } from 'vitest';
import { adminBackupFilename, buildAdminBackupSheets } from './adminDataBackup';
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

  it('names backup files with timestamp', () => {
    expect(adminBackupFilename(new Date('2026-07-14T12:34:56.000Z'))).toMatch(
      /^kado-kohi-admin-backup-2026-07-14T12-34-56\.xlsx$/,
    );
  });
});
