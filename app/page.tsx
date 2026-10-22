import Image from 'next/image';
import Link from 'next/link';
import siteData from '@/data/site.json';
import { products as productsData } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const bestSellers = productsData.filter(p => p.tags.includes('bestseller')).slice(0, 4);
  
  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] bg-gray-100 flex flex-col justify-center items-center overflow-hidden">
        <Image 
          src="/s11-sports-/images/hero/hero-video-poster.webp"
          alt="Sports Store"
          fill
          priority
          unoptimized
          className="object-cover"
        />
        {/* Subtle overlay so text is readable if there's text, but Devans has no text in center usually. 
            The prompt says "headline, tagline, and buttons". Let's make them elegant and not so brutalist. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-10" />
        
        <div className="relative z-20 text-center text-white px-8 py-10 flex flex-col items-center mt-12 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 max-w-2xl mx-auto shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-wide">{siteData.store.name}</h1>
          <p className="text-lg md:text-xl mb-10 font-light tracking-wider text-gray-200">{siteData.store.tagline}</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/collections/cricket" className="bg-white text-black font-semibold text-sm py-3 px-10 tracking-widest uppercase hover:bg-gray-100 transition-colors">
              Shop Now
            </Link>
            <a href={`https://wa.me/${siteData.store.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="bg-transparent border border-white text-white font-semibold text-sm py-3 px-10 tracking-widest uppercase hover:bg-white/10 transition-colors">
              WhatsApp Order
            </a>
          </div>
        </div>
      </section>

      {/* Brand Strip (Elegant text only) */}
      <section className="py-6 border-b border-gray-200">
        <div className="container mx-auto px-4 flex justify-center items-center flex-wrap gap-8 md:gap-16">
          {siteData.brands.map((brand, idx) => (
            <div key={idx} className="text-lg font-serif text-gray-500 uppercase tracking-widest">{brand}</div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-serif font-medium tracking-wide">Shop by Category</h2>
          <div className="w-12 h-[1px] bg-black mx-auto mt-4"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {siteData.categories.slice(0, 5).map(cat => (
            <Link key={cat.slug} href={`/collections/${cat.slug}`} className="group block text-center">
              <div className="relative aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
                <Image src={`/s11-sports-/images/categories/${cat.slug}.webp`} alt={cat.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="text-[13px] font-medium tracking-wider uppercase group-hover:text-gray-500">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-serif font-medium tracking-wide">Featured Products</h2>
            <div className="w-12 h-[1px] bg-black mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      {/* ... keeping other sections simple and elegant ... */}
    </div>
  );
}