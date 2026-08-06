const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Extend asset extensions to include TFLite model files
const config = {
  resolver: {
    assetExts: [
      // Spread default asset extensions, then add tflite
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp',
      'ttf', 'otf', 'woff', 'woff2',
      'aac', 'mp4', 'm4v', 'mov', 'mp3', 'wav',
      'html', 'pdf', 'zip',
      'tflite', // ← TensorFlow Lite model files
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
