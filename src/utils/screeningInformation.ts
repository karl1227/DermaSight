export const PRIMARY_LOCATIONS = [
  'Face',
  'Neck',
  'Nape',
  'Forearm',
  'Shoulder',
  'Leg',
  'Torso',
];
export const OTHER_LOCATIONS = [
  'Arm',
  'Back',
  'Chest',
  'Hand',
  'Foot',
  'Other',
];
export const OCCUPATIONS = [
  'Agricultural Workers',
  'Fisherfolk and Aquaculture Workers',
  'Construction and Infrastructure Workers',
  'Transport Workers',
  'Outdoor Vendors and Street Traders',
  'Other',
];

// A display label only; database ownership and navigation keep the full UUID.
export function screeningLabel(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
