# Capture validation and merged review

Camera/gallery → Review Captured Image → Analyze Image → existing classifier → Result.

The Review screen now runs conversion, skin screening, quality checks, ROI extraction and existing preprocessing automatically. There is no separate preprocessing page in this path. It retains patient information, image preview, retake and retry, with loading stages and usable error messages. Analyze stays disabled while running or after a rejected image. Back/retake cancels further stages and suppresses stale screen updates. Zoom In/Out changes actual center-cropped ROI pixels, not only the displayed image. Native normalization bounds JPEG decoding at 1024 pixels and converts gallery formats to JPEG. Detected lesion bounds (including surrounding-skin margin) now expand to a square in source-image pixels with a minimum 224-pixel side. Squares shift inward at photo edges while retaining the detected region. If the region cannot fit in a square inside the photo, the original-image fallback is preserved. This adds real surrounding pixels instead of upscaling a tiny crop.

Existing EfficientNet weights/labels/inference remain unchanged: float32 RGB [1,224,224,3], 0–255 input. Existing lesion segmentation attempts automatic ROI extraction; failure falls back to the validated image. Severe quality gates reject dimensions below 224, mean luminance below 35/above 240, and edge score below 2. These prototype thresholds need real-device evaluation; the quality check is repeated on the final crop.

## Skin validation limitation

There is no trained skin/non-skin detector in this project. The enabled fallback is an **experimental YCbCr/colour-coverage filter**, not proof of human skin or a lesion detector. It requires skin-like coverage over 20% of the image and 15% of its centre. It rejects many plain neutral/blue/green images but **wood, clothing, walls and objects with skin-like colours can pass**. Real skin under some lighting or with unusual colour can be rejected. It does not identify scars; the classifier still predicts only its existing seven HAM10000 classes. Do not claim reliable non-skin rejection or measured accuracy from this filter.

Research context: [A Hybrid Color Space for Skin Detection](https://pmc.ncbi.nlm.nih.gov/articles/PMC4534136/) discusses colour-filter limitations with skin-like objects. Our thresholds are prototype defaults, not claimed reproductions of that paper or trained/tested medical thresholds.

## Replace the filter with a trained detector

`src/services/skinValidationService.ts` has a separate TFLite adapter. Obtain a skin/non-skin model evaluated on all intended skin tones, camera lighting and hard negatives (wood, clothing, walls, phones). Supply its local file URL, float32 NHWC square input size, RGB input range, output probability count, skin class index, and an acceptance threshold calibrated against that evaluation. The adapter checks model tensor metadata and rejects malformed outputs and non-skin scores. Quantized models or logits require adapting the adapter according to the export specification; do not guess normalization or labels.

Set SKIN_DETECTOR_CONFIG to this model specification to use it instead of the colour filter. Set REQUIRE_SKIN_VALIDATION=true to fail closed when the trained model is missing. Never use lesion-classifier confidence or segmentation confidence as a substitute for skin detection.

## Verification

Automated coverage includes non-skin rejection stopping downstream work, dark/glare/blur/small-image gates, validated ROI preprocessing, fallback for missing/tiny segmentation, cancellation, actual zoom cropping, and the appearance filter's known false-positive limitation. These mocked pipeline and synthetic-colour tests do **not** establish skin-detection accuracy. Real iPhone/Android captures, multiple skin tones, JPEG/HEIC/PNG imports and representative non-skin objects remain to be evaluated.

## Camera preview update

The enlarged rounded camera preview contains Gallery, Capture and Front/Back Switch controls using the existing SVG icon component and teal palette. Light remains available as a header text control. Front-camera flash/torch is guarded by device capabilities. Skin/quality checks, gallery import and patient context are retained. Square ROI geometry tests cover small boxes, rectangular photos, photo corners and impossible containment. All 51 app tests pass; TypeScript and targeted lint pass (two existing AccountUI style warnings). Physical-phone appearance and front/back capture still need hands-on verification.
