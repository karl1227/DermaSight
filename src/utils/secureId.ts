/* eslint-disable no-bitwise -- UUID version and variant bits */
/** UUID v4 using the platform CSPRNG; never fall back to Math.random. */
export function secureId(): string {
  const runtime = globalThis as unknown as {
    RN$Bridgeless?: boolean;
    nativeCallSyncHook?: unknown;
  };
  if (
    __DEV__ &&
    runtime.RN$Bridgeless !== true &&
    runtime.nativeCallSyncHook === undefined
  ) {
    throw new Error(
      'Secure IDs require on-device JavaScript; remote Chrome debugging is unsupported.',
    );
  }
  const bytes = new Uint8Array(16);
  const rng = (
    globalThis as unknown as {
      crypto?: { getRandomValues: (array: Uint8Array) => Uint8Array };
    }
  ).crypto;
  if (!rng?.getRandomValues)
    throw new Error(
      'Secure random generation is unavailable. Rebuild the native app.',
    );
  rng.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
