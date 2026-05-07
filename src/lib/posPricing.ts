import type { OrderItemVariantSnapshot, Product } from '../types/domain';

export type ParsedCustomOption = {
  id: string;
  label: string;
  priceDelta: number;
};

export type PosLineConfig = {
  qty: number;
  temperature?: 'hot' | 'iced';
  milkId?: string;
  sizeId?: string;
  customizations: OrderItemVariantSnapshot[];
};

export function parseCustomFieldOptions(product: Product): { groupName: string; key: string; options: ParsedCustomOption[] }[] {
  return (product.customFields ?? [])
    .map((field) => {
      const options = field.value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part, index) => {
          const [labelPart, pricePart] = part.split('|').map((v) => v.trim());
          const maybePrice = Number(pricePart ?? 0);
          return {
            id: `${field.id}_${index}`,
            label: labelPart,
            priceDelta: Number.isFinite(maybePrice) ? maybePrice : 0,
          };
        });
      return { groupName: field.label, key: field.key, options };
    })
    .filter((item) => item.options.length > 0);
}

export function resolvePosUnitPrice(
  product: Product,
  config: Pick<PosLineConfig, 'milkId' | 'sizeId' | 'customizations'>,
): { unit: number; milkLabel?: string; sizeLabel?: string } {
  let unit = product.basePrice;
  let milkLabel: string | undefined;
  let sizeLabel: string | undefined;

  if (config.sizeId) {
    const size = product.sizes.find((item) => item.id === config.sizeId);
    if (size) {
      unit += size.priceDelta;
      sizeLabel = size.label;
    }
  }

  if (config.milkId) {
    const milk = product.milks.find((item) => item.id === config.milkId);
    if (milk) {
      unit += milk.priceDelta;
      milkLabel = milk.label;
    }
  }

  for (const custom of config.customizations) {
    unit += custom.priceDelta;
  }

  return { unit, milkLabel, sizeLabel };
}

export function defaultPosLineConfig(product: Product): PosLineConfig {
  const customGroups = parseCustomFieldOptions(product);
  return {
    qty: 1,
    temperature: product.temperature === 'both' ? 'hot' : product.temperature === 'iced' ? 'iced' : 'hot',
    milkId: product.milks[0]?.id,
    sizeId: product.sizes[0]?.id,
    customizations: customGroups.map((group) => ({
      groupName: group.groupName,
      optionLabel: group.options[0]?.label ?? '',
      priceDelta: group.options[0]?.priceDelta ?? 0,
    })),
  };
}
