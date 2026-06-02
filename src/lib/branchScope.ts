/** NULL/empty branchId = valid at all branches (universal). */
export function voucherAppliesAtBranch(
  scopeBranchId: string | null | undefined,
  orderBranchId: string,
): boolean {
  if (!scopeBranchId) return true;
  return scopeBranchId === orderBranchId;
}

export function formatVoucherScopeLabel(
  scopeBranchId: string | null | undefined,
  branchNameById: (id: string) => string | undefined,
): string {
  if (!scopeBranchId) return 'All branches';
  return branchNameById(scopeBranchId) ?? scopeBranchId;
}
