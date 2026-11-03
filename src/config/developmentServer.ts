import { TurboModuleRegistry, type TurboModule } from 'react-native';

// Used when a development build loads an embedded bundle instead of Metro.
export const DEVELOPMENT_SERVER_FALLBACK = 'http://10.201.1.216:3001';

interface SourceCodeModule extends TurboModule {
  getConstants(): { scriptURL: string };
}

export function backendUrlFromBundle(
  scriptURL?: string,
  fallback = DEVELOPMENT_SERVER_FALLBACK,
): string {
  // Do not rely on URL.hostname: React Native's URL polyfill differs from
  // browser/Node URL handling for bracketed IPv6 hosts.
  const match = scriptURL?.match(
    /^https?:\/\/(\[[^\]\s]+\]|[a-z\d.-]+)(?::\d+)?(?:[/?#]|$)/i,
  );
  const host = match?.[1];
  if (
    !host ||
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host.toLowerCase())
  )
    return fallback;
  return `http://${host}:3001`;
}

export function developmentBackendUrl(): string {
  try {
    const source = TurboModuleRegistry.get<SourceCodeModule>('SourceCode');
    return backendUrlFromBundle(source?.getConstants().scriptURL);
  } catch {
    return DEVELOPMENT_SERVER_FALLBACK;
  }
}
