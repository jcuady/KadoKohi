import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../types/domain';
import {
  DEFAULT_MENU_PRODUCT_IMAGE,
  getMenuProductImageFallbackChain,
} from '../../lib/menuCatalog';

type Props = {
  product: Pick<Product, 'image' | 'categoryId'>;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  pastriesCategoryId?: string;
};

export default function MenuProductImage({
  product,
  alt,
  className = '',
  loading = 'lazy',
  pastriesCategoryId,
}: Props) {
  const chain = useMemo(
    () => getMenuProductImageFallbackChain(product, { pastriesCategoryId }),
    [product.image, product.categoryId, pastriesCategoryId],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [product.image, product.categoryId, pastriesCategoryId]);

  const src = chain[Math.min(index, chain.length - 1)] ?? DEFAULT_MENU_PRODUCT_IMAGE;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        setIndex((i) => (i + 1 < chain.length ? i + 1 : i));
      }}
    />
  );
}
