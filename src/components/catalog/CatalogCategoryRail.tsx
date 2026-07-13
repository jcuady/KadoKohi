import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type CatalogCategoryItem = {
  id: string;
  label: string;
  /** Narrow screens — falls back to label. */
  shortLabel?: string;
  icon?: ReactNode;
};

type Props = {
  items: CatalogCategoryItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
};

/**
 * Horizontal category rail — café-standard chip navigation.
 * Scrolls on mobile; wraps cleanly on desktop. 44px touch targets.
 */
export default function CatalogCategoryRail({
  items,
  value,
  onChange,
  ariaLabel = 'Categories',
}: Props) {
  return (
    <div className="catalog-category-rail relative min-w-0" role="tablist" aria-label={ariaLabel}>
      <div className="catalog-category-rail-track flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
        {items.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              onClick={() => onChange(item.id)}
              className={cn(
                'catalog-category-chip inline-flex min-h-11 shrink-0 touch-manipulation items-center gap-2 rounded-full px-3.5 text-[11px] font-bold tracking-wide transition-colors duration-200 sm:px-4 sm:text-xs',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-offwhite',
                active
                  ? 'bg-kado-red text-white shadow-sm shadow-kado-red/25'
                  : 'border border-kado-dark/12 bg-white text-kado-dark/75 hover:border-kado-red/35 hover:text-kado-red',
              )}
            >
              {item.icon ? (
                <span className={cn('shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5', active ? 'opacity-100' : 'opacity-70')}>
                  {item.icon}
                </span>
              ) : null}
              <span className="md:hidden">{item.shortLabel ?? item.label}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
