-- 1. Create a public bucket named category-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for Storage Objects for the category-images bucket
CREATE POLICY "Give public access to category-images" ON storage.objects
FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Admins can upload category-images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'category-images' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update category-images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'category-images' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete category-images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'category-images' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
