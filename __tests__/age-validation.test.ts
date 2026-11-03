import { isValidAge } from '../src/utils/ageValidation';

test.each(['0', '1', '25', '98', '99'])('accepts age %s', value => {
  expect(isValidAge(value)).toBe(true);
});

test.each([
  '',
  ' ',
  '-1',
  '-99',
  '100',
  '120',
  '1000',
  '2.5',
  '1e1',
  '+1',
  '25abc',
  '0x10',
])('rejects invalid age %s without truncating or converting it', value => {
  expect(isValidAge(value)).toBe(false);
});
