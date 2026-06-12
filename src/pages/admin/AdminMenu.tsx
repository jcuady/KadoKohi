import { useEffect, useMemo, useState, type FormEvent, type DragEvent } from 'react';
import { Upload, X } from 'lucide-react';
import type {
  MenuCategory,
  Product,
  MilkOption,
  ProductTemperature,
  ProductSize,
  ProductCustomField,
} from '../../types/domain';
import { useMenuStore } from '../../store/menuStore';
import { MENU_MILK_OPTIONS } from '../../data/menuCatalog';
import { formatPhp } from '../../lib/money';
import { newId } from '../../lib/id';
import { clampText } from '../../lib/validation';
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  describeMenuImageOnSave,
  inferMenuImageSource,
  isGoogleDriveUrl,
  MENU_PRODUCT_IMAGE_MAX_BYTES,
  previewUrlForMenuImageSource,
  resolveMenuImageSaveIntent,
  type MenuImageSource,
} from '../../lib/menuProductImage';
import MenuProductStockButton from '../../components/menu/MenuProductStockButton';
import { isProductInStock } from '../../lib/productStock';

type ProductFormData = {
  name: string;
  description: string;
  basePrice: string;
  image: string;
  temperature: ProductTemperature;
  visible: boolean;
  tags: string;
  milks: MilkOption[];
  sizes: ProductSize[];
  customFields: ProductCustomField[];
};

const emptyProductForm: ProductFormData = {
  name: '',
  description: '',
  basePrice: '',
  image: '',
  temperature: 'both',
  visible: true,
  tags: '',
  milks: MENU_MILK_OPTIONS,
  sizes: [],
  customFields: [],
};

