import type { LesionClass } from '../types';

// Teammate's EfficientNet export from 20383b0. Reported dataset accuracy is
// separate from the per-image probability; never force a 90% output score.
export const CLASSIFIER_MODEL_SHA256 =
  'ba541d0b9ce68007c2a58cefc217cda4c47db43fea147bf14d13a44c62c478c2';
export const CLASSIFIER_INPUT_SIZE = 224;
export const CLASSIFIER_CONFIDENCE_THRESHOLD = 70;

// Preserve the order supplied by labels.txt. Changing it relabels predictions.
export const CLASSIFIER_LABELS = [
  'Actinic Keratoses',
  'Basal Cell Carcinoma',
  'Benign Keratosis',
  'Dermatofibroma',
  'Melanoma',
  'Melanocytic Nevi',
  'Vascular Lesions',
] as const satisfies readonly LesionClass[];
