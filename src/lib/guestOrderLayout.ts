/** Bottom padding so main content clears the sticky cart on guest order flows. */
export function guestOrderMainPadding(cartExpanded: boolean, hasCart: boolean): string {
  if (cartExpanded && hasCart) {
    return 'pb-[min(46dvh,380px)] [@media(orientation:landscape)_and_(max-height:30rem)]:pb-[min(34dvh,220px)]';
  }
  if (hasCart) {
    return 'pb-[max(9rem,calc(8rem+env(safe-area-inset-bottom)))] [@media(orientation:landscape)_and_(max-height:30rem)]:pb-28';
  }
  return 'pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))]';
}
