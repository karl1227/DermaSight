import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';
import RNFS from 'react-native-fs';

export interface ImageMetadata {
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface ImageSource {
  base64?: string;
  mimeType?: string;
  filePath?: string;
}

export interface QualityCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'info';
  detail: string;
}

export interface QualityAssessment {
  checks: QualityCheck[];
  overallStatus: 'pass' | 'warn';
  summary: string;
}

const DEFAULT_IMAGE_SIZE = 224;

function stripDataPrefix(base64: string): string {
  return base64.includes(',') ? base64.split(',').pop() ?? base64 : base64;
}

function decodeRgbFromJpeg(buffer: Buffer): { width: number; height: number; rgb: Uint8Array } {
  const decoded = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
  if (!decoded?.data?.length) {
    throw new Error('Could not decode JPEG pixels.');
  }

  const rgb = new Uint8Array(decoded.width * decoded.height * 3);
  for (let i = 0, j = 0; i < decoded.data.length; i += 4, j += 3) {
    rgb[j] = decoded.data[i];
    rgb[j + 1] = decoded.data[i + 1];
    rgb[j + 2] = decoded.data[i + 2];
  }

  return { width: decoded.width, height: decoded.height, rgb };
}

async function decodeSource(source: ImageSource): Promise<{ width: number; height: number; rgb: Uint8Array }> {
  const base64 = source.base64 ?? (
    source.filePath
      ? await RNFS.readFile(source.filePath.startsWith('file://') ? source.filePath.slice(7) : source.filePath, 'base64')
      : undefined
  );
  if (!base64) {
    throw new Error('No image payload available for decoding.');
  }

  const buffer = Buffer.from(stripDataPrefix(base64), 'base64');
  return decodeRgbFromJpeg(buffer);
}

function bilinearResize(
  srcData: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
): Uint8Array {
  const dst = new Uint8Array(dstWidth * dstHeight * 3);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    for (let dstX = 0; dstX < dstWidth; dstX++) {
      const srcX = dstX * xRatio;
      const srcY = dstY * yRatio;

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcWidth - 1);
      const y1 = Math.min(y0 + 1, srcHeight - 1);

      const xFrac = srcX - x0;
      const yFrac = srcY - y0;

      const idx00 = (y0 * srcWidth + x0) * 3;
      const idx10 = (y0 * srcWidth + x1) * 3;
      const idx01 = (y1 * srcWidth + x0) * 3;
      const idx11 = (y1 * srcWidth + x1) * 3;

      const w00 = (1 - xFrac) * (1 - yFrac);
      const w10 = xFrac * (1 - yFrac);
      const w01 = (1 - xFrac) * yFrac;
      const w11 = xFrac * yFrac;

      const dstIdx = (dstY * dstWidth + dstX) * 3;
      for (let c = 0; c < 3; c++) {
        dst[dstIdx + c] = Math.round(
          srcData[idx00 + c] * w00 +
          srcData[idx10 + c] * w10 +
          srcData[idx01 + c] * w01 +
          srcData[idx11 + c] * w11,
        );
      }
    }
  }

  return dst;
}

export async function loadResizedImageRgb(
  source: ImageSource,
  size = DEFAULT_IMAGE_SIZE,
): Promise<Uint8Array> {
  const decoded = await decodeSource(source);
  return bilinearResize(decoded.rgb, decoded.width, decoded.height, size, size);
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function analyzeBrightness(rgb: Uint8Array): { mean: number; min: number; max: number } {
  let total = 0;
  let min = 255;
  let max = 0;

  for (let i = 0; i < rgb.length; i += 3) {
    const value = luminance(rgb[i], rgb[i + 1], rgb[i + 2]);
    total += value;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return {
    mean: total / (rgb.length / 3),
    min,
    max,
  };
}

function analyzeSharpness(rgb: Uint8Array, width: number, height: number): number {
  const intensities = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      intensities[y * width + x] = luminance(rgb[idx], rgb[idx + 1], rgb[idx + 2]);
    }
  }

  let total = 0;
  let count = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const current = intensities[y * width + x];
      const right = intensities[y * width + x + 1];
      const down = intensities[(y + 1) * width + x];
      total += Math.abs(current - right) + Math.abs(current - down);
      count += 2;
    }
  }

  return count > 0 ? total / count : 0;
}

export async function assessImageQuality(
  source: ImageSource,
  metadata: ImageMetadata = {},
): Promise<QualityAssessment> {
  const rgb = await loadResizedImageRgb(source);
  const width = DEFAULT_IMAGE_SIZE;
  const height = DEFAULT_IMAGE_SIZE;
  const brightness = analyzeBrightness(rgb);
  const sharpness = analyzeSharpness(rgb, width, height);
  const sourceWidth = metadata.width ?? width;
  const sourceHeight = metadata.height ?? height;
  const sourcePixels = Math.max(1, sourceWidth * sourceHeight);
  const bytesPerPixel = (metadata.fileSize ?? 0) / sourcePixels;

  const resolutionPass = sourceWidth >= DEFAULT_IMAGE_SIZE && sourceHeight >= DEFAULT_IMAGE_SIZE;
  const brightnessPass = brightness.mean >= 65 && brightness.mean <= 205;
  const sharpnessPass = sharpness >= 10 || bytesPerPixel >= 0.12;

  const checks: QualityCheck[] = [
    {
      id: 'resolution',
      label: 'Resolution meets model input size',
      status: resolutionPass ? 'pass' : 'warn',
      detail: resolutionPass
        ? `Captured image is ${sourceWidth}×${sourceHeight}.`
        : 'Image is below the recommended 224×224 minimum and may reduce accuracy.',
    },
    {
      id: 'lighting',
      label: 'Lighting looks usable',
      status: brightnessPass ? 'pass' : 'warn',
      detail: brightnessPass
        ? `Average brightness is ${brightness.mean.toFixed(0)} / 255, which is within a usable range.`
        : brightness.mean < 65
          ? `Average brightness is ${brightness.mean.toFixed(0)} / 255, suggesting the image may be underexposed.`
          : `Average brightness is ${brightness.mean.toFixed(0)} / 255, suggesting the image may be overexposed.`,
    },
    {
      id: 'sharpness',
      label: 'Focus looks reasonably sharp',
      status: sharpnessPass ? 'pass' : 'warn',
      detail: sharpnessPass
        ? `Edge contrast score is ${sharpness.toFixed(1)}, which is consistent with a usable image.`
        : `Edge contrast score is ${sharpness.toFixed(1)}, which may indicate blur or heavy compression.`,
    },
    {
      id: 'compressed',
      label: 'File compression is acceptable',
      status: bytesPerPixel >= 0.12 ? 'pass' : 'info',
      detail: metadata.fileSize
        ? `File size is ${Math.round(metadata.fileSize / 1024)} KB, about ${bytesPerPixel.toFixed(2)} bytes per source pixel.`
        : 'File size was not available, so compression quality could not be estimated.',
    },
  ];

  const failedChecks = checks.filter(check => check.status === 'warn').length;
  return {
    checks,
    overallStatus: failedChecks > 0 ? 'warn' : 'pass',
    summary:
      failedChecks > 0
        ? 'One or more image-quality checks need attention before analysis.'
        : 'Image quality looks acceptable for preprocessing and analysis.',
  };
}