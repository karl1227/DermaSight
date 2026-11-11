import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { prepareCapture } from '../src/services/capturePreparationService';
import { runInference } from '../src/services/tfliteService';
import {
  CLASSIFIER_LABELS,
  CLASSIFIER_MODEL_SHA256,
} from '../src/config/classifier';

const mockRun = jest.fn();
const mockPhotoBase64 = jpeg
  .encode(
    { data: Buffer.alloc(320 * 320 * 4, 160), width: 320, height: 320 },
    95,
  )
  .data.toString('base64');
jest.mock('react-native-fs', () => ({
  read: jest.fn(async () => '/9j/'),
  readFile: jest.fn(async () => mockPhotoBase64),
}));
jest.mock('react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: jest.fn(async () => ({
      uri: 'file:///validation.jpg',
      path: '/validation.jpg',
      width: 320,
      height: 320,
      size: 1000,
    })),
  },
}));
jest.mock('../src/services/skinValidationService', () => ({
  validateSkin: jest.fn(async () => 'appearance'),
}));
jest.mock('../src/services/imageProcessingService', () => ({
  ...jest.requireActual('../src/services/imageProcessingService'),
  assessImageQuality: jest.fn(async () => ({
    metrics: { width: 320, height: 320, brightness: 120, sharpness: 20 },
  })),
}));
jest.mock('../src/assets/models/efficientnet_ham10000.tflite', () => 99);
jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(async () => ({
    inputs: [{ dataType: 'float32', shape: [1, 224, 224, 3] }],
    outputs: [{ dataType: 'float32', shape: [1, 7] }],
    run: mockRun,
  })),
}));

// Fixed expected labels independent of the implementation configuration. Native
// model outputs are mocked: this verifies routing/mapping, not model accuracy.
const expected = [
  'Actinic Keratoses',
  'Basal Cell Carcinoma',
  'Benign Keratosis',
  'Dermatofibroma',
  'Melanoma',
  'Melanocytic Nevi',
  'Vascular Lesions',
];
beforeEach(() => jest.clearAllMocks());
test('the shared classifier configuration pins the original teammate export and label order', () => {
  expect(CLASSIFIER_MODEL_SHA256).toBe(
    '433142ab927fb99e4210415a9a4b8f569afe6f4f571c2a61773ed5bd400e7ff5',
  );
  expect(CLASSIFIER_LABELS).toEqual(expected);
});
for (const entry of ['camera', 'gallery']) {
  test.each(expected.map((label, index) => [label, index] as const))(
    `${entry}: output for %s stays in the correct HAM10000 class`,
    async (label, index) => {
      const scores = expected.map((_, i) => (i === index ? 0.94 : 0.01));
      mockRun.mockResolvedValue([Float32Array.from(scores).buffer]);
      const source = { filePath: `/${entry}.jpg`, mimeType: 'image/jpeg' };
      const prepared = await prepareCapture(
        source,
        { width: 320, height: 320 },
        () => {},
      );
      const result = await runInference(
        { filePath: prepared.image.path },
        { abcde: {}, other: {} } as any,
        prepared.preprocessing.id,
      );
      if (entry === 'camera' && index === 0) {
        expect(loadTensorflowModel).toHaveBeenCalledWith(99, []);
      } else {
        expect(loadTensorflowModel).not.toHaveBeenCalled();
      }
      expect(prepared.cropped).toBe(false);
      expect(prepared.image.path).toBe(source.filePath);
      expect(mockRun.mock.calls[0][0][0]).toBe(
        prepared.preprocessing.inputTensor,
      );
      expect(result.predictedLesionType).toBe(label);
      expect(result.confidenceScore).toBe(94);
      expect(mockRun).toHaveBeenCalledTimes(1);
      const input = new Float32Array(mockRun.mock.calls[0][0][0]);
      expect(input.length).toBe(224 * 224 * 3);
      expect(
        input.every(
          value => Number.isFinite(value) && value >= 0 && value <= 255,
        ),
      ).toBe(true);
    },
  );
}
