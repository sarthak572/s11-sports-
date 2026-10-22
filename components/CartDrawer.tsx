'use client';
import { useCart } from '@/lib/CartContext';
import Image from 'next/image';
import siteData from '@/data/site.json';
import { formatPrice, productPrice, useCurrency } from '@/lib/currency';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const currency = useCurrency();

  if (!isCartOpen) return null;

  const unitPrice = (item: (typeof items)[number]) => productPrice(item, currency).price;
  const cartTotal = items.reduce((total, item) => total + unitPrice(item) * item.quantity, 0);

  const generateWhatsAppMessage = () => {
    let msg = `Hello ${siteData.store.name}, I would like to order:\n`;
    items.forEach(item => {
      msg += `- ${item.quantity}x ${item.name} ${item.selectedVariant ? `(${item.selectedVariant})` : ''} - ${formatPrice(unitPrice(item) * item.quantity, currency)}\n`;
    });
    msg += `Total: ${formatPrice(cartTotal, currency)}`;
    return encodeURIComponent(msg);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsCartOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white z-[70] shadow-xl flex flex-col transform transition-transform">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-black">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">Your cart is empty</div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.cartId} className="flex gap-4 border-b pb-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded">
                    <Image src={item.imagePaths[0]} alt={item.name} fill className="object-cover rounded" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-1">{item.name}</h3>
                    {item.selectedVariant && <p className="text-sm text-gray-500">Size: {item.selectedVariant}</p>}
                    <p className="font-bold mt-1">{formatPrice(unitPrice(item), currency)}</p>
                    <div className="flex items-center mt-2 space-x-3">
                      <button className="px-2 bg-gray-100" onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button className="px-2 bg-gray-100" onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>+</button>
                      <button className="text-red-500 text-sm ml-auto" onClick={() => removeFromCart(item.cartId)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal, currency)}</span>
            </div>
            <button className="w-full bg-navy-900 text-white py-3 rounded mb-2 hover:bg-black transition-colors" onClick={() => alert("Checkout coming soon!")}>
              Checkout (Coming Soon)
            </button>
            <a 
              href={`https://wa.me/${siteData.store.phone.replace(/[^0-9]/g, '')}?text=${generateWhatsAppMessage()}`} 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-[#25D366] text-white py-3 rounded flex justify-center items-center hover:bg-[#128C7E] transition-colors"
            >
              Order via WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}