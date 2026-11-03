import {
  CLASSIFIER_MODEL_SHA256,
  CLASSIFIER_INPUT_SIZE,
  CLASSIFIER_CONFIDENCE_THRESHOLD,
  CLASSIFIER_LABELS,
} from '../config/classifier';
/**
 * TFLite Classification Service
 *
 * Runs local inference using the bundled EfficientNet TFLite model.
 * The predicted class and confidence come only from the trained model output.
 */

import {
  loadTensorflowModel,
  type TfliteModel,
} from 'react-native-fast-tflite';
import {
  loadResizedImageRgb,
  type ImageSource,
} from './imageProcessingService';
import { getPreprocessedResult } from './preprocessingService';
import {
  ClassificationResult,
  SelectedSymptoms,
  ThresholdStatus,
} from '../types';
import { getAssessmentMessage, getScreeningStatus } from '../utils';

const MODEL_SHA256 = CLASSIFIER_MODEL_SHA256;
const CONFIDENCE_THRESHOLD = CLASSIFIER_CONFIDENCE_THRESHOLD;
const MODEL_INPUT_SIZE = CLASSIFIER_INPUT_SIZE;
const MODEL_INPUT_ELEMENTS = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3;
const LABEL_MAP = CLASSIFIER_LABELS;

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

let cachedModel: TfliteModel | null = null;

async function getModel(): Promise<TfliteModel> {
  if (cachedModel) return cachedModel;

  try {
    if (Platform.OS === 'android') {
      const modelFilename = 'efficientnet_ham10000.tflite';
      // Bind cached bytes to this exact export, not just a reused filename.
      const targetPath = `${
        RNFS.CachesDirectoryPath
      }/efficientnet_ham10000-${MODEL_SHA256.slice(0, 12)}.tflite`;
      const existingMatches =
        (await RNFS.exists(targetPath)) &&
        (await RNFS.hash(targetPath, 'sha256')) === MODEL_SHA256;
      if (!existingMatches)
        await RNFS.copyFileAssets(modelFilename, targetPath);
      const targetExists =
        (await RNFS.hash(targetPath, 'sha256')) === MODEL_SHA256;
      if (!targetExists)
        throw new Error(
          'The packaged classifier does not match the expected export.',
        );
      if (targetExists) {
        cachedModel = await loadTensorflowModel(
          { url: `file://${targetPath}` },
          [],
        );
        return cachedModel;
      }
    }
  } catch (error) {
    console.warn(
      'Failed to load Android asset via file path, falling back to require:',
      error,
    );
  }

  cachedModel = await loadTensorflowModel(
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

export async function runInference(
  source: ImageSource,
  _symptoms: SelectedSymptoms,
  preprocessingId?: string,
): Promise<ClassificationResult> {
  const model = await getModel();
  if (
    model.inputs.length !== 1 ||
    model.outputs.length !== 1 ||
    model.inputs[0].dataType !== 'float32' ||
    model.outputs[0].dataType !== 'float32' ||
    model.inputs[0].shape.join(',') !==
      `1,${MODEL_INPUT_SIZE},${MODEL_INPUT_SIZE},3` ||
    model.outputs[0].shape.join(',') !== `1,${LABEL_MAP.length}`
  ) {
    throw new Error(
      'The classifier format is incompatible. Rebuild the app with the verified EfficientNet model.',
    );
  }
  const preprocessedResult = getPreprocessedResult(preprocessingId);
  if (preprocessingId && !preprocessedResult) {
    throw new Error(
      'The preprocessed image tensor is no longer available. Please preprocess the image again.',
    );
  }
  const inputBuffer =
    preprocessedResult?.inputTensor ?? (await buildInputTensor(source));

  if (
    inputBuffer.byteLength !==
    MODEL_INPUT_ELEMENTS * Float32Array.BYTES_PER_ELEMENT
  ) {
    throw new Error(
      `Unexpected input tensor size: ${inputBuffer.byteLength} bytes.`,
    );
  }

  const inputValues = new Float32Array(inputBuffer);
  if (
    inputValues.some(
      value => !Number.isFinite(value) || value < 0 || value > 255,
    )
  ) {
    throw new Error(
      'The image tensor is invalid. Please prepare the image again.',
    );
  }
  const outputs = await model.run([inputBuffer]);
  if (
    outputs.length !== 1 ||
    outputs[0].byteLength !== LABEL_MAP.length * Float32Array.BYTES_PER_ELEMENT
  ) {
    throw new Error(
      'The classifier returned an incompatible result. Please try again.',
    );
  }
  const probabilities = new Float32Array(outputs[0]);

  if (
    probabilities.length !== LABEL_MAP.length ||
    probabilities.some(
      score => !Number.isFinite(score) || score < 0 || score > 1,
    ) ||
    Math.abs(probabilities.reduce((sum, score) => sum + score, 0) - 1) > 0.02
  ) {
    throw new Error(`Unexpected model output size: ${probabilities.length}.`);
  }

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
    assessmentMessage: getAssessmentMessage(screeningStatus, lesion),
  };
}
