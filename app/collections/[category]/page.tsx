import ProductCard from '@/components/ProductCard';
import { products as productsData } from '@/lib/products';
import siteData from '@/data/site.json';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return siteData.categories.map((c) => ({
    category: c.slug,
  }));
}

export default async function CollectionPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  const category = resolvedParams.category;
  const categoryData = siteData.categories.find(c => c.slug === category);
  
  if (!categoryData) {
    notFound();
  }

  const products = productsData.filter(p => p.category === category);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{categoryData.name}</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="mb-8">
            <h3 className="font-bold mb-4 border-b pb-2">Subcategories</h3>
            <ul className="space-y-2">
              {categoryData.subcategories.map(sub => (
                <li key={sub} className="text-gray-600 hover:text-black cursor-pointer">{sub}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 border-b pb-2">Brands</h3>
            <ul className="space-y-2">
              {siteData.brands.map(brand => (
                <li key={brand} className="text-gray-600 hover:text-black cursor-pointer">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>{brand}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-500">{products.length} products</div>
            <select className="border border-gray-300 rounded px-3 py-1">
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No products found in this category.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}