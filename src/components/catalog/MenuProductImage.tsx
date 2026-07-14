import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../types/domain';
import {
  DEFAULT_MENU_PRODUCT_IMAGE,
  getMenuProductImageFallbackChain,
} from '../../lib/menuCatalog';
import { toWebpSrc } from '../../lib/toWebpSrc';

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
  const chain = useMemo(() => {
    const base = getMenuProductImageFallbackChain(product, { pastriesCategoryId });
    const expanded: string[] = [];
    for (const url of base) {
      const webp = toWebpSrc(url);
      if (webp && webp !== url) expanded.push(webp);
      expanded.push(url);
    }
    return [...new Set(expanded)];
  }, [product.image, product.categoryId, pastriesCategoryId]);
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
      fetchPriority={loading === 'eager' ? 'high' : 'auto'}
      width={800}
      height={600}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      referrerPolicy="no-referrer"
      onError={() => {
        setIndex((i) => (i + 1 < chain.length ? i + 1 : i));
      }}
    />
  );
}
