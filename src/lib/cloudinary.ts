import "server-only";
import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_FOLDER = "ym-textiles";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not set");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return { cloudName, apiKey, apiSecret };
}

/**
 * Signature for a direct browser-to-Cloudinary upload. Files never pass through
 * our server, which avoids Vercel's request body size limit.
 */
export function createUploadSignature(subfolder: string) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `${CLOUDINARY_FOLDER}/${subfolder}`;
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
  return { cloudName, apiKey, timestamp, folder, signature };
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  config();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Losing an orphaned image is harmless, so we log and continue.
    console.error("Cloudinary delete failed", publicId, error);
  }
}
