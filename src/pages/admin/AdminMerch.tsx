import { useEffect, useState, type FormEvent, type DragEvent } from 'react';
import type { MerchCategory, MerchProduct, MerchVariantGroup, MerchVariantOption } from '../../types/domain';
import { useMerchStore } from '../../store/merchStore';
import { formatPhp } from '../../lib/money';
import { newId } from '../../lib/id';
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

type ProductFormData = {
  name: string;
  description: string;
  basePrice: string;
  image: string;
  visible: boolean;
  tags: string;
  variants: MerchVariantGroup[];
};

const emptyProductForm: ProductFormData = {
  name: '',
  description: '',
  basePrice: '',
  image: '',
  visible: true,
  tags: '',
  variants: [],
};

export default function AdminMerch() {
  const categories = useMerchStore((s) => s.categories);
  const products = useMerchStore((s) => s.products);
  const remoteLoaded = useMerchStore((s) => s.remoteLoaded);
  const hydrateFromRemote = useMerchStore((s) => s.hydrateFromRemote);
  const addCategory = useMerchStore((s) => s.addCategory);
  const updateCategory = useMerchStore((s) => s.updateCategory);
  const removeCategory = useMerchStore((s) => s.removeCategory);
  const addProduct = useMerchStore((s) => s.addProduct);
  const updateProduct = useMerchStore((s) => s.updateProduct);
  const removeProduct = useMerchStore((s) => s.removeProduct);
  const reorderCategories = useMerchStore((s) => s.reorderCategories);
  const reorderProductsInCategory = useMerchStore((s) => s.reorderProductsInCategory);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  type DragState =
    | null
    | { kind: 'cat'; from: number }
    | { kind: 'prod'; categoryId: string; from: number };
  const [drag, setDrag] = useState<DragState>(null);

  const onDragEnd = () => setDrag(null);

  const [expandedCat, setExpandedCat] = useState<string | null>(sortedCategories[0]?.id ?? null);
  const [newCatName, setNewCatName] = useState('');

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingToCat, setAddingToCat] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyProductForm);
  const [saveError, setSaveError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaveError('');
    try {
      await addCategory(newCatName.trim());
      setNewCatName('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not add category.');
    }
  };

  const startEditProduct = (p: MerchProduct) => {
    setEditingProduct(p.id);
    setAddingToCat(null);
    setForm({
      name: p.name,
      description: p.description ?? '',
      basePrice: String(p.basePrice),
      image: p.image ?? '',
      visible: p.visible,
      tags: (p.tags ?? []).join(', '),
      variants: p.variants ?? [],
    });
  };

  const startAddProduct = (catId: string) => {
    setAddingToCat(catId);
    setEditingProduct(null);
    setForm(emptyProductForm);
  };

  const cancelForm = () => {
    setEditingProduct(null);
    setAddingToCat(null);
    setForm(emptyProductForm);
  };

  /* ── Variant group helpers ── */

  const addVariantGroup = () => {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { id: newId(), name: '', required: false, options: [] },
      ],
    }));
  };

  const updateVariantGroup = (idx: number, patch: Partial<MerchVariantGroup>) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((g, i) => (i === idx ? { ...g, ...patch } : g)),
    }));
  };

  const removeVariantGroup = (idx: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== idx),
    }));
  };

  const addVariantOption = (groupIdx: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((g, i) =>
        i === groupIdx
          ? { ...g, options: [...g.options, { id: newId(), label: '', priceDelta: 0 }] }
          : g,
      ),
    }));
  };

  const updateVariantOption = (groupIdx: number, optIdx: number, patch: Partial<MerchVariantOption>) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((g, gi) =>
        gi === groupIdx
          ? { ...g, options: g.options.map((o, oi) => (oi === optIdx ? { ...o, ...patch } : o)) }
          : g,
      ),
    }));
  };

  const removeVariantOption = (groupIdx: number, optIdx: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((g, gi) =>
        gi === groupIdx
          ? { ...g, options: g.options.filter((_, oi) => oi !== optIdx) }
          : g,
      ),
    }));
  };

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.basePrice) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      basePrice: Number(form.basePrice),
      image: form.image.trim() || undefined,
      visible: form.visible,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      variants: form.variants
        .filter((g) => g.name.trim())
        .map((g) => ({ ...g, options: g.options.filter((o) => o.label.trim()) })),
    };

    setSavingProduct(true);
    setSaveError('');
    try {
      if (editingProduct) {
        await updateProduct(editingProduct, payload);
      } else if (addingToCat) {
        await addProduct({
          ...payload,
          categoryId: addingToCat,
          order: products.filter((p) => p.categoryId === addingToCat).length,
        });
      }
      cancelForm();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="max-w-4xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Merch Manager</h1>
      <p className="dash-muted mb-2">
        Categories and products sync to Supabase — changes appear on the public merch store.
      </p>
      {!remoteLoaded ? (
        <p className="text-xs dash-muted mb-4">Loading catalog from database…</p>
      ) : null}
      {saveError ? (
        <p className="text-sm text-red-600 font-medium mb-4" role="alert">
          {saveError}
        </p>
      ) : null}
      <p className="dash-muted mb-6">
        {categories.length} categories · {products.length} products
      </p>

      {/* Add category */}
      <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="New category name…"
          className="flex-1 rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
        />
        <button
          type="submit"
          className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Category
        </button>
      </form>

      {/* Category accordion */}
      <p className="text-xs dash-muted mb-4">Drag categories or products (grip) to reorder display order.</p>

      <div className="space-y-3">
        {sortedCategories.map((cat, catIndex) => {
          const catProducts = products
            .filter((p) => p.categoryId === cat.id)
            .sort((a, b) => a.order - b.order);
          const isExpanded = expandedCat === cat.id;

          const onCatDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          };
          const onCatDrop = (e: DragEvent) => {
            e.preventDefault();
            if (drag?.kind === 'cat' && drag.from !== catIndex) reorderCategories(drag.from, catIndex);
            setDrag(null);
          };

          return (
            <div
              key={cat.id}
              className="rounded-2xl dash-card border overflow-hidden"
              onDragOver={onCatDragOver}
              onDrop={onCatDrop}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 px-5 py-4">
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Drag to reorder category ${cat.name}`}
                  className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded hover:bg-kado-cream/80"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDrag({ kind: 'cat', from: catIndex });
                  }}
                  onDragEnd={onDragEnd}
                >
                  <GripVertical className="w-4 h-4 dash-muted shrink-0" />
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-display font-bold text-kado-dark dash-heading truncate">{cat.name}</span>
                  <span className="text-xs dash-muted shrink-0">{catProducts.length} items</span>
                </button>
                <label className="flex items-center gap-1.5 text-xs dash-muted shrink-0">
                  <input
                    type="checkbox"
                    checked={cat.visible}
                    onChange={(e) => updateCategory(cat.id, { visible: e.target.checked })}
                    className="rounded"
                  />
                  Visible
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${cat.name}" and all its products?`)) removeCategory(cat.id);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded product list */}
              {isExpanded && (
                <div className="border-t dash-border px-5 py-4 space-y-2">
                  {catProducts.map((p, pIndex) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl dash-card-alt border dash-border px-4 py-3"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (drag?.kind === 'prod' && drag.categoryId === cat.id && drag.from !== pIndex) {
                          reorderProductsInCategory(cat.id, drag.from, pIndex);
                        }
                        setDrag(null);
                      }}
                    >
                      <span
                        className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded hover:bg-white shrink-0"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.effectAllowed = 'move';
                          setDrag({ kind: 'prod', categoryId: cat.id, from: pIndex });
                        }}
                        onDragEnd={onDragEnd}
                        aria-label={`Drag to reorder ${p.name}`}
                      >
                        <GripVertical className="w-4 h-4 dash-muted" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-kado-dark dash-heading truncate">{p.name}</span>
                          {!p.visible && (
                            <span className="text-[9px] uppercase tracking-widest font-bold dash-muted dash-card-alt px-2 py-0.5 rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-xs dash-muted mt-0.5 flex gap-2">
                          <span>{formatPhp(p.basePrice)}</span>
                          {p.variants?.length > 0 && <span>{p.variants.length} variant group(s)</span>}
                          {p.tags?.length ? <span>{p.tags.join(', ')}</span> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditProduct(p)}
                        className="dash-muted hover:text-kado-red p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => startAddProduct(cat.id)}
                    className="w-full rounded-xl border-2 border-dashed dash-border py-3 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red hover:text-kado-red transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add product
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Product form modal */}
      {(editingProduct || addingToCat) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kado-dark/55 backdrop-blur-[3px] px-4">
          <form
            onSubmit={submitProduct}
            className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 shadow-[0_30px_60px_rgba(158,24,29,0.12)] max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display font-bold text-xl dash-heading mb-4">
              {editingProduct ? 'Edit product' : 'Add product'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Base price (₱)</label>
                  <input
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                    className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Image URL</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://…"
                    className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="bestseller, new, limited"
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>

              <label className="flex items-center gap-2 text-sm dash-muted">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                  className="rounded"
                />
                Visible on store
              </label>

              {/* Variant groups */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider dash-muted">Variant groups</label>
                  <button
                    type="button"
                    onClick={addVariantGroup}
                    className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add variant group
                  </button>
                </div>
                {form.variants.length === 0 && (
                  <p className="text-xs dash-muted">No variant groups. Add if this product has size, color, etc.</p>
                )}
                <div className="space-y-4">
                  {form.variants.map((group, gi) => (
                    <div key={group.id} className="rounded-xl border dash-border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={group.name}
                          onChange={(e) => updateVariantGroup(gi, { name: e.target.value })}
                          placeholder="Group name (e.g. Size, Color)"
                          className="flex-1 rounded-lg dash-input border px-3 py-2 text-xs"
                        />
                        <label className="flex items-center gap-1 text-[10px] dash-muted whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) => updateVariantGroup(gi, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => removeVariantGroup(gi)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Options inside group */}
                      <div className="space-y-1.5 pl-2">
                        {group.options.map((opt, oi) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              value={opt.label}
                              onChange={(e) => updateVariantOption(gi, oi, { label: e.target.value })}
                              placeholder="Label (e.g. Large)"
                              className="flex-1 rounded-lg dash-input border px-3 py-2 text-xs"
                            />
                            <input
                              type="number"
                              value={opt.priceDelta}
                              onChange={(e) => updateVariantOption(gi, oi, { priceDelta: Number(e.target.value) })}
                              className="w-20 rounded-lg dash-input border px-3 py-2 text-xs"
                              placeholder="+₱"
                            />
                            <input
                              type="number"
                              value={opt.stock ?? ''}
                              onChange={(e) =>
                                updateVariantOption(gi, oi, {
                                  stock: e.target.value === '' ? undefined : Number(e.target.value),
                                })
                              }
                              className="w-20 rounded-lg dash-input border px-3 py-2 text-xs"
                              placeholder="Stock"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantOption(gi, oi)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addVariantOption(gi)}
                        className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline flex items-center gap-0.5 pl-2"
                      >
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60"
              >
                {savingProduct ? 'Saving…' : editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
