export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  priceCad?: number | null;
  compareAtPrice: number | null;
  description: string;
  specs: { name: string; value: string }[];
  variants: string[] | null;
  imagePaths: string[];
  tags: string[];
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedVariant?: string;
}