import type { Order, Table } from '../types/domain';

export function getTableForOrder(order: Pick<Order, 'tableId'>, tables: Table[]): Table | undefined {
  if (!order.tableId) return undefined;
  return tables.find((t) => t.id === order.tableId);
}

export function getOrderTableLabel(order: Pick<Order, 'tableId'>, tables: Table[]): string | null {
  return getTableForOrder(order, tables)?.label ?? null;
}
