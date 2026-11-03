import { summarizeLesionMask } from '../src/services/lesionMask';
test('captured-photo mask uses the expected threshold and surrounding-skin margin', () => {
  const mask = new Float32Array(256 * 256);
  for (let y = 100; y < 110; y++)
    for (let x = 120; x < 130; x++) mask[y * 256 + x] = 0.9;
  const result = summarizeLesionMask(mask);
  expect(result.lesionDetected).toBe(true);
  expect(result.bounds).toEqual({
    left: 108 / 256,
    top: 88 / 256,
    right: 142 / 256,
    bottom: 122 / 256,
  });
});
test('empty, tiny and malformed masks cannot invent a detection', () => {
  expect(
    summarizeLesionMask(new Float32Array(256 * 256)).bounds,
  ).toBeUndefined();
  const mask = new Float32Array(256 * 256);
  mask.fill(1, 0, 31);
  expect(summarizeLesionMask(mask).bounds).toBeUndefined();
  mask[5] = NaN;
  expect(() => summarizeLesionMask(mask)).toThrow('Invalid');
  expect(() => summarizeLesionMask(new Float32Array(3))).toThrow('size');
});
