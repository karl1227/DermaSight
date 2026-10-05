/**
 * Image Storage Service
 * Copies captured or gallery images into the app's local document directory.
 * Only the file path is stored in SQLite — not the image blob.
 */

import RNFS from 'react-native-fs';
import { secureId } from '../utils/secureId';

const IMAGE_DIR = `${RNFS.DocumentDirectoryPath}/skinsense_images`;

/** Ensure the images directory exists */
export async function ensureImageDirectory(): Promise<void> {
  const exists = await RNFS.exists(IMAGE_DIR);
  if (!exists) {
    await RNFS.mkdir(IMAGE_DIR);
  }
}

/**
 * Copy an image from a temporary/gallery URI into the app's permanent
 * image directory. Returns the new persistent local path.
 *
 * @param sourceUri - The URI returned by the image picker
 */
export async function saveImageLocally(sourceUri: string): Promise<string> {
  await ensureImageDirectory();

  const timestamp = secureId();
  const candidate = sourceUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const extension = ['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(candidate) ? candidate : 'jpg';
  const fileName = `lesion_${timestamp}.${extension}`;
  const destPath = `${IMAGE_DIR}/${fileName}`;

  // Strip file:// prefix if present for RNFS
  const cleanSource = sourceUri.startsWith('file://')
    ? sourceUri.slice(7)
    : sourceUri;

  const exists = await RNFS.exists(cleanSource);
  if (!exists) {
    throw new Error('The image is no longer available. Please capture or select it again.');
  }

  await RNFS.copyFile(cleanSource, destPath);
  return destPath;
}

/**
 * Delete an image file from local storage.
 * Called when a screening record is deleted.
 */
export async function deleteLocalImage(imagePath: string): Promise<void> {
  try {
    const exists = await RNFS.exists(imagePath);
    if (exists) {
      await RNFS.unlink(imagePath);
    }
  } catch {
    // Non-critical: log and continue if deletion fails
    console.warn('Could not delete a local screening image.');
  }
}

/**
 * Convert a stored path to a displayable URI for Image components.
 * Adds file:// prefix if not already present.
 */
export function toImageUri(path: string): string {
  if (!path) return '';
  return path.startsWith('file://') ? path : `file://${path}`;
}
