import { memo } from 'react';
import type { Product } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { isIcedOnlyDrink, productFallbackDescription } from '../../lib/menuProductModifiers';
import { isProductInStock } from '../../lib/productStock';
import { menuProductDomId } from '../../lib/menuDeepLink';
import MenuProductImage from './MenuProductImage';

type Props = {
  product: Product;
  highlight: boolean;
  imagePriority: boolean;
  onSelect: (product: Product) => void;
  pastriesCategoryId?: string;
};

function MenuProductCard({ product, highlight, imagePriority, onSelect, pastriesCategoryId }: Props) {
  const tag = isIcedOnlyDrink(product) ? 'Iced only' : product.tags?.[0];
  const inStock = isProductInStock(product);
  const desc = productFallbackDescription(product);

  return (
    <button
      id={menuProductDomId(product.id)}
      type="button"
      disabled={!inStock}
      onClick={() => inStock && onSelect(product)}
      className={`menu-product-card group flex h-full touch-manipulation flex-col overflow-hidden rounded-xl border bg-white text-left transition-[border-color,box-shadow,transform] duration-300 focus:outline-none active:scale-[0.99] md:rounded-[1.25rem] ${
        highlight
          ? 'border-kado-red ring-2 ring-kado-red ring-offset-2'
          : 'border-kado-dark/10'
      } ${
        inStock
          ? 'hover:-translate-y-0.5 hover:border-kado-red/30 hover:shadow-[0_12px_28px_rgba(158,24,29,0.08)] focus-visible:ring-2 focus-visible:ring-kado-red'
          : 'cursor-not-allowed border-kado-dark/5 opacity-60'
      }`}
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-kado-dark/5">
        <MenuProductImage
          product={product}
          alt={product.name}
          loading={imagePriority ? 'eager' : 'lazy'}
          pastriesCategoryId={pastriesCategoryId}
          className="h-full w-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {!inStock ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow">
            Out of stock
          </span>
        ) : (
          tag && (
            <span className="absolute left-2 top-2 rounded-full bg-kado-dark px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow">
              {tag}
            </span>
          )
        )}

        <div className="absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
          <span className="rounded-full bg-kado-red/90 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-sm">
            View details
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="mb-1 flex items-start justify-between gap-1.5 sm:gap-2">
          <h3 className="line-clamp-2 font-display text-xs font-black leading-snug text-kado-dark transition-colors group-hover:text-kado-red sm:text-[0.95rem]">
            {product.name}
          </h3>
          <span className="shrink-0 font-sans text-xs font-black text-kado-dark sm:text-base">
            {formatPhp(product.basePrice)}
          </span>
        </div>
        <p className="mt-auto line-clamp-2 pt-1 text-[10px] font-medium leading-relaxed text-kado-dark/60 sm:text-xs">
          {desc}
        </p>
      </div>
    </button>
  );
}

export default memo(
  MenuProductCard,
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.highlight === next.highlight &&
    prev.imagePriority === next.imagePriority &&
    prev.pastriesCategoryId === next.pastriesCategoryId &&
    prev.product.inStock === next.product.inStock &&
    prev.product.image === next.product.image &&
    prev.product.basePrice === next.product.basePrice &&
    prev.product.name === next.product.name,
);
