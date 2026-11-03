# Current DermaSight classifier and capture flow

Both Camera and Gallery use the same `prepareCapture` → `runPreprocessing` → `runInference` path.

The selected model is the teammate's `20383b0` EfficientNet export. Its SHA-256 is `ba541d0b9ce68007c2a58cefc217cda4c47db43fea147bf14d13a44c62c478c2`. This matches the export in Git and all four packaged/source model copies. The supplied `Model_Training.ipynb` saved outputs report 78.84% best validation accuracy, 94.90% final training accuracy and 96.58% validation AUC. The earlier teammate-reported 90% figure is not a saved validation result in that notebook. These saved metrics have not been independently reproduced. See `model-audit/README.md`.

Shared model settings are in `src/config/classifier.ts`. Output order follows the supplied label files:

| Index | Code | App label |
|---|---|---|
| 0 | AK | Actinic Keratoses |
| 1 | BCC | Basal Cell Carcinoma |
| 2 | BKL | Benign Keratosis |
| 3 | DF | Dermatofibroma |
| 4 | MEL | Melanoma |
| 5 | NV | Melanocytic Nevi |
| 6 | VASC | Vascular Lesions |

Do not swap MEL and NV to make a particular photo appear correct. The supplied notebook explicitly sets this class order for both directory loaders and writes it to the exported label file. Do not change it to force an expected answer for one photograph.

U-Net inference and automatic cropping are disabled for both entry points. Skin and quality validation remain active. Readable local JPEGs go directly into the unchanged 224×224 RGB float32 0–255 tensor builder. Other formats keep the native JPEG conversion required by the decoder. The model contains normalization and a final softmax; the app reports the largest output ×100 without boosting it or forcing 90%.

`__tests__/seven-class-capture-flow.test.ts` exercises both sources through real JPEG decoding/preprocessing with mocked native model outputs for every class position. These tests establish routing, input handoff and label mapping; they do not measure trained-model accuracy. Binary-integrity tests check all classifier assets and labels. Existing source, validation, retake, ownership, session and navigation tests remain active.

For actual accuracy evaluation, use held-out dataset examples with known labels, track the model version, input files, predicted class and score, and calculate per-class results/confusion matrix. Report ordinary-phone-photo evaluation separately from dermoscopic dataset evaluation. A confidence percentage for one image is not test-set accuracy or a clinical diagnosis.
