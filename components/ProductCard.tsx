import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import PriceTag from '@/components/PriceTag';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block text-center">
      <div className="bg-gray-100 aspect-[4/5] relative overflow-hidden mb-4">
        <Image 
          src={product.imagePaths[0]} 
          alt={product.name} unoptimized
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {product.tags.includes('new') && (
          <span className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase tracking-widest px-2 py-1">New</span>
        )}
      </div>
      <div className="text-gray-500 text-[11px] mb-1 uppercase tracking-widest">{product.brand}</div>
      <h3 className="text-[13px] font-medium text-gray-900 group-hover:text-gray-500 transition-colors mb-2 line-clamp-1 px-2">{product.name}</h3>
      <div className="flex items-center justify-center space-x-2 text-[13px]">
        <PriceTag product={product} className="font-medium" compareClassName="text-gray-400 line-through" />
      </div>
    </Link>
  );
}