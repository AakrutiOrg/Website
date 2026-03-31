export type OrderStatus = "pending" | "confirmed" | "contacted" | "fulfilled" | "closed" | "cancelled";
export type DeliveryType = "tracked" | "home_delivery";

export type Order = {
  id: string;
  order_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  notes: string | null;
  status: OrderStatus;
  subtotal: number | null;
  total_items: number;
  email_status: "pending" | "sent" | "failed";
  tracking_number: string | null;
  shipping_company: string | null;
  tracking_url: string | null;
  delivery_type: DeliveryType | null;
  cancellation_reason: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_db_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  product_slug_snapshot: string | null;
  unit_price_snapshot: number | null;
  quantity: number;
  selected_variant_json: { size?: string | null; color?: string | null } | null;
  created_at: string;
};
