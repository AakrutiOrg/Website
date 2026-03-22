"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const sort_order = parseInt(formData.get("sort_order") as string || "0", 10);
  const image_url = formData.get("image_url") as string;
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description,
    sort_order,
    image_url: image_url || null,
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
  const image_url = formData.get("image_url") as string;
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description,
      sort_order,
      image_url: image_url || null,
      is_active,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}/edit`);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  revalidatePath("/admin/categories");
}
