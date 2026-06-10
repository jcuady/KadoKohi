import type { Order, Table } from '../types/domain';

export function getTableForOrder(order: Pick<Order, 'tableId'>, tables: Table[]): Table | undefined {
  if (!order.tableId) return undefined;
  return tables.find((t) => t.id === order.tableId);
}

export function getOrderTableLabel(order: Pick<Order, 'tableId'>, tables: Table[]): string | null {
  return getTableForOrder(order, tables)?.label ?? null;
}

export type KioskOrderTag = { kind: 'table' | 'online' | 'takeout'; label: string };

/** Customer kiosk chips: table number, online, or takeout. */
export function getKioskOrderTags(
  order: Pick<Order, 'channel' | 'tableId'>,
  tables: Table[],
): KioskOrderTag[] {
  if (order.channel === 'online') return [{ kind: 'online', label: 'Online' }];
  if (order.channel === 'takeout') return [{ kind: 'takeout', label: 'Takeout' }];
  if (order.channel === 'dine-in' || order.tableId) {
    const tableLabel = getOrderTableLabel(order, tables);
    if (tableLabel) return [{ kind: 'table', label: tableLabel }];
  }
  return [];
}
