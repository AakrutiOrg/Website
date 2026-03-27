"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function addProductImage(productId: string, storagePath: string) {
  await requireAdmin();
  const supabase = await createClient();

  // If no primary image exists yet, make this one primary
  const { data: existing } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .maybeSingle();

  const isPrimary = !existing;

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    is_primary: isPrimary,
  });

  if (error) {
    throw new Error(`Failed to save image metadata: ${error.message}`);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/");
  revalidatePath("/categories", "layout");
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

export async function setPrimaryImage(productId: string, imageId: string) {
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

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/categories", "layout");
}
