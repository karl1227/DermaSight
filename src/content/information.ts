// Brief mobile content supplied by the project team. Storage wording reflects
// the current implementation; no cloud upload or Firebase service is enabled.
export const PROJECT_OPERATORS =
  'Karl Christopher D. Blockstock, Michelle Ann S. Angeles, Emmanuel M. Espeña and Gerald Elli Ramos';
export const PROJECT_INSTITUTION =
  'College of Computer Studies, Technological Institute of the Philippines–Quezon City';
export const PRIVACY_CONTACT = 'Michelle Ann S. Angeles — qmasamar@tip.edu.ph';
export const SCREENING_CONSENT =
  'I consent to processing the information and photographs I provide for screening, as described in the full Privacy Notice.';
export const MEDICAL_ACKNOWLEDGMENT =
  'I understand the application’s screening purpose and limitations.';

export const PRIVACY_SECTIONS = [
  {
    icon: 'db' as const,
    title: 'Responsible Operator',
    body: `${PROJECT_OPERATORS} of the ${PROJECT_INSTITUTION}. Privacy contact: ${PRIVACY_CONTACT}.`,
    citation: 'DermaSight project team',
  },
  {
    icon: 'db' as const,
    title: 'Information We Process',
    body: 'DermaSight processes the information you provide—including screening details, occupation, sunburn history, symptom responses and photographs—to provide screening functions and maintain your records.',
    citation: 'Privacy Notice · Information and purposes',
  },
  {
    icon: 'db' as const,
    title: 'Local Screening Records',
    body: 'Guests use a local guest session without creating an account. Screening records and images remain on this device for both guests and registered users. They are not automatically uploaded when internet access returns.',
    citation: 'Current app storage',
  },
  {
    icon: 'wifi' as const,
    title: 'Online Accounts',
    body: 'Registration and sign-in send account information to the project account server, currently running on the project Mac. Google Sign-In verifies identity. Cloud screening storage, Firebase integration and cross-device history backup are not enabled.',
    citation: 'Current development setup',
  },
  {
    icon: 'x' as const,
    title: 'Your Choices and Requests',
    body: 'You may contact us about access, correction, withdrawal or deletion, subject to applicable law. Signing out does not delete saved records. Read the full notice for storage, safeguards, retention, authorized recipients and request procedures.',
    citation: 'Privacy contact: qmasamar@tip.edu.ph',
  },
];
export const MEDICAL_SECTIONS = [
  {
    title: 'Preliminary Educational Screening',
    body: 'DermaSight does not diagnose or rule out skin cancer, determine severity or cancer stage, prescribe treatment, or replace a licensed healthcare professional.',
  },
  {
    title: 'Results May Be Incorrect',
    body: 'A possible category, confidence score or “low-risk” indicator does not confirm that a lesion is harmless.',
  },
  {
    title: 'Professional Assessment',
    body: 'Seek professional assessment for a new, changing, unusual, persistently painful or bleeding lesion, or a sore that does not heal—regardless of the result.',
    danger: true,
  },
  {
    title: 'Screening Limitations',
    body: 'Body-location options and personal-history questions do not guarantee an accurate result. DermaSight is not an emergency service.',
  },
];
export const ABOUT_SUMMARY =
  'DermaSight is a hybrid mobile application for preliminary, educational skin-lesion screening. It analyzes a skin photograph to suggest a possible lesion category using a model trained on the seven-category HAM10000 dataset.';
