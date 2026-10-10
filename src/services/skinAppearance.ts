/**
 * Experimental pixel-colour screen, not a trained human-skin detector.
 * Thresholds are prototype defaults and require diverse device/skin-tone evaluation.
 * Skin-coloured objects can pass; unusual lighting or skin tones can be rejected.
 */
export function inspectSkinAppearance(rgb: Uint8Array, size: number) {
  if (rgb.length !== size * size * 3 || size < 4)
    throw new Error('Invalid skin-check image.');
  let skinPixels = 0;
  let centerSkinPixels = 0;
  let centerPixels = 0;
  const start = Math.floor(size * 0.2);
  const end = Math.ceil(size * 0.8);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 3;
      const r = rgb[index];
      const g = rgb[index + 1];
      const b = rgb[index + 2];
      // Separate chroma from brightness; do not impose a light-skin luminance cutoff.
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const skinLike =
        cb >= 77 &&
        cb <= 127 &&
        cr >= 133 &&
        cr <= 173 &&
        chroma > 7 &&
        r > b &&
        r >= g;
      const centered = x >= start && x < end && y >= start && y < end;
      if (skinLike) {
        skinPixels++;
        if (centered) centerSkinPixels++;
      }
      if (centered) centerPixels++;
    }
  }
  const coverage = skinPixels / (size * size);
  const centerCoverage = centerSkinPixels / centerPixels;
  return {
    coverage,
    centerCoverage,
    accepted: coverage >= 0.2 && centerCoverage >= 0.15,
  };
}
