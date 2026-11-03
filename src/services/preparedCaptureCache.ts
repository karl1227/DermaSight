import { CAPTURE_INPUT_VERSION } from '../config/capture';
import type { PreparedCapture } from './capturePreparationService';
import type { Owner } from '../auth/types';

const entries = new Map<
  string,
  { value: PreparedCapture; owner: string; source: string; expires: number }
>();
export function cachePreparedCapture(
  id: string,
  owner: Owner,
  source: string,
  value: PreparedCapture,
) {
  for (const [key, entry] of entries)
    if (entry.expires < Date.now()) entries.delete(key);
  while (entries.size >= 3) entries.delete(entries.keys().next().value!);
  entries.set(id, {
    value,
    source,
    owner: owner.kind + ':' + owner.id,
    expires: Date.now() + 5 * 60_000,
  });
}
export function takePreparedCapture(
  id: string | undefined,
  owner: Owner,
  source: string,
) {
  if (!id) return undefined;
  const entry = entries.get(id);
  entries.delete(id);
  if (
    !entry ||
    entry.value.cropped ||
    entry.value.inputVersion !== CAPTURE_INPUT_VERSION ||
    entry.expires < Date.now() ||
    entry.owner !== owner.kind + ':' + owner.id ||
    entry.source !== source
  )
    return undefined;
  return entry.value;
}
