import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import type { MilkOption, ProductCustomField, ProductSize, ProductTemperature } from '../../../types/domain';
import {
  isGoogleDriveUrl,
  MENU_PRODUCT_IMAGE_MAX_LABEL,
  type MenuImageSource,
} from '../../../lib/menuProductImage';
import { kukidoAdminBadge } from '../../../lib/kukido';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { useConfirmDialog } from '../../ui/ConfirmDialog';
import MenuImagePreview from './MenuImagePreview';

export type ProductFormData = {
  name: string;
  description: string;
  basePrice: string;
  discountType: '' | 'fixed' | 'percent';
  discountValue: string;
  image: string;
  temperature: ProductTemperature;
  visible: boolean;
  inStock: boolean;
  tags: string;
  milks: MilkOption[];
  sizes: ProductSize[];
  customFields: ProductCustomField[];
};

type Props = {
  open: boolean;
  isPastryForm: boolean;
  editingProduct: string | null;
  form: ProductFormData;
  setForm: Dispatch<SetStateAction<ProductFormData>>;
  productFormError: string;
  imageSource: MenuImageSource;
  setImageSource: (source: MenuImageSource) => void;
  saveSummary: string;
  saveSummaryIsError: boolean;
  activePreviewSrc: string | null;
  pendingImageFile: File | null;
  uploadPreviewLabel: string;
  hasStoredUpload: boolean;
  savingProduct: boolean;
  preparingImage: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onImageFilePick: (file: File | null) => void;
  onClearPendingImage: () => void;
  addMilkRow: () => void;
  updateMilk: (idx: number, patch: Partial<MilkOption>) => void;
  removeMilk: (idx: number) => void;
  addSizeRow: () => void;
  updateSize: (idx: number, patch: Partial<ProductSize>) => void;
  removeSize: (idx: number) => void;
  addCustomFieldRow: () => void;
  updateCustomField: (idx: number, patch: Partial<ProductCustomField>) => void;
  removeCustomField: (idx: number) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border dash-border p-3.5">
      <h3 className="font-display text-[10px] font-bold uppercase tracking-wider text-kado-red">{title}</h3>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider dash-muted">
      {children}
      {required ? <span className="text-kado-red"> *</span> : null}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border dash-border dash-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60';

export default function AdminMenuProductFormModal({
  open,
  isPastryForm,
  editingProduct,
  form,
  setForm,
  productFormError,
  imageSource,
  setImageSource,
  saveSummary,
  saveSummaryIsError,
  activePreviewSrc,
  pendingImageFile,
  uploadPreviewLabel,
  hasStoredUpload,
  savingProduct,
  preparingImage,
  onSubmit,
  onCancel,
  onImageFilePick,
  onClearPendingImage,
  addMilkRow,
  updateMilk,
  removeMilk,
  addSizeRow,
  updateSize,
  removeSize,
  addCustomFieldRow,
  updateCustomField,
  removeCustomField,
}: Props) {
  const { confirm, confirmDialog } = useConfirmDialog();

  if (!open) return null;

  const title = isPastryForm
    ? editingProduct
      ? 'Edit pastry'
      : 'Add pastry'
    : editingProduct
      ? 'Edit product'
      : 'Add product';

  const kukidoKind = editingProduct ? kukidoAdminBadge(editingProduct) : null;

  const confirmRemove = async (titleText: string, description: string, then: () => void) => {
    if (
      !(await confirm({
        title: titleText,
        description,
        confirmLabel: 'Remove',
      }))
    ) {
      return;
    }
    then();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-kado-dark/55 backdrop-blur-[3px] p-0 sm:items-center sm:p-4">
      {confirmDialog}
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2.5rem] border dash-border bg-[var(--color-dash-surface)] shadow-[0_30px_60px_rgba(158,24,29,0.12)] sm:rounded-[2rem]"
      >
        <div className="flex items-start justify-between gap-3 border-b dash-border px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-display text-lg font-bold dash-heading">{title}</h2>
            <p className="mt-0.5 text-xs dash-muted">
              {isPastryForm ? 'Name required — price and photo optional' : 'All fields sync to the public menu & QR'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 dash-muted hover:bg-[var(--color-dash-hover)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {productFormError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {productFormError}
            </p>
          ) : null}

          {isPastryForm ? (
            <p className="rounded-xl border border-kado-red/15 bg-kado-red/[0.04] px-3.5 py-2.5 text-xs leading-relaxed dash-muted">
              Only the <strong className="dash-heading">name</strong> is required. Set a price when customers can order
              online. Use sizes for packs or flavors (e.g.{' '}
              <span className="font-mono text-[10px]">Single|0, Box of 6|250</span>).
            </p>
          ) : null}

          {kukidoKind === 'cookie' ? (
            <p className="rounded-xl border border-[#1B4FCC]/25 bg-[#1B4FCC]/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-[#143A9E]">
              <strong className="font-semibold">Kukidō cookie</strong> — price, photo, visibility, and stock drive the
              public cookie list and Kuki Box builder. Keep Visible + In stock for flavors customers can pick.
            </p>
          ) : null}
          {kukidoKind === 'box' ? (
            <p className="rounded-xl border border-[#1B4FCC]/25 bg-[#1B4FCC]/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-[#143A9E]">
              <strong className="font-semibold">Kuki Box SKU</strong> — base price is what customers pay for this box
              size (home + builder + checkout). Sold only via the box builder (not the pastry grid). Keep Visible so
              orders validate; use Out of stock to pause a size.
            </p>
          ) : null}
          {kukidoKind === 'pack' ? (
            <p className="rounded-xl border border-[#1B4FCC]/25 bg-[#1B4FCC]/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-[#143A9E]">
              <strong className="font-semibold">Kuki packaging add-on</strong> — base price is the optional packaging
              surcharge in the box builder. Keep Visible for checkout validation.
            </p>
          ) : null}

          <FormSection title="Basics">
            <div>
              <FieldLabel required>Name</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={isPastryForm ? 'e.g. Red Velvet Cookie' : 'e.g. Spanish Latte'}
                className={inputClass}
                required
              />
            </div>
            <div>
              <FieldLabel>Description{isPastryForm ? ' (optional)' : ''}</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className={isPastryForm ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'}>
              <div>
                <FieldLabel required={!isPastryForm}>
                  {isPastryForm ? 'Price (₱, optional)' : 'Base price (₱)'}
                </FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  placeholder={isPastryForm ? 'Leave blank if in-store only' : undefined}
                  className={inputClass}
                  required={!isPastryForm}
                />
              </div>
              {!isPastryForm ? (
                <div>
                  <FieldLabel>Temperature</FieldLabel>
                  <select
                    value={form.temperature}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, temperature: e.target.value as ProductTemperature }))
                    }
                    className={inputClass}
                  >
                    <option value="both">Hot & Iced</option>
                    <option value="hot">Hot only</option>
                    <option value="iced">Iced only</option>
                  </select>
                </div>
              ) : null}
            </div>
          </FormSection>

          <FormSection title="Promotional price">
            <p className="text-xs leading-relaxed dash-muted">
              Optional. The sale price is applied before a checkout voucher or promo code. Modifiers remain full price.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Discount type</FieldLabel>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discountType: e.target.value as ProductFormData['discountType'],
                      discountValue: e.target.value ? f.discountValue : '',
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">No discount</option>
                  <option value="percent">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </div>
              <div>
                <FieldLabel>
                  {form.discountType === 'percent' ? 'Percent off (%)' : 'Amount off (₱)'}
                </FieldLabel>
                <input
                  type="number"
                  min={form.discountType ? 0.01 : 0}
                  max={form.discountType === 'percent' ? 99.99 : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  disabled={!form.discountType}
                  required={Boolean(form.discountType)}
                  className={inputClass}
                />
              </div>
            </div>
            {form.discountType && form.discountValue && form.basePrice ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                Customer price: ₱
                {Math.max(
                  0,
                  form.discountType === 'percent'
                    ? Number(form.basePrice) * (1 - Number(form.discountValue) / 100)
                    : Number(form.basePrice) - Number(form.discountValue),
                ).toFixed(2)}
              </p>
            ) : null}
          </FormSection>

          <FormSection title={`Product image${isPastryForm ? ' (optional)' : ''}`}>
            <p className="text-xs leading-relaxed dash-muted">
              {isPastryForm
                ? 'Add a photo when ready. Items without photos still appear on the pastries list.'
                : 'Choose one source — only the selected tab is saved on submit.'}
            </p>
            <Tabs
              value={imageSource}
              onValueChange={(value) => {
                if (value === 'none' || value === 'url' || value === 'upload') setImageSource(value);
              }}
            >
              <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
                <TabsTrigger value="none" className="min-h-[36px] flex-1 text-[9px] sm:text-[10px]">
                  No image
                </TabsTrigger>
                <TabsTrigger value="url" className="min-h-[36px] flex-1 text-[9px] sm:text-[10px]">
                  Image link
                </TabsTrigger>
                <TabsTrigger value="upload" className="min-h-[36px] flex-1 text-[9px] sm:text-[10px]">
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
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider">Will display on menu</span>
              {saveSummary}
            </p>
            {imageSource === 'url' ? (
              <div>
                <FieldLabel>Image URL</FieldLabel>
                <input
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://… or /public/path.jpg"
                  disabled={savingProduct}
                  className={inputClass}
                />
                {form.image.trim() && isGoogleDriveUrl(form.image) ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed dash-muted">
                    Google Drive — file must be shared as <span className="font-semibold">Anyone with the link</span>.
                  </p>
                ) : null}
              </div>
            ) : null}
            {imageSource === 'upload' ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label
                    className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border dash-border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                      preparingImage || savingProduct
                        ? 'pointer-events-none opacity-60'
                        : 'cursor-pointer hover:bg-[var(--color-dash-hover)]'
                    }`}
                  >
                    <Upload className="h-4 w-4 shrink-0" aria-hidden />
                    {preparingImage ? 'Preparing…' : 'Choose file'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
                      disabled={savingProduct || preparingImage}
                      className="hidden"
                      onChange={(e) => {
                        void onImageFilePick(e.target.files?.[0] ?? null);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {pendingImageFile ? (
                    <Button type="button" variant="outline" size="sm" onClick={onClearPendingImage} disabled={savingProduct}>
                      Clear file
                    </Button>
                  ) : null}
                </div>
                {uploadPreviewLabel ? (
                  <p className="truncate text-[11px] dash-muted">New file: {uploadPreviewLabel}</p>
                ) : hasStoredUpload ? (
                  <p className="text-[11px] dash-muted">Keeping current upload unless you pick a new file.</p>
                ) : null}
                <p className="text-[11px] dash-muted">
                  Max {MENU_PRODUCT_IMAGE_MAX_LABEL} — larger files are compressed automatically.
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
          </FormSection>

          <FormSection title="Visibility & tags">
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
              {isPastryForm ? (
                <label className="flex items-center gap-2 text-sm dash-muted">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                    className="rounded"
                  />
                  In stock
                </label>
              ) : null}
            </div>
            <div>
              <FieldLabel>Tags (comma-separated)</FieldLabel>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder={isPastryForm ? 'bestseller, seasonal (promo auto-added with discount)' : 'bestseller, new (promo auto-added with discount)'}
                className={inputClass}
              />
            </div>
          </FormSection>

          <FormSection title="Modifiers">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Milk options</span>
                <button
                  type="button"
                  onClick={addMilkRow}
                  className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {form.milks.length === 0 ? (
                <p className="text-xs dash-muted">No milk modifiers.</p>
              ) : (
                <div className="space-y-2">
                  {form.milks.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input
                        value={m.label}
                        onChange={(e) => updateMilk(i, { label: e.target.value })}
                        placeholder="e.g. Oat"
                        className="flex-1 rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        value={m.priceDelta}
                        onChange={(e) => updateMilk(i, { priceDelta: Number(e.target.value) })}
                        className="w-20 rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                        placeholder="+₱"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void confirmRemove(
                            `Remove milk “${m.label.trim() || `option ${i + 1}`}”?`,
                            'Removed from this draft until you save the product.',
                            () => removeMilk(i),
                          )
                        }
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Size options</span>
                <button
                  type="button"
                  onClick={addSizeRow}
                  className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {form.sizes.length === 0 ? (
                <p className="text-xs dash-muted">No size modifiers.</p>
              ) : (
                <div className="space-y-2">
                  {form.sizes.map((size, index) => (
                    <div key={size.id} className="flex items-center gap-2">
                      <input
                        value={size.label}
                        onChange={(e) => updateSize(index, { label: e.target.value })}
                        placeholder="e.g. Large"
                        className="flex-1 rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        value={size.priceDelta}
                        onChange={(e) => updateSize(index, { priceDelta: Number(e.target.value) })}
                        className="w-20 rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                        placeholder="+₱"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void confirmRemove(
                            `Remove size “${size.label.trim() || `option ${index + 1}`}”?`,
                            'Removed from this draft until you save the product.',
                            () => removeSize(index),
                          )
                        }
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Custom option groups</span>
                <button
                  type="button"
                  onClick={addCustomFieldRow}
                  className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {form.customFields.length === 0 ? (
                <p className="text-xs dash-muted">Add option groups beyond milk (sweetness, roast, etc.).</p>
              ) : (
                <div className="space-y-2">
                  {form.customFields.map((field, index) => (
                    <div key={field.id} className="space-y-2 rounded-xl border dash-border p-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={field.label}
                          onChange={(e) => updateCustomField(index, { label: e.target.value })}
                          placeholder="Group label"
                          className="rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                        />
                        <input
                          value={field.key}
                          onChange={(e) => updateCustomField(index, { key: e.target.value })}
                          placeholder="key"
                          className="rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={field.value}
                          onChange={(e) => updateCustomField(index, { value: e.target.value })}
                          placeholder="Options: None|0, Less|0, Extra|30"
                          className="flex-1 rounded-lg border dash-border dash-input px-3 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void confirmRemove(
                              `Remove group “${field.label.trim() || field.key.trim() || `option ${index + 1}`}”?`,
                              'Removed from this draft until you save the product.',
                              () => removeCustomField(index),
                            )
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormSection>
        </div>

        <div className="flex justify-end gap-2 border-t dash-border px-4 py-3 sm:px-5">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={savingProduct}>
            {savingProduct ? 'Saving…' : editingProduct ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}
