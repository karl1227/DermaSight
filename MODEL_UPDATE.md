# Model update from teammate commit 20383b0

The current UI, authentication, iOS configuration and scan ownership work is saved at commit `cc229a6` on `codex/preserve-app-before-model`. The model update is isolated on `codex/update-ham10000-model`; nothing was pushed remotely.

Imported only these copies of the classifier:

- `src/assets/models/efficientnet_ham10000.tflite`
- `android/app/src/main/assets/efficientnet_ham10000.tflite`
- `efficientnet_ham10000.tflite`

All three have SHA-256 `ba541d0b9ce68007c2a58cefc217cda4c47db43fea147bf14d13a44c62c478c2`. Android's cached classifier filename now includes `20383b0` so an existing install copies the new asset instead of using its previous cached file.

FlatBuffer inspection confirms TFL3 format, float32 input `[1,224,224,3]`, float32 output `[1,7]`, a final softmax, and the same operator types (including Flex operators) as the previous model. Existing RGB preprocessing, label order and assessment logic are preserved. Tensor shape compatibility and a successful build do not prove actual device inference, label semantics, preprocessing correctness or claimed accuracy. Ask the teammate to confirm their export uses the documented raw RGB 0–255 input and AK/BCC/BKL/DF/MEL/NV/VASC output order, and provide evaluation results supporting the reported 90% accuracy.

The teammate's app/database renaming, generated Android bundle and confirmation-screen changes were not imported. The app continues to use `skinsense.db`; existing records and account IDs are preserved.

Verification: TypeScript passed, 20 app tests passed, Android Debug build passed (6 seconds). These tests do not execute native model inference. Next, reload the iPhone app with Metro running and test several known images. If the old model remains loaded, rebuild/run from Xcode without uninstalling the app. Android requires installing the new Debug build to refresh its packaged native asset.

To return to the saved pre-model app when the working tree is clean:

```sh
git switch codex/preserve-app-before-model
```

Keep the model-update branch for review. Do not reset or overwrite local changes to switch branches.

## PR #2 merge resolution (October 10)

Merged `origin/main` into the feature branch for review. The DermaSight display/module name is now consistent across JavaScript, Android and iOS. Existing `skinsense.db` and `skinsense_images` storage names remain unchanged to preserve installed users' history. Google callback and photo-library permission entries are retained.

The main branch's lesion-highlight preview is combined with the newer shared capture/gallery validation and preprocessing flow. The preview can show the original image with bounds or the selected ROI; classification always receives the prepared ROI tensor. Bounding boxes account for the original image's aspect ratio. The classifier asset and its SHA-256 remain unchanged.

## Classifier and confidence audit (October 30)

Classifier audit: all three EfficientNet assets still match SHA-256 `ba541d0b9ce68007c2a58cefc217cda4c47db43fea147bf14d13a44c62c478c2`. The inference and preprocessing services have no production changes relative to the model-update branch. They retain 224×224 RGB float32 values in the existing 0–255 range, AK/BCC/BKL/DF/MEL/NV/VASC class order, and confidence calculated as the largest model output probability ×100, rounded to one decimal. U-Net is used only for region selection, never as the lesion classifier. Regression tests pin the asset hashes and verify direct model confidence and the exact prepared tensor path.

The selected image upstream can change due to segmentation/cropping and JPEG normalization. Such changes can alter predictions and confidence without changing the model. No paired-photo comparison has established the cause of a particular lower score, and no training/evaluation notebook is provided here to independently verify the reported 90% accuracy. Do not inflate scores, select whichever input gives the larger score, or change normalization/labels without the model export specification and controlled evaluation.

Camera audit: Auto light previously forced the continuous torch on because every mode except Off enabled it. Auto now leaves the torch off and retains the camera's automatic still-photo flash selection. Capture prioritizes photo quality and selects the highest supported still resolution, preferring a 720p preview when available. A regression test verifies Auto does not force the torch. Lighting/crop/input differences can affect scores; these changes are not proof that a specific confidence decrease is resolved.

## iPhone unresolved-ops repair

The phone reported `Status: unresolved-ops` while allocating the classifier tensors. The export contains FlexMul, FlexConv2D and other Select TensorFlow operators. The standard TensorFlowLiteC runtime alone cannot execute them.

The iOS Podfile now adds `TensorFlowLiteSelectTfOps` 2.17.0, matching TensorFlowLiteC 2.17.0, and force-loads the delegate for physical iPhone builds so registration is retained. This follows Google's Select Ops integration instructions: https://developers.google.com/edge/litert/conversion/tensorflow/ops_select . Native rebuilding and installing the app is required; Metro reload alone cannot add this library.

This library increases app size substantially and the supplied framework supports physical arm64 iOS devices. CocoaPods reports conflicting simulator architecture exclusions; simulator classification is not verified. Android's Select Ops support has not been changed by this repair. A future built-in-operators-only export from the original trained model would avoid the Flex dependency; it requires the teammate's training/export source, which is not in this repository.

iPhone repair verification: `pod install` completed with Select Ops 2.17.0; physical iPhone Debug build returned BUILD SUCCEEDED. Symbol inspection of SkinSense.debug.dylib confirmed `TF_AcquireFlexDelegate` and `tflite::AcquireFlexDelegate` are linked. The rebuilt app was installed over the existing com.emman.dermasight app on the paired iPhone without uninstalling it. A real scan on the phone is still needed to confirm inference after installation.

## Follow-up confidence audit (October 30, camera and gallery)

