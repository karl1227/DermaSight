import type { NormalizedCrop } from './imageProcessingService';

/** Convert the captured photo mask into lesion bounds with surrounding-skin context. */
export function summarizeLesionMask(mask: Float32Array, size = 256) {
  if (mask.length !== size * size)
    throw new Error('Unexpected segmentation mask size.');
  let count = 0,
    total = 0,
    left = size,
    top = size,
    right = 0,
    bottom = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!Number.isFinite(mask[i]))
      throw new Error('Invalid segmentation output.');
    const probability = Math.min(1, Math.max(0, mask[i]));
    total += probability;
    if (probability < 0.5) continue;
    count++;
    const x = i % size,
      y = Math.floor(i / size);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  const lesionDetected = count >= 32;
  let bounds: NormalizedCrop | undefined;
  if (lesionDetected) {
    const margin = Math.max(
      12,
      Math.ceil(Math.max(right - left + 1, bottom - top + 1) * 0.2),
    );
    bounds = {
      left: Math.max(0, (left - margin) / size),
      top: Math.max(0, (top - margin) / size),
      right: Math.min(1, (right + 1 + margin) / size),
      bottom: Math.min(1, (bottom + 1 + margin) / size),
    };
  }
  return {
    coveragePercent: Math.round((count / mask.length) * 1000) / 10,
    meanProbability: Math.round((total / mask.length) * 1000) / 1000,
    lesionDetected,
    bounds,
  };
}
