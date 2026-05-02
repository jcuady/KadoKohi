export function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Tax on subtotal + modifiers (additive). `taxRatePercent` is e.g. 12 for 12%. */
export function computeOrderTotals(
  subtotal: number,
  modifiersTotal: number,
  taxRatePercent: number,
): { subtotal: number; modifiersTotal: number; tax: number; total: number } {
  const taxable = Math.max(0, subtotal + modifiersTotal);
  const tax = taxRatePercent > 0 ? Math.round((taxable * taxRatePercent) / 100) : 0;
  return { subtotal, modifiersTotal, tax, total: taxable + tax };
}
