import { prepareCapture } from '../src/services/capturePreparationService';
import { validateSkin } from '../src/services/skinValidationService';
import {
  assessImageQuality,
  cropImageToJpeg,
} from '../src/services/imageProcessingService';
import { createAutomaticAreaOfInterest } from '../src/services/segmentationService';
import { runPreprocessing } from '../src/services/preprocessingService';

jest.mock('react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: jest.fn(async () => ({
      uri: 'file:///normalized.jpg',
      path: '/normalized.jpg',
      width: 1024,
      height: 768,
      size: 100000,
    })),
  },
}));
jest.mock('../src/services/skinValidationService', () => ({
  validateSkin: jest.fn(async () => {}),
}));
jest.mock('../src/services/imageProcessingService', () => ({
  assessImageQuality: jest.fn(),
  cropImageToJpeg: jest.fn(),
}));
jest.mock('../src/services/segmentationService', () => ({
  createAutomaticAreaOfInterest: jest.fn(),
}));
jest.mock('../src/services/preprocessingService', () => ({
  runPreprocessing: jest.fn(),
}));
const quality = assessImageQuality as jest.Mock;
const skin = validateSkin as jest.Mock;
const aoi = createAutomaticAreaOfInterest as jest.Mock;
const preprocessing = runPreprocessing as jest.Mock;
const crop = cropImageToJpeg as jest.Mock;
const source = { filePath: '/original.jpg' };
beforeEach(() => {
  jest.clearAllMocks();
  skin.mockResolvedValue('model');
  quality.mockResolvedValue({
    metrics: { brightness: 120, sharpness: 20, width: 1024, height: 768 },
  });
  aoi.mockResolvedValue({ segmentation: { lesionDetected: false } });
  preprocessing.mockResolvedValue({
    id: 'tensor-id',
    width: 224,
    height: 224,
    channels: 3,
    inputRange: '0-255',
  });
});
test('skin rejection stops quality, cropping and preprocessing', async () => {
  skin.mockRejectedValue(new Error('Human skin could not be confirmed.'));
  await expect(prepareCapture(source, undefined, jest.fn())).rejects.toThrow(
    'Human skin',
  );
  expect(quality).not.toHaveBeenCalled();
  expect(aoi).not.toHaveBeenCalled();
  expect(preprocessing).not.toHaveBeenCalled();
});
test.each([
  [{ brightness: 10 }, 'dark'],
  [{ brightness: 250 }, 'glare'],
  [{ sharpness: 0.5 }, 'blurred'],
  [{ width: 100 }, 'small'],
])(
  'unusable quality blocks ROI and preprocessing: %j',
  async (metrics, message) => {
    quality.mockResolvedValue({
      metrics: {
        brightness: 120,
        sharpness: 20,
        width: 1024,
        height: 768,
        ...metrics,
      },
    });
    await expect(prepareCapture(source, undefined, jest.fn())).rejects.toThrow(
      message,
    );
    expect(aoi).not.toHaveBeenCalled();
    expect(preprocessing).not.toHaveBeenCalled();
  },
);
test('validated crop is the source passed to existing preprocessing', async () => {
  const image = {
    uri: 'file:///roi.jpg',
    path: '/roi.jpg',
    width: 500,
    height: 500,
    fileSize: 30000,
  };
  aoi.mockResolvedValue({ image });
  const stages: string[] = [];
  const result = await prepareCapture(source, undefined, stage =>
    stages.push(stage),
  );
  expect(result.cropped).toBe(true);
  expect(result.image).toEqual(image);
  expect(preprocessing).toHaveBeenCalledWith(
    { filePath: '/roi.jpg', mimeType: 'image/jpeg' },
    expect.any(Function),
  );
  expect(stages).toEqual([
    'Preparing image',
    'Checking for skin',
    'Checking image quality',
    'Finding the lesion',
    'Preparing for analysis',
  ]);
});
test('segmentation failure uses the validated original; small ROI is not enlarged', async () => {
  aoi.mockRejectedValueOnce(new Error('unavailable'));
  expect((await prepareCapture(source, undefined, jest.fn())).image.path).toBe(
    '/normalized.jpg',
  );
  aoi.mockResolvedValueOnce({
    image: { path: '/tiny.jpg', width: 10, height: 10 },
  });
  expect((await prepareCapture(source, undefined, jest.fn())).image.path).toBe(
    '/normalized.jpg',
  );
});
test('retake cancellation prevents downstream work', async () => {
  let cancelled = false;
  skin.mockImplementationOnce(async () => {
    cancelled = true;
  });
  await expect(
    prepareCapture(source, undefined, jest.fn(), () => cancelled),
  ).rejects.toThrow('cancelled');
  expect(quality).not.toHaveBeenCalled();
  expect(preprocessing).not.toHaveBeenCalled();
});
test('manual zoom crops actual pixels, rechecks skin and preprocesses the zoomed ROI', async () => {
  crop.mockResolvedValue({
    uri: 'file:///zoom.jpg',
    path: '/zoom.jpg',
    width: 512,
    height: 384,
  });
  const result = await prepareCapture(
    source,
    undefined,
    jest.fn(),
    () => false,
    2,
  );
  expect(result.image.path).toBe('/zoom.jpg');
  expect(crop).toHaveBeenCalledWith(
    { filePath: '/normalized.jpg' },
    { left: 0.25, top: 0.25, right: 0.75, bottom: 0.75 },
  );
  expect(skin).toHaveBeenCalledTimes(2);
  expect(preprocessing).toHaveBeenCalledWith(
    { filePath: '/zoom.jpg', mimeType: 'image/jpeg' },
    expect.any(Function),
  );
});
