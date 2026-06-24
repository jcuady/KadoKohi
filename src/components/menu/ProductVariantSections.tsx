import type { ComponentType, ReactNode } from 'react';
import type { Product } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import {
  getOrderableMilks,
  showMilkChoice,
  showTemperatureChoice,
} from '../../lib/menuProductModifiers';
import {
  parseCustomFieldOptions,
  type PosLineConfig,
} from '../../lib/posPricing';

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

type Props = {
  product: Product;
  config: PosLineConfig;
  onChange: (patch: Partial<PosLineConfig>) => void;
  /** Hide hot/iced for pastries and other non-drink items. */
  showTemperature?: boolean;
  Chip: ComponentType<ChipProps>;
  sectionLabelClass?: string;
};

export default function ProductVariantSections({
  product,
  config,
  onChange,
  showTemperature = showTemperatureChoice(product),
  Chip,
  sectionLabelClass = 'text-[9px] font-black uppercase tracking-[0.2em] text-kado-dark/50 mb-3',
}: Props) {
  const customGroups = parseCustomFieldOptions(product);

  const setCustomization = (groupName: string, optionLabel: string, priceDelta: number) => {
    const others = config.customizations.filter((item) => item.groupName !== groupName);
    onChange({ customizations: [...others, { groupName, optionLabel, priceDelta }] });
  };

  return (
    <>
      {showTemperature && (
        <div className="mb-6">
          <p className={sectionLabelClass}>Temperature</p>
          <div className="flex gap-2">
            {(['hot', 'iced'] as const).map((t) => (
              <Chip key={t} active={config.temperature === t} onClick={() => onChange({ temperature: t })}>
                {t === 'hot' ? 'Hot' : 'Iced'}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="mb-6">
          <p className={sectionLabelClass}>Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <Chip
                key={size.id}
                active={config.sizeId === size.id}
                onClick={() => onChange({ sizeId: size.id })}
              >
                <span>
                  {size.label}
                  {size.priceDelta !== 0 && (
                    <span className="opacity-80">
                      {' '}
                      {size.priceDelta > 0 ? '+' : ''}
                      {formatPhp(size.priceDelta)}
                    </span>
                  )}
                </span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      {showMilkChoice(product) && (
        <div className="mb-6">
          <p className={sectionLabelClass}>Milk option</p>
          <div className="flex flex-wrap gap-2">
            {getOrderableMilks(product).map((milk) => (
              <Chip
                key={milk.id}
                active={config.milkId === milk.id}
                onClick={() => onChange({ milkId: milk.id })}
              >
                <span>
                  {milk.label}
                  {milk.priceDelta > 0 && <span className="opacity-80"> +{formatPhp(milk.priceDelta)}</span>}
                </span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      {customGroups.map((group) => {
        const selected = config.customizations.find((item) => item.groupName === group.groupName);
        return (
          <div key={group.key} className="mb-6">
            <p className={sectionLabelClass}>{group.groupName}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <Chip
                  key={option.id}
                  active={selected?.optionLabel === option.label}
                  onClick={() => setCustomization(group.groupName, option.label, option.priceDelta)}
                >
                  <span>
                    {option.label}
                    {option.priceDelta !== 0 && (
                      <span className="opacity-80">
                        {' '}
                        {option.priceDelta > 0 ? '+' : ''}
                        {formatPhp(option.priceDelta)}
                      </span>
                    )}
                  </span>
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
