import ImageResizer from 'react-native-image-resizer';
import { CAPTURE_INPUT_VERSION } from '../config/capture';
import {
  assessImageQuality,
  isOriginalJpegSource,
  type ImageSource,
  type ImageMetadata,
  type CroppedImage,
  type NormalizedCrop,
} from './imageProcessingService';
import { validateSkin } from './skinValidationService';
import {
  runPreprocessing,
  type PreprocessingResult,
} from './preprocessingService';

export interface PreparedCapture {
  inputVersion: typeof CAPTURE_INPUT_VERSION;
  image: CroppedImage;
  preprocessing: PreprocessingResult;
  cropped: boolean;
  validationMethod: 'appearance' | 'model';
  originalImage: CroppedImage;
  lesionBounds?: NormalizedCrop;
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
  onStage('Checking image quality');
  const quality = await assessImageQuality(normalizedSource, {
    width: Math.min(metadata?.width ?? image.width, image.width),
    height: Math.min(metadata?.height ?? image.height, image.height),
    fileSize: image.fileSize,
  });
  assertUsableQuality(quality.metrics);
  checkActive();
  // Presentation baseline: use the full photo for both camera and
  // gallery. U-Net segmentation and automatic ROI cropping are disabled.
  onStage('Checking for skin');
  const validationMethod = await validateSkin(normalizedSource, 'capture');
  checkActive();
  // Restore the pre-segmentation JPEG path: classification reads the exact
  // original file once, avoiding the added 1024px resize and JPEG recompression.
  // Keep native conversion for formats/URIs the JPEG decoder cannot read.
  const useOriginal = await isOriginalJpegSource(source);
  checkActive();
  const analysisImage: CroppedImage =
    useOriginal && source.filePath
      ? {
          uri: source.filePath.startsWith('file://')
            ? source.filePath
            : `file://${source.filePath}`,
          path: source.filePath,
          width: metadata?.width ?? image.width,
          height: metadata?.height ?? image.height,
          fileSize: metadata?.fileSize ?? 0, // Unknown original byte size; do not reuse the converted file size.
        }
      : image;
  onStage('Preparing for analysis');
  const preprocessing = await runPreprocessing(
    { filePath: analysisImage.path, mimeType: 'image/jpeg' },
    () => {},
  );
  checkActive();
  return {
    inputVersion: CAPTURE_INPUT_VERSION,
    image: analysisImage,
    preprocessing,
    cropped: false,
    validationMethod,
    originalImage: analysisImage,
    lesionBounds: undefined,
  };
}
