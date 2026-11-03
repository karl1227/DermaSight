import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
test('all shipped EfficientNet classifier assets retain the teammate export', () => {
  const expected =
    'ba541d0b9ce68007c2a58cefc217cda4c47db43fea147bf14d13a44c62c478c2';
  for (const file of [
    'efficientnet_ham10000.tflite',
    'src/assets/models/efficientnet_ham10000.tflite',
    'android/app/src/main/assets/efficientnet_ham10000.tflite',
    'android/app/src/main/res/raw/src_assets_models_efficientnet_ham10000.tflite',
  ]) {
    expect(
      createHash('sha256')
        .update(readFileSync(resolve(__dirname, '..', file)))
        .digest('hex'),
    ).toBe(expected);
  }
});

test('all bundled class-label files agree with the classifier output order', () => {
  for (const file of [
    'labels.txt',
    'src/assets/models/labels.txt',
    'android/app/src/main/assets/labels.txt',
  ]) {
    expect(
      readFileSync(resolve(__dirname, '..', file), 'utf8').trim().split(/\s+/),
    ).toEqual(['AK', 'BCC', 'BKL', 'DF', 'MEL', 'NV', 'VASC']);
  }
});
