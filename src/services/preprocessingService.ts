/**
 * Image Preprocessing Service
 *
 * Prepares a captured image for EfficientNet inference.
 */

import { loadResizedImageRgb, type ImageSource } from './imageProcessingService';

export interface PreprocessingStep {
  id: string;
  label: string;
  description: string;
}

export const PREPROCESSING_STEPS: PreprocessingStep[] = [
  {
    id: 'decode',
    label: 'Image Decode',
    description: 'Decoding captured JPEG pixels',
  },
  {
    id: 'resize',
    label: 'Image Resize',
    description: 'Resizing image to 224x224 pixels',
  },
  {
    id: 'rgb',
    label: 'RGB Conversion',
    description: 'Converting pixels to RGB channel order',
  },
  {
    id: 'tensor',
    label: 'Tensor Build',
    description: 'Building Float32 tensor for EfficientNet',
  },
  {
    id: 'validate',
    label: 'Tensor Validation',
    description: 'Validating shape [1, 224, 224, 3]',
  },
];

export type StepProgressCallback = (
  stepId: string,
  completed: boolean,
) => void;

export interface PreprocessingImageSource {
  base64?: string;
  mimeType?: string;
  filePath?: string;
}

export interface PreprocessingResult {
  id: string;
  processedImagePath: string;
  inputTensor: ArrayBuffer;
  width: 224;
  height: 224;
  channels: 3;
  inputRange: '0-255';
}

const MODEL_INPUT_SIZE = 224;
const MODEL_INPUT_CHANNELS = 3;
const MODEL_INPUT_ELEMENTS = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * MODEL_INPUT_CHANNELS;

const preprocessingCache = new Map<string, PreprocessingResult>();

function createPreprocessingId(): string {
  return `preprocessed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function markStep(
  onStepUpdate: StepProgressCallback,
  stepId: string,
  completed: boolean,
): void {
  onStepUpdate(stepId, completed);
}

export function getPreprocessedResult(id?: string): PreprocessingResult | undefined {
  return id ? preprocessingCache.get(id) : undefined;
}

/**
 * Run the preprocessing pipeline with step-by-step progress updates.
 *
 * @param imageSource - Captured/selected image source
 * @param onStepUpdate - Callback fired when each step starts and completes
 */
export async function runPreprocessing(
  imageSource: string | PreprocessingImageSource,
  onStepUpdate: StepProgressCallback,
): Promise<PreprocessingResult> {
  const source: ImageSource =
    typeof imageSource === 'string'
      ? { filePath: imageSource }
      : imageSource;

  markStep(onStepUpdate, 'decode', false);
  markStep(onStepUpdate, 'decode', true);

  markStep(onStepUpdate, 'resize', false);
  const resizedRGB = await loadResizedImageRgb(source, MODEL_INPUT_SIZE);
  markStep(onStepUpdate, 'resize', true);

  markStep(onStepUpdate, 'rgb', false);
  markStep(onStepUpdate, 'rgb', true);

  markStep(onStepUpdate, 'tensor', false);
  const inputBuffer = new ArrayBuffer(MODEL_INPUT_ELEMENTS * 4);
  const inputFloat32 = new Float32Array(inputBuffer);

  for (let i = 0; i < MODEL_INPUT_ELEMENTS; i++) {
    inputFloat32[i] = resizedRGB[i];
  }
  markStep(onStepUpdate, 'tensor', true);

  markStep(onStepUpdate, 'validate', false);
  if (inputFloat32.length !== MODEL_INPUT_ELEMENTS) {
    throw new Error(`Unexpected tensor size: ${inputFloat32.length}`);
  }
  markStep(onStepUpdate, 'validate', true);

  const result: PreprocessingResult = {
    id: createPreprocessingId(),
    processedImagePath: source.filePath ?? '',
    inputTensor: inputBuffer,
    width: MODEL_INPUT_SIZE,
    height: MODEL_INPUT_SIZE,
    channels: MODEL_INPUT_CHANNELS,
    inputRange: '0-255',
  };

  preprocessingCache.set(result.id, result);
  return result;
}
