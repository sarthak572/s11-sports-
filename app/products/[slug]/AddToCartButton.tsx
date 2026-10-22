'use client';

import { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { Product } from '@/types';
import siteData from '@/data/site.json';
import { formatPrice, productPrice, useCurrency } from '@/lib/currency';

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const currency = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(product.variants?.[0] || '');

  const handleAdd = () => {
    addToCart(product, quantity, variant);
  };

  const price = formatPrice(productPrice(product, currency).price, currency);
  const whatsappMsg = encodeURIComponent(`Hi, I want to order ${product.name}${variant ? ` (Size: ${variant})` : ''} for ${price}`);
  const whatsappUrl = `https://wa.me/${siteData.store.phone.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

  return (
    <div className="space-y-6">
      {product.variants && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Size / Variant</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map(v => (
              <button 
                key={v}
                onClick={() => setVariant(v)}
                className={`px-4 py-2 border rounded-md ${variant === v ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-md">
          <button className="px-4 py-3 hover:bg-gray-100" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span className="w-8 text-center">{quantity}</span>
          <button className="px-4 py-3 hover:bg-gray-100" onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        <button onClick={handleAdd} className="flex-1 bg-navy-900 hover:bg-black text-white font-bold py-3 px-8 rounded-md transition-colors">
          Add to Cart
        </button>
      </div>

      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block w-full text-center border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 rounded-md transition-colors">
        Order on WhatsApp
      </a>
    </div>
  );
}