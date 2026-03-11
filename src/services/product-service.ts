import type { Product } from "@/types";

const placeholderProducts: Product[] = [];

export async function getFeaturedProducts(): Promise<Product[]> {
  return placeholderProducts;
}
