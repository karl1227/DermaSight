/**
 * TFLite Classification Service
 *
 * Runs local inference using the bundled EfficientNet TFLite model.
 * The predicted class and confidence come only from the trained model output.
 */

import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import { loadResizedImageRgb, type ImageSource } from './imageProcessingService';
import { getPreprocessedResult } from './preprocessingService';
import {
  ClassificationResult,
  LesionClass,
  ScreeningStatus,
  SelectedSymptoms,
  ThresholdStatus,
} from '../types';
import { getAssessmentMessage, getScreeningStatus } from '../utils';

const CONFIDENCE_THRESHOLD = 70;
const MODEL_INPUT_SIZE = 224;
const MODEL_INPUT_ELEMENTS = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3;

const LABEL_MAP: LesionClass[] = [
  'Actinic Keratoses',
  'Basal Cell Carcinoma',
  'Benign Keratosis',
  'Dermatofibroma',
  'Melanoma',
  'Melanocytic Nevi',
  'Vascular Lesions',
];

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

let cachedModel: TfliteModel | null = null;

async function getModel(): Promise<TfliteModel> {
  if (cachedModel) return cachedModel;

  try {
    if (Platform.OS === 'android') {
      const modelFilename = 'efficientnet_ham10000.tflite';
      const targetPath = `${RNFS.CachesDirectoryPath}/${modelFilename}`;
      const exists = await RNFS.exists(targetPath);
      if (!exists) {
        try {
          await RNFS.copyFileAssets(modelFilename, targetPath);
        } catch {
          // If copyFileAssets fails, attempt from DocumentDirectoryPath or require fallback
        }
      }
      const targetExists = await RNFS.exists(targetPath);
      if (targetExists) {
        cachedModel = await loadTensorflowModel({ url: `file://${targetPath}` }, []);
        return cachedModel;
      }
    }
  } catch (error) {
    console.warn('Failed to load Android asset via file path, falling back to require:', error);
  }

  cachedModel = await loadTensorflowModel(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../assets/models/efficientnet_ham10000.tflite'),
    [],
  );
  return cachedModel;
}

async function buildInputTensor(source: ImageSource): Promise<ArrayBuffer> {
  const resizedRGB = await loadResizedImageRgb(source, MODEL_INPUT_SIZE);
  const inputBuffer = new ArrayBuffer(MODEL_INPUT_ELEMENTS * 4);
  const inputFloat32 = new Float32Array(inputBuffer);

  for (let i = 0; i < MODEL_INPUT_ELEMENTS; i++) {
    inputFloat32[i] = resizedRGB[i];
  }

  return inputBuffer;
}

function buildRecommendation(status: ScreeningStatus, lesion: LesionClass): string {
  switch (status) {
    case 'High Concern':
      return `The trained CNN model classified the image as ${lesion}. Please consult a licensed dermatologist promptly for clinical evaluation.`;
    case 'Precancerous Indicator':
      return `The trained CNN model classified the image as ${lesion}. A dermatologist evaluation is advised to rule out precancerous changes.`;
    case 'Generally Benign':
      return `The trained CNN model classified the image as ${lesion}. Continue routine monitoring and consult a dermatologist if the lesion changes.`;
    default:
      return 'The trained CNN model did not meet the minimum confidence threshold. Consider retaking a clearer image or consulting a licensed dermatologist.';
  }
}

function buildRecommendationBasis(confidence: number): string {
  return `Prediction and confidence are based only on the trained EfficientNet TFLite model output. Model confidence: ${confidence.toFixed(1)}%.`;
}

export async function runInference(
  source: ImageSource,
  _symptoms: SelectedSymptoms,
  preprocessingId?: string,
): Promise<ClassificationResult> {
  const model = await getModel();
  const preprocessedResult = getPreprocessedResult(preprocessingId);
  const inputBuffer = preprocessedResult?.inputTensor ?? await buildInputTensor(source);

  const [outputBuffer] = await model.run([inputBuffer]);
  const probabilities = new Float32Array(outputBuffer);

  const predictions = Array.from(probabilities)
    .map((score, idx) => ({
      label: LABEL_MAP[idx],
      confidence: score * 100,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const topPrediction = predictions[0];
  const lesion = topPrediction.label;
  const modelConfidence = topPrediction.confidence;
  const screeningStatus = getScreeningStatus(lesion, modelConfidence);
  const thresholdStatus: ThresholdStatus =
    modelConfidence >= CONFIDENCE_THRESHOLD
      ? 'Above Threshold'
      : 'Below Threshold';

  return {
    predictedLesionType: lesion,
    confidenceScore: parseFloat(modelConfidence.toFixed(1)),
    screeningStatus,
    thresholdStatus,
    matchingVisualFeatures: [],
    recommendationBasis: buildRecommendationBasis(modelConfidence),
    recommendation: buildRecommendation(screeningStatus, lesion),
    assessmentMessage: getAssessmentMessage(screeningStatus, lesion),
  };
}
