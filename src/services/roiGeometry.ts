import type { NormalizedCrop } from './imageProcessingService';

/** Square in source pixels, not normalized coordinates (which distort rectangles). */
export function expandToSquareCrop(
  bounds: NormalizedCrop,
  width: number,
  height: number,
  minimumSide = 224,
) {
  const values = [
    bounds.left,
    bounds.top,
    bounds.right,
    bounds.bottom,
    width,
    height,
    minimumSide,
  ];
  if (
    values.some(value => !Number.isFinite(value)) ||
    width < 1 ||
    height < 1 ||
    minimumSide < 1 ||
    bounds.left < 0 ||
    bounds.top < 0 ||
    bounds.right > 1 ||
    bounds.bottom > 1 ||
    bounds.right <= bounds.left ||
    bounds.bottom <= bounds.top
  )
    throw new Error('Invalid lesion bounds.');
  const left = Math.floor(bounds.left * width);
  const top = Math.floor(bounds.top * height);
  const right = Math.ceil(bounds.right * width);
  const bottom = Math.ceil(bounds.bottom * height);
  const side = Math.ceil(Math.max(minimumSide, right - left, bottom - top));
  // A square cannot contain this box inside the photo. Keep the original fallback.
  if (side > Math.min(width, height)) return undefined;
  const x = Math.max(
    0,
    Math.min(width - side, Math.floor((left + right - side) / 2)),
  );
  const y = Math.max(
    0,
    Math.min(height - side, Math.floor((top + bottom - side) / 2)),
  );
  return { left: x, top: y, right: x + side, bottom: y + side };
}
