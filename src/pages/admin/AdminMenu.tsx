import { useEffect, useMemo, useState, Fragment, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Coffee,
  Croissant,
  ExternalLink,
  EyeOff,
  FolderOpen,
  Layers,
  Package,
  Plus,
} from 'lucide-react';
import type { MenuCategory, Product, MilkOption, ProductSize, ProductCustomField } from '../../types/domain';
import { useMenuStore } from '../../store/menuStore';
import { MENU_MILK_OPTIONS } from '../../data/menuCatalog';
import { newId } from '../../lib/id';
import { clampText } from '../../lib/validation';
import { orderingRepo, formatMenuProductCrudError } from '../../lib/supabase/repositories/ordering';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  describeMenuImageOnSave,
  inferMenuImageSource,
  prepareMenuProductImage,
  previewUrlForMenuImageSource,
  resolveMenuImageSaveIntent,
  type MenuImageSource,
} from '../../lib/menuProductImage';
import { isProductInStock } from '../../lib/productStock';
import {
  findPastriesCategory,
  isPastriesCategory,
  isPastriesCategoryId,
  pastryHasPrice,
  PASTRIES_CATEGORY_NAME,
} from '../../lib/pastriesCategory';
import DashboardKpi from '../../components/admin/dashboard/DashboardKpi';
import DashboardSection from '../../components/admin/dashboard/DashboardSection';
import AdminMenuCategoryCard from '../../components/admin/menu/AdminMenuCategoryCard';
import AdminMenuProductFormModal, {
  type ProductFormData,
} from '../../components/admin/menu/AdminMenuProductFormModal';

type MenuManagerTab = 'coffee' | 'pastries';

