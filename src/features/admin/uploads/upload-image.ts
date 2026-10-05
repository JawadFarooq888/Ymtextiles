import { getUploadSignature } from "@/features/admin/uploads/actions";

export interface UploadedImage {
  url: string;
  publicId: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

/** Upload one image straight from the browser to Cloudinary using a server-issued signature. */
export async function uploadImage(
  file: File,
  folder: "products" | "categories" | "banners",
): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB`);

  const signed = await getUploadSignature(folder);
  if (!signed.ok) throw new Error(signed.error);
  const { cloudName, apiKey, timestamp, folder: fullFolder, signature } = signed.data;

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", fullFolder);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id };
}
