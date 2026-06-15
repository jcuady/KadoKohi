import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Upload, X, Croissant } from 'lucide-react';
import type { Product } from '../../types/domain';
import { useMenuStore } from '../../store/menuStore';
import { findPastriesCategory, PASTRIES_CATEGORY_NAME } from '../../lib/pastriesCategory';
import { newId } from '../../lib/id';
import { formatPhp } from '../../lib/money';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { getMenuProductImageUrl } from '../../lib/menuCatalog';
import {
  describeMenuImageOnSave,
  inferMenuImageSource,
  isGoogleDriveUrl,
  MENU_PRODUCT_IMAGE_MAX_BYTES,
  previewUrlForMenuImageSource,
  resolveMenuImageSaveIntent,
  type MenuImageSource,
} from '../../lib/menuProductImage';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

type PastryForm = {
  name: string;
  description: string;
  basePrice: string;
  image: string;
  visible: boolean;
  inStock: boolean;
};

const emptyForm: PastryForm = {
  name: '',
  description: '',
  basePrice: '',
  image: '',
  visible: true,
  inStock: true,
};

function clampText(value: string, max: number) {
  return value.trim().slice(0, max);
}

export default function AdminPastries() {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const removeProduct = useMenuStore((s) => s.removeProduct);

  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const pastryItems = useMemo(() => {
    if (!pastriesCategory) return [];
    return products
      .filter((p) => p.categoryId === pastriesCategory.id)
      .sort((a, b) => a.order - b.order);
  }, [products, pastriesCategory]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PastryForm>(emptyForm);
  const [imageSource, setImageSource] = useState<MenuImageSource>('none');
  const [originalImage, setOriginalImage] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadPreviewLabel, setUploadPreviewLabel] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

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

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOriginalImage('');
    setImageSource('none');
    clearPendingImageFile();
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? '',
      basePrice: String(p.basePrice),
      image: p.image ?? '',
      visible: p.visible,
      inStock: p.inStock !== false,
    });
    setOriginalImage(p.image ?? '');
    setImageSource(inferMenuImageSource(p.image));
    clearPendingImageFile();
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    clearPendingImageFile();
    setFormError('');
  };

  const handleImageFilePick = (file: File | null) => {
    if (!file) return;
    setFormError('');
    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file (PNG, JPG, WebP, etc.).');
      return;
    }
    if (file.size > MENU_PRODUCT_IMAGE_MAX_BYTES) {
      setFormError(
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pastriesCategory) {
      setFormError(`Create a “${PASTRIES_CATEGORY_NAME}” category in Menu Manager first.`);
      return;
    }

    setFormError('');
    if (!form.name.trim()) {
      setFormError('Pastry name is required.');
      return;
    }
    const basePrice = Number(form.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setFormError('Enter a valid price (0 or greater).');
      return;
    }

    const productId = editingId ?? newId();
    const imageIntentInput = {
      source: imageSource,
      urlInput: form.image,
      hasPendingFile: Boolean(pendingImageFile),
      existingImage: originalImage,
      isEditing: Boolean(editingId),
    };
    const intent = resolveMenuImageSaveIntent(imageIntentInput);
    if (intent.ok === false) {
      setFormError(intent.error);
      return;
    }

    const now = new Date().toISOString();
    const shared = {
      name: clampText(form.name, 120),
      description: clampText(form.description, 500) || undefined,
      basePrice,
      temperature: 'both' as const,
      visible: form.visible,
      inStock: form.inStock,
      tags: [] as string[],
      milks: [],
      sizes: [],
      customFields: [],
    };

    let saved: Product;
    if (editingId) {
      const prev = products.find((p) => p.id === editingId);
      if (!prev) {
        setFormError('Pastry not found. Refresh and try again.');
        return;
      }
      saved = { ...prev, ...shared, updatedAt: now };
    } else {
      saved = {
        id: productId,
        categoryId: pastriesCategory.id,
        branchId: null,
        ...shared,
        order: pastryItems.length,
        createdAt: now,
        updatedAt: now,
      };
    }

    try {
      setSaving(true);
      let image: string | undefined;
      switch (intent.action) {
        case 'clear':
          image = undefined;
          break;
        case 'use_url':
        case 'keep_existing':
          image = intent.url;
          break;
        case 'needs_upload':
          if (!pendingImageFile) {
            setFormError('Choose an image file to upload.');
            return;
          }
          image = await orderingRepo.uploadMenuProductImage(pendingImageFile, productId);
          break;
      }

      saved = { ...saved, image, updatedAt: new Date().toISOString() };
      await orderingRepo.upsertProduct(saved);
      useMenuStore.setState((s) => ({
        products: editingId
          ? s.products.map((p) => (p.id === saved.id ? saved : p))
          : [...s.products, saved],
        hydrateError: null,
      }));
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save pastry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete “${p.name}”?`)) return;
    try {
      await orderingRepo.deleteProduct(p.id);
      removeProduct(p.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not delete pastry.');
    }
  };

  const imageIntentInput = {
    source: imageSource,
    urlInput: form.image,
    hasPendingFile: Boolean(pendingImageFile),
    existingImage: originalImage,
    isEditing: Boolean(editingId),
  };
  const pendingImageIntent = resolveMenuImageSaveIntent(imageIntentInput);
  const saveSummary =
    pendingImageIntent.ok === false ? pendingImageIntent.error : describeMenuImageOnSave(imageIntentInput);
  const saveSummaryIsError = pendingImageIntent.ok === false;
  const activePreviewSrc = previewUrlForMenuImageSource(
    imageSource,
    form.image,
    originalImage,
    uploadPreviewUrl,
  );

  return (
    <div className="max-w-4xl dash-page pb-16">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">CMS</p>
          <h1 className="font-display text-3xl font-bold dash-heading">Pastries</h1>
          <p className="dash-muted mt-1 text-sm max-w-xl">
            Manage items in the <strong>{PASTRIES_CATEGORY_NAME}</strong> menu category. They appear on{' '}
            <code className="text-xs">/pastries</code> and under Pastries on the coffee menu.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={!pastriesCategory}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-kado-dark disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add pastry
        </button>
      </div>

      {!pastriesCategory ? (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-amber-950 dark:text-amber-100">
          No <strong>{PASTRIES_CATEGORY_NAME}</strong> category found. In{' '}
          <Link to="/admin/menu" className="font-semibold underline">
            Menu Manager
          </Link>
          , add a category named exactly <strong>{PASTRIES_CATEGORY_NAME}</strong>, then return here.
        </div>
      ) : (
        <p className="dash-muted mb-4 text-xs">
          Category: <span className="font-mono">{pastriesCategory.id}</span> · {pastryItems.length} item
          {pastryItems.length === 1 ? '' : 's'} · synced to Supabase
        </p>
      )}

      {formError && !showModal ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>
      ) : null}

      <div className="space-y-3">
        {pastryItems.length === 0 && pastriesCategory ? (
          <p className="dash-muted text-sm">No pastries yet. Add your first bake.</p>
        ) : null}
        {pastryItems.map((p) => (
          <article
            key={p.id}
            className="dash-card flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 gap-4">
              <img
                src={getMenuProductImageUrl(p, { pastriesCategoryId: pastriesCategory?.id })}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover border dash-border"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="dash-heading font-semibold truncate">{p.name}</h3>
                  {!p.visible ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Hidden</span>
                  ) : null}
                  {p.inStock === false ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Out of stock</span>
                  ) : null}
                </div>
                <p className="dash-muted text-sm">{formatPhp(p.basePrice)}</p>
                {p.description ? (
                  <p className="dash-muted text-xs mt-1 line-clamp-2">{p.description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="inline-flex items-center gap-1.5 rounded-lg border dash-border px-3 py-2 text-xs font-bold uppercase tracking-wider dash-muted hover:text-kado-red"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(p)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display font-bold text-xl dash-heading flex items-center gap-2">
                <Croissant className="h-5 w-5 text-kado-red" />
                {editingId ? 'Edit pastry' : 'Add pastry'}
              </h2>
              <button type="button" onClick={closeModal} className="dash-muted hover:text-kado-red" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError ? <p className="mb-3 text-xs text-red-600 font-medium">{formError}</p> : null}

            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider dash-muted">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider dash-muted">Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider dash-muted">Price (₱)</span>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
                />
              </label>

              <div className="space-y-3 rounded-xl border dash-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider dash-muted">Photo</p>
                <Tabs
                  value={imageSource}
                  onValueChange={(v) => {
                    if (v === 'none' || v === 'url' || v === 'upload') setImageSource(v);
                  }}
                >
                  <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
                    <TabsTrigger value="none" className="flex-1 text-[10px]">No image</TabsTrigger>
                    <TabsTrigger value="url" className="flex-1 text-[10px]">Image link</TabsTrigger>
                    <TabsTrigger value="upload" className="flex-1 text-[10px]">Upload file</TabsTrigger>
                  </TabsList>
                </Tabs>

                <p
                  className={[
                    'rounded-lg border px-3 py-2 text-xs',
                    saveSummaryIsError
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-950'
                      : 'border-kado-red/20 bg-kado-red/5',
                  ].join(' ')}
                >
                  {saveSummary}
                </p>

                {imageSource === 'url' ? (
                  <input
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://…"
                    className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
                  />
                ) : null}

                {imageSource === 'upload' ? (
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red">
                      <Upload className="h-4 w-4" />
                      Choose file
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
                        className="sr-only"
                        onChange={(e) => handleImageFilePick(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {uploadPreviewLabel ? (
                      <p className="mt-1 text-[11px] dash-muted truncate">{uploadPreviewLabel}</p>
                    ) : null}
                  </div>
                ) : null}

                {activePreviewSrc ? (
                  <img
                    src={activePreviewSrc}
                    alt="Pastry preview"
                    className="mt-2 h-32 w-full rounded-xl object-cover border dash-border"
                  />
                ) : null}

                {form.image.trim() && isGoogleDriveUrl(form.image) && imageSource === 'url' ? (
                  <p className="text-[11px] text-amber-800">
                    Google Drive links must be shared as “Anyone with the link”, or use Upload file.
                  </p>
                ) : null}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                />
                <span className="text-sm font-medium dash-heading">Visible on menu & pastries page</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                />
                <span className="text-sm font-medium dash-heading">In stock today</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-kado-dark px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-kado-red disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add pastry'}
              </button>
              <button type="button" onClick={closeModal} className="rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
