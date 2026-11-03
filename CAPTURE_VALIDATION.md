# Capture validation and merged review

Camera/gallery → photo quality check on Skin Scan → U-Net region selection → skin validation of selected ROI → frozen-photo highlight and crop → Review Captured Image → Analyze Image → existing classifier → Result.

The Skin Scan entry runs conversion, skin screening, quality checks, ROI extraction and preprocessing before Review. Review uses the owner/source-bound prepared handoff, or revalidates if it is absent. There is no separate preprocessing page in this path. It retains patient information, image preview, retake and retry, with loading stages and usable error messages. Analyze stays disabled while running or after a rejected image. Back/retake cancels further stages and suppresses stale screen updates. Manual Zoom In/Out and its center-cropping function have been removed. Automatic lesion ROI extraction remains. Every camera/gallery entry pushes a fresh review with a capture ID. Retake immediately invalidates acceptance, cancels further preparation, and ignores late completions. Native normalization bounds JPEG decoding at 1024 pixels and converts gallery formats to JPEG. Detected lesion bounds (including surrounding-skin margin) now expand to a square in source-image pixels with a minimum 224-pixel side. Squares shift inward at photo edges while retaining the detected region. If the region cannot fit in a square inside the photo, the original-image fallback is preserved. This adds real surrounding pixels instead of upscaling a tiny crop.

Existing EfficientNet weights/labels/inference remain unchanged: float32 RGB [1,224,224,3], 0–255 input. Existing lesion segmentation attempts automatic ROI extraction; failure falls back to the validated image. Severe quality gates reject dimensions below 224, mean luminance below 35/above 240, and edge score below 2. These prototype thresholds need real-device evaluation; the quality check is repeated on the final crop.

## Skin validation limitation

There is no trained skin/non-skin detector in this project. The enabled fallback is an **experimental YCbCr/colour-coverage filter**, not proof of human skin or a lesion detector. Photo and cropped-region checks are separate. A full capture requires at least 20% skin-like pixels overall, 25% in its center, three supported center tiles and a connected skin-like area covering 15% of the photo. The ROI requires at least 35% overall coverage, 55% surrounding coverage, a connected area of 25%, and either 65% center skin-like coverage or a dark/neutral center consistent with a dark lesion (30% of center pixels). Both modes additionally check the central 20% target: at least 50% skin-like pixels, or a dark/neutral center below brightness 90 covering at least 30% with at least 65% skin-like coverage in its surrounding central ring. These are uncalibrated prototype thresholds; they reduce rejection caused by background and dark lesions but can still accept objects or reject genuine skin. It rejects many plain neutral/blue/green images but **wood, clothing, walls and objects with skin-like colours can pass**. Real skin under some lighting or with unusual colour can be rejected. It does not identify scars; the classifier still predicts only its existing seven HAM10000 classes. Do not claim reliable non-skin rejection or measured accuracy from this filter.

