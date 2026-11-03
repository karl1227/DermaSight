import { Buffer } from 'buffer';
import samples from './fixtures/skin-appearance-samples.json';
import { inspectSkinAppearance } from '../src/services/skinAppearance';

// Photo regions extracted from supplied screenshots, excluding names and app UI.
// Regression examples, not an independent accuracy evaluation or training data.
test.each(samples)('$name screenshot photo-region regression', sample => {
  const result = inspectSkinAppearance(
    Uint8Array.from(Buffer.from(sample.rgb, 'base64')),
    sample.size,
    'capture',
  );
  if (sample.name === 'bottle' || sample.name === 'bag')
    expect(result.accepted).toBe(false);
  else expect(result.accepted).toBe(true);
  // Wood remains an explicit false positive: colour alone cannot prove human skin.
});
