"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { uploadOptimizedImage } from "@/lib/images/upload-optimized-image";
import { parseSupabaseStoragePublicUrl } from "@/lib/images/storage-url";
import { createClient } from "@/lib/supabase/server";

async function resolveCategoryImageUrl(formData: FormData, existingUrl?: string | null) {
  const imageFile = formData.get("image");

  if (imageFile instanceof File && imageFile.size > 0) {
    const { publicUrl } = await uploadOptimizedImage({
      bucket: "category-images",
      folder: "categories",
      file: imageFile,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 80,
    });

    return publicUrl;
  }

  return existingUrl ?? null;
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const sort_order = parseInt(formData.get("sort_order") as string || "0", 10);
  const is_active = formData.get("is_active") === "on";
  const image_url = await resolveCategoryImageUrl(formData);

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description,
    sort_order,
    image_url,
    is_active,
  });

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const sort_order = parseInt(formData.get("sort_order") as string || "0", 10);
  const is_active = formData.get("is_active") === "on";
  const { data: existingCategory } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", id)
    .single();
  const image_url = await resolveCategoryImageUrl(formData, existingCategory?.image_url ?? null);

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description,
      sort_order,
      image_url,
      is_active,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  const previousImage = parseSupabaseStoragePublicUrl(existingCategory?.image_url);
  const nextImage = parseSupabaseStoragePublicUrl(image_url);
  const hasReplacedManagedImage =
    previousImage
    && (!nextImage || previousImage.bucket !== nextImage.bucket || previousImage.storagePath !== nextImage.storagePath);

  if (hasReplacedManagedImage) {
    const { error: storageError } = await supabase.storage
      .from(previousImage.bucket)
      .remove([previousImage.storagePath]);

    if (storageError) {
      console.error("Failed to delete replaced category image from storage:", storageError);
    }
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}/edit`);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  const existingImage = parseSupabaseStoragePublicUrl(category?.image_url);
  if (existingImage) {
    const { error: storageError } = await supabase.storage
      .from(existingImage.bucket)
      .remove([existingImage.storagePath]);

    if (storageError) {
      console.error("Failed to delete category image from storage:", storageError);
    }
  }

  revalidatePath("/admin/categories");
}
