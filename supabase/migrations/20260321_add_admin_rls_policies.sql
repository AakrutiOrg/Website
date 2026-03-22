-- =========================================
-- ADMIN RLS POLICIES FOR CATALOG TABLES
-- =========================================

-- Admin full access policies for categories
CREATE POLICY "Categories are modifyable by admins" ON public.categories
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin full access policies for products
CREATE POLICY "Products are modifyable by admins" ON public.products
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin full access policies for product_images
CREATE POLICY "Product images are modifyable by admins" ON public.product_images
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin full access policies for product_variants (Optional depending on if it's used yet)
CREATE POLICY "Product variants are modifyable by admins" ON public.product_variants
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
