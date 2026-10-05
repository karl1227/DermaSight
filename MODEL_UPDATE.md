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
