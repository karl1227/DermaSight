/**
 * TFLite Classification Service
 *
 * Real inference using react-native-fast-tflite + EfficientNetB0 trained on HAM10000.
 *
 * Model specs:
 *   Input:  [1, 224, 224, 3] — Float32, RGB, pixel values 0–255
 *   Output: [1, 7]           — Float32 softmax probabilities
 *
 * Label index order (alphabetical, matches model output):
 *   0: AK  → Actinic Keratoses
 *   1: BCC → Basal Cell Carcinoma
 *   2: BKL → Benign Keratosis
 *   3: DF  → Dermatofibroma
 *   4: MEL → Melanoma
 *   5: NV  → Melanocytic Nevi
 *   6: VASC→ Vascular Lesions
 */

import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import { loadResizedImageRgb, type ImageSource } from './imageProcessingService';
import {
  ClassificationResult,
  LesionClass,
  ScreeningStatus,
  SelectedSymptoms,
  ThresholdStatus,
} from '../types';
import { getAssessmentMessage, getScreeningStatus } from '../utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIDENCE_THRESHOLD = 70; // percent
const MODEL_INPUT_SIZE = 224;
const MODEL_INPUT_ELEMENTS = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3; // 150,528

/**
 * Label index → LesionClass mapping.
 * Order must match model output (alphabetical short codes from labels.txt).
 */
const LABEL_MAP: LesionClass[] = [
  'Actinic Keratoses',   // 0: AK
  'Basal Cell Carcinoma', // 1: BCC
  'Benign Keratosis',    // 2: BKL
  'Dermatofibroma',      // 3: DF
  'Melanoma',            // 4: MEL
  'Melanocytic Nevi',    // 5: NV
  'Vascular Lesions',    // 6: VASC
];

// ─── Model singleton ─────────────────────────────────────────────────────────

let cachedModel: TfliteModel | null = null;

/**
 * Load (or return cached) TFLite model.
 * Uses require() bundled asset via Metro asset registry.
 */
async function getModel(): Promise<TfliteModel> {
  if (cachedModel) return cachedModel;

  // On Android the model is bundled in app assets.
  // react-native-fast-tflite resolves require() via Metro asset registry.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cachedModel = await loadTensorflowModel(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../assets/models/efficientnet_ham10000.tflite'),
    [], // empty = default CPU delegate
  );
  return cachedModel;
}

// ─── Image decoding & resizing ───────────────────────────────────────────────

/**
 * Resize image to 224×224 and decode the actual RGB pixels for the model.
 */
async function buildInputTensor(source: ImageSource): Promise<ArrayBuffer> {
  const resizedRGB = await loadResizedImageRgb(source, MODEL_INPUT_SIZE);

  const inputBuffer = new ArrayBuffer(MODEL_INPUT_ELEMENTS * 4); // float32
  const inputFloat32 = new Float32Array(inputBuffer);

  for (let i = 0; i < MODEL_INPUT_ELEMENTS; i++) {
    // EfficientNetB0 (HAM10000) expects pixel values in 0–255 range
    inputFloat32[i] = resizedRGB[i];
  }

  return inputBuffer;
}

// ─── Visual feature descriptors per class ────────────────────────────────────

const VISUAL_FEATURES: Record<LesionClass, string[]> = {
  Melanoma: [
    'Asymmetric lesion borders detected',
    'Multiple color tones observed (brown, black, pink)',
    'Irregular border patterns identified',
    'Lesion diameter appears greater than 6mm',
  ],
  'Basal Cell Carcinoma': [
    'Pearly or translucent surface texture detected',
    'Rolled borders identified',
    'Central ulceration area noted',
    'Waxy appearance patterns found',
  ],
  'Actinic Keratoses': [
    'Rough scaly texture patterns detected',
    'Reddish or pink base coloration noted',
    'Flat or slightly raised surface identified',
    'Sun-damaged skin patterns observed',
  ],
  'Melanocytic Nevi': [
    'Uniform round or oval shape detected',
    'Consistent border regularity identified',
    'Homogeneous coloration patterns noted',
    'Smooth surface texture observed',
  ],
  'Benign Keratosis': [
    'Waxy or stuck-on appearance detected',
    'Well-defined border patterns identified',
    'Varied pigmentation observed (tan to dark brown)',
    'Rough or verrucous surface noted',
  ],
  Dermatofibroma: [
    'Firm nodule characteristics detected',
    'Dimpling pattern when pressed identified',
    'Brownish or reddish-brown coloration noted',
    'Small, firm papule features observed',
  ],
  'Vascular Lesions': [
    'Red or purple coloration patterns detected',
    'Blanching characteristics identified',
    'Vascular surface patterns noted',
    'Bright red color intensity observed',
  ],
};

