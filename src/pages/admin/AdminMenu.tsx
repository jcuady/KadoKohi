import { useEffect, useMemo, useState, type FormEvent, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, X, Croissant, Coffee } from 'lucide-react';
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
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Check, Eye, EyeOff } from 'lucide-react';
import { orderingRepo, formatMenuProductCrudError } from '../../lib/supabase/repositories/ordering';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  describeMenuImageOnSave,
  inferMenuImageSource,
  isGoogleDriveUrl,
  MENU_PRODUCT_IMAGE_MAX_LABEL,
  prepareMenuProductImage,
  previewUrlForMenuImageSource,
  resolveMenuImageSaveIntent,
  type MenuImageSource,
} from '../../lib/menuProductImage';
import MenuProductStockButton from '../../components/menu/MenuProductStockButton';
import { isProductInStock } from '../../lib/productStock';
import {
  findPastriesCategory,
  isPastriesCategory,
  isPastriesCategoryId,
  pastryHasPrice,
  PASTRIES_CATEGORY_NAME,
} from '../../lib/pastriesCategory';

type MenuManagerTab = 'coffee' | 'pastries';

type ProductFormData = {
  name: string;
  description: string;
  basePrice: string;
  image: string;
  temperature: ProductTemperature;
  visible: boolean;
  inStock: boolean;
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
  inStock: true,
  tags: '',
  milks: MENU_MILK_OPTIONS,
  sizes: [],
  customFields: [],
};

const pastryProductForm: ProductFormData = {
  name: '',
  description: '',
  basePrice: '',
  image: '',
  temperature: 'both',
  visible: true,
  inStock: true,
  tags: '',
  milks: [],
  sizes: [],
  customFields: [],
};

