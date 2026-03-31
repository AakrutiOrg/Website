"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getMarkets } from "@/services/markets/get-markets";
import type { ProductAttributes } from "@/types";

function buildProductAttributes(formData: FormData): ProductAttributes | null {
  const size = (formData.get("size") as string)?.trim();
  const sizeUnit = (formData.get("size_unit") as string)?.trim();
  const color = (formData.get("color") as string)?.trim();
  const material = (formData.get("material") as string)?.trim();
  const frameStyle = (formData.get("frame_style") as string)?.trim();

  const attributes: ProductAttributes = {};

  if (size) {
    attributes.size = size;
    attributes.size_unit = sizeUnit === "cm" ? "cm" : "inch";
  }

  if (color) {
    attributes.color = color;
  }

  if (material) {
    attributes.material = material;
  }

  if (frameStyle === "framed" || frameStyle === "non_framed") {
    attributes.frame_style = frameStyle;
  }

  return Object.keys(attributes).length > 0 ? attributes : null;
}

async function upsertMarketData(productId: string, formData: FormData) {
  const supabase = await createClient();
  const markets = await getMarkets();

  for (const market of markets) {
    const priceInput = formData.get(`market_${market.code}_price`) as string;
    const costInput = formData.get(`market_${market.code}_cost`) as string;
    const stockInput = formData.get(`market_${market.code}_stock`) as string;
    const sku = formData.get(`market_${market.code}_sku`) as string;
    const isActive = formData.get(`market_${market.code}_is_active`) === "on";

    const price = priceInput ? parseFloat(priceInput) : null;
    const cost_price = costInput ? parseFloat(costInput) : null;
    const stock_quantity = parseInt(stockInput || "0", 10);

    // Skip creating blank inactive markets if they don't already exist
    if (!isActive && !price && !cost_price && stock_quantity === 0) {
      const { data: existing } = await supabase.from("product_market_data")
        .select("id")
        .eq("product_id", productId)
        .eq("market_id", market.id)
        .single();
        
      if (!existing) {
        continue;
      }
    }
       
    const { error } = await supabase.from("product_market_data").upsert({
      product_id: productId,
      market_id: market.id,
      currency: market.currency,
      price,
      cost_price,
      stock_quantity,
      is_active: isActive,
      external_sku: sku || null
    }, { onConflict: "product_id,market_id" });

    if (error) {
       console.error(`Failed to upsert market data for ${market.code}:`, error);
       throw new Error(`DB Error [${market.code}]: ${error.message} - ${error.details || ''} - ${error.hint || ''}`);
    }
  }
}

async function ensureFeaturedLimit(supabase: Awaited<ReturnType<typeof createClient>>, isFeatured: boolean, currentProductId?: string) {
  if (!isFeatured) {
    return;
  }

  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_featured", true);

  if (currentProductId) {
    query = query.neq("id", currentProductId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to validate precious products limit: ${error.message}`);
  }

  if ((count ?? 0) >= 5) {
    throw new Error("You can only mark up to 5 products as Precious Treasures.");
  }
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const short_description = formData.get("short_description") as string;
  const description = formData.get("description") as string;
  const basePriceInput = formData.get("base_price") as string;
  const category_id = formData.get("category_id") as string;
  const sku = formData.get("sku") as string;
  const art_type = formData.get("art_type") as string;
  const is_active = formData.get("is_active") === "on";
  const is_featured = formData.get("is_featured") === "on";

  const base_price = basePriceInput ? parseFloat(basePriceInput) : null;
  const attributes = buildProductAttributes(formData);

  await ensureFeaturedLimit(supabase, is_featured);

  const { data: product, error } = await supabase.from("products").insert({
    id,
    name,
    slug,
    short_description: short_description || null,
    description: description || null,
    base_price,
    sku: sku || null,
    attributes,
    art_type,
    category_id,
    is_active,
    is_featured,
  }).select("id").single();

  if (error || !product) {
    throw new Error(`Failed to create product globally: ${error?.message}`);
  }

  // Handle uploaded images
  const newImagesStr = formData.get("new_images") as string;
  if (newImagesStr) {
    try {
      const paths = JSON.parse(newImagesStr) as string[];
      for (const [index, path] of paths.entries()) {
        await supabase.from("product_images").insert({
          product_id: product.id,
          storage_path: path,
          is_primary: index === 0, // Make the first image primary by default
        });
        
        // If it's the primary image, sync the public URL to products.image_url
        if (index === 0) {
          const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
          await supabase.from("products").update({ image_url: publicUrl }).eq("id", product.id);
        }
      }
    } catch(e) {
      console.error("Failed to parse and insert images:", e);
    }
  }

  // Handle distinct market matrices
  await upsertMarketData(product.id, formData);

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const short_description = formData.get("short_description") as string;
  const description = formData.get("description") as string;
  const basePriceInput = formData.get("base_price") as string;
  const category_id = formData.get("category_id") as string;
  const sku = formData.get("sku") as string;
  const art_type = formData.get("art_type") as string;
  const is_active = formData.get("is_active") === "on";
  const is_featured = formData.get("is_featured") === "on";

  const base_price = basePriceInput ? parseFloat(basePriceInput) : null;
  const attributes = buildProductAttributes(formData);

  await ensureFeaturedLimit(supabase, is_featured, id);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      short_description: short_description || null,
      description: description || null,
      base_price,
      sku: sku || null,
      attributes,
      art_type,
      category_id,
      is_active,
      is_featured,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update global product structure: ${error.message}`);
  }

  // Handle appended uploaded images
  const newImagesStr = formData.get("new_images") as string;
  if (newImagesStr) {
    try {
      const paths = JSON.parse(newImagesStr) as string[];
      // Check if product already has a primary image
      const { data: existingImages } = await supabase
         .from("product_images")
         .select("id")
         .eq("product_id", id)
         .eq("is_primary", true);
         
      const needsPrimary = !existingImages || existingImages.length === 0;

      for (const [index, path] of paths.entries()) {
        const isFirstUploadHere = needsPrimary && index === 0;
        await supabase.from("product_images").insert({
          product_id: id,
          storage_path: path,
          is_primary: isFirstUploadHere, 
        });
        
        if (isFirstUploadHere) {
          const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
          await supabase.from("products").update({ image_url: publicUrl }).eq("id", id);
        }
      }
    } catch(e) {
      console.error("Failed to parse and insert images:", e);
    }
  }

  // Handle distinct market matrices
  await upsertMarketData(id, formData);

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

