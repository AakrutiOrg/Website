export const CART_STORAGE_KEY = "aakruti-cart";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  quantity: number;
  stockQuantity: number;
  size?: string | null;
  color?: string | null;
};
