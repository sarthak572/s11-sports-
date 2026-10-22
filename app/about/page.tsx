import Image from 'next/image';
import siteData from '@/data/site.json';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About {siteData.store.name}</h1>
        
        <div className="relative h-80 md:h-[400px] rounded-xl overflow-hidden mb-12">
          <Image src="/s11-sports-/images/store/about-us.webp" alt="About Us" fill className="object-cover" />
        </div>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <p>
            {siteData.store.shortStory} What started as a small shop catering to local cricket enthusiasts has grown into Patiala's premier destination for sports goods and fitness equipment.
          </p>
          <p>
            Our mission is simple: to provide athletes of all levels with top-quality gear at competitive prices. Whether you're a beginner buying your first badminton racket, a school team needing bulk uniforms, or a professional cricketer looking for a custom-knocked English willow bat, we have you covered.
          </p>
          <h2 className="text-2xl font-bold text-black mt-8 mb-4">Why Choose Us?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Authentic Products:</strong> We source directly from major brands like SG, SS, Yonex, and Nivia.</li>
            <li><strong>Expert Advice:</strong> Our staff includes former players who understand the equipment.</li>
            <li><strong>Specialized Services:</strong> Racket stringing, bat knocking, and custom kit printing.</li>
            <li><strong>Community Focus:</strong> Proud supporters of local schools and sports academies in Punjab.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}