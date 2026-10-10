/** Separate skin/non-skin detector. Never use HAM10000 scores as skin proof. */
import {
  loadTensorflowModel,
  type TfliteModel,
} from 'react-native-fast-tflite';
import {
  loadResizedImageRgb,
  type ImageSource,
} from './imageProcessingService';
import { inspectSkinAppearance } from './skinAppearance';

export interface SkinDetectorConfig {
  /** Local file URL of a trained detector, not the lesion classifier. */
  modelUrl: string;
  inputSize: number;
  inputRange: '0-255' | '0-1' | '-1-1';
  outputCount: number;
  skinIndex: number;
  /** Calibrated acceptance threshold from detector evaluation. */
  threshold: number;
}

// Configure only after obtaining the model's training/export specification.
// Until a trained detector is supplied, use the explicitly experimental filter.
export const SKIN_DETECTOR_CONFIG: SkinDetectorConfig | null = null;
// Enable strict mode when validation must require a trained detector.
export const REQUIRE_SKIN_VALIDATION = false;
let model: TfliteModel | null = null;

export async function validateSkin(
  source: ImageSource,
): Promise<'appearance' | 'model'> {
  const config = SKIN_DETECTOR_CONFIG;
  if (!config) {
    if (!REQUIRE_SKIN_VALIDATION) {
      const rgb = await loadResizedImageRgb(source, 128);
      if (!inspectSkinAppearance(rgb, 128).accepted) {
        throw new Error(
          'Skin was not detected clearly. Capture a close-up of the skin and lesion with even lighting, then try again.',
        );
      }
      return 'appearance';
    }
    throw new Error(
      'Skin validation is not configured yet. A trained skin/non-skin model is required before this image can be classified.',
    );
  }
  if (!model) model = await loadTensorflowModel({ url: config.modelUrl }, []);
  const input = model.inputs[0];
  const output = model.outputs[0];
  if (
    model.inputs.length !== 1 ||
    model.outputs.length !== 1 ||
    input.dataType !== 'float32' ||
    output.dataType !== 'float32' ||
    input.shape.join(',') !== `1,${config.inputSize},${config.inputSize},3` ||
    output.shape.reduce((a, b) => a * b, 1) !== config.outputCount ||
    config.skinIndex < 0 ||
    config.skinIndex >= config.outputCount ||
    config.threshold <= 0 ||
    config.threshold > 1
  ) {
    throw new Error(
      'The skin detector configuration does not match its model. Please contact your project administrator.',
    );
  }
  const rgb = await loadResizedImageRgb(source, config.inputSize);
  const tensor = Float32Array.from(rgb, value =>
    config.inputRange === '0-1'
      ? value / 255
      : config.inputRange === '-1-1'
      ? value / 127.5 - 1
      : value,
  );
  const [buffer] = await model.run([tensor.buffer]);
  const scores = new Float32Array(buffer);
  if (
    scores.length !== config.outputCount ||
    scores.some(value => !Number.isFinite(value) || value < 0 || value > 1)
  ) {
    throw new Error(
      'Skin validation could not be completed. Please retake the image.',
    );
  }
  if (scores[config.skinIndex] < config.threshold) {
    throw new Error(
      'Human skin could not be confirmed. Capture a clear close-up of the skin and lesion, then try again.',
    );
  }
  return 'model';
}