export default function AdminMenu() {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const dataSource = useMenuStore((s) => s.dataSource);
  const hydrateError = useMenuStore((s) => s.hydrateError);
  const ensureCatalogInDatabase = useMenuStore((s) => s.ensureCatalogInDatabase);
  const addCategory = useMenuStore((s) => s.addCategory);
  const updateCategory = useMenuStore((s) => s.updateCategory);
  const removeCategory = useMenuStore((s) => s.removeCategory);
  const removeProduct = useMenuStore((s) => s.removeProduct);
  const reorderCategories = useMenuStore((s) => s.reorderCategories);
  const reorderProductsInCategory = useMenuStore((s) => s.reorderProductsInCategory);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    void useMenuStore.getState().hydrateFromRemote();
  }, []);

  useEffect(() => {
    if (!remoteLoaded || expandedCat) return;
    const first = sortedCategories[0]?.id;
    if (first) setExpandedCat(first);
  }, [remoteLoaded, sortedCategories, expandedCat]);

  type DragState =
    | null
    | { kind: 'cat'; from: number }
    | { kind: 'prod'; categoryId: string; from: number };
  const [drag, setDrag] = useState<DragState>(null);

  const onDragEnd = () => setDrag(null);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingToCat, setAddingToCat] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyProductForm);
  const [productFormError, setProductFormError] = useState('');
  const [imageSource, setImageSource] = useState<MenuImageSource>('none');
  const [originalImage, setOriginalImage] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadPreviewLabel, setUploadPreviewLabel] = useState<string>('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [initializingCatalog, setInitializingCatalog] = useState(false);
  const [initCatalogError, setInitCatalogError] = useState<string | null>(null);

  const handleInitializeCatalog = async () => {
    setInitCatalogError(null);
    setInitializingCatalog(true);
    try {
      await ensureCatalogInDatabase();
    } catch (err) {
      setInitCatalogError(err instanceof Error ? err.message : 'Could not initialize menu catalog.');
    } finally {
      setInitializingCatalog(false);
    }
  };

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p.id);
    setAddingToCat(null);
    setForm({
      name: p.name,
      description: p.description ?? '',
      basePrice: String(p.basePrice),
      image: p.image ?? '',
      temperature: p.temperature,
      visible: p.visible,
      tags: (p.tags ?? []).join(', '),
      milks: p.milks ?? [],
      sizes: p.sizes ?? [],
      customFields: p.customFields ?? [],
    });
    clearPendingImageFile();
    setOriginalImage(p.image ?? '');
    setImageSource(inferMenuImageSource(p.image));
  };

  const startAddProduct = (catId: string) => {
    setAddingToCat(catId);
    setEditingProduct(null);
    setForm(emptyProductForm);
    clearPendingImageFile();
    setOriginalImage('');
    setImageSource('none');
  };

  const cancelForm = () => {
    setEditingProduct(null);
    setAddingToCat(null);
    setForm(emptyProductForm);
    clearPendingImageFile();
    setOriginalImage('');
    setImageSource('none');
    setSavingProduct(false);
  };

  const clearPendingImageFile = () => {
    if (uploadPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(uploadPreviewUrl);
    setPendingImageFile(null);
    setUploadPreviewUrl(null);
    setUploadPreviewLabel('');
  };

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(uploadPreviewUrl);
    };
  }, [uploadPreviewUrl]);

  const addMilkRow = () => {
    setForm((f) => ({
      ...f,
      milks: [...f.milks, { id: newId(), label: '', priceDelta: 0 }],
    }));
  };

  const updateMilk = (idx: number, patch: Partial<MilkOption>) => {
    setForm((f) => ({
      ...f,
      milks: f.milks.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  };

  const removeMilk = (idx: number) => {
    setForm((f) => ({
      ...f,
      milks: f.milks.filter((_, i) => i !== idx),
    }));
  };

  const addSizeRow = () => {
    setForm((f) => ({
      ...f,
      sizes: [...f.sizes, { id: newId(), label: '', priceDelta: 0 }],
    }));
  };

  const updateSize = (idx: number, patch: Partial<ProductSize>) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((item, index) => (index === idx ? { ...item, ...patch } : item)),
    }));
  };

  const removeSize = (idx: number) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((_, index) => index !== idx),
    }));
  };

  const addCustomFieldRow = () => {
    setForm((f) => ({
      ...f,
      customFields: [
        ...f.customFields,
        {
          id: newId(),
          key: '',
          label: '',
          value: '',
        },
      ],
    }));
  };

  const updateCustomField = (idx: number, patch: Partial<ProductCustomField>) => {
    setForm((f) => ({
      ...f,
      customFields: f.customFields.map((item, index) => (index === idx ? { ...item, ...patch } : item)),
    }));
  };

  const removeCustomField = (idx: number) => {
    setForm((f) => ({
      ...f,
      customFields: f.customFields.filter((_, index) => index !== idx),
    }));
  };

  const handleImageFilePick = (file: File | null) => {
    if (!file) return;
    setProductFormError('');
    if (!file.type.startsWith('image/')) {
      setProductFormError('Please choose an image file (PNG, JPG, WebP, etc.).');
      return;
    }
    if (file.size > MENU_PRODUCT_IMAGE_MAX_BYTES) {
      setProductFormError(
        `Image is too large (${Math.round(file.size / 1024)} KB). Max ${Math.round(MENU_PRODUCT_IMAGE_MAX_BYTES / 1024)} KB.`,
      );
      return;
    }
    if (uploadPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(uploadPreviewUrl);
    setPendingImageFile(file);
    setUploadPreviewLabel(file.name);
    setUploadPreviewUrl(URL.createObjectURL(file));
    setImageSource('upload');
  };

  const beginCategoryRename = (category: MenuCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const commitCategoryRename = () => {
    if (!editingCategoryId) return;
    const next = editingCategoryName.trim();
    if (next) updateCategory(editingCategoryId, { name: next });
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const activeCategoryCount = useMemo(() => categories.filter((cat) => cat.visible).length, [categories]);

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    if (!form.name.trim()) {
      setProductFormError('Product name is required.');
      return;
    }
    const basePrice = Number(form.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setProductFormError('Enter a valid price (0 or greater).');
      return;
    }

    const productId = editingProduct ?? newId();
    const imageIntentInput = {
      source: imageSource,
      urlInput: form.image,
      hasPendingFile: Boolean(pendingImageFile),
      existingImage: originalImage,
      isEditing: Boolean(editingProduct),
    };
    const intent = resolveMenuImageSaveIntent(imageIntentInput);

    if (intent.ok === false) {
      setProductFormError(intent.error);
      return;
    }

    let image: string | undefined;

    const now = new Date().toISOString();
    const sharedFields = {
      name: clampText(form.name, 120),
      description: clampText(form.description, 500) || undefined,
      basePrice,
      temperature: form.temperature,
      visible: form.visible,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      milks: form.milks.filter((m) => m.label.trim()),
      sizes: form.sizes.filter((s) => s.label.trim()),
      customFields: form.customFields.filter((field) => field.label.trim() && field.key.trim() && field.value.trim()),
    };

    let saved: Product;
    if (editingProduct) {
      const prev = products.find((p) => p.id === editingProduct);
      if (!prev) {
        setProductFormError('Product not found. Refresh and try again.');
        return;
      }
      saved = { ...prev, ...sharedFields, updatedAt: now };
    } else if (addingToCat) {
      saved = {
        id: productId,
        categoryId: addingToCat,
        branchId: null,
        ...sharedFields,
        order: products.filter((p) => p.categoryId === addingToCat).length,
        inStock: true,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      return;
    }

    try {
      setSavingProduct(true);
      switch (intent.action) {
        case 'clear':
          image = undefined;
          break;
        case 'use_url':
          image = intent.url;
          break;
        case 'keep_existing':
          image = intent.url;
          break;
        case 'needs_upload':
          if (!pendingImageFile) {
            setProductFormError('Choose an image file to upload.');
            return;
          }
          image = await orderingRepo.uploadMenuProductImage(pendingImageFile, productId);
          break;
      }

      saved = { ...saved, ...sharedFields, image, updatedAt: new Date().toISOString() };

      await orderingRepo.upsertProduct(saved);
      useMenuStore.setState((s) => ({
        products: editingProduct
          ? s.products.map((p) => (p.id === saved.id ? saved : p))
          : [...s.products, saved],
        hydrateError: null,
      }));
      cancelForm();
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const imageIntentInput = {
    source: imageSource,
    urlInput: form.image,
    hasPendingFile: Boolean(pendingImageFile),
    existingImage: originalImage,
    isEditing: Boolean(editingProduct),
  };
  const pendingImageIntent = resolveMenuImageSaveIntent(imageIntentInput);
  const saveSummary =
    pendingImageIntent.ok === false ? pendingImageIntent.error : describeMenuImageOnSave(imageIntentInput);
  const saveSummaryIsError = pendingImageIntent.ok === false;
  const hasStoredUpload =
    imageSource === 'upload' && !pendingImageFile && Boolean(originalImage.trim()) && pendingImageIntent.ok && pendingImageIntent.action === 'keep_existing';
  const activePreviewSrc = previewUrlForMenuImageSource(
    imageSource,
    form.image,
    originalImage,
    uploadPreviewUrl,
  );

  if (!remoteLoaded) {
    return (
      <div className="max-w-4xl dash-page">
        <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Menu Manager</h1>
        <p className="dash-muted text-sm">Loading menu from database…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Menu Manager</h1>
      <p className="dash-muted mb-2">
        {categories.length} categories ({activeCategoryCount} visible) · {products.length} products
        {dataSource === 'remote' ? ' · synced from Supabase' : ' · offline catalog fallback'}
      </p>
      <p className="text-[10px] dash-muted mb-4">
        KADO MENU V2 — edit here or on the public Menu page after changes save to the database.
      </p>

      {(hydrateError || initCatalogError) && (
        <div
          className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="alert"
        >
          {initCatalogError ?? hydrateError}
        </div>
      )}

      {categories.length === 0 && (
        <div className="mb-6 rounded-xl border border-dashed border-kado-red/30 bg-kado-cream/50 px-4 py-4">
          <p className="text-sm dash-muted mb-3">
            No coffee categories in this Supabase project yet. Initialize the flyer catalog (4 categories, 19 drinks) or
            add your own below.
          </p>
          <button
            type="button"
            disabled={initializingCatalog}
            onClick={() => void handleInitializeCatalog()}
            className="rounded-xl bg-kado-red text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {initializingCatalog ? 'Initializing…' : 'Initialize KADO MENU V2'}
          </button>
        </div>
      )}

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
                  {editingCategoryId === cat.id ? (
                    <input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="rounded-lg dash-input border px-2 py-1 text-sm font-bold min-w-[160px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-display font-bold text-kado-dark dash-heading truncate">{cat.name}</span>
                  )}
                  <span className="text-xs dash-muted shrink-0">{catProducts.length} items</span>
                </button>
                {editingCategoryId === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={commitCategoryRename}
                      className="text-kado-red hover:text-kado-dark p-1"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryName('');
                      }}
                      className="dash-muted hover:text-kado-dark p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => beginCategoryRename(cat)}
                    className="dash-muted hover:text-kado-red p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
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
                          {!isProductInStock(p) && (
                            <span className="text-[9px] uppercase tracking-widest font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Out of stock
                            </span>
                          )}
                        </div>
                        <div className="text-xs dash-muted mt-0.5 flex gap-2">
                          <span>{formatPhp(p.basePrice)}</span>
                          <span>{p.temperature}</span>
                  {p.sizes?.length > 0 && <span>{p.sizes.length} size(s)</span>}
                          {p.milks?.length > 0 && <span>{p.milks.length} milk(s)</span>}
                  {p.customFields?.length > 0 && <span>{p.customFields.length} custom group(s)</span>}
                          {p.tags?.length ? <span>{p.tags.join(', ')}</span> : null}
                        </div>
                      </div>
                      <MenuProductStockButton product={p} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={submitProduct}
            className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display font-bold text-xl dash-heading mb-4">
              {editingProduct ? 'Edit product' : 'Add product'}
            </h2>
            {productFormError && (
              <p className="mb-3 text-xs text-red-600 font-medium">{productFormError}</p>
            )}

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
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Temperature</label>
                  <select
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value as ProductTemperature }))}
                    className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  >
                    <option value="both">Hot & Iced</option>
                    <option value="hot">Hot only</option>
                    <option value="iced">Iced only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border dash-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider dash-muted">Product image</p>
                <p className="text-xs dash-muted leading-relaxed">
                  Choose how this drink&apos;s photo is stored. Only the selected source is saved — switch tabs before
                  saving if you change your mind.
                </p>

                <Tabs
                  value={imageSource}
                  onValueChange={(value) => {
                    if (value === 'none' || value === 'url' || value === 'upload') setImageSource(value);
                  }}
                >
                  <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
                    <TabsTrigger value="none" className="min-h-[36px] flex-1 px-2 text-[9px] sm:text-[10px]">
                      No image
                    </TabsTrigger>
                    <TabsTrigger value="url" className="min-h-[36px] flex-1 px-2 text-[9px] sm:text-[10px]">
                      Image link
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="min-h-[36px] flex-1 px-2 text-[9px] sm:text-[10px]">
                      Upload file
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <p
                  className={[
                    'rounded-lg border px-3 py-2 text-xs leading-relaxed',
                    saveSummaryIsError
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                      : 'border-kado-red/20 bg-kado-red/5 text-kado-dark dark:text-kado-cream',
                  ].join(' ')}
                  role="status"
                >
                  <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                    Will display on menu
                  </span>
                  {saveSummary}
                </p>

                {imageSource === 'none' ? (
                  <p className="text-xs dash-muted leading-relaxed">
                    No custom image — the public menu uses the category fallback until you add a link or upload.
                  </p>
                ) : null}

                {imageSource === 'url' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                      Image URL
                    </label>
                    <input
                      value={form.image}
                      onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                      placeholder="https://… or /public/path.jpg"
                      disabled={savingProduct}
                      className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
                    />
                    {form.image.trim() && isGoogleDriveUrl(form.image) ? (
                      <p className="mt-1.5 text-[11px] dash-muted leading-relaxed">
                        Google Drive link — converted on save. File must be shared as{' '}
                        <span className="font-semibold">Anyone with the link</span>, or use Upload file instead.
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] font-semibold text-kado-red">
                      Saving uses this URL only (uploaded files are ignored while Image link is selected).
                    </p>
                  </div>
                ) : null}

                {imageSource === 'upload' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                      Upload image
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark/5">
                        <Upload className="h-4 w-4 shrink-0" aria-hidden />
                        Choose file
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
                          disabled={savingProduct}
                          className="hidden"
                          onChange={(e) => {
                            handleImageFilePick(e.target.files?.[0] ?? null);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {pendingImageFile ? (
                        <button
                          type="button"
                          onClick={clearPendingImageFile}
                          disabled={savingProduct}
                          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-red-300/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                          Clear new file
                        </button>
                      ) : null}
                    </div>
                    {uploadPreviewLabel ? (
                      <p className="mt-1.5 text-[11px] dash-muted truncate">New file: {uploadPreviewLabel}</p>
                    ) : hasStoredUpload ? (
                      <p className="mt-1.5 text-[11px] dash-muted">Keeping current uploaded image unless you pick a new file.</p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] font-semibold text-kado-red">
                      Saving uploads to Kado storage (external URLs are ignored while Upload file is selected).
                    </p>
                  </div>
                ) : null}

                {activePreviewSrc ? (
                  <MenuImagePreview
                    src={activePreviewSrc}
                    label={
                      imageSource === 'upload'
                        ? pendingImageFile
                          ? 'Upload preview (will be saved)'
                          : 'Current uploaded image (will be kept)'
                        : 'URL preview (will be saved)'
                    }
                    emphasize={imageSource === 'upload'}
                  />
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="bestseller, new, iced-only"
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
                Visible on menu
              </label>

              {/* Milk modifiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider dash-muted">Milk options</label>
                  <button
                    type="button"
                    onClick={addMilkRow}
                    className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {form.milks.length === 0 && (
                  <p className="text-xs dash-muted">No milk modifiers. Add if this drink supports alternatives.</p>
                )}
                <div className="space-y-2">
                  {form.milks.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input
                        value={m.label}
                        onChange={(e) => updateMilk(i, { label: e.target.value })}
                        placeholder="e.g. Oat"
                        className="flex-1 rounded-lg dash-input border px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        value={m.priceDelta}
                        onChange={(e) => updateMilk(i, { priceDelta: Number(e.target.value) })}
                        className="w-20 rounded-lg dash-input border px-3 py-2 text-xs"
                        placeholder="+₱"
                      />
                      <button type="button" onClick={() => removeMilk(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider dash-muted">Size options</label>
                  <button
                    type="button"
                    onClick={addSizeRow}
                    className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {form.sizes.length === 0 && (
                  <p className="text-xs dash-muted">No size modifiers. Add sizes (e.g., Small, Large) if needed.</p>
                )}
                <div className="space-y-2">
                  {form.sizes.map((size, index) => (
                    <div key={size.id} className="flex items-center gap-2">
                      <input
                        value={size.label}
                        onChange={(e) => updateSize(index, { label: e.target.value })}
                        placeholder="e.g. Large"
                        className="flex-1 rounded-lg dash-input border px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        value={size.priceDelta}
                        onChange={(e) => updateSize(index, { priceDelta: Number(e.target.value) })}
                        className="w-20 rounded-lg dash-input border px-3 py-2 text-xs"
                        placeholder="+₱"
                      />
                      <button type="button" onClick={() => removeSize(index)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider dash-muted">Custom option groups</label>
                  <button
                    type="button"
                    onClick={addCustomFieldRow}
                    className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {form.customFields.length === 0 && (
                  <p className="text-xs dash-muted">Add option groups beyond milk (example: sweetness, roast profile).</p>
                )}
                <div className="space-y-2">
                  {form.customFields.map((field, index) => (
                    <div key={field.id} className="rounded-xl border dash-border p-2.5 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={field.label}
                          onChange={(e) => updateCustomField(index, { label: e.target.value })}
                          placeholder="Group label (e.g. Sweetness)"
                          className="rounded-lg dash-input border px-3 py-2 text-xs"
                        />
                        <input
                          value={field.key}
                          onChange={(e) => updateCustomField(index, { key: e.target.value })}
                          placeholder="key (e.g. sweetness)"
                          className="rounded-lg dash-input border px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={field.value}
                          onChange={(e) => updateCustomField(index, { value: e.target.value })}
                          placeholder="Options: None|0, Less|0, Extra|30"
                          className="flex-1 rounded-lg dash-input border px-3 py-2 text-xs"
                        />
                        <button type="button" onClick={() => removeCustomField(index)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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

function MenuImagePreview({
  src,
  label,
  emphasize = false,
}: {
  src: string;
  label: string;
  emphasize?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={[
        'rounded-xl border p-2.5',
        emphasize ? 'border-kado-red/30 bg-kado-red/5' : 'dash-border',
      ].join(' ')}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider dash-muted">{label}</p>
      {failed ? (
        <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
          Could not load this preview. Use a direct image link (https://…jpg) or upload a file. Google Drive files must
          be shared as &quot;Anyone with the link&quot;.
        </p>
      ) : (
        <img
          src={src}
          alt=""
          className="h-32 w-full rounded-lg border dash-border object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
