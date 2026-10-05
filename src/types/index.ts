// ─── Core Data Types ─────────────────────────────────────────────────────────

export interface PatientInfo {
  patientId: string; // compatibility display alias for the screening UUID
  screeningId: string;
  createdAt: string;
  owner: import('../auth/types').Owner;
  fullName: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other' | '';
  lesionLocation: string;
}

export interface ABCDEAnswers {
  asymmetry: boolean;
  borderIrregularity: boolean;
  colorVariation: boolean;
  diameterLarge: boolean;
  evolution: boolean;
}

export interface OtherSymptoms {
  pearlyOrWaxyBump: boolean;
  roughOrScalyTexture: boolean;
  bleedingOrCrusting: boolean;
  firmSmallNodule: boolean;
  dimplingWhenPinched: boolean;
  blanchingWhenPressed: boolean;
  redOrPurpleBump: boolean;
  stableAppearance: boolean;
  painOrTenderness: boolean;
  itching: boolean;
}

export interface SelectedSymptoms {
  abcde: ABCDEAnswers;
  other: OtherSymptoms;
}

// ─── AI Classification Types ─────────────────────────────────────────────────

export type LesionClass =
  | 'Melanoma'
  | 'Basal Cell Carcinoma'
  | 'Actinic Keratoses'
  | 'Melanocytic Nevi'
  | 'Benign Keratosis'
  | 'Dermatofibroma'
  | 'Vascular Lesions';

export type ScreeningStatus =
  | 'High Concern'
  | 'Precancerous Indicator'
  | 'Generally Benign'
  | 'Low Confidence';

export type ThresholdStatus = 'Above Threshold' | 'Below Threshold';

export interface ClassificationResult {
  predictedLesionType: LesionClass;
  confidenceScore: number; // 0–100
  screeningStatus: ScreeningStatus;
  thresholdStatus: ThresholdStatus;
  matchingVisualFeatures: string[];
  assessmentMessage: string;
}

// ─── Database Record ─────────────────────────────────────────────────────────

export interface ScreeningRecord {
  id?: number;
  screening_id: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  patient_id: string;
  full_name: string; // historical profile snapshot, not the account source of truth
  age: number;
  sex: string; // historical profile snapshot
  lesion_location: string;
  selected_symptoms: string; // JSON
  abcde_answers: string; // JSON
  image_path: string;
  predicted_lesion_type: string;
  confidence_score: number;
  screening_status: string;
  threshold_status: string;
  matching_visual_features: string; // JSON
  recommendation_basis: string;
  recommendation: string;
  created_at: string;
}

// ─── Navigation Param List ────────────────────────────────────────────────────

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Splash: undefined;
  Onboarding: undefined;
  Landing: undefined;
  MedicalDisclaimer: undefined;
  PrivacyConsent: undefined;
  SettingsMedicalDisclaimer: undefined;
  SettingsPrivacyConsent: undefined;
  MainTabs: undefined;
  Settings: undefined;
  EditProfile: undefined;
  AccountSecurity: undefined;
  About: undefined;
  PatientInfo: undefined;
  SymptomChecklist: { patientInfo: PatientInfo };
  Camera: { patientInfo: PatientInfo; symptoms: SelectedSymptoms };
  ConfirmImage: {
    patientInfo: PatientInfo;
    symptoms: SelectedSymptoms;
    imageUri: string;
    imagePath?: string;
    imageData?: string;
    imageType?: string;
    imageMeta?: {
      width?: number;
      height?: number;
      fileSize?: number;
    };
  };
  ImagePreprocessing: {
    patientInfo: PatientInfo;
    symptoms: SelectedSymptoms;
    imageUri: string;
    imagePath?: string;
    imageData?: string;
    imageType?: string;
  };
  AIClassification: {
    patientInfo: PatientInfo;
    symptoms: SelectedSymptoms;
    imageUri: string;
    imagePath?: string;
    imageData?: string;
    imageType?: string;
    preprocessingId?: string;
  };
  Result: {
    patientInfo: PatientInfo;
    symptoms: SelectedSymptoms;
    imageUri: string;
    result: ClassificationResult;
  };
  Report: { recordId: number };
  LesionGuide: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Guide: undefined;
  Analytics: undefined;
  Profile: undefined;
};
