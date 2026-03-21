"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const priceInput = formData.get("price") as string;
  const image_url = formData.get("image_url") as string;
  const category_id = formData.get("category_id") as string;
  const is_active = formData.get("is_active") === "on";

  const price = Math.round(parseFloat(priceInput || "0") * 100);

  const { error } = await supabase.from("products").insert({
    name,
    slug,
    description,
    price,
    image_url: image_url || null,
    category_id,
    is_active,
  });

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const priceInput = formData.get("price") as string;
  const image_url = formData.get("image_url") as string;
  const category_id = formData.get("category_id") as string;
  const is_active = formData.get("is_active") === "on";

  const price = Math.round(parseFloat(priceInput || "0") * 100);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      description,
      price,
      image_url: image_url || null,
      category_id,
      is_active,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  revalidatePath("/admin/products");
}
