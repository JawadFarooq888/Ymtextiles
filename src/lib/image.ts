/**
 * Insert Cloudinary transformations (auto format/quality, width) into a delivery URL.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryUrl(url: string, width?: number): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const transforms = ["f_auto", "q_auto", width ? `w_${width}` : null, "c_limit"]
    .filter(Boolean)
    .join(",");
  return url.replace(marker, `${marker}${transforms}/`);
}
