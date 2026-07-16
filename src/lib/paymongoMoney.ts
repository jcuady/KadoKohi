/** Convert PHP pesos to PayMongo centavos (integer). */
export function phpToCentavos(pesos: number): number {
  if (!Number.isFinite(pesos) || pesos < 0) return 0;
  return Math.round(pesos * 100);
}
