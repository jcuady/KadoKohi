import { motion } from 'motion/react';
import type { Product } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { getProductDescription } from '../../lib/productImage';
import { isIcedOnlyDrink, productFallbackDescription } from '../../lib/menuProductModifiers';
import MenuProductImage from '../catalog/MenuProductImage';
import { isProductInStock } from '../../lib/productStock';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../ProductGridPagination';

type Props = {
  products: Product[];
  page: number;
  onPageChange: (page: number) => void;
  onSelectProduct: (product: Product) => void;
  showDescriptions?: boolean;
};

export default function QrGuestFilteredCatalog({
  products,
  page,
  onPageChange,
  onSelectProduct,
  showDescriptions = true,
}: Props) {
  const totalPages = products.length === 0 ? 1 : Math.ceil(products.length / PRODUCT_GRID_PAGE_SIZE);
  const safePage = products.length === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PRODUCT_GRID_PAGE_SIZE;
  const pageItems = products.slice(start, start + PRODUCT_GRID_PAGE_SIZE);

  if (products.length === 0) {
    return (
      <div className="qr-surface-card rounded-2xl border-2 border-dashed py-12 text-center">
        <p className="qr-text-muted text-sm font-semibold">
          No drinks match your search. Try another term or clear filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="guest-order-product-grid">
        {pageItems.map((p, i) => {
          const tag = isIcedOnlyDrink(p) ? 'Iced only' : p.tags?.[0];
          const inStock = isProductInStock(p);
          const desc = showDescriptions
            ? getProductDescription(p) || productFallbackDescription(p)
            : null;

          return (
            <motion.button
              key={p.id}
              type="button"
              disabled={!inStock}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.12) }}
              onClick={() => inStock && onSelectProduct(p)}
              className={`qr-surface-card flex h-full flex-col overflow-hidden rounded-xl text-left transition-all touch-manipulation ${
                inStock
                  ? 'hover:border-kado-red/25 active:scale-[0.98]'
                  : 'cursor-not-allowed opacity-55'
              }`}
            >
              <div className="relative aspect-square shrink-0 qr-image-placeholder">
                <MenuProductImage
                  product={p}
                  alt={p.name}
                  loading={i < 6 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
                {!inStock ? (
                  <span className="absolute left-1 top-1 rounded-full bg-amber-600 px-1 py-0.5 text-[6px] font-black uppercase tracking-widest text-white">
                    Out
                  </span>
                ) : tag ? (
                  <span className="absolute left-1 top-1 rounded-full qr-badge-tag px-1 py-0.5 text-[6px] font-black uppercase tracking-widest">
                    {tag}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-1.5 sm:p-2">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="line-clamp-2 font-display text-[10px] font-black leading-tight qr-text sm:text-[11px]">
                    {p.name}
                  </h3>
                  <span className="shrink-0 text-[10px] font-black text-kado-red">{formatPhp(p.basePrice)}</span>
                </div>
                {desc ? (
                  <p className="qr-text-muted mt-0.5 line-clamp-2 text-[9px] font-medium leading-snug">
                    {desc}
                  </p>
                ) : null}
              </div>
            </motion.button>
          );
        })}
      </div>

      <ProductGridPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={products.length}
        onPageChange={onPageChange}
        className="mt-4"
      />
    </div>
  );
}