const emptyProductForm: ProductFormData = {
  name: '',
  description: '',
  basePrice: '',
  discountType: '',
  discountValue: '',
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
  discountType: '',
  discountValue: '',
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
      discountType: p.discountType ?? '',
      discountValue: p.discountValue != null ? String(p.discountValue) : '',
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
  const outOfStockCount = useMemo(() => products.filter((p) => !isProductInStock(p)).length, [products]);

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

    const discountValue = form.discountType ? Number(form.discountValue) : null;
    if (
      form.discountType &&
      (!Number.isFinite(discountValue) ||
        discountValue == null ||
        discountValue <= 0 ||
        (form.discountType === 'percent' && discountValue >= 100) ||
        (form.discountType === 'fixed' && discountValue >= basePrice))
    ) {
      setProductFormError(
        form.discountType === 'percent'
          ? 'Percentage discount must be greater than 0 and less than 100.'
          : 'Fixed discount must be greater than 0 and less than the base price.',
      );
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
      discountType: form.discountType || null,
      discountValue,
      temperature: isPastryForm ? ('both' as const) : form.temperature,
      visible: form.visible,
      tags: (() => {
        const tags = form.tags
            .split(',')
            .map((t) => t.trim())
          .filter(Boolean)
          .filter((t) => t.toLowerCase() !== 'promo');
        if (form.discountType) tags.unshift('promo');
        return tags;
      })(),
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

  const tabProductCount =
    menuTab === 'pastries' ? pastryItemCount : products.length - pastryItemCount;
  const tabCategoryCount = menuTab === 'pastries' ? (pastriesCategory ? 1 : 0) : coffeeCategoryCount;

  if (!remoteLoaded) {
    return (
      <div className="dash-page max-w-7xl space-y-5 pb-16">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-xl">Menu</CardTitle>
            <CardDescription className="text-xs">Loading catalog from Supabase…</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="dash-page max-w-7xl space-y-5 pb-16">
      <Card>
        <CardHeader className="gap-3 p-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xl md:text-2xl">Menu</CardTitle>
            <CardDescription className="text-xs">
              {tabCategoryCount} {menuTab === 'pastries' ? 'category' : 'categor'}
              {tabCategoryCount === 1 ? 'y' : 'ies'} · {tabProductCount} product
              {tabProductCount === 1 ? '' : 's'} ·{' '}
              {dataSource === 'remote' ? (
                <span className="text-emerald-700 dark:text-emerald-400">Live sync</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">Offline fallback</span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-xl border dash-border px-3 text-[10px] font-bold uppercase tracking-wider dash-heading transition-colors hover:border-kado-red/40 hover:text-kado-red"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public menu
            </Link>
            <Tabs value={menuTab} onValueChange={(v) => setMenuTab(v as MenuManagerTab)}>
              <TabsList className="h-auto flex-wrap gap-1">
                <TabsTrigger value="coffee" className="gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <Coffee className="h-3.5 w-3.5" />
                  Drinks
                </TabsTrigger>
                <TabsTrigger value="pastries" className="gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <Croissant className="h-3.5 w-3.5" />
          Pastries
                </TabsTrigger>
              </TabsList>
            </Tabs>
      </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DashboardKpi
          label="Categories"
          value={String(tabCategoryCount)}
          hint={`${activeCategoryCount} visible overall`}
          icon={Layers}
        />
        <DashboardKpi
          label="Products"
          value={String(tabProductCount)}
          hint={menuTab === 'coffee' ? 'Coffee & drinks' : 'Pastry items'}
          icon={Package}
          highlight
        />
        <DashboardKpi
          label="Hidden"
          value={String(hiddenProductCount)}
          hint="Not on public menu"
          icon={EyeOff}
          alert={hiddenProductCount > 0}
        />
        <DashboardKpi
          label="Out of stock"
          value={String(outOfStockCount)}
          hint="Pastries & toggled items"
          icon={FolderOpen}
          alert={outOfStockCount > 0}
        />
      </div>

      {(hydrateError || initCatalogError) && (
        <Card className="border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">{initCatalogError ?? hydrateError}</p>
        </Card>
      )}

      {categories.length === 0 && menuTab === 'coffee' && (
        <Card className="border-dashed border-kado-red/30 bg-kado-red/[0.03] p-4">
          <p className="mb-3 text-sm dash-muted">
            No coffee categories yet. Initialize the flyer catalog (4 categories, 19 drinks) or add your own below.
          </p>
          <Button disabled={initializingCatalog} onClick={() => void handleInitializeCatalog()}>
            {initializingCatalog ? 'Initializing…' : 'Initialize KADO MENU V2'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>
      )}

      {menuTab === 'pastries' && !pastriesCategory && (
        <Card className="border-dashed border-kado-red/30 bg-kado-red/[0.03] p-4">
          <p className="mb-3 text-sm dash-muted">
            Add a category named <strong className="dash-heading">{PASTRIES_CATEGORY_NAME}</strong> to manage pastries
            here.
          </p>
          <Button disabled={addingCategory} onClick={() => void createCategoryByName(PASTRIES_CATEGORY_NAME)}>
            {addingCategory ? 'Creating…' : `Create ${PASTRIES_CATEGORY_NAME}`}
          </Button>
        </Card>
      )}

      <DashboardSection
        title="Catalog"
        description={
          menuTab === 'pastries'
            ? pastriesCategory
              ? `${pastryItemCount} items on /pastries and the public menu`
              : 'Pastries tab needs a Pastries category'
            : 'Drag categories and products to reorder — changes save automatically'
        }
        action={
          menuTab === 'coffee' ? (
            <form onSubmit={(e) => void handleAddCategory(e)} className="flex w-full max-w-xs gap-2 sm:w-auto">
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category…"
          disabled={addingCategory}
                className="min-w-0 flex-1 rounded-lg border dash-border dash-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
              />
              <Button type="submit" size="sm" disabled={addingCategory || !newCatName.trim()}>
                <Plus className="h-3.5 w-3.5" />
                {addingCategory ? '…' : 'Add'}
              </Button>
      </form>
          ) : null
        }
      >
        {addCategoryError ? <p className="text-xs font-semibold text-red-600">{addCategoryError}</p> : null}

        {menuTab === 'pastries' && pastriesCategory ? (
          <p className="text-xs dash-muted">
            Only the name is required. Price, photo, sizes, and tags are optional — same controls as drinks.
          </p>
        ) : null}

        {visibleCategories.length === 0 ? (
          <Card className="border-dashed p-6 text-center">
            <p className="text-sm dash-muted">No categories in this tab yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
        {visibleCategories.map((cat) => {
          const catIndex = sortedCategories.findIndex((c) => c.id === cat.id);
          const catProducts = products
            .filter((p) => p.categoryId === cat.id)
            .sort((a, b) => a.order - b.order);

              return (
                <Fragment key={cat.id}>
                  <AdminMenuCategoryCard
                  cat={cat}
                  catProducts={catProducts}
                  isExpanded={expandedCat === cat.id}
                  menuTab={menuTab}
                  pastriesCategoryId={pastriesCategory?.id}
                  editingCategoryId={editingCategoryId}
                  editingCategoryName={editingCategoryName}
                  drag={drag}
                  deleteConfirmProductId={deleteConfirmProductId}
                  deletingProductId={deletingProductId}
                  onToggleExpand={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  onDragStartCat={() => setDrag({ kind: 'cat', from: catIndex })}
                  onDragEnd={onDragEnd}
                  onCatDrop={(e) => {
            e.preventDefault();
            if (drag?.kind === 'cat' && drag.from !== catIndex) reorderCategories(drag.from, catIndex);
            setDrag(null);
                  }}
                  onSetEditingCategoryName={setEditingCategoryName}
                  onCommitCategoryRename={commitCategoryRename}
                  onCancelCategoryRename={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryName('');
                      }}
                  onBeginCategoryRename={() => beginCategoryRename(cat)}
                  onToggleCategoryVisible={() => updateCategory(cat.id, { visible: !cat.visible })}
                  onDeleteCategory={() => {
                    if (confirm(`Delete "${cat.name}" and all its products?`)) removeCategory(cat.id);
                  }}
                  onReorderProducts={(from, to) => reorderProductsInCategory(cat.id, from, to)}
                  onSetDrag={setDrag}
                  onToggleProductVisible={(id, visible) => updateProduct(id, { visible })}
                  onEditProduct={startEditProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddProduct={() => startAddProduct(cat.id)}
                />
                </Fragment>
          );
        })}
      </div>
        )}
      </DashboardSection>

      <AdminMenuProductFormModal
        open={Boolean(editingProduct || addingToCat)}
        isPastryForm={isPastryForm}
        editingProduct={editingProduct}
        form={form}
        setForm={setForm}
        productFormError={productFormError}
        imageSource={imageSource}
        setImageSource={setImageSource}
        saveSummary={saveSummary}
        saveSummaryIsError={saveSummaryIsError}
        activePreviewSrc={activePreviewSrc}
        pendingImageFile={pendingImageFile}
        uploadPreviewLabel={uploadPreviewLabel}
        hasStoredUpload={hasStoredUpload}
        savingProduct={savingProduct}
        preparingImage={preparingImage}
        onSubmit={submitProduct}
        onCancel={cancelForm}
        onImageFilePick={handleImageFilePick}
        onClearPendingImage={clearPendingImageFile}
        addMilkRow={addMilkRow}
        updateMilk={updateMilk}
        removeMilk={removeMilk}
        addSizeRow={addSizeRow}
        updateSize={updateSize}
        removeSize={removeSize}
        addCustomFieldRow={addCustomFieldRow}
        updateCustomField={updateCustomField}
        removeCustomField={removeCustomField}
      />
    </div>
  );
}
