import type { MarketAwareProduct } from "./product";

export type PosPaymentMethod = "cash" | "sumup_solo";

export type PosBasketItem = {
  productId: string;
  quantity: number;
};

export type PosCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type PosDiscountType = "percentage" | "absolute";

export type PosSaleInput = {
  customer: PosCustomer;
  items: PosBasketItem[];
  paymentMethod: PosPaymentMethod;
  discountType?: PosDiscountType | null;
  discountAmount?: number | null;
};

export type PosSaleResult = {
  ok: boolean;
  orderId?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  message: string;
};

export type PosDeviceTestResult = {
  ok: boolean;
  message: string;
  deviceStatus?: "ONLINE" | "OFFLINE" | "UNKNOWN";
  readerState?: string | null;
  firmwareVersion?: string | null;
  lastActivity?: string | null;
  batteryLevel?: number | null;
  connectionType?: string | null;
  testedAt: string;
};

export type PosCatalogItem = Pick<
  MarketAwareProduct,
  | "product_id"
  | "name"
  | "slug"
  | "category_name"
  | "market_currency"
  | "price"
  | "stock_quantity"
  | "low_stock_threshold"
  | "primary_image_url"
>;
