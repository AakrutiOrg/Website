-- =========================================
-- ORDER FULFILLMENT & CANCELLATION FIELDS
-- =========================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS shipping_company text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS discount_amount numeric,
  ADD COLUMN IF NOT EXISTS discount_type text;


ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_type_valid
  CHECK (delivery_type IS NULL OR delivery_type IN ('tracked', 'home_delivery'));

-- Extend status constraint to include 'fulfilled'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_valid;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_valid CHECK (
  status IN ('pending', 'confirmed', 'contacted', 'fulfilled', 'closed', 'cancelled')
);

-- =========================================
-- ADMIN RLS POLICIES FOR ORDERS
-- =========================================

CREATE POLICY "Orders are manageable by admins" ON public.orders
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Order items are manageable by admins" ON public.order_items
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