export default function AdminMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const menuTab: MenuManagerTab = searchParams.get('tab') === 'pastries' ? 'pastries' : 'coffee';
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const dataSource = useMenuStore((s) => s.dataSource);
  const hydrateError = useMenuStore((s) => s.hydrateError);
  const ensureCatalogInDatabase = useMenuStore((s) => s.ensureCatalogInDatabase);
  const addCategory = useMenuStore((s) => s.addCategory);
  const updateCategory = useMenuStore((s) => s.updateCategory);
  const updateProduct = useMenuStore((s) => s.updateProduct);
  const removeCategory = useMenuStore((s) => s.removeCategory);
  const removeProduct = useMenuStore((s) => s.removeProduct);
  const reorderCategories = useMenuStore((s) => s.reorderCategories);
  const reorderProductsInCategory = useMenuStore((s) => s.reorderProductsInCategory);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const visibleCategories = useMemo(() => {
    if (menuTab === 'pastries') {
      return pastriesCategory ? [pastriesCategory] : [];
    }
    return sortedCategories.filter((c) => !isPastriesCategory(c));
  }, [menuTab, sortedCategories, pastriesCategory]);

  const setMenuTab = (tab: MenuManagerTab) => {
    if (tab === 'pastries') {
      setSearchParams({ tab: 'pastries' }, { replace: true });
      if (pastriesCategory) setExpandedCat(pastriesCategory.id);
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    void useMenuStore.getState().hydrateFromRemote();
  }, []);

  useEffect(() => {
    if (!remoteLoaded) return;
    if (menuTab === 'pastries' && pastriesCategory) {
      setExpandedCat(pastriesCategory.id);
      return;
    }
    if (!expandedCat && sortedCategories[0]) {
      const firstCoffee = sortedCategories.find((c) => !isPastriesCategory(c));
      if (firstCoffee) setExpandedCat(firstCoffee.id);
    }
  }, [remoteLoaded, menuTab, pastriesCategory, sortedCategories, expandedCat]);

  type DragState =
    | null
    | { kind: 'cat'; from: number }
    | { kind: 'prod'; categoryId: string; from: number };
  const [drag, setDrag] = useState<DragState>(null);

  const onDragEnd = () => setDrag(null);
  const [newCatName, setNewCatName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState('');
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
  const [preparingImage, setPreparingImage] = useState(false);
  const [initializingCatalog, setInitializingCatalog] = useState(false);
  const [initCatalogError, setInitCatalogError] = useState<string | null>(null);
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    await createCategoryByName(name);
  };

  const createCategoryByName = async (name: string) => {
    setAddingCategory(true);
    setAddCategoryError('');
    try {
      const created = await addCategory(name);
      setNewCatName('');
      setExpandedCat(created.id);
      return created;
    } catch (err) {
      setAddCategoryError(err instanceof Error ? err.message : 'Could not add category.');
      return null;
    } finally {
      setAddingCategory(false);
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p.id);
    setAddingToCat(null);
    setProductFormError('');
    setForm({
      name: p.name,
      description: p.description ?? '',
      basePrice:
        isPastriesCategoryId(categories, p.categoryId) && !pastryHasPrice(p)
          ? ''
          : String(p.basePrice),
      image: p.image ?? '',
      temperature: p.temperature,
      visible: p.visible,
      inStock: p.inStock !== false,
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
    setProductFormError('');
    setForm(isPastriesCategoryId(categories, catId) ? pastryProductForm : emptyProductForm);
    clearPendingImageFile();
    setOriginalImage('');
    setImageSource('none');
  };

  const cancelForm = () => {
    setEditingProduct(null);
    setAddingToCat(null);
    setForm(emptyProductForm);
    setProductFormError('');
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

  const handleImageFilePick = async (file: File | null) => {
    if (!file) return;
    setProductFormError('');
    setPreparingImage(true);
    try {
      const prepared = await prepareMenuProductImage(file);
      if (prepared.ok === false) {
        setProductFormError(prepared.error);
        return;
      }
      if (uploadPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(uploadPreviewUrl);
      setPendingImageFile(prepared.file);
      setUploadPreviewLabel(prepared.file.name);
      setUploadPreviewUrl(URL.createObjectURL(prepared.file));
      setImageSource('upload');
    } finally {
      setPreparingImage(false);
    }
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
  const hiddenProductCount = useMemo(() => products.filter((p) => !p.visible).length, [products]);

  const handleDeleteProduct = async (id: string) => {
    if (deleteConfirmProductId !== id) {
      setDeleteConfirmProductId(id);
      return;
    }
    setDeletingProductId(id);
    try {
      await removeProduct(id);
      setDeleteConfirmProductId(null);
      if (editingProduct === id) cancelForm();
    } catch (err) {
      useMenuStore.setState({
        hydrateError: formatMenuProductCrudError(err, 'delete'),
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    if (!form.name.trim()) {
      setProductFormError('Product name is required.');
      return;
    }

    const categoryId = editingProduct
      ? products.find((p) => p.id === editingProduct)?.categoryId
      : addingToCat;
    const isPastryForm = isPastriesCategoryId(categories, categoryId);

    const priceInput = form.basePrice.trim();
    const basePrice =
      priceInput === '' ? 0 : Number(priceInput);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setProductFormError('Enter a valid price (0 or greater), or leave blank.');
      return;
    }
    if (!isPastryForm && priceInput === '') {
      setProductFormError('Enter a price for this drink.');
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
      temperature: isPastryForm ? ('both' as const) : form.temperature,
      visible: form.visible,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      milks: form.milks.filter((m) => m.label.trim()),
      sizes: form.sizes.filter((s) => s.label.trim()),
      customFields: form.customFields.filter(
        (field) => field.label.trim() && field.key.trim() && field.value.trim(),
      ),
    };

    let saved: Product;
    if (editingProduct) {
      const prev = products.find((p) => p.id === editingProduct);
      if (!prev) {
        setProductFormError('Product not found. Refresh and try again.');
        return;
      }
      saved = {
        ...prev,
        ...sharedFields,
        inStock: isPastryForm ? form.inStock : prev.inStock,
        updatedAt: now,
      };
    } else if (addingToCat) {
      saved = {
        id: productId,
        categoryId: addingToCat,
        branchId: null,
        ...sharedFields,
        order: products.filter((p) => p.categoryId === addingToCat).length,
        inStock: isPastryForm ? form.inStock : true,
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
      setProductFormError(formatMenuProductCrudError(err, 'save'));
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

  const activeFormCategoryId = editingProduct
    ? products.find((p) => p.id === editingProduct)?.categoryId
    : addingToCat;
  const isPastryForm = isPastriesCategoryId(categories, activeFormCategoryId);
  const pastryItemCount = pastriesCategory
    ? products.filter((p) => p.categoryId === pastriesCategory.id).length
    : 0;
  const coffeeCategoryCount = sortedCategories.filter((c) => !isPastriesCategory(c)).length;

  if (!remoteLoaded) {
    return (
      <div className="max-w-5xl dash-page pb-16">
        <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">Admin · Operations</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Menu Manager</h1>
        <p className="dash-muted text-sm">Loading menu from database…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl dash-page space-y-6 pb-16">
      <div>
        <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">Admin · Operations</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Menu Manager</h1>
        <p className="dash-muted text-sm mt-1 max-w-2xl">
          {categories.length} categories ({activeCategoryCount} visible) · {products.length} products
          {hiddenProductCount > 0 ? ` · ${hiddenProductCount} hidden` : ''}
        </p>
        {dataSource === 'remote' ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Synced with Supabase
          </p>
        ) : (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Offline catalog fallback
          </p>
        )}
      </div>

      <Tabs value={menuTab} onValueChange={(v) => setMenuTab(v as MenuManagerTab)} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap gap-1 p-1 sm:w-auto">
          <TabsTrigger value="coffee" className="min-h-[40px] flex-1 gap-2 sm:flex-none sm:px-5">
            <Coffee className="w-4 h-4" />
            Coffee &amp; drinks
          </TabsTrigger>
          <TabsTrigger value="pastries" className="min-h-[40px] flex-1 gap-2 sm:flex-none sm:px-5">
            <Croissant className="w-4 h-4" />
            Pastries
          </TabsTrigger>
        </TabsList>

        <p className="text-sm dash-muted -mt-2">
          {menuTab === 'pastries' ? (
            pastriesCategory
              ? `${pastryItemCount} item${pastryItemCount === 1 ? '' : 's'} on /pastries and the public menu`
              : `Create a "${PASTRIES_CATEGORY_NAME}" category to manage pastries here.`
          ) : (
            <>
              {coffeeCategoryCount} drink categor{coffeeCategoryCount === 1 ? 'y' : 'ies'} ·{' '}
              {products.length - pastryItemCount} product{products.length - pastryItemCount === 1 ? '' : 's'}
            </>
          )}
        </p>

      {(hydrateError || initCatalogError) && (
        <div
          className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="alert"
        >
          {initCatalogError ?? hydrateError}
        </div>
      )}

      {categories.length === 0 && menuTab === 'coffee' && (
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

      {menuTab === 'pastries' && !pastriesCategory && (
        <div className="mb-6 rounded-xl border border-dashed border-kado-red/30 bg-kado-cream/50 px-4 py-4">
          <p className="text-sm dash-muted mb-3">
            Add a menu category named <strong>{PASTRIES_CATEGORY_NAME}</strong> to manage pastries in this tab.
          </p>
          <button
            type="button"
            disabled={addingCategory}
            onClick={() => void createCategoryByName(PASTRIES_CATEGORY_NAME)}
            className="rounded-xl bg-kado-red text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {addingCategory ? 'Creating…' : `Create ${PASTRIES_CATEGORY_NAME} category`}
          </button>
        </div>
      )}

      {menuTab === 'coffee' && (
        <div className="flex flex-col gap-3 rounded-xl border dash-border dash-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs dash-muted">
            Drag the grip to reorder categories and products. Changes save to Supabase automatically.
          </p>
          <form onSubmit={(e) => void handleAddCategory(e)} className="flex w-full gap-2 sm:max-w-md sm:w-auto">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category…"
              disabled={addingCategory}
              className="min-w-0 flex-1 rounded-lg dash-input border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={addingCategory || !newCatName.trim()}
              className="shrink-0 rounded-lg bg-kado-dark text-kado-cream px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" /> {addingCategory ? '…' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {addCategoryError ? (
        <p className="text-xs font-semibold text-red-600 -mt-4">{addCategoryError}</p>
      ) : null}

      {menuTab === 'pastries' && (
        <p className="text-xs dash-muted -mt-2">
          Only the name is required. Add price, sizes, custom options, photo, and tags when ready — same controls as drinks.
        </p>
      )}

      <div className="space-y-3">
        {visibleCategories.map((cat) => {
          const catIndex = sortedCategories.findIndex((c) => c.id === cat.id);
          const catIsPastry = isPastriesCategory(cat);
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
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Drag to reorder category ${cat.name}`}
                  className={`p-1.5 rounded-lg shrink-0 ${
                    menuTab === 'pastries'
                      ? 'cursor-not-allowed opacity-30'
                      : 'cursor-grab active:cursor-grabbing touch-none hover:bg-kado-cream/80'
                  }`}
                  draggable={menuTab !== 'pastries'}
                  onDragStart={(e) => {
                    if (menuTab === 'pastries') return;
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
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  {editingCategoryId === cat.id ? (
                    <input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="rounded-lg dash-input border px-2 py-1 text-sm font-bold min-w-[10rem] max-w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-display font-bold dash-heading truncate">{cat.name}</span>
                  )}
                  <span className="text-xs dash-muted shrink-0">{catProducts.length} items</span>
                  {!cat.visible && (
                    <span className="text-[9px] font-bold uppercase tracking-widest dash-muted bg-kado-cream/80 px-2 py-0.5 rounded-full shrink-0">
                      Hidden
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-0.5 ml-auto">
                  {editingCategoryId === cat.id ? (
                    <>
                      <button
                        type="button"
                        onClick={commitCategoryRename}
                        className="rounded-lg p-2 text-kado-red hover:bg-kado-red/10"
                        aria-label="Save category name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategoryName('');
                        }}
                        className="rounded-lg p-2 dash-muted hover:bg-kado-cream/80"
                        aria-label="Cancel rename"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginCategoryRename(cat)}
                      className="rounded-lg p-2 dash-muted hover:bg-kado-cream/80 hover:text-kado-red"
                      aria-label={`Rename ${cat.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateCategory(cat.id, { visible: !cat.visible })}
                    className={`rounded-lg p-2 transition-colors ${
                      cat.visible ? 'dash-muted hover:bg-kado-cream/80' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                    title={cat.visible ? 'Hide category from menu' : 'Show category on menu'}
                    aria-label={cat.visible ? 'Hide category' : 'Show category'}
                  >
                    {cat.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${cat.name}" and all its products?`)) removeCategory(cat.id);
                    }}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded product list */}
              {isExpanded && (
                <div className="border-t dash-border px-4 py-3 sm:px-5 space-y-2">
                  {catProducts.map((p, pIndex) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 rounded-xl dash-card-alt border dash-border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
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
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                          className="cursor-grab active:cursor-grabbing touch-none rounded-lg p-1.5 hover:bg-white shrink-0"
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
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-bold text-sm dash-heading truncate">{p.name}</span>
                            {!p.visible && (
                              <span className="text-[9px] uppercase tracking-widest font-bold dash-muted bg-white/80 px-2 py-0.5 rounded-full">
                                Hidden
                              </span>
                            )}
                            {!isProductInStock(p) && (
                              <span className="text-[9px] uppercase tracking-widest font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                Out of stock
                              </span>
                            )}
                          </div>
                          <div className="text-xs dash-muted mt-0.5 flex gap-x-2 gap-y-0.5 flex-wrap">
                            {catIsPastry && !pastryHasPrice(p) ? (
                              <span>No listed price</span>
                            ) : (
                              <span className="font-semibold text-kado-dark/80">{formatPhp(p.basePrice)}</span>
                            )}
                            {p.sizes?.length > 0 && <span>{p.sizes.length} size(s)</span>}
                            {p.milks?.length > 0 && <span>{p.milks.length} milk(s)</span>}
                            {p.customFields?.length > 0 && <span>{p.customFields.length} custom</span>}
                            {p.tags?.length ? <span>{p.tags.join(', ')}</span> : null}
                            {!catIsPastry && <span>{p.temperature}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-0.5 sm:shrink-0">
                        <MenuProductStockButton product={p} size="icon" />
                        <button
                          type="button"
                          onClick={() => updateProduct(p.id, { visible: !p.visible })}
                          className={`rounded-lg p-2 transition-colors ${
                            p.visible ? 'dash-muted hover:bg-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                          title={p.visible ? 'Hide from menu' : 'Show on menu'}
                          aria-label={p.visible ? 'Hide product' : 'Show product'}
                        >
                          {p.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="rounded-lg p-2 dash-muted hover:bg-white hover:text-kado-red"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProduct(p.id)}
                          disabled={deletingProductId === p.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            deleteConfirmProductId === p.id
                              ? 'bg-red-50 text-red-600'
                              : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title={deleteConfirmProductId === p.id ? 'Click again to confirm delete' : 'Delete product'}
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => startAddProduct(cat.id)}
                    className="w-full rounded-lg border border-dashed dash-border py-2.5 text-[10px] font-bold uppercase tracking-wider dash-muted hover:border-kado-red hover:text-kado-red transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> {catIsPastry ? 'Add pastry' : 'Add product'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </Tabs>

      {/* Product form modal */}
      {(editingProduct || addingToCat) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={submitProduct}
            className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display font-bold text-xl dash-heading mb-4">
              {isPastryForm
                ? editingProduct
                  ? 'Edit pastry'
                  : 'Add pastry'
                : editingProduct
                  ? 'Edit product'
                  : 'Add product'}
            </h2>
            {productFormError && (
              <p className="mb-3 text-xs text-red-600 font-medium">{productFormError}</p>
            )}

            {isPastryForm && (
              <p className="mb-4 rounded-xl border border-kado-red/15 bg-kado-cream/40 px-4 py-3 text-xs dash-muted leading-relaxed">
                Only the <strong className="dash-heading">name</strong> is required. Set a price when customers can order
                online. Use sizes and option groups for packs or flavors (e.g.{' '}
                <span className="font-mono text-[10px]">Single|0, Box of 6|250</span>).
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                  Name <span className="text-kado-red">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isPastryForm ? 'e.g. Red Velvet Cookie' : undefined}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                  Description{isPastryForm ? ' (optional)' : ''}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 resize-none"
                />
              </div>

              <div className={isPastryForm ? '' : 'grid grid-cols-2 gap-4'}>
                <div className={isPastryForm ? '' : undefined}>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                    {isPastryForm ? 'Price (₱, optional)' : 'Base price (₱)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                    placeholder={isPastryForm ? 'Leave blank if priced in-store only' : undefined}
                    className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    required={!isPastryForm}
                  />
                </div>
                {!isPastryForm && (
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
                )}
              </div>

              <div className="space-y-3 rounded-xl border dash-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider dash-muted">
                  Product image{isPastryForm ? ' (optional)' : ''}
                </p>
                <p className="text-xs dash-muted leading-relaxed">
                  {isPastryForm
                    ? 'Add a photo when you have one. Items without photos still appear on the pastries list.'
                    : "Choose how this drink's photo is stored. Only the selected source is saved — switch tabs before saving if you change your mind."}
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
                      <label className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider ${preparingImage || savingProduct ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:bg-kado-dark/5'}`}>
                        <Upload className="h-4 w-4 shrink-0" aria-hidden />
                        {preparingImage ? 'Preparing…' : 'Choose file'}
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
                          disabled={savingProduct || preparingImage}
                          className="hidden"
                          onChange={(e) => {
                            void handleImageFilePick(e.target.files?.[0] ?? null);
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
                      {' '}Max {MENU_PRODUCT_IMAGE_MAX_LABEL} per image — larger files are compressed automatically.
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

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm dash-muted">
                  <input
                    type="checkbox"
                    checked={!form.visible}
                    onChange={(e) => setForm((f) => ({ ...f, visible: !e.target.checked }))}
                    className="rounded"
                  />
                  {isPastryForm ? 'Hide from menu, pastries page & QR' : 'Hide from menu & QR'}
                </label>
                {isPastryForm && (
                  <label className="flex items-center gap-2 text-sm dash-muted">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                      className="rounded"
                    />
                    In stock
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                  Tags (comma-separated){isPastryForm ? ' (optional)' : ''}
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder={isPastryForm ? 'bestseller, seasonal, cookie' : 'bestseller, new, iced-only'}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>

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