The user reports lower confidence from both sources. Their common path is normalization/orientation via ImageResizer (JPEG quality 92, bounded to 1024 pixels), optional U-Net square crop, 224×224 RGB bilinear resize, float32 tensor, then the bundled EfficientNet. If the crop is missing, too small or fails skin/quality checks, the validated original photo is classified. Thus the classifier may receive a wide phone photo in which the intended small lesion occupies very few input pixels. Skin-colour acceptance is not evidence that the classifier sees a suitable lesion.

Binary inspection of the actual classifier confirms:

- TFL3, one float32 input `[1,224,224,3]`, one float32 output `[1,7]`.
- Initial cast and embedded rescaling constant `0.0039215087890625` (float16 approximation of 1/255), embedded channel normalization, final Softmax.
- Existing raw RGB float32 0–255 input is consistent with that graph; adding external /255 would apply scaling twice.
- The three label files agree on AK/BCC/BKL/DF/MEL/NV/VASC. The training/export class-index mapping and held-out evaluation are still not supplied, so label-file agreement is not independent verification of semantic class ordering or accuracy.
- The recently built iPhone app's packaged classifier matches the primary asset SHA-256 `ba541d0b9ce68007c2a58cefc217cda4c47db43fea147bf14d13a44c62c478c2`.

A concrete Android packaging mismatch was found: `android/app/src/main/res/raw/src_assets_models_efficientnet_ham10000.tflite` had SHA-256 `eb865d87e1dff3869edd8920ad655e91652ee42994fdce538448abc04590724a`, whereas the primary Android/iOS/source copies were the expected export. This fallback resource was synchronized and the previously stale Android JS bundle regenerated. The Android cache filename is now tied to the expected model hash, and cached/copied model bytes are verified before loading. Regression coverage now checks all four source/resource copies and all three label files. This Android-specific issue does not explain a confirmed iPhone-only decline.

Inference now checks tensor metadata, finite RGB input bounds and a seven-value probability output in [0,1] with sum approximately 1. Invalid output is rejected, not normalized, boosted or treated as a prediction. Valid output confidence remains exactly max(probability)×100, rounded to one decimal. The 70% threshold only controls display status.

No classifier weights, class order, input scaling, confidence threshold, capture lighting or segmentation crop selection were altered during this audit. Do not infer that a higher confidence image is more accurate, or choose between crops by whichever yields the higher confidence.

The exact cause of the user's lower scores is **not established** without paired inputs and native outputs. A controlled follow-up needs the exact same original photograph, its selected crop (or confirmation of original fallback), the model version and all seven outputs, plus an independently established label for accuracy assessment. Compare original versus crop without choosing the higher score as truth. Phone photos differ from the dermoscopic research images in HAM10000; the reported 90% dataset accuracy does not establish 90% accuracy on these phone captures. No representative clinical evaluation or actual native classification was executed in this audit.

References: Keras EfficientNet input/preprocessing documentation: https://keras.io/api/applications/efficientnet/efficientnet_models/ . HAM10000 dataset source: https://www.nature.com/articles/sdata2018161 .

## Presentation baseline: no U-Net crop

The user explicitly requested disabling U-Net crop selection for both camera and gallery rather than waiting for paired evaluation. The shared preparation service now skips segmentation completely and preprocesses the full normalized photo after existing quality/skin checks. A cached prepared crop from the previous flow is rejected. EfficientNet model weights, embedded normalization, class order, score computation and display threshold are unchanged. Confidence may change in either direction because the image content differs; this change does not establish accuracy or restore a measured 90% performance level.

## Direct JPEG input restoration after the no-crop baseline

Follow-up inspection found an additional upstream change still present after disabling U-Net: all photos were resized to at most 1024 pixels and JPEG-reencoded before the unchanged 224×224 model resize. The pre-segmentation path at commit `0ea7fad` passed the original JPEG directly to preprocessing. This is a confirmed input-path difference, not proof that it caused a particular wrong prediction.

Readable local JPEGs are now detected by their FF D8 FF encoding bytes and passed directly to EfficientNet preprocessing, matching the earlier direct-file path. A normalized copy still serves the existing quality and skin gates. Unsupported formats, base64-only sources and scoped/non-file URIs keep native conversion for decoder compatibility. U-Net remains disabled. A capture input version invalidates any prepared tensor cached by the prior normalization pipeline.

A pixel-level integration test verifies exact Float32 tensor equality between the restored preparation path and direct preprocessing of the same original JPEG, and verifies it does not consume a deliberately different converted copy. HEIC/conversion fallback, skin/quality rejection, retakes and stale-cache invalidation are covered. Original JPEG decoding retains the legacy decoder's EXIF behavior; no new normalization, label or confidence changes were introduced. Reading high-resolution originals uses more JPEG decoding memory than the bounded converted path. Actual on-phone correctness/confidence improvement is still unverified and must not be claimed based on these tests.

## Supplied training notebook and export: verified comparison

On October 30 the user supplied `Model_Training.ipynb` and `dermasight_model-2.tflite`. Exact byte comparison confirms the supplied export equals all four source/model-resource copies and the models inside the latest built iOS app and Android Debug APK. The notebook confirms the app's 224×224 RGB input convention, seven-output order and EfficientNetB0 export architecture. No model replacement or application rewrite is required for these files.

Important correction: the notebook's saved best validation accuracy is **78.84%**, final training accuracy **94.90%**, and best validation AUC **96.58%**. No 90% validation result is saved. Training combines ISIC 2019, PAD-UFES smartphone images and additional HAM10000 images; the earlier HAM10000-only/dermoscopy-only description was incomplete. The saved confusion matrix includes approximately 9.7% NV→MEL and 15.6% MEL→NV errors on its validation set. These findings do not diagnose user photographs, establish prospective clinical performance, or replace Keras-versus-TFLite numerical evaluation. Full findings and the extracted plot are in `model-audit/README.md`. The notebook was inspected without executing it.
