/** Bottom padding so main content clears the sticky cart on guest order flows. */
export function guestOrderMainPadding(cartExpanded: boolean, hasCart: boolean): string {
  if (cartExpanded && hasCart) {
    return 'pb-[min(42dvh,340px)] [@media(orientation:landscape)_and_(max-height:30rem)]:pb-[min(32dvh,200px)]';
  }
  if (hasCart) {
    return 'pb-[max(7.5rem,calc(6.5rem+env(safe-area-inset-bottom)))] [@media(orientation:landscape)_and_(max-height:30rem)]:pb-24';
  }
  return 'pb-[max(5rem,calc(4rem+env(safe-area-inset-bottom)))]';
}
