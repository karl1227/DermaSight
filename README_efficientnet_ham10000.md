# EfficientNet HAM10000 TFLite Model Context

This README provides contextual specifications for AI code assistants (Cursor IDE, Kiro IDE, GitHub Copilot) to generate accurate inference, preprocessing, and UI code for `efficientnet_ham10000.tflite`.

## 1. Model Overview
- Model File: efficientnet_ham10000.tflite
- Base Architecture: EfficientNetB0
- Target Task: Multi-class Pigmented Skin Lesion Classification (7 Categories)
- Dataset: HAM10000 (Human Against Machine with 10,000 dermatoscopic images)
- Target Runtime: Mobile / Edge offline inference (React Native, Android, iOS)

## 2. Tensor Specifications

### Input Tensor
- Shape: [1, 224, 224, 3] ([Batch, Height, Width, Channels])
- Data Type: Float32
- Color Space: RGB
- Normalization: Standard 0–255 pixel range (EfficientNetB0 handles internal scaling)

### Output Tensor
- Shape: [1, 7]
- Data Type: Float32
- Activation: Softmax (Array of 7 probability scores summing to 1.0)

## 3. Label Index Mapping (labels.txt)
Class labels in exact output index order (alphabetical):

- Index 0: AK   - Actinic Keratoses / Intraepithelial Carcinoma (Premalignant)
- Index 1: BCC  - Basal Cell Carcinoma (Malignant)
- Index 2: BKL  - Benign Keratosis-like Lesions (Benign)
- Index 3: DF   - Dermatofibroma (Benign)
- Index 4: MEL  - Melanoma (High Malignancy Risk)
- Index 5: NV   - Melanocytic Nevi (Benign)
- Index 6: VASC - Vascular Lesions (Benign)

## 4. Preprocessing & Inference Rules for AI Code Generation

1. Image Preprocessing:
   - Crop and resize raw input image to 224x224 pixels.
   - Convert image buffer into a flat Float32Array of size 150,528 (224 * 224 * 3).
   - Ensure color channel order is RGB (not BGR).

2. Mobile React Native Inference Code Pattern:
   ```typescript
   import { loadTensorflowModel } from 'react-native-fast-tflite';

   const LABELS = ['AK', 'BCC', 'BKL', 'DF', 'MEL', 'NV', 'VASC'];

   // Load model asset from bundle
   const model = await loadTensorflowModel({
     actualFilename: 'efficientnet_ham10000.tflite',
   });

   // Pass preprocessed float32 array
   const inputBuffer = new Float32Array(1 * 224 * 224 * 3);
   const outputArray = await model.run([inputBuffer]);

   // Postprocess output probabilities
   const probabilities = Array.from(outputArray[0] as Float32Array);
   const predictions = probabilities
     .map((score, index) => ({
       label: LABELS[index],
       confidence: score,
     }))
     .sort((a, b) => b.confidence - a.confidence);

   const topPrediction = predictions[0];