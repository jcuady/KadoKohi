import type { HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Pulse placeholder for loading states (customer catalog pages). */
export default function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-kado-dark/10 ${className}`.trim()}
      aria-hidden
      {...props}
    />
  );
}
