'use client';
import { Product } from '@/types';
import { formatPrice, productPrice, useCurrency } from '@/lib/currency';

export default function PriceTag({ product, className, compareClassName }: {
  product: Pick<Product, 'price' | 'priceCad' | 'compareAtPrice'>;
  className?: string;
  compareClassName?: string;
}) {
  const currency = useCurrency();
  const { price, compareAtPrice } = productPrice(product, currency);
  return (
    <>
      <span className={className}>{formatPrice(price, currency)}</span>
      {compareAtPrice && <span className={compareClassName}>{formatPrice(compareAtPrice, currency)}</span>}
    </>
  );
}
