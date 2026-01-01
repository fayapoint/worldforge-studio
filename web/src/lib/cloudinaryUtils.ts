// Cloudinary transformation utilities for image variations

export type CloudinaryTransform = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "scale" | "thumb" | "crop" | "pad";
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  effect?: string;
  radius?: number | "max";
  aspect?: string;
};

export type ImageVariation = {
  id: string;
  label: string;
  icon: string;
  description: string;
  transform: CloudinaryTransform;
};

export const IMAGE_VARIATIONS: ImageVariation[] = [
  {
    id: "thumbnail",
    label: "Thumbnail",
    icon: "image",
    description: "Small square thumbnail (150x150)",
    transform: { width: 150, height: 150, crop: "fill", gravity: "face", quality: "auto", format: "auto" },
  },
  {
    id: "avatar",
    label: "Avatar",
    icon: "character",
    description: "Circular avatar (200x200)",
    transform: { width: 200, height: 200, crop: "fill", gravity: "face", radius: "max", quality: "auto", format: "auto" },
  },
  {
    id: "card",
    label: "Card",
    icon: "project",
    description: "Card size (400x300)",
    transform: { width: 400, height: 300, crop: "fill", gravity: "auto", quality: "auto", format: "auto" },
  },
  {
    id: "portrait",
    label: "Portrait",
    icon: "character",
    description: "Portrait ratio (600x800)",
    transform: { width: 600, height: 800, crop: "fill", gravity: "face", quality: "auto", format: "auto" },
  },
  {
    id: "landscape",
    label: "Landscape",
    icon: "location",
    description: "Wide ratio (1200x675)",
    transform: { width: 1200, height: 675, crop: "fill", gravity: "auto", quality: "auto", format: "auto" },
  },
  {
    id: "square",
    label: "Square",
    icon: "fullscreen",
    description: "Square format (800x800)",
    transform: { width: 800, height: 800, crop: "fill", gravity: "auto", quality: "auto", format: "auto" },
  },
  {
    id: "hd",
    label: "HD",
    icon: "maximize",
    description: "High definition (1920x1080)",
    transform: { width: 1920, height: 1080, crop: "fit", quality: "auto", format: "auto" },
  },
  {
    id: "original",
    label: "Original",
    icon: "download",
    description: "Original quality",
    transform: { quality: "auto", format: "auto" },
  },
];

export function buildCloudinaryUrl(publicId: string, transform: CloudinaryTransform): string {
  if (!publicId) return "";

  // Extract cloud name from publicId if it's a full URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  
  const transformParts: string[] = [];

  if (transform.width) transformParts.push(`w_${transform.width}`);
  if (transform.height) transformParts.push(`h_${transform.height}`);
  if (transform.crop) transformParts.push(`c_${transform.crop}`);
  if (transform.gravity) transformParts.push(`g_${transform.gravity}`);
  if (transform.quality) transformParts.push(`q_${transform.quality}`);
  if (transform.format) transformParts.push(`f_${transform.format}`);
  if (transform.radius) transformParts.push(`r_${transform.radius}`);
  if (transform.aspect) transformParts.push(`ar_${transform.aspect}`);
  if (transform.effect) transformParts.push(`e_${transform.effect}`);

  const transformString = transformParts.join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

export function getTransformedUrl(originalUrl: string, transform: CloudinaryTransform): string {
  if (!originalUrl) return "";

  // Check if it's already a Cloudinary URL
  const cloudinaryMatch = originalUrl.match(
    /https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:([^/]+)\/)?(.+)/
  );

  if (cloudinaryMatch) {
    const [, cloudName, , publicId] = cloudinaryMatch;
    const transformParts: string[] = [];

    if (transform.width) transformParts.push(`w_${transform.width}`);
    if (transform.height) transformParts.push(`h_${transform.height}`);
    if (transform.crop) transformParts.push(`c_${transform.crop}`);
    if (transform.gravity) transformParts.push(`g_${transform.gravity}`);
    if (transform.quality) transformParts.push(`q_${transform.quality}`);
    if (transform.format) transformParts.push(`f_${transform.format}`);
    if (transform.radius) transformParts.push(`r_${transform.radius}`);
    if (transform.aspect) transformParts.push(`ar_${transform.aspect}`);
    if (transform.effect) transformParts.push(`e_${transform.effect}`);

    const transformString = transformParts.join(",");
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
  }

  // Return original if not Cloudinary
  return originalUrl;
}

export function extractPublicId(cloudinaryUrl: string): string | null {
  const match = cloudinaryUrl.match(
    /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:[^/]+\/)?(.+)/
  );
  return match ? match[1] : null;
}

export function getAllVariationsForUrl(originalUrl: string): { variation: ImageVariation; url: string }[] {
  return IMAGE_VARIATIONS.map((variation) => ({
    variation,
    url: getTransformedUrl(originalUrl, variation.transform),
  }));
}
