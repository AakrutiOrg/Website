export type Market = {
  id: string;
  name: string;
  code: string;
  currency: string;
  is_active: boolean;
  sort_order: number;
};

export type ProductMarketData = {
  id: string;
  product_id: string;
  market_id: string;
  price: number | null;
  cost_price: number | null;
  currency: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  loyverse_item_id: string | null;
  external_sku: string | null;
};
