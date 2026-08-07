/**
 * Image Preprocessing Service
 *
 * Simulates the preprocessing pipeline for UI feedback.
 * In production, each step would apply actual image transforms
 * (resize to 224×224, normalize pixel values, apply Gaussian blur, etc.)
 * before feeding the tensor to the TFLite EfficientNet model.
 */

export interface PreprocessingStep {
  id: string;
  label: string;
  description: string;
  durationMs: number;
}

export const PREPROCESSING_STEPS: PreprocessingStep[] = [
  {
    id: 'resize',
    label: 'Image Resizing',
    description: 'Resizing image to 224×224px for CNN input',
    durationMs: 400,
  },
  {
    id: 'normalize',
    label: 'Image Normalization',
    description: 'Normalizing pixel values to [0, 1] range',
    durationMs: 350,
  },
  {
    id: 'noise',
    label: 'Noise Reduction',
    description: 'Applying Gaussian blur to reduce image noise',
    durationMs: 500,
  },
  {
    id: 'detection',
    label: 'Lesion Area Detection',
    description: 'Identifying and isolating lesion region of interest',
    durationMs: 600,
  },
  {
    id: 'enhancement',
    label: 'Image Enhancement',
    description: 'Enhancing contrast and sharpness for feature extraction',
    durationMs: 450,
  },
  {
    id: 'tensor',
    label: 'Feature Extraction Preparation',
    description: 'Converting image to input tensor for EfficientNet',
    durationMs: 300,
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

/**
 * Run the preprocessing pipeline with step-by-step progress updates.
 * Returns the processed image path (original path for now — in production,
 * this would be the path to the processed/resized image file).
 *
 * @param imagePath - Local path of the captured/selected image
 * @param onStepUpdate - Callback fired when each step starts and completes
 */
export async function runPreprocessing(
  imageSource: string | PreprocessingImageSource,
  onStepUpdate: StepProgressCallback,
): Promise<string> {
  for (const step of PREPROCESSING_STEPS) {
    // Signal step started (not yet completed)
    onStepUpdate(step.id, false);

    // Simulate processing time
    await new Promise<void>(resolve => setTimeout(resolve, step.durationMs));

    // Signal step completed
    onStepUpdate(step.id, true);
  }

  // In production: return path to the resized/processed image
  // For now: return the original path unchanged
  if (typeof imageSource === 'string') {
    return imageSource;
  }

  return imageSource.filePath ?? '';
}
