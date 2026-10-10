import ImageResizer from 'react-native-image-resizer';
import {
  assessImageQuality,
  cropImageToJpeg,
  type ImageSource,
  type ImageMetadata,
  type CroppedImage,
} from './imageProcessingService';
import { validateSkin } from './skinValidationService';
import { createAutomaticAreaOfInterest } from './segmentationService';
import {
  runPreprocessing,
  type PreprocessingResult,
} from './preprocessingService';

export interface PreparedCapture {
  image: CroppedImage;
  preprocessing: PreprocessingResult;
  cropped: boolean;
  maxZoom: number;
  validationMethod: 'appearance' | 'model';
}

function assertUsableQuality(metrics: {
  brightness: number;
  sharpness: number;
  width: number;
  height: number;
}) {
  const { brightness, sharpness, width, height } = metrics;
  if (width < 224 || height < 224)
    throw new Error(
      'The image is too small. Capture a closer, higher-resolution photo.',
    );
  if (brightness < 35)
    throw new Error('The image is too dark. Use even lighting and retake it.');
  if (brightness > 240)
    throw new Error(
      'The image has too much glare. Reduce direct light and retake it.',
    );
  if (sharpness < 2)
    throw new Error(
      'The image is too blurred or lacks usable detail. Focus on the lesion and retake it.',
    );
}

/** A sequential gate: nothing downstream runs after failed validation. */
export async function prepareCapture(
  source: ImageSource,
  metadata: ImageMetadata | undefined,
  onStage: (stage: string) => void,
  isCancelled: () => boolean = () => false,
  zoom = 1,
): Promise<PreparedCapture> {
  const checkActive = () => {
    if (isCancelled()) throw new Error('Capture cancelled.');
  };
  checkActive();
  onStage('Preparing image');
  const uri =
    source.filePath ??
    (source.base64
      ? `data:${source.mimeType ?? 'image/jpeg'};base64,${source.base64}`
      : '');
  if (!uri)
    throw new Error('The image is unavailable. Please capture it again.');
  let normalized;
  try {
    // Bound JS JPEG decoding memory; normalize orientation and gallery formats.
    normalized = await ImageResizer.createResizedImage(
      uri,
      1024,
      1024,
      'JPEG',
      92,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true },
    );
  } catch {
    throw new Error(
      'This image could not be opened. Capture or select another image.',
    );
  }
  const image: CroppedImage = {
    uri: normalized.uri,
    path: normalized.path,
    width: normalized.width,
    height: normalized.height,
    fileSize: normalized.size,
  };
  const normalizedSource = { filePath: image.path, mimeType: 'image/jpeg' };
  checkActive();
  onStage('Checking for skin');
  let validationMethod = await validateSkin(normalizedSource);
  checkActive();
  onStage('Checking image quality');
  const quality = await assessImageQuality(normalizedSource, {
    width: Math.min(metadata?.width ?? image.width, image.width),
    height: Math.min(metadata?.height ?? image.height, image.height),
    fileSize: image.fileSize,
  });
  assertUsableQuality(quality.metrics);
  checkActive();
  onStage('Finding the lesion');
  let selected = image;
  let cropped = false;
  try {
    const aoi = await createAutomaticAreaOfInterest(normalizedSource);
    // Avoid unusable tiny crops; keep surrounding skin and the original fallback.
    if (aoi.image && aoi.image.width >= 224 && aoi.image.height >= 224) {
      selected = aoi.image;
      cropped = true;
    }
  } catch {
    // Skin/quality already passed; segmentation failure uses the validated image.
  }
  checkActive();
  const maxZoom = Math.min(3, Math.min(selected.width, selected.height) / 224);
  if (zoom > 1) {
    if (zoom > maxZoom)
      throw new Error(
        'This crop is too small. Zoom out or capture a closer image.',
      );
    const margin = (1 - 1 / zoom) / 2;
    selected = await cropImageToJpeg(
      { filePath: selected.path },
      {
        left: margin,
        top: margin,
        right: 1 - margin,
        bottom: 1 - margin,
      },
    );
    cropped = true;
    checkActive();
  }
  if (cropped) {
    validationMethod = await validateSkin({ filePath: selected.path });
    checkActive();
    const roiQuality = await assessImageQuality(
      { filePath: selected.path },
      selected,
    );
    assertUsableQuality(roiQuality.metrics);
    checkActive();
  }
  onStage('Preparing for analysis');
  const preprocessing = await runPreprocessing(
    { filePath: selected.path, mimeType: 'image/jpeg' },
    () => {},
  );
  checkActive();
  return { image: selected, preprocessing, cropped, maxZoom, validationMethod };
}
