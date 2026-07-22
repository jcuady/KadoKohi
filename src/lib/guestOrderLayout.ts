/** Bottom padding so main content clears the sticky cart on guest order flows. */
export function guestOrderMainPadding(cartExpanded: boolean, hasCart: boolean): string {
  // Expanded: pinned totals + name + payment — pad so catalog stays reachable above sheet.
  if (cartExpanded && hasCart) {
    return 'pb-[min(58dvh,460px)] [@media(orientation:landscape)_and_(max-height:30rem)]:pb-[min(42dvh,260px)]';
  }
  // Collapsed may still show guest-name field — pad for that taller footer.
  if (hasCart) {
    return 'pb-[max(9.5rem,calc(8.25rem+env(safe-area-inset-bottom)))] [@media(orientation:landscape)_and_(max-height:30rem)]:pb-28';
  }
  return 'pb-[max(5rem,calc(4rem+env(safe-area-inset-bottom)))]';
}
