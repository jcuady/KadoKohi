import type { DragEvent } from 'react';
import { Fragment } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { MenuCategory, Product } from '../../../types/domain';
import { isPastriesCategory } from '../../../lib/pastriesCategory';
import { Badge } from '../../ui/badge';
import AdminMenuProductRow from './AdminMenuProductRow';

type DragState =
  | null
  | { kind: 'cat'; from: number }
  | { kind: 'prod'; categoryId: string; from: number };

type Props = {
  cat: MenuCategory;
  catProducts: Product[];
  isExpanded: boolean;
  menuTab: 'coffee' | 'pastries';
  pastriesCategoryId?: string;
  editingCategoryId: string | null;
  editingCategoryName: string;
  drag: DragState;
  deletingProductId: string | null;
  onToggleExpand: () => void;
  onDragStartCat: () => void;
  onDragEnd: () => void;
  onCatDrop: (e: DragEvent) => void;
  onSetEditingCategoryName: (name: string) => void;
  onCommitCategoryRename: () => void;
  onCancelCategoryRename: () => void;
  onBeginCategoryRename: () => void;
  onToggleCategoryVisible: () => void;
  onDeleteCategory: () => void;
  onReorderProducts: (from: number, to: number) => void;
  onSetDrag: (drag: DragState) => void;
  onToggleProductVisible: (id: string, visible: boolean) => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: () => void;
};

export default function AdminMenuCategoryCard({
  cat,
  catProducts,
  isExpanded,
  menuTab,
  pastriesCategoryId,
  editingCategoryId,
  editingCategoryName,
  drag,
  deletingProductId,
  onToggleExpand,
  onDragStartCat,
  onDragEnd,
  onCatDrop,
  onSetEditingCategoryName,
  onCommitCategoryRename,
  onCancelCategoryRename,
  onBeginCategoryRename,
  onToggleCategoryVisible,
  onDeleteCategory,
  onReorderProducts,
  onSetDrag,
  onToggleProductVisible,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
}: Props) {
  const catIsPastry = isPastriesCategory(cat);
  const canReorderCat = menuTab !== 'pastries';

  return (
    <div
      className={[
        'overflow-hidden rounded-xl border dash-border bg-[var(--color-dash-surface)] transition-colors',
        isExpanded ? 'border-kado-red/25 shadow-sm' : 'hover:border-kado-red/15',
      ].join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={onCatDrop}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
        <span
          role="button"
          tabIndex={0}
          aria-label={`Drag to reorder category ${cat.name}`}
          className={[
            'shrink-0 rounded-lg p-1.5',
            canReorderCat
              ? 'cursor-grab touch-none hover:bg-[var(--color-dash-hover)] active:cursor-grabbing'
              : 'cursor-not-allowed opacity-30',
          ].join(' ')}
          draggable={canReorderCat}
          onDragStart={(e) => {
            if (!canReorderCat) return;
            e.dataTransfer.effectAllowed = 'move';
            onDragStartCat();
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="h-4 w-4 shrink-0 dash-muted" />
        </span>
        <button type="button" onClick={onToggleExpand} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-kado-red" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 dash-muted" />
          )}
          {editingCategoryId === cat.id ? (
            <input
              value={editingCategoryName}
              onChange={(e) => onSetEditingCategoryName(e.target.value)}
              className="min-w-[10rem] max-w-full rounded-lg border dash-border dash-input px-2 py-1 text-sm font-bold"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate font-display text-sm font-bold dash-heading">{cat.name}</span>
          )}
          <Badge variant="outline" className="shrink-0 text-[9px]">
            {catProducts.length}
          </Badge>
          {!cat.visible ? <Badge variant="muted">Hidden</Badge> : null}
        </button>
        <div className="ml-auto flex items-center gap-0.5">
          {editingCategoryId === cat.id ? (
            <>
              <button
                type="button"
                onClick={onCommitCategoryRename}
                className="rounded-lg p-2 text-kado-red hover:bg-kado-red/10"
                aria-label="Save category name"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCancelCategoryRename}
                className="rounded-lg p-2 dash-muted hover:bg-[var(--color-dash-hover)]"
                aria-label="Cancel rename"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onBeginCategoryRename}
              className="rounded-lg p-2 dash-muted hover:bg-[var(--color-dash-hover)] hover:text-kado-red"
              aria-label={`Rename ${cat.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCategoryVisible}
            className={`rounded-lg p-2 transition-colors ${
              cat.visible ? 'dash-muted hover:bg-[var(--color-dash-hover)]' : 'bg-amber-50 text-amber-800'
            }`}
            title={cat.visible ? 'Hide category from menu' : 'Show category on menu'}
            aria-label={cat.visible ? 'Hide category' : 'Show category'}
          >
            {cat.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDeleteCategory}
            className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${cat.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="space-y-2 border-t dash-border bg-[var(--color-dash-surface-alt)]/30 px-3 py-3 sm:px-4">
          {catProducts.map((p, pIndex) => (
            <Fragment key={p.id}>
              <AdminMenuProductRow
              product={p}
              category={cat}
              pastriesCategoryId={pastriesCategoryId}
              pIndex={pIndex}
              deletingProductId={deletingProductId}
              onDragStart={(e, idx) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                onSetDrag({ kind: 'prod', categoryId: cat.id, from: idx });
              }}
              onDragEnd={onDragEnd}
              onDrop={(e, idx) => {
                e.preventDefault();
                e.stopPropagation();
                if (drag?.kind === 'prod' && drag.categoryId === cat.id && drag.from !== idx) {
                  onReorderProducts(drag.from, idx);
                }
                onSetDrag(null);
              }}
              onToggleVisible={() => onToggleProductVisible(p.id, !p.visible)}
              onEdit={() => onEditProduct(p)}
              onDelete={() => void onDeleteProduct(p.id)}
            />
            </Fragment>
          ))}
          <button
            type="button"
            onClick={onAddProduct}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed dash-border py-2.5 text-[10px] font-bold uppercase tracking-wider dash-muted transition-colors hover:border-kado-red hover:text-kado-red"
          >
            <Plus className="h-4 w-4" /> {catIsPastry ? 'Add pastry' : 'Add product'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