Research context: [A Hybrid Color Space for Skin Detection](https://pmc.ncbi.nlm.nih.gov/articles/PMC4534136/) discusses colour-filter limitations with skin-like objects. Our thresholds are prototype defaults, not claimed reproductions of that paper or trained/tested medical thresholds.

## Replace the filter with a trained detector

`src/services/skinValidationService.ts` has a separate TFLite adapter. Obtain a skin/non-skin model evaluated on all intended skin tones, camera lighting and hard negatives (wood, clothing, walls, phones). Supply its local file URL, float32 NHWC square input size, RGB input range, output probability count, skin class index, and an acceptance threshold calibrated against that evaluation. The adapter checks model tensor metadata and rejects malformed outputs and non-skin scores. Quantized models or logits require adapting the adapter according to the export specification; do not guess normalization or labels.

Set SKIN_DETECTOR_CONFIG to this model specification to use it instead of the colour filter. Set REQUIRE_SKIN_VALIDATION=true to fail closed when the trained model is missing. Never use lesion-classifier confidence or segmentation confidence as a substitute for skin detection.

## Verification

Automated coverage includes non-skin rejection stopping downstream work, dark/glare/blur/small-image gates, validated ROI preprocessing, fallback for missing/tiny segmentation, retake cancellation, repeated checks on reused paths, ignoring late completions, and the appearance filter's known false-positive limitation. These mocked pipeline and synthetic-colour tests do **not** establish skin-detection accuracy. Real iPhone/Android captures, multiple skin tones, JPEG/HEIC/PNG imports and representative non-skin objects remain to be evaluated.

## Camera preview update

The enlarged rounded camera preview contains Gallery, Capture and Front/Back Switch controls using the existing SVG icon component and teal palette. Light remains available as a header text control. Front-camera flash/torch is guarded by device capabilities. Skin/quality checks, gallery import and patient context are retained. Square ROI geometry tests cover small boxes, rectangular photos, photo corners and impossible containment. All 51 app tests pass; TypeScript and targeted lint pass (two existing AccountUI style warnings). Physical-phone appearance and front/back capture still need hands-on verification.

## After-capture segmentation and prepared handoff

Skin Scan uses only the existing lightweight 64-pixel lighting/focus/motion feedback while the camera is live. Continuous U-Net inference, the live model instance, tracking timers and moving detection overlay have been removed.

After Capture (or a gallery selection), the app freezes the photo and pauses the camera. It checks photo quality, runs U-Net on that actual photo, creates a square ROI with surrounding context, and validates both the original centered target and the selected region. The whole camera frame is not required to pass a skin-color gate before segmentation. The selected region is highlighted on the frozen image, then the cropped view is revealed. Review opens only after that sequence finishes, with the prepared crop already selected. Reduce Motion skips the animation. A missed or unsuitable crop falls back to the original photo after skin/quality validation; Review retains the original-photo fallback without claiming a successful detection.

A one-use, owner/source-bound cache transfers the prepared crop and tensor through a random capture ID, not through serialized tensor navigation parameters. If the cache is unavailable, Review repeats preparation with optional segmentation and validated original-photo fallback. Retake invalidates the old request and checks the next photo again. EfficientNet runs only after Analyze; model weights, label order and input preprocessing remain unchanged.

Tests cover mask interpretation, optional ROI selection, original-photo validation, highlight-before-navigation ordering, retake behavior, prepared-cache ownership/source/expiry and the absence of segmentation during live quality feedback. Phone crop quality and animation timing still need real-image testing; builds do not establish clinical accuracy.

## Ordinary phone framing: ROI-first validation

After-capture entries now check image quality and run U-Net before applying the skin gate to the selected ROI. Background in an ordinary phone photo no longer rejects the image before region selection. The original centered target must pass its capture skin check even when U-Net proposes a crop. A usable crop also passes its own skin/quality checks; otherwise the already-validated original is used. A rejected original cannot be rescued by a skin-coloured crop from the background. Segmentation is an assistive cropper, not a mandatory lesion-detection gate. Regression tests verify that background is not a pre-segmentation gate and that rejected regions are not analyzed and fallback originals must pass their own checks.

These changes do not make a dermoscopy-trained model clinically validated for ordinary phone photographs. Cropping selects existing pixels; it does not recover details absent from the capture. Evaluate model results and skin-filter errors on representative phone photos before claiming accuracy.

## Still-photo capture lifecycle and compact classification

Keep the native camera session, torch and frame processor stable while `takePhoto()` is pending. Pause them only after the photo returns and the frozen preview is available. A synchronous capture lock prevents duplicate capture requests; failures and Review handoff release it. With continuous torch enabled, still-photo flash stays off to avoid competing LED requests. Capture failures show a short recovery message instead of the native error dump.

Classification now shows the progress indicator and Continue action, retaining Back/Retry on failure. The six processing rows, class chips, model explanation and footer note are removed. EfficientNet inference and its reported confidence remain unchanged. Automated tests cover pending capture lifecycle, duplicate taps, failure recovery and the compact classification result/error states. Physical iPhone capture still needs verification.

## Capture lighting and responsive classification display

Light Auto now requests native still-photo flash On: illumination is limited to capture and ends automatically. Light On uses continuous torch until the photo returns; Light Off disables both. The light selector is locked while capture/preparation is pending to avoid changing the camera configuration mid-photo. Devices without flash/torch remain guarded by their capabilities. Test native Auto/On/Off capture on a physical phone.

The classification indicator now sizes from screen width and height, with a rotating teal arc, a breathing halo and a larger percentage. The Continue action sits below the central animation near the bottom of the content. Ambient animation continues after inference reaches 100% until leaving the screen, pauses in the background, stops on error and respects Reduce Motion. This animation does not alter inference progress, classifier output or confidence.

## Torch shutdown after capture

The native camera now unmounts as soon as a captured photo is frozen, and stays unmounted while the route is hidden or the app is in the background. This releases the native capture session rather than relying only on asynchronous torch/pause props. Review handoff resets continuous On to Auto before clearing the frozen photo, preventing the retained camera route from relighting behind Review, classification or saved results. Auto and Off remain selected if already chosen.

The supplied DermaSight logo is installed in the iOS app-icon catalog and Android launcher densities. iOS launch-screen text and bundle name now use DermaSight; identifiers and database paths are retained to preserve installed data. Native rebuild/reinstallation is required for icon and launch-screen updates.

## Object-photo regressions and remaining limitation

The previous capture gate counted a broad central area, allowing a grey central bottle to pass because wooden furniture elsewhere looked skin-coloured. The revised target gate rejects that bottle and the printed bag in supplied screenshot-photo regions. Two supplied hand-photo regions still pass. Tests use 128×128 pixel-only samples with app UI/names excluded; they are development regression examples, not an independent evaluation dataset.

The supplied wood sample still passes. Neither this result nor U-Net output can establish that the image contains human skin. A reliable next step requires a separate trained skin/non-skin model and held-out evaluation across skin tones, lighting and hard negatives (wood, fabric, bottles). EfficientNet weights, preprocessing and confidence calculation remain untouched. No skin-detection accuracy percentage is claimed.

## Current presentation flow: U-Net cropping disabled

At the user's request, `prepareCapture` no longer imports or invokes the segmentation service. Both camera and gallery use the full orientation-normalized photo for skin/quality validation and EfficientNet preprocessing. The returned `image` and `originalImage` are the same full photo, `cropped` is false, and no lesion bounds are supplied. No ROI controls appear in Review. Old one-use cached captures marked as cropped are discarded, forcing full-photo preparation instead. Existing segmentation models/helpers remain available in the repository but are not run by capture or gallery preparation.

Orientation/format normalization, JPEG quality, the 1024-pixel bound, skin validation, quality checks and EfficientNet's 224×224 RGB float32 input remain unchanged. This is a no-crop presentation baseline; it is not evidence of increased confidence or accuracy. Use a fresh capture/upload after reloading the app. Old saved results retain their original outputs.

## Current classifier source: original JPEG when readable

To restore the input path used before segmentation was introduced, readable local JPEG files now go directly to the existing 224×224 RGB tensor builder. Native normalization remains for validation and for formats/URIs the JPEG decoder cannot read. Preprocessed capture caches carry `original-jpeg-no-crop-v2`; earlier normalized/cropped entries are discarded. This preserves skin/quality rejection and avoids extra JPEG resizing/recompression for JPEG inference. It does not establish a measured prediction or confidence improvement.
