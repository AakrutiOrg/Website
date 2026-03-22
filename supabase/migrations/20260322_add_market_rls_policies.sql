-- =========================================
-- MARKET DATA RLS POLICIES
-- =========================================

begin;

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_market_data ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access
DROP POLICY IF EXISTS "Public can view markets" ON public.markets;
CREATE POLICY "Public can view markets" ON public.markets FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can view active market data" ON public.product_market_data;
CREATE POLICY "Public can view active market data" ON public.product_market_data 
FOR SELECT USING (is_active = true);

-- 2. Admin All Access (Insert/Update/Delete)
DROP POLICY IF EXISTS "Admins can modify markets" ON public.markets;
CREATE POLICY "Admins can modify markets" ON public.markets
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can modify product_market_data" ON public.product_market_data;
CREATE POLICY "Admins can modify product_market_data" ON public.product_market_data
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

commit;
