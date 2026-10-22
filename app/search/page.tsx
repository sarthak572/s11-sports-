'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { products as productsData } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (q) {
      const lowerQ = q.toLowerCase();
      const filtered = productsData.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.brand.toLowerCase().includes(lowerQ) ||
        p.category.toLowerCase().includes(lowerQ)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [q]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-500 mb-8">Showing results for "{q}"</p>
      
      {results.length === 0 ? (
        <div className="text-center py-20 border-t">
          <p className="text-gray-500 mb-4">No products found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t pt-8">
          {results.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}