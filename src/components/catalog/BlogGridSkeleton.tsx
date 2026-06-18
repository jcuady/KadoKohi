import Skeleton from '../ui/Skeleton';

export default function BlogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading blog posts"
    >
      {Array.from({ length: count }, (_, i) => (
        <article
          key={i}
          className="flex flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-white"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <div className="flex gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="mt-auto h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}
