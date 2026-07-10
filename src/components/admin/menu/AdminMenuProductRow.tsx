import { GripVertical, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import type { MenuCategory, Product } from '../../../types/domain';
import { formatPhp } from '../../../lib/money';
import { getProductImageUrl } from '../../../lib/productImage';
import { isPastriesCategory, pastryHasPrice } from '../../../lib/pastriesCategory';
import { isProductInStock } from '../../../lib/productStock';
import MenuProductStockButton from '../../menu/MenuProductStockButton';
import { Badge } from '../../ui/badge';

type Props = {
  product: Product;
  category: MenuCategory;
  pastriesCategoryId?: string;
  pIndex: number;
  deleteConfirmProductId: string | null;
  deletingProductId: string | null;
  onDragStart: (e: DragEvent, pIndex: number) => void;
  onDragEnd: () => void;
  onDrop: (e: DragEvent, pIndex: number) => void;
  onToggleVisible: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AdminMenuProductRow({
  product,
  category,
  pastriesCategoryId,
  pIndex,
  deleteConfirmProductId,
  deletingProductId,
  onDragStart,
  onDragEnd,
  onDrop,
  onToggleVisible,
  onEdit,
  onDelete,
}: Props) {
  const catIsPastry = isPastriesCategory(category);
  const thumb = getProductImageUrl(product, { pastriesCategoryId });

  return (
    <div
      className="group flex flex-col gap-2 rounded-xl border dash-border bg-[var(--color-dash-surface-alt)]/40 px-3 py-2.5 transition-colors hover:border-kado-red/20 sm:flex-row sm:items-center"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => onDrop(e, pIndex)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="cursor-grab touch-none rounded-lg p-1.5 hover:bg-[var(--color-dash-hover)] active:cursor-grabbing"
          draggable
          onDragStart={(e) => onDragStart(e, pIndex)}
          onDragEnd={onDragEnd}
          aria-label={`Drag to reorder ${product.name}`}
        >
          <GripVertical className="h-4 w-4 dash-muted" />
        </span>
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border dash-border bg-[var(--color-dash-surface)]">
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold dash-heading">{product.name}</span>
            {!product.visible ? <Badge variant="muted">Hidden</Badge> : null}
            {!isProductInStock(product) ? (
              <Badge variant="warning" className="text-[9px]">
                Out of stock
              </Badge>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] dash-muted">
            {catIsPastry && !pastryHasPrice(product) ? (
              <span>No listed price</span>
            ) : (
              <span className="font-display font-bold tabular-nums text-kado-red">{formatPhp(product.basePrice)}</span>
            )}
            {product.sizes?.length > 0 ? <span>{product.sizes.length} sizes</span> : null}
            {product.milks?.length > 0 ? <span>{product.milks.length} milks</span> : null}
            {!catIsPastry ? <span className="capitalize">{product.temperature}</span> : null}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-0.5 sm:shrink-0">
        <MenuProductStockButton product={product} size="icon" />
        <button
          type="button"
          onClick={onToggleVisible}
          className={`rounded-lg p-2 transition-colors ${
            product.visible ? 'dash-muted hover:bg-[var(--color-dash-hover)]' : 'bg-amber-50 text-amber-800'
          }`}
          title={product.visible ? 'Hide from menu' : 'Show on menu'}
          aria-label={product.visible ? 'Hide product' : 'Show product'}
        >
          {product.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 dash-muted hover:bg-[var(--color-dash-hover)] hover:text-kado-red"
          aria-label={`Edit ${product.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deletingProductId === product.id}
          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
            deleteConfirmProductId === product.id
              ? 'bg-red-50 text-red-600'
              : 'text-red-400 hover:bg-red-50 hover:text-red-600'
          }`}
          title={deleteConfirmProductId === product.id ? 'Click again to confirm' : 'Delete'}
          aria-label={`Delete ${product.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
