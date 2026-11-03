export const AGE_ERROR = 'Enter a whole-number age from 0 to 99.';

export function isValidAge(value: string): boolean {
  return /^\d{1,2}$/.test(value) && Number(value) <= 99;
}
