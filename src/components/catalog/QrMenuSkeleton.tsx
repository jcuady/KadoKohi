import Skeleton from '../ui/Skeleton';

export default function QrMenuSkeleton() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-4" aria-busy="true" aria-label="Loading menu">
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="guest-order-product-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="qr-surface-card overflow-hidden rounded-xl">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-1.5 p-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
