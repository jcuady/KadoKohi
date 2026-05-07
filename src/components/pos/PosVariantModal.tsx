import { useEffect, useMemo, useState } from 'react';
import type { OrderItemVariantSnapshot, Product } from '../../types/domain';
import { defaultPosLineConfig, parseCustomFieldOptions, resolvePosUnitPrice, type PosLineConfig } from '../../lib/posPricing';
import { formatPhp } from '../../lib/money';

type PosVariantModalProps = {
  product: Product | null;
  open: boolean;
  initial?: PosLineConfig;
  onClose: () => void;
  onConfirm: (config: PosLineConfig) => void;
};

export default function PosVariantModal({ product, open, initial, onClose, onConfirm }: PosVariantModalProps) {
  const customGroups = useMemo(() => (product ? parseCustomFieldOptions(product) : []), [product]);
  const fallback = useMemo(() => (product ? defaultPosLineConfig(product) : null), [product]);

  const [local, setLocal] = useState<PosLineConfig | null>(null);

  useEffect(() => {
    if (!open) {
      setLocal(null);
      return;
    }
    setLocal(initial ?? null);
  }, [open, product?.id, initial]);

  if (!open || !product || !fallback) return null;
  const value = local ?? initial ?? fallback;
  const resolved = resolvePosUnitPrice(product, value);
  const lineTotal = resolved.unit * value.qty;

  const setCustomization = (groupName: string, optionLabel: string, priceDelta: number) => {
    setLocal((prev) => {
      const next = prev ?? value;
      const others = next.customizations.filter((item) => item.groupName !== groupName);
      return {
        ...next,
        customizations: [...others, { groupName, optionLabel, priceDelta }],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 p-4 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-[2rem] bg-white overflow-hidden border border-kado-dark/10 shadow-2xl max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-kado-dark/10 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-kado-dark">{product.name}</h3>
            <p className="text-xs text-kado-dark/60 mt-0.5">Select variants before adding to POS cart.</p>
          </div>
          <button onClick={onClose} type="button" className="text-kado-dark/50 hover:text-kado-red text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {product.temperature === 'both' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Temperature</p>
              <div className="grid grid-cols-2 gap-2">
                {(['hot', 'iced'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...(prev ?? value), temperature: item }))}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                      value.temperature === item ? 'bg-kado-red text-kado-cream border-kado-red' : 'border-kado-dark/12 text-kado-dark/70'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Size</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...(prev ?? value), sizeId: size.id }))}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider text-left ${
                      value.sizeId === size.id ? 'bg-kado-red text-kado-cream border-kado-red' : 'border-kado-dark/12 text-kado-dark/70'
                    }`}
                  >
                    {size.label} {size.priceDelta ? `${size.priceDelta > 0 ? '+' : ''}${formatPhp(size.priceDelta)}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.milks.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Milk Option</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {product.milks.map((milk) => (
                  <button
                    key={milk.id}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...(prev ?? value), milkId: milk.id }))}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider text-left ${
                      value.milkId === milk.id ? 'bg-kado-red text-kado-cream border-kado-red' : 'border-kado-dark/12 text-kado-dark/70'
                    }`}
                  >
                    {milk.label} {milk.priceDelta ? `${milk.priceDelta > 0 ? '+' : ''}${formatPhp(milk.priceDelta)}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {customGroups.map((group) => {
            const selected = value.customizations.find((item) => item.groupName === group.groupName);
            return (
              <div key={group.key}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">{group.groupName}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {group.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCustomization(group.groupName, option.label, option.priceDelta)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider text-left ${
                        selected?.optionLabel === option.label ? 'bg-kado-red text-kado-cream border-kado-red' : 'border-kado-dark/12 text-kado-dark/70'
                      }`}
                    >
                      {option.label} {option.priceDelta ? `${option.priceDelta > 0 ? '+' : ''}${formatPhp(option.priceDelta)}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Quantity</p>
            <div className="inline-flex items-center gap-3 rounded-full border border-kado-dark/12 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setLocal((prev) => ({ ...(prev ?? value), qty: Math.max(1, (prev ?? value).qty - 1) }))}
                className="w-7 h-7 rounded-full border border-kado-dark/10 text-lg"
              >
                -
              </button>
              <span className="font-display font-bold text-kado-dark min-w-[1.5rem] text-center">{value.qty}</span>
              <button
                type="button"
                onClick={() => setLocal((prev) => ({ ...(prev ?? value), qty: (prev ?? value).qty + 1 }))}
                className="w-7 h-7 rounded-full border border-kado-dark/10 text-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-kado-dark/10 bg-white flex items-center justify-between gap-4">
          <div className="text-sm text-kado-dark/70">
            Unit: <strong className="text-kado-dark">{formatPhp(resolved.unit)}</strong>
          </div>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            className="rounded-full bg-kado-red text-kado-cream px-6 py-3 text-xs font-black uppercase tracking-wider hover:bg-kado-dark transition-colors"
          >
            Add to cart — {formatPhp(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
