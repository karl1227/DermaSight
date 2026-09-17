/** Runs the bundled lesion-segmentation model entirely on the device. */
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import {
  cropImageToJpeg,
  loadResizedImageRgb,
  type CroppedImage,
  type ImageSource,
  type NormalizedCrop,
} from './imageProcessingService';

const MODEL_FILENAME = 'lesion_segmentation.tflite';
const MODEL_SIZE = 256;
const MODEL_INPUT_ELEMENTS = MODEL_SIZE * MODEL_SIZE * 3;
const MASK_PIXELS = MODEL_SIZE * MODEL_SIZE;
const MASK_THRESHOLD = 0.5;

export interface SegmentationResult {
  /** Percentage of the image classified as lesion by the segmentation mask. */
  coveragePercent: number;
  /** Mean mask probability, useful as a lightweight confidence indicator. */
  meanProbability: number;
  lesionDetected: boolean;
  bounds?: NormalizedCrop;
}

export interface AreaOfInterestResult {
  segmentation: SegmentationResult;
  image?: CroppedImage;
}

let cachedModel: TfliteModel | null = null;

async function getModel(): Promise<TfliteModel> {
  if (cachedModel) return cachedModel;

  if (Platform.OS === 'android') {
    const cachedPath = `${RNFS.CachesDirectoryPath}/${MODEL_FILENAME}`;
    if (!(await RNFS.exists(cachedPath))) {
      await RNFS.copyFileAssets(MODEL_FILENAME, cachedPath);
    }
    cachedModel = await loadTensorflowModel({ url: `file://${cachedPath}` }, []);
    return cachedModel;
  }

  cachedModel = await loadTensorflowModel(
    require('../assets/models/lesion_segmentation.tflite'),
    [],
  );
  return cachedModel;
}

export async function segmentLesion(source: ImageSource): Promise<SegmentationResult> {
  const model = await getModel();
  const rgb = await loadResizedImageRgb(source, MODEL_SIZE);
  const input = new Float32Array(MODEL_INPUT_ELEMENTS);

  // The float model has no preprocessing operation in its graph, so supply the
  // standard normalized RGB range used during image-model training.
  for (let index = 0; index < MODEL_INPUT_ELEMENTS; index += 1) input[index] = rgb[index] / 255;

  const [output] = await model.run([input.buffer]);
  const mask = new Float32Array(output);
  if (mask.length !== MASK_PIXELS || mask.some(value => !Number.isFinite(value))) {
    throw new Error(`Unexpected segmentation mask size: ${mask.length}.`);
  }

  let lesionPixels = 0;
  let total = 0;
  let left = MODEL_SIZE;
  let top = MODEL_SIZE;
  let right = 0;
  let bottom = 0;
  for (let index = 0; index < mask.length; index += 1) {
    const probability = Math.min(1, Math.max(0, mask[index]));
    total += probability;
    if (probability >= MASK_THRESHOLD) {
      lesionPixels += 1;
      const x = index % MODEL_SIZE;
      const y = Math.floor(index / MODEL_SIZE);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  const coveragePercent = (lesionPixels / MASK_PIXELS) * 100;
  const lesionDetected = lesionPixels >= 32;
  let bounds: NormalizedCrop | undefined;
  if (lesionDetected) {
    // Preserve surrounding skin: add 20% of the longest lesion dimension,
    // with a small minimum margin for compact lesions.
    const margin = Math.max(12, Math.ceil(Math.max(right - left + 1, bottom - top + 1) * 0.2));
    bounds = {
      left: Math.max(0, (left - margin) / MODEL_SIZE),
      top: Math.max(0, (top - margin) / MODEL_SIZE),
      right: Math.min(1, (right + 1 + margin) / MODEL_SIZE),
      bottom: Math.min(1, (bottom + 1 + margin) / MODEL_SIZE),
    };
  }
  return {
    coveragePercent: Number(coveragePercent.toFixed(1)),
    meanProbability: Number((total / MASK_PIXELS).toFixed(3)),
    lesionDetected,
    bounds,
  };
}

/** Segments the lesion and materializes its automatically selected AOI. */
export async function createAutomaticAreaOfInterest(source: ImageSource): Promise<AreaOfInterestResult> {
  const segmentation = await segmentLesion(source);
  if (!segmentation.bounds) return { segmentation };
  return { segmentation, image: await cropImageToJpeg(source, segmentation.bounds) };
}
