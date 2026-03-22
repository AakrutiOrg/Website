export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  base_price: number | null;
  sku: string | null;
  material: string | null;
  art_type: "brass_framed" | "brass_non_framed" | "fabric_patchwork";
  is_framed: boolean;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MarketAwareProduct = {
  product_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  sku: string | null;
  material: string | null;
  art_type: string;
  is_framed: boolean;
  is_featured: boolean;
  
  market_id: string;
  market_code: string;
  market_name: string;
  market_currency: string;
  
  product_market_data_id: string;
  price: number | null;
  cost_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  market_active: boolean;
  loyverse_item_id: string | null;
  external_sku: string | null;
  
  primary_image_url: string | null;
};
