-- 1. Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Trigger for updated_at
CREATE TRIGGER set_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. Enable RLS for table
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images are viewable by everyone" ON public.product_images
FOR SELECT USING (TRUE);

CREATE POLICY "Product images are insertable, updateable, deletable by admins only" ON public.product_images
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Create proper bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

-- 5. Set up RLS for Storage Objects
CREATE POLICY "Give public access to product-images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product-images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update product-images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete product-images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'product-images' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