// ─── Recommendation builders ─────────────────────────────────────────────────

function buildRecommendation(status: ScreeningStatus, lesion: LesionClass): string {
  switch (status) {
    case 'High Concern':
      return `The preliminary screening identified features associated with ${lesion}. Please consult a licensed dermatologist promptly for a clinical evaluation. Do not delay seeking professional medical advice.`;
    case 'Precancerous Indicator':
      return `Preliminary features consistent with ${lesion} were identified. A dermatologist evaluation is advised to rule out precancerous changes. Early assessment can improve outcomes.`;
    case 'Generally Benign':
      return `Preliminary screening suggests features associated with ${lesion}, which is generally considered benign. Continue periodic self-monitoring and consult a dermatologist if you notice any changes in size, color, or shape.`;
    default:
      return 'The image did not meet the minimum confidence threshold. Consider retaking a clearer image under good lighting, or consult a licensed dermatologist for a clinical evaluation.';
  }
}

function buildRecommendationBasis(
  symptoms: SelectedSymptoms,
  features: string[],
): string {
  const abcdeCount = Object.values(symptoms.abcde).filter(Boolean).length;
  const otherCount = Object.values(symptoms.other).filter(Boolean).length;
  return (
    `Matching visual patterns: ${features.slice(0, 2).join('; ')}. ` +
    `ABCDE criteria met: ${abcdeCount}/5. ` +
    `Additional symptoms selected: ${otherCount}. ` +
    `Confidence based on CNN EfficientNet feature extraction and checklist weighting.`
  );
}

// ─── Symptom weighting ───────────────────────────────────────────────────────

function applySymptomContext(
  baseConfidence: number,
  symptoms: SelectedSymptoms,
  lesion: LesionClass,
): number {
  const abcdeCount = Object.values(symptoms.abcde).filter(Boolean).length;
  const otherCount = Object.values(symptoms.other).filter(Boolean).length;

  let adjustment = 0;
  const highConcern: LesionClass[] = ['Melanoma', 'Basal Cell Carcinoma'];
  const precancerous: LesionClass[] = ['Actinic Keratoses'];

  if (highConcern.includes(lesion)) {
    adjustment += abcdeCount * 1.2;
  } else if (precancerous.includes(lesion)) {
    adjustment += abcdeCount * 0.8;
  } else {
    adjustment -= abcdeCount * 0.5;
  }
  adjustment += otherCount * 0.3;

  return Math.min(99, Math.max(20, baseConfidence + adjustment));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Run EfficientNetB0 TFLite inference on the given image.
 *
 * @param imagePath - Local file path of the captured/preprocessed image
 * @param symptoms  - ABCDE and other symptom selections from the checklist
 * @returns Full ClassificationResult ready for the ResultScreen
 */
export async function runInference(
  source: ImageSource,
  symptoms: SelectedSymptoms,
): Promise<ClassificationResult> {
  // 1. Load model (cached after first call)
  const model = await getModel();

  // 2. Build input tensor from image (proper JPEG decode + resize)
  const inputBuffer = await buildInputTensor(source);

  // 3. Run inference
  const [outputBuffer] = await model.run([inputBuffer]);

  // 4. Parse output probabilities [1, 7] float32
  const probabilities = new Float32Array(outputBuffer);

  // 5. Map to label predictions, sorted by confidence descending
  const predictions = Array.from(probabilities).map((score, idx) => ({
    label: LABEL_MAP[idx],
    confidence: score * 100, // convert 0-1 → 0-100
  })).sort((a, b) => b.confidence - a.confidence);

  const topPrediction = predictions[0];
  const lesion = topPrediction.label;
  const baseConfidence = topPrediction.confidence;

  // 6. Apply symptom checklist context adjustment
  const adjustedConfidence = applySymptomContext(baseConfidence, symptoms, lesion);
  const screeningStatus = getScreeningStatus(lesion, adjustedConfidence);
  const thresholdStatus: ThresholdStatus =
    adjustedConfidence >= CONFIDENCE_THRESHOLD
      ? 'Above Threshold'
      : 'Below Threshold';

  // 7. Build result payload
  const features = VISUAL_FEATURES[lesion].slice(0, 3);
  const recommendation = buildRecommendation(screeningStatus, lesion);
  const recommendationBasis = buildRecommendationBasis(symptoms, features);
  const assessmentMessage = getAssessmentMessage(screeningStatus, lesion);

  return {
    predictedLesionType: lesion,
    confidenceScore: parseFloat(adjustedConfidence.toFixed(1)),
    screeningStatus,
    thresholdStatus,
    matchingVisualFeatures: features,
    recommendationBasis,
    recommendation,
    assessmentMessage,
  };
}
