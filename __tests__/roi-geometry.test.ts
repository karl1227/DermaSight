import { expandToSquareCrop } from '../src/services/roiGeometry';

test('small rectangular lesion becomes a 224px square with surrounding context', () => {
  const crop = expandToSquareCrop(
    { left: 0.4, top: 0.4, right: 0.6, bottom: 0.58 },
    600,
    450,
  )!;
  expect(crop.right - crop.left).toBe(224);
  expect(crop.bottom - crop.top).toBe(224);
  expect(crop.left).toBeLessThanOrEqual(240);
  expect(crop.right).toBeGreaterThanOrEqual(360);
  expect(crop.top).toBeLessThanOrEqual(180);
  expect(crop.bottom).toBeGreaterThanOrEqual(261);
});
test.each([
  { left: 0, top: 0, right: 0.1, bottom: 0.1 },
  { left: 0.9, top: 0.9, right: 1, bottom: 1 },
  { left: 0, top: 0.8, right: 0.2, bottom: 1 },
  { left: 0.8, top: 0, right: 1, bottom: 0.2 },
])('edge crop stays square and contains the lesion: %j', bounds => {
  const crop = expandToSquareCrop(bounds, 600, 450)!;
  expect(crop.right - crop.left).toBe(crop.bottom - crop.top);
  expect(crop.left).toBeGreaterThanOrEqual(0);
  expect(crop.top).toBeGreaterThanOrEqual(0);
  expect(crop.right).toBeLessThanOrEqual(600);
  expect(crop.bottom).toBeLessThanOrEqual(450);
  expect(crop.left).toBeLessThanOrEqual(bounds.left * 600);
  expect(crop.top).toBeLessThanOrEqual(bounds.top * 450);
  expect(crop.right).toBeGreaterThanOrEqual(bounds.right * 600);
  expect(crop.bottom).toBeGreaterThanOrEqual(bounds.bottom * 450);
});
test('large box expands to its largest source-pixel dimension, not normalized size', () => {
  const crop = expandToSquareCrop(
    { left: 0.2, top: 0.2, right: 0.8, bottom: 0.6 },
    600,
    450,
  )!;
  expect(crop.right - crop.left).toBe(360);
  expect(crop.bottom - crop.top).toBe(360);
});
test('impossible containment uses original-image fallback', () => {
  expect(
    expandToSquareCrop({ left: 0, top: 0, right: 1, bottom: 1 }, 600, 450),
  ).toBeUndefined();
});
test('invalid boxes fail instead of cutting unrelated pixels', () => {
  expect(() =>
    expandToSquareCrop({ left: 0.9, top: 0, right: 0.1, bottom: 1 }, 600, 450),
  ).toThrow('Invalid');
});
