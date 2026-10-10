import { LesionClass, ScreeningStatus } from '../types';

/**
 * Generate a padded patient ID like SS-2024-0001
 */
export function generatePatientId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SS-${year}-${rand}`;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format confidence score to display string
 */
export function formatConfidence(score: number): string {
  return `${score.toFixed(1)}%`;
}

/**
 * Map lesion class to screening status
 */
export function getScreeningStatus(
  lesionType: LesionClass,
  confidence: number,
): ScreeningStatus {
  if (confidence < 70) return 'Low Confidence';
  const highConcern: LesionClass[] = ['Melanoma', 'Basal Cell Carcinoma'];
  const precancerous: LesionClass[] = ['Actinic Keratoses'];
  if (highConcern.includes(lesionType)) return 'High Risk';
  if (precancerous.includes(lesionType)) return 'Medium Risk';
  return 'Low Risk';
}

/** Display older saved records using the current category names. */
export function normalizeScreeningStatus(status: string): ScreeningStatus {
  switch (status) {
    case 'High Concern':
      return 'High Risk';
    case 'Precancerous Indicator':
      return 'Medium Risk';
    case 'Generally Benign':
      return 'Low Risk';
    case 'High Risk':
    case 'Medium Risk':
    case 'Low Risk':
      return status;
    default:
      return 'Low Confidence';
  }
}

/**
 * Get the status badge color for a screening status
 */
export function getStatusColor(status: string): string {
  switch (normalizeScreeningStatus(status)) {
    case 'High Risk':
      return '#E53935';
    case 'Medium Risk':
      return '#F57C00';
    case 'Low Risk':
      return '#2E7D32';
    default:
      return '#1565C0';
  }
}

/**
 * Get assessment message based on lesion type and status
 */
export function getAssessmentMessage(
  status: ScreeningStatus,
  _lesionType: LesionClass,
): string {
  switch (status) {
    case 'High Risk':
      return 'High Risk Classification';
    case 'Medium Risk':
      return 'Medium Risk Classification';
    case 'Low Risk':
      return 'Low Risk Classification';
    default:
      return 'Low-Confidence Classification';
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
