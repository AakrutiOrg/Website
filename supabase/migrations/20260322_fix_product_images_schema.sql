-- =========================================
-- FIX PRODUCT IMAGES SCHEMA OVERLAP
-- =========================================

begin;

-- Rename legacy image_url column to storage_path if it exists
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'product_images' 
          AND column_name = 'image_url'
    ) THEN 
        ALTER TABLE public.product_images RENAME COLUMN image_url TO storage_path;
    END IF; 
END $$;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

commit;
