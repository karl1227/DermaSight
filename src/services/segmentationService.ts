import { summarizeLesionMask } from './lesionMask';
/** Runs the bundled lesion-segmentation model entirely on the device. */
import {
  loadTensorflowModel,
  type TfliteModel,
} from 'react-native-fast-tflite';
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

/** Load on demand after capture; no model runs against the live preview. */
async function createSegmentationModel(): Promise<TfliteModel> {
  if (Platform.OS === 'android') {
    const cachedPath = RNFS.CachesDirectoryPath + '/' + MODEL_FILENAME;
    if (!(await RNFS.exists(cachedPath)))
      await RNFS.copyFileAssets(MODEL_FILENAME, cachedPath);
    return loadTensorflowModel({ url: 'file://' + cachedPath }, []);
  }
  return loadTensorflowModel(
    require('../assets/models/lesion_segmentation.tflite'),
    [],
  );
}
let pendingModel: Promise<TfliteModel> | null = null;
async function getModel(): Promise<TfliteModel> {
  if (cachedModel) return cachedModel;
  if (!pendingModel)
    pendingModel = createSegmentationModel()
      .then(value => {
        cachedModel = value;
        return value;
      })
      .catch(error => {
        pendingModel = null;
        throw error;
      });
  return pendingModel;
}

export async function segmentLesion(
  source: ImageSource,
): Promise<SegmentationResult> {
  const model = await getModel();
  const rgb = await loadResizedImageRgb(source, MODEL_SIZE);
  const input = new Float32Array(MODEL_INPUT_ELEMENTS);

  // The float model has no preprocessing operation in its graph, so supply the
  // standard normalized RGB range used during image-model training.
  for (let index = 0; index < MODEL_INPUT_ELEMENTS; index += 1)
    input[index] = rgb[index] / 255;

  const [output] = await model.run([input.buffer]);
  const mask = new Float32Array(output);
  if (
    mask.length !== MASK_PIXELS ||
    mask.some(value => !Number.isFinite(value))
  ) {
    throw new Error(`Unexpected segmentation mask size: ${mask.length}.`);
  }

  return summarizeLesionMask(mask);
}

/** Segments the lesion and materializes its automatically selected AOI. */
export async function createAutomaticAreaOfInterest(
  source: ImageSource,
): Promise<AreaOfInterestResult> {
  const segmentation = await segmentLesion(source);
  if (!segmentation.bounds) return { segmentation };
  return {
    segmentation,
    image: await cropImageToJpeg(source, segmentation.bounds, {
      square: true,
      minimumSide: 224,
    }),
  };
}
