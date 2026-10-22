import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products as productsData } from '@/lib/products';
import siteData from '@/data/site.json';
import ProductCard from '@/components/ProductCard';
import PriceTag from '@/components/PriceTag';
import AddToCartButton from './AddToCartButton'; // Client Component

export function generateStaticParams() {
  return productsData.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = productsData.find(p => p.slug === slug);
  
  if (!product) {
    notFound();
  }

  const relatedProducts = productsData
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-black">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/collections/${product.category}`} className="hover:text-black capitalize">
          {product.category.replace('-', ' ')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
            <Image src={product.imagePaths[0]} alt={product.name} fill className="object-cover" />
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">{product.brand}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center space-x-4 mb-6">
            <PriceTag product={product} className="text-2xl font-bold" compareClassName="text-lg text-gray-400 line-through" />
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Incl. of all taxes</span>
          </div>

          <p className="text-gray-700 mb-8">{product.description}</p>

          <AddToCartButton product={product} />

          <div className="mt-12 border-t pt-8">
            <h3 className="font-bold text-lg mb-4">Specifications</h3>
            <div className="grid grid-cols-2 gap-y-3">
              {product.specs.map((spec, i) => (
                <div key={i}>
                  <span className="text-gray-500 block text-sm">{spec.name}</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 border-t">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}