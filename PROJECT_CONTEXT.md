# Project context

Source: https://chatgpt.com/share/6aba1290-52e4-83ec-90f6-e1d2a6bf6e4b

Reviewed on 2026-10-05 alongside the existing repository. This is a distilled
working reference, not a complete transcript or a replacement for approved thesis
documents. The shared page exposes text inconsistently as it renders; many prior
attachments appear only as "Uploaded a file" or "Uploaded an image". Their
contents, training outputs, and final document revisions have not been verified.

## Purpose and audience

- Capstone: preliminary pigmented skin lesion classification using CNN image
  processing on consumer smartphones.
- The proposal and native app use SkinSense; the repository and later discussion
  use DermaSight. Final branding is unresolved. Preserve current naming until an
  explicit branding change is requested.
- The project moved from a hardware kiosk to an offline mobile application.
- Android and iOS are intended platforms. The user reports Android already runs;
  the immediate objective is running the existing app on an iPhone from a Mac.
- Intended audience includes Filipino patients, rural communities, barangay health
  workers, Rural Health Units, and BHERTs.
- Preserve the existing features, visual design, and React Native architecture.

## Core workflow and architecture

Consent/disclaimer -> Home -> Patient information -> Symptom checklist ->
Camera/gallery -> Image review/quality checks -> Preprocessing -> EfficientNet
TensorFlow Lite classification -> Preliminary result -> Optional local saving ->
History/report.

- ABCDE questions belong before image capture in every screening, rather than
  appearing only after a melanoma prediction.
- Include other lesion observations: pearly/waxy bump, rough/scaly texture,
  bleeding/crusting, firm nodule, dimpling, blanching, and other existing signs.
- Seven classification categories: Actinic Keratoses, Basal Cell Carcinoma,
  Benign Keratosis-like Lesions, Dermatofibroma, Melanoma, Melanocytic Nevi,
  and Vascular Lesions.
- React Native/TypeScript presents the UI; bundled TFLite models perform local
  inference; OP-SQLite and app-local files hold screening records and images.
- Preserve offline screening, history, and educational content.
- Model preprocessing and label order must match the trained artifact. The local
  model README specifies 224 x 224 RGB float32 input in the 0-255 range and label
  order AK, BCC, BKL, DF, MEL, NV, VASC. This is repository documentation, not an
  independent validation of training.
- The recent discussion separates CNN image predictions from patient metadata
  and symptoms. Do not change class probabilities using arbitrary checklist
  rules. The current classifier ignoring symptoms is not automatically a defect.

## Scope and presentation

- Present predictions, model confidence, educational information, and a clear
  preliminary-screening disclaimer. Avoid definitive diagnosis wording.
- Excluded proposal features include kiosk hardware, Raspberry Pi, thermal
  printers, telemedicine, doctor chat, prescriptions, and payment features.
- The user requested module-based presentation of the screens for the defense.
- Preserve established colors, cards, typography, and flow. Earlier prototypes
  are historical references rather than instructions to replace current UI.

## Unresolved decisions and conflicting history

- Older proposal/prototype text includes risk levels and multimodal classification.
  Later user wording requests no risk level in a business-model update and
  emphasizes predicted lesion type + confidence + disclaimer. That diagram
  request does not establish permission to remove current screening statuses.
  Resolve the intended application output before adding or removing risk logic.
- Guest, sign-in, and sign-up were discussed conditionally; they are not present
  in the inspected app and are not authorized for implementation merely by this
  context import.
- Local-only accounts versus online accounts usable across devices is unresolved.
- Guest record retention, deletion on exit, and transfer to a new account were
  alternatives, not settled requirements. Never delete existing records based on
  an earlier assistant suggestion.
- Account-specific record ownership would be needed if multiple users are added;
  the current database has no user/session ownership model.
- Initial documents describe demographic/symptom fusion, dataset validation for
  Filipino applicability, supplementary datasets, and database encryption. These
  are proposal claims/plans, not verified implementation or evaluation results.
- Training was discussed in Google Colab using HAM10000 and EfficientNet, followed
  by evaluation and TFLite conversion. Uploaded results are not available here;
  do not invent accuracy, clinical validation, or model provenance.

## Repository observations from the initial inspection

- iOS workspace and target already exist under ios/SkinSense.xcworkspace.
- Current deployment target is iOS 15.1; package.json requires Node >= 22.11.0.
- Xcode 26.6 and Node 22.22.3 were available during inspection.
- node_modules is incomplete: Vision Camera, Worklets Core, camera resize plugin,
  and several Babel dependencies are missing. CocoaPods gems/ios/Pods are absent.
- iOS camera permission text exists; photo-library text is absent while gallery
  selection requests extra metadata. Device signing needs configuration.
- Image processing decodes JPEG only; iOS formats and orientation need testing.
- History-enable toggle is screen-local state and is not wired to persistence.
- Delete-all removes database rows without deleting saved image files.
- matchingVisualFeatures is always empty. Existing tests contain only a basic
  render test; iOS app icon slots have no image files.
- No iOS build or physical iPhone run has been verified.

## Academic context

- The history includes Chapters 1-3, architecture, storyboard/design discussion,
  market diagrams, Agile development, and ISO/IEC 25010 evaluation planning.
- A Chapter 2 activity requested at least ten physical TIP Library books dated
  2022-2026, APA references, library-visit evidence, and member contributions.
  Bibliographic claims in prior assistant messages still require verification
  if reused for academic work.
- Keep explanations understandable for the team and usable in the capstone
  defense. Distinguish working code, proposed features, and measured results.
