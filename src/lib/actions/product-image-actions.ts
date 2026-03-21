"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function addProductImage(productId: string, storagePath: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    is_primary: false,
  });

  if (error) {
    throw new Error(`Failed to save image metadata: ${error.message}`);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteProductImage(imageId: string, storagePath: string, productId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // 1. Remove from storage bucket
  const { error: storageError } = await supabase.storage.from("product-images").remove([storagePath]);

  if (storageError) {
    throw new Error(`Failed to delete file from storage: ${storageError.message}`);
  }

  // 2. Remove metadata from product_images
  const { error: dbError } = await supabase.from("product_images").delete().eq("id", imageId);

  if (dbError) {
    throw new Error(`Failed to delete image record: ${dbError.message}`);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function setPrimaryImage(productId: string, imageId: string, storagePath: string) {
  await requireAdmin();
  const supabase = await createClient();

  // 1. Unset all siblings
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  // 2. Set this image as primary
  const { error: primaryError } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  if (primaryError) {
    throw new Error(`Failed to set primary image: ${primaryError.message}`);
  }

  // 3. Sync to products table for backward compatibility
  const publicUrl = supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;

  const { error: productError } = await supabase
    .from("products")
    .update({ image_url: publicUrl })
    .eq("id", productId);

  if (productError) {
    throw new Error(`Failed to sync primary image to product: ${productError.message}`);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
}
