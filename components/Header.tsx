'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import siteData from '@/data/site.json';
import { useRouter } from 'next/navigation';
import { Currency, setCurrency, useCurrency } from '@/lib/currency';

export default function Header() {
  const { items, setIsCartOpen } = useCart();
  const currency = useCurrency();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <header className="w-full font-sans">
      {/* Top Black Bar */}
      <div className="bg-[#111111] text-white text-[11px] font-medium py-2 px-6 flex justify-between items-center tracking-widest uppercase">
        <div className="hidden md:block">
          {siteData.announcement}
        </div>
        <div className="flex items-center space-x-6 ml-auto">
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="bg-transparent text-white uppercase tracking-widest cursor-pointer outline-none"
          >
            <option value="INR" className="text-black">₹ INR</option>
            <option value="CAD" className="text-black">CA$ CAD</option>
          </select>
          <Link href="#" className="flex items-center hover:text-gray-300">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Login
          </Link>
          <button className="flex items-center hover:text-gray-300" onClick={() => setIsCartOpen(true)}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            {items.reduce((a, b) => a + b.quantity, 0)}
          </button>
        </div>
      </div>
      
      {/* Main White Header */}
      <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-200">
        {/* Logo */}
        <div className="flex-shrink-0 w-1/4">
          <Link href="/" className="inline-flex flex-col text-black">
            <span className="text-2xl font-serif tracking-[0.15em] uppercase leading-none">Patiala</span>
            <span className="text-[9px] font-sans tracking-[0.3em] uppercase mt-1">Sports House</span>
          </Link>
        </div>
        
        {/* Center Menu */}
        <nav className="hidden lg:flex flex-1 justify-center space-x-7 text-[12px] font-medium text-black">
          {siteData.categories.slice(0, 6).map(cat => (
            <div key={cat.slug} className="group relative cursor-pointer">
              <Link href={`/collections/${cat.slug}`} className="flex items-center hover:text-gray-600">
                {cat.name.replace(' and ', ' & ')}
                <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </Link>
            </div>
          ))}
          <div className="relative group cursor-pointer">
             <span className="flex items-center hover:text-gray-600">
               More
               <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </span>
             <div className="absolute top-full left-0 pt-4 hidden group-hover:block z-50">
               <div className="bg-white shadow-lg border border-gray-100 min-w-[150px] py-2">
                 {siteData.categories.slice(6).map(cat => (
                   <Link key={cat.slug} href={`/collections/${cat.slug}`} className="block px-4 py-2 text-[12px] hover:bg-gray-50 text-black">
                     {cat.name}
                   </Link>
                 ))}
               </div>
             </div>
          </div>
        </nav>

        {/* Right Search */}
        <div className="flex-shrink-0 w-1/4 flex justify-end">
          <form onSubmit={handleSearch} className="relative w-full max-w-[220px]">
            <input 
              type="text" 
              placeholder="Search" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-400 rounded-none pl-3 pr-8 py-1.5 text-[13px] focus:outline-none focus:border-black transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1.5 text-gray-500 hover:text-black">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}