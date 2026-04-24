"use server";

import "server-only";

import sharp from "sharp";

import { createClient } from "@/lib/supabase/server";

const MAX_SOURCE_FILE_SIZE = 15 * 1024 * 1024;

type UploadOptimizedImageOptions = {
  bucket: "product-images" | "category-images";
  folder: string;
  file: File;
  maxWidth: number;
  maxHeight: number;
  quality?: number;
};

type UploadOptimizedImageResult = {
  storagePath: string;
  publicUrl: string;
};

function sanitizeFileStem(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim().toLowerCase();
  const safe = baseName.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return safe || "image";
}

export async function uploadOptimizedImage({
  bucket,
  folder,
  file,
  maxWidth,
  maxHeight,
  quality = 82,
}: UploadOptimizedImageOptions): Promise<UploadOptimizedImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is not a supported image file.`);
  }

  if (file.size > MAX_SOURCE_FILE_SIZE) {
    throw new Error(`"${file.name}" is too large. Please keep uploads under 15MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const optimizedBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer();

  const fileStem = sanitizeFileStem(file.name);
  const storagePath = `${folder}/${Date.now()}-${crypto.randomUUID()}-${fileStem}.webp`;
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, optimizedBuffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload optimized image: ${uploadError.message}`);
  }

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;

  return {
    storagePath,
    publicUrl,
  };
}
