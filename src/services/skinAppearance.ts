/**
 * Experimental pixel-colour screen, not a trained human-skin detector.
 * Thresholds are prototype defaults and require diverse device/skin-tone evaluation.
 * Skin-coloured objects can pass; unusual lighting or skin tones can be rejected.
 */
export function inspectSkinAppearance(
  rgb: Uint8Array,
  size: number,
  mode: 'capture' | 'roi' = 'roi',
) {
  if (rgb.length !== size * size * 3 || size < 4)
    throw new Error('Invalid skin-check image.');
  let skinPixels = 0;
  let centerSkinPixels = 0;
  let centerPixels = 0;
  let darkCenterPixels = 0;
  let targetPixels = 0;
  let targetSkinPixels = 0;
  let targetDarkPixels = 0;
  const targetStart = Math.floor(size * 0.4);
  const targetEnd = Math.ceil(size * 0.6);
  const skinMask = new Uint8Array(size * size);
  const tileSkin = new Array<number>(9).fill(0);
  const tilePixels = new Array<number>(9).fill(0);
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
      if (
        x >= targetStart &&
        x < targetEnd &&
        y >= targetStart &&
        y < targetEnd
      ) {
        targetPixels++;
        if (skinLike) targetSkinPixels++;
        // Keep dark lesion centers possible without treating medium-grey plastic as skin.
        if (chroma <= 25 && (r + g + b) / 3 < 90) targetDarkPixels++;
      }
      if (skinLike) {
        skinPixels++;
        skinMask[y * size + x] = 1;
        if (centered) centerSkinPixels++;
      }
      if (centered) {
        centerPixels++;
        // A dark/neutral lesion need not have the color of the surrounding skin.
        if (
          Math.max(r, g, b) - Math.min(r, g, b) <= 25 &&
          (r + g + b) / 3 < 145
        )
          darkCenterPixels++;
        const col = Math.min(2, Math.floor(((x - start) * 3) / (end - start)));
        const row = Math.min(2, Math.floor(((y - start) * 3) / (end - start)));
        const tile = row * 3 + col;
        tilePixels[tile]++;
        if (skinLike) tileSkin[tile]++;
      }
    }
  }
  const coverage = skinPixels / (size * size);
  const centerCoverage = centerSkinPixels / centerPixels;
  // Require a close-up with skin-like pixels distributed around the target,
  // rather than accepting a hand or small patch beside a central object.
  const supportedTiles = tileSkin.filter(
    (count, i) => tilePixels[i] > 0 && count / tilePixels[i] >= 0.5,
  ).length;
  // Reject isolated skin-colored speckles: require a connected surrounding area.
  let largest = 0;
  const visited = new Uint8Array(size * size);
  const queue = new Int32Array(size * size);
  for (let i = 0; i < skinMask.length; i++) {
    if (!skinMask[i] || visited[i]) continue;
    let head = 0,
      tail = 1;
    queue[0] = i;
    visited[i] = 1;
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % size;
      const neighbors = [
        x > 0 ? pixel - 1 : -1,
        x < size - 1 ? pixel + 1 : -1,
        pixel - size,
        pixel + size,
      ];
      for (const next of neighbors) {
        if (
          next < 0 ||
          next >= skinMask.length ||
          !skinMask[next] ||
          visited[next]
        )
          continue;
        visited[next] = 1;
        queue[tail++] = next;
      }
    }
    largest = Math.max(largest, tail);
  }
  const connectedCoverage = largest / (size * size);
  const surroundingCoverage =
    (skinPixels - centerSkinPixels) / (size * size - centerPixels);
  const darkCenterCoverage = darkCenterPixels / centerPixels;
  const targetCoverage = targetSkinPixels / targetPixels;
  const targetDarkCoverage = targetDarkPixels / targetPixels;
  const ringPixels = centerPixels - targetPixels;
  const targetSurroundingCoverage =
    ringPixels > 0 ? (centerSkinPixels - targetSkinPixels) / ringPixels : 0;
  // A central object must not qualify just because a table or hand surrounds it.
  // This remains a colour heuristic, not evidence that a texture is human skin.
  const targetSupported =
    targetCoverage >= 0.5 ||
    (targetDarkCoverage >= 0.3 && targetSurroundingCoverage >= 0.65);
  const appearanceAccepted =
    mode === 'capture'
      ? coverage >= 0.2 &&
        centerCoverage >= 0.25 &&
        supportedTiles >= 3 &&
        connectedCoverage >= 0.15
      : coverage >= 0.35 &&
        surroundingCoverage >= 0.55 &&
        connectedCoverage >= 0.25 &&
        (centerCoverage >= 0.65 || darkCenterCoverage >= 0.3);
  return {
    targetCoverage,
    targetDarkCoverage,
    targetSurroundingCoverage,
    targetSupported,
    connectedCoverage,
    surroundingCoverage,
    darkCenterCoverage,
    supportedTiles,
    coverage,
    centerCoverage,
    accepted: appearanceAccepted && targetSupported,
  };
}
