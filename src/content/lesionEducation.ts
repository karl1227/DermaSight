// Shared educational descriptions; these are not image-specific model findings.
export const LESION_CLASSES = [
  {
    name: 'Melanoma',
    abbreviation: 'MEL',
    riskLevel: 'high' as const,
    description:
      'Melanoma is the most serious form of skin cancer, developing in melanocytes (pigment-producing cells). It can spread rapidly to other parts of the body if not caught early.',
    commonSigns: [
      'Asymmetric, irregularly shaped mole',
      'Border with notched or ragged edges',
      'Multiple colors (brown, black, tan, pink, white, blue)',
      'Diameter larger than 6mm',
      'Evolving size, shape, or color over weeks or months',
    ],
  },
  {
    name: 'Basal Cell Carcinoma',
    abbreviation: 'BCC',
    riskLevel: 'high' as const,
    description:
      'The most common form of skin cancer, basal cell carcinoma begins in basal cells. It rarely spreads but can cause significant local tissue destruction if left untreated.',
    commonSigns: [
      'Pearly or waxy bump, often with visible blood vessels',
      'Flat, flesh-colored or brown scar-like lesion',
      'Bleeding or scabbing sore that heals and recurs',
      'Pink growth with raised edges and central indentation',
      'Usually appears on sun-exposed areas (face, neck, hands)',
    ],
  },
  {
    name: 'Actinic Keratoses',
    abbreviation: 'AKIEC',
    riskLevel: 'precancerous' as const,
    description:
      'Actinic keratosis is a rough, scaly patch caused by years of sun exposure. It is considered precancerous and may develop into squamous cell carcinoma if untreated.',
    commonSigns: [
      'Rough, dry, scaly patch of skin (less than 1 inch)',
      'Flat or slightly raised reddish patch',
      'Hard, wart-like surface',
      'Itching, burning, or tenderness in the affected area',
      'Appears on face, lips, ears, forearms, and scalp',
    ],
  },
  {
    name: 'Melanocytic Nevi',
    abbreviation: 'NV',
    riskLevel: 'benign' as const,
    description:
      'Commonly known as moles, melanocytic nevi are benign growths that form when melanocytes grow in clusters. Most moles are harmless but should be monitored for changes.',
    commonSigns: [
      'Uniform round or oval shape',
      'Consistent brown, tan, or black color throughout',
      'Smooth, well-defined borders',
      'Flat or slightly raised surface',
      'Stable appearance over time (no changes)',
    ],
  },
  {
    name: 'Benign Keratosis',
    abbreviation: 'BKL',
    riskLevel: 'benign' as const,
    description:
      'Benign keratosis-like lesions include seborrheic keratoses and other harmless growths. They are non-cancerous and very common in older adults.',
    commonSigns: [
      'Waxy, "stuck-on" appearance',
      'Tan, brown, or black color, may vary',
      'Well-defined, round or oval shape',
      'Slightly raised, rough or warty surface',
      'Can appear anywhere on the body',
    ],
  },
  {
    name: 'Dermatofibroma',
    abbreviation: 'DF',
    riskLevel: 'benign' as const,
    description:
      'Dermatofibromas are benign skin growths (fibrous nodules) most commonly found on the lower legs. They are generally harmless and require no treatment.',
    commonSigns: [
      'Small, firm, raised nodule',
      'Brownish, reddish-brown, or tan color',
      'Dimpling or puckering when pinched (classic sign)',
      'Often found on lower legs',
      'Usually asymptomatic; may itch slightly',
    ],
  },
  {
    name: 'Vascular Lesions',
    abbreviation: 'VASC',
    riskLevel: 'benign' as const,
    description:
      'This category groups blood-vessel-related lesions, such as angiomas. Many are benign, but a photo alone cannot establish the exact type.',
    commonSigns: [
      'Bright red, purple, or blue color',
      'Some types fade when pressed; others do not',
      'Smooth surface, soft texture',
      'Can range from tiny dots to larger flat patches',
      'Common in adults over 30 (cherry angiomas)',
    ],
  },
];

export const LESION_SOURCES: Record<string, string> = {
  Melanoma: 'https://dermnetnz.org/topics/melanoma',
  'Basal Cell Carcinoma': 'https://dermnetnz.org/topics/basal-cell-carcinoma',
  'Actinic Keratoses': 'https://dermnetnz.org/topics/actinic-keratosis',
  'Melanocytic Nevi': 'https://dermnetnz.org/topics/melanocytic-naevus',
  'Benign Keratosis': 'https://dermnetnz.org/topics/seborrhoeic-keratosis',
  Dermatofibroma: 'https://dermnetnz.org/topics/dermatofibroma',
  'Vascular Lesions': 'https://dermnetnz.org/topics/cherry-angioma',
};
