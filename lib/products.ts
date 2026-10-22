import productsData from '@/data/products.json';
import { Product } from '@/types';

// products.json is generated from the Google Sheet at build time (scripts/sync-products.mjs),
// so its inferred JSON type can change; always read it through this typed export.
export const products = productsData as Product[];
