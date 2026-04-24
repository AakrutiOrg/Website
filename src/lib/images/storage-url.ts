import "server-only";

type ParsedStorageUrl = {
  bucket: "product-images" | "category-images";
  storagePath: string;
};

export function parseSupabaseStoragePublicUrl(url: string | null | undefined): ParsedStorageUrl | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const marker = "/storage/v1/object/public/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const publicPath = parsedUrl.pathname.slice(markerIndex + marker.length);
    const firstSlashIndex = publicPath.indexOf("/");

    if (firstSlashIndex === -1) {
      return null;
    }

    const bucket = publicPath.slice(0, firstSlashIndex);
    const storagePath = publicPath.slice(firstSlashIndex + 1);

    if (
      (bucket !== "product-images" && bucket !== "category-images")
      || !storagePath
    ) {
      return null;
    }

    return {
      bucket,
      storagePath,
    };
  } catch {
    return null;
  }
}
