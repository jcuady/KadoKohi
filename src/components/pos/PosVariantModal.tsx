import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../types/domain';
import { defaultPosLineConfig, parseCustomFieldOptions, resolvePosUnitPrice, type PosLineConfig } from '../../lib/posPricing';
import { formatPhp } from '../../lib/money';
import { getOrderableMilks, showTemperatureChoice } from '../../lib/menuProductModifiers';
import OptionChip from '../ui/OptionChip';
import {
  OVERLAY_CLOSE,
  OVERLAY_CTA,
  OVERLAY_FOOTER,
  OVERLAY_HEADER,
  OVERLAY_HOST_CENTER,
  OVERLAY_PANEL_XL,
} from '../../lib/overlayTheme';
import { X } from 'lucide-react';

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
    <div className={`${OVERLAY_HOST_CENTER} z-[120]`}>
      <div className={OVERLAY_PANEL_XL}>
        <div className={OVERLAY_HEADER}>
          <div className="min-w-0 pr-2">
            <h3 className="font-display text-xl font-bold text-kado-dark">{product.name}</h3>
            <p className="text-xs text-kado-dark/60 mt-0.5">Select variants before adding to POS cart.</p>
          </div>
          <button type="button" onClick={onClose} className={OVERLAY_CLOSE} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {showTemperatureChoice(product) && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Temperature</p>
              <div className="flex flex-wrap gap-2">
                {(['hot', 'iced'] as const).map((item) => (
                  <OptionChip
                    key={item}
                    active={value.temperature === item}
                    onClick={() => setLocal((prev) => ({ ...(prev ?? value), temperature: item }))}
                  >
                    {item}
                  </OptionChip>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <OptionChip
                    key={size.id}
                    active={value.sizeId === size.id}
                    onClick={() => setLocal((prev) => ({ ...(prev ?? value), sizeId: size.id }))}
                  >
                    {size.label}
                    {size.priceDelta ? (
                      <span className="opacity-80">
                        {size.priceDelta > 0 ? '+' : ''}
                        {formatPhp(size.priceDelta)}
                      </span>
                    ) : null}
                  </OptionChip>
                ))}
              </div>
            </div>
          )}

          {getOrderableMilks(product).length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Milk</p>
              <div className="flex flex-wrap gap-2">
                {getOrderableMilks(product).map((milk) => (
                  <OptionChip
                    key={milk.id}
                    active={value.milkId === milk.id}
                    onClick={() => setLocal((prev) => ({ ...(prev ?? value), milkId: milk.id }))}
                  >
                    {milk.label}
                    {milk.priceDelta ? (
                      <span className="opacity-80">
                        {milk.priceDelta > 0 ? '+' : ''}
                        {formatPhp(milk.priceDelta)}
                      </span>
                    ) : null}
                  </OptionChip>
                ))}
              </div>
            </div>
          )}

          {customGroups.map((group) => {
            const selected = value.customizations.find((item) => item.groupName === group.groupName);
            return (
              <div key={group.key}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">{group.groupName}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => (
                    <OptionChip
                      key={option.id}
                      active={selected?.optionLabel === option.label}
                      onClick={() => setCustomization(group.groupName, option.label, option.priceDelta)}
                    >
                      {option.label}{' '}
                      {option.priceDelta
                        ? `${option.priceDelta > 0 ? '+' : ''}${formatPhp(option.priceDelta)}`
                        : ''}
                    </OptionChip>
                  ))}
                </div>
              </div>
            );
          })}

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Quantity</p>
            <div className="inline-flex items-center gap-3 rounded-full border border-kado-dark/10 bg-white px-3 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => setLocal((prev) => ({ ...(prev ?? value), qty: Math.max(1, (prev ?? value).qty - 1) }))}
                className="w-8 h-8 rounded-full hover:bg-kado-red/5 hover:text-kado-red"
                aria-label="Decrease"
              >
                −
              </button>
              <span className="font-display font-bold text-kado-dark min-w-[1.5rem] text-center">{value.qty}</span>
              <button
                type="button"
                onClick={() => setLocal((prev) => ({ ...(prev ?? value), qty: (prev ?? value).qty + 1 }))}
                className="w-8 h-8 rounded-full hover:bg-kado-red/5 hover:text-kado-red"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className={`${OVERLAY_FOOTER} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
          <div className="text-sm text-kado-dark/70 text-center sm:text-left">
            Unit: <strong className="text-kado-dark">{formatPhp(resolved.unit)}</strong>
          </div>
          <button type="button" onClick={() => onConfirm(value)} className={`${OVERLAY_CTA} sm:w-auto sm:min-w-[12rem]`}>
            Add — {formatPhp(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
