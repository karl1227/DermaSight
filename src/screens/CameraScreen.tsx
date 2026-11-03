import {
  prepareCapture,
  type PreparedCapture,
} from '../services/capturePreparationService';
import { cachePreparedCapture } from '../services/preparedCaptureCache';
import { LesionRegionPreview } from '../components/LesionRegionPreview';
import { secureId } from '../utils/secureId';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  AppState,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useIsFocused } from '@react-navigation/native';
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { LineIcon } from '../components/AccountUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { ProgressSteps } from '../components/ProgressSteps';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

const STEPS = ['Information', 'Symptoms', 'Scan'];
type LightMode = 'auto' | 'on' | 'off';

type LiveQuality = {
  brightness: number;
  sharpness: number;
  motion: number;
  status: 'checking' | 'ready' | 'warning';
  message: string;
};

type CapturedImage = {
  uri: string;
  path?: string;
  base64?: string;
  type?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  entry?: 'camera' | 'gallery';
};
const INITIAL_LIVE_QUALITY: LiveQuality = {
  brightness: 0,
  sharpness: 0,
  motion: 0,
  status: 'checking',
  message: 'Checking lighting and focus...',
};

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientInfo, symptoms } = route.params;
  const [loading, setLoading] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setForeground(state === 'active'),
    );
    return () => subscription.remove();
  }, []);
  const [hasPermission, setHasPermission] = useState(false);
  const [lightMode, setLightMode] = useState<LightMode>('auto');
  const [liveQuality, setLiveQuality] =
    useState<LiveQuality>(INITIAL_LIVE_QUALITY);
  const cameraRef = useRef<Camera>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [capturePrepared, setCapturePrepared] =
    useState<PreparedCapture | null>(null);
  const [captureStage, setCaptureStage] = useState('');
  const [captureError, setCaptureError] = useState('');
  const captureRequest = useRef(0);
  const captureInFlight = useRef(false);
  const mounted = useRef(true);
  const invalidateCapture = useCallback(() => {
    captureRequest.current++;
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateCapture();
    };
  }, [invalidateCapture]);
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>(
    'back',
  );
  const device = useCameraDevice(cameraPosition);
  const format = useCameraFormat(device, [
    { photoResolution: 'max' },
    { videoResolution: { width: 1280, height: 720 } },
  ]);
  const oppositeDevice = useCameraDevice(
    cameraPosition === 'back' ? 'front' : 'back',
  );
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { resize } = useResizePlugin();
  // Shared values keep the previous live-frame signature on the frame-processor runtime.
  const previousSignature = useSharedValue<number[]>([]);

  const publishLiveQuality = useRunOnJS((next: LiveQuality) => {
    if (!mounted.current) return;
    setLiveQuality(current =>
      current.status === next.status &&
      current.message === next.message &&
      Math.abs(current.brightness - next.brightness) < 1 &&
      Math.abs(current.sharpness - next.sharpness) < 0.5 &&
      Math.abs(current.motion - next.motion) < 1
        ? current
        : next,
    );
  }, []);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      // A 64px centre crop is cheap enough for live feedback and roughly matches the guide frame.
      runAtTargetFps(4, () => {
        'worklet';
        const pixels = resize(frame, {
          scale: { width: 64, height: 64 },
          pixelFormat: 'rgb',
          dataType: 'uint8',
        });

        let brightnessTotal = 0;
        let edgeTotal = 0;
        let edgeCount = 0;
        const signature: number[] = [];
        const sampleStep = 8;

        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 64; x++) {
            const index = (y * 64 + x) * 3;
            const value =
              0.299 * pixels[index] +
              0.587 * pixels[index + 1] +
              0.114 * pixels[index + 2];
            brightnessTotal += value;

            if (x < 63 && y < 63) {
              const right = (y * 64 + x + 1) * 3;
              const below = ((y + 1) * 64 + x) * 3;
              const rightValue =
                0.299 * pixels[right] +
                0.587 * pixels[right + 1] +
                0.114 * pixels[right + 2];
              const belowValue =
                0.299 * pixels[below] +
                0.587 * pixels[below + 1] +
                0.114 * pixels[below + 2];
              edgeTotal +=
                Math.abs(value - rightValue) + Math.abs(value - belowValue);
              edgeCount += 2;
            }

            if (x % sampleStep === 0 && y % sampleStep === 0)
              signature.push(value);
          }
        }

        const brightness = brightnessTotal / (64 * 64);
        const sharpness = edgeTotal / edgeCount;
        const previous = previousSignature.value;
        let motion = 0;
        if (previous.length === signature.length) {
          for (let i = 0; i < signature.length; i++)
            motion += Math.abs(signature[i] - previous[i]);
          motion /= signature.length;
        }
        previousSignature.value = signature;

        let message = 'Ready to capture';
        let status: LiveQuality['status'] = 'ready';
        if (brightness < 65) {
          status = 'warning';
          message = 'More light needed';
        } else if (brightness > 205) {
          status = 'warning';
          message = 'Reduce glare or direct light';
        } else if (sharpness < 10) {
          status = 'warning';
          message = 'Move closer and let the camera focus';
        } else if (previous.length > 0 && motion > 16) {
          status = 'warning';
          message = 'Hold the phone steady';
        }

        publishLiveQuality({ brightness, sharpness, motion, status, message });
      });
    },
    [resize, previousSignature, publishLiveQuality],
  );

  useEffect(() => {
    const status = Camera.getCameraPermissionStatus();
    setHasPermission(status === 'granted');
  }, []);

  const retakeCapture = () => {
    captureRequest.current++;
    captureInFlight.current = false;
    setCaptured(null);
    setCapturePrepared(null);
    setCaptureError('');
    setLoading(false);
  };
  const navigateToConfirm = async (image: CapturedImage) => {
    if (!mounted.current || !isFocused) return;
    const requestId = ++captureRequest.current;
    setCaptured(image);
    setCapturePrepared(null);
    setCaptureError('');
    setLoading(true);
    try {
      const prepared = await prepareCapture(
        {
          filePath: image.path ?? image.uri,
          base64: image.base64,
          mimeType: image.type,
        },
        { width: image.width, height: image.height, fileSize: image.fileSize },
        stage => {
          if (mounted.current && captureRequest.current === requestId)
            setCaptureStage(stage);
        },
        () => !mounted.current || captureRequest.current !== requestId,
      );
      if (mounted.current && captureRequest.current === requestId)
        setCapturePrepared(prepared);
    } catch (error) {
      if (mounted.current && captureRequest.current === requestId)
        setCaptureError(
          error instanceof Error
            ? error.message
            : 'Could not prepare this photo. Retake it.',
        );
    }
  };
  const openPreparedReview = () => {
    if (
      !captured ||
      !capturePrepared ||
      captureError ||
      !mounted.current ||
      !isFocused
    )
      return;
    const captureId = secureId();
    cachePreparedCapture(
      captureId,
      patientInfo.owner,
      captured.path ?? captured.uri,
      capturePrepared,
    );
    const image = captured;
    captureRequest.current++;
    captureInFlight.current = false;
    setLightMode(mode => (mode === 'on' ? 'auto' : mode));
    setCaptured(null);
    setCapturePrepared(null);
    setLoading(false);
    navigation.push('ConfirmImage', {
      captureId,
      imageEntry: image.entry ?? 'camera',
      patientInfo,
      symptoms,
      imageUri: image.uri,
      imagePath: image.path ?? image.uri,
      imageData: image.base64,
      imageType: image.type ?? 'image/jpeg',
      imageMeta: {
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
      },
    });
  };

  const handleImageResult = (response: ImagePickerResponse) => {
    setLoading(false);
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert(
        'Gallery Unavailable',
        'Could not open your photos. Check photo access in Settings and try again.',
      );
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('Error', 'No image was selected. Please try again.');
      return;
    }
    navigateToConfirm({
      uri: asset.uri,
      // Use the picker-provided accessible URI, not a potentially inaccessible
      // original library path under Android scoped storage or iOS Photos.
      path: asset.uri,
      entry: 'gallery',
      base64: asset.base64,
      type: asset.type,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
    });
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const status = await Camera.requestCameraPermission();
    const granted = status === 'granted';
    setHasPermission(granted);
    if (!granted) {
      Alert.alert(
        'Permission Denied',
        'Enable camera access in Settings to use guided capture.',
      );
    }
    return granted;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const permission =
        Number(Platform.Version) >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.request(permission, {
        title: 'Gallery Permission',
        message:
          'DermaSight needs gallery access to select skin lesion images.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const handleCapture = async () => {
    if (captureInFlight.current || captured) return;
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) return;
    }

    if (!cameraRef.current) {
      Alert.alert(
        'Camera Not Ready',
        'Please wait for the camera preview to load.',
      );
      return;
    }

    try {
      captureInFlight.current = true;
      setLoading(true);
      const photo = await cameraRef.current.takePhoto({
        // Auto lights only the still capture; native flash turns itself off afterward.
        // Explicit On uses continuous torch, so do not also fire the flash.
        flash:
          lightMode === 'on' && supportsTorch
            ? 'off'
            : device?.hasFlash
            ? lightMode === 'auto'
              ? 'on'
              : lightMode
            : 'off',
        enableShutterSound: true,
      });

      await navigateToConfirm({
        uri: `file://${photo.path}`,
        path: photo.path,
        type: 'image/jpeg',
        width: photo.width,
        height: photo.height,
      });
    } catch {
      if (mounted.current) {
        captureInFlight.current = false;
        setLoading(false);
        Alert.alert(
          'Capture Failed',
          'The camera could not finish taking the photo. Try again with Light Auto or Off. Your screening information is preserved.',
        );
      }
    }
  };

  const handleGallery = async () => {
    const granted = await requestGalleryPermission();
    if (!granted) {
      Alert.alert(
        'Permission Denied',
        'Enable photo library access in Settings to use this feature.',
      );
      return;
    }
    setLoading(true);
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
        selectionLimit: 1,
        includeBase64: false,
        // Width/height/URI are already supplied without accessing extra Photos
        // metadata. Avoid requesting broad library access for selected images.
        includeExtra: false,
      });
      handleImageResult(response);
    } catch {
      Alert.alert(
        'Gallery Unavailable',
        'Could not open your photos. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const canShowCamera =
    hasPermission && device && isFocused && foreground && !captured;
  const supportsTorch = Boolean(device?.hasTorch);
  const nextLightMode: Record<LightMode, LightMode> = {
    auto: 'on',
    on: 'off',
    off: 'auto',
  };
  const lightLabel: Record<LightMode, string> = {
    auto: 'Auto',
    on: 'ON',
    off: 'OFF',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skin Scan</Text>
          {supportsTorch ? (
            <TouchableOpacity
              onPress={() => setLightMode(mode => nextLightMode[mode])}
              disabled={loading || !!captured}
              style={[
                styles.torchBtn,
                lightMode !== 'off' && styles.torchBtnActive,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  styles.torchText,
                  lightMode !== 'off' && styles.torchTextActive,
                ]}
              >
                {`Light ${lightLabel[lightMode]}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        <ProgressSteps steps={STEPS} currentStep={2} />
      </View>

      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) },
        ]}
      >
        <View style={styles.patientStrip}>
          <Text style={styles.patientStripText} numberOfLines={1}>
            {patientInfo.fullName} • {patientInfo.lesionLocation}
          </Text>
        </View>

        <View
          style={styles.cameraShell}
          onLayout={event => setPreviewSize(event.nativeEvent.layout)}
        >
          {canShowCamera ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              format={format}
              isActive={isFocused && foreground && !captured}
              torch={
                supportsTorch &&
                isFocused &&
                foreground &&
                lightMode === 'on' &&
                !captured
                  ? 'on'
                  : 'off'
              }
              photo
              photoQualityBalance="quality"
              pixelFormat="yuv"
              enableBufferCompression={false}
              videoHdr={false}
              frameProcessor={
                isFocused && foreground && !captured
                  ? frameProcessor
                  : undefined
              }
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cameraFallback}>
              {!device ? (
                <>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.fallbackText}>Loading camera...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.fallbackTitle}>
                    Camera permission needed
                  </Text>
                  <Text style={styles.fallbackText}>
                    Allow camera access to use live guided capture.
                  </Text>
                  <AppButton
                    label="Allow Camera"
                    onPress={requestCameraPermission}
                    size="md"
                  />
                </>
              )}
            </View>
          )}

          {!captured && (
            <View pointerEvents="none" style={styles.guidanceOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.centerDot} />
              </View>

              <View style={styles.bottomGuide}>
                <Text style={styles.guideText}>
                  Place lesion inside frame & hold steady
                </Text>
              </View>

              <View
                style={[
                  styles.liveQualityBadge,
                  liveQuality.status === 'ready'
                    ? styles.liveQualityReady
                    : liveQuality.status === 'warning'
                    ? styles.liveQualityWarning
                    : styles.liveQualityChecking,
                ]}
              >
                <Text style={styles.liveQualityText}>
                  {liveQuality.message}
                </Text>
              </View>
            </View>
          )}
          {captured && (
            <View style={styles.frozenCapture}>
              {capturePrepared && !captureError ? (
                <LesionRegionPreview
                  key={capturePrepared.preprocessing.id}
                  original={capturePrepared.originalImage}
                  selected={capturePrepared.image}
                  bounds={capturePrepared.lesionBounds}
                  cropped={capturePrepared.cropped}
                  size={Math.min(
                    previewSize.width || 300,
                    previewSize.height || 300,
                  )}
                  mode="crop"
                  onComplete={openPreparedReview}
                  onError={() =>
                    setCaptureError(
                      'The preview could not load. Please retake the image.',
                    )
                  }
                />
              ) : (
                <Image
                  source={{ uri: captured.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                />
              )}
              {!capturePrepared && !captureError && (
                <ActivityIndicator color={Colors.white} size="large" />
              )}
              <Text style={styles.captureStage}>
                {captureError || captureStage}
              </Text>
              <AppButton
                label="Retake Image"
                variant="outline"
                onPress={retakeCapture}
                fullWidth={false}
              />
            </View>
          )}
          {!captured && (
            <View style={styles.captureControls}>
              <TouchableOpacity
                style={styles.smallControl}
                onPress={handleGallery}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Open gallery"
              >
                <LineIcon name="gallery" color={Colors.primary} size={27} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.captureControl,
                  (loading || !canShowCamera) && styles.controlDisabled,
                ]}
                onPress={handleCapture}
                disabled={loading || !canShowCamera}
                accessibilityRole="button"
                accessibilityLabel="Capture image"
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="large" />
                ) : (
                  <LineIcon name="camera" color={Colors.white} size={38} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.smallControl,
                  (!oppositeDevice || loading) && styles.controlDisabled,
                ]}
                disabled={!oppositeDevice || loading}
                accessibilityRole="button"
                accessibilityLabel={
                  cameraPosition === 'back'
                    ? 'Switch to front camera'
                    : 'Switch to back camera'
                }
                onPress={() => {
                  setCameraPosition(position =>
                    position === 'back' ? 'front' : 'back',
                  );
                  previousSignature.value = [];
                  setLiveQuality(INITIAL_LIVE_QUALITY);
                }}
              >
                <LineIcon
                  name="switchCamera"
                  color={Colors.primary}
                  size={27}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frozenCapture: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#152827',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 12,
  },
  captureStage: {
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  headerSpacer: { width: 40 },
  torchBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  torchBtnActive: {
    backgroundColor: Colors.accent,
  },
  torchText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  torchTextActive: {
    color: Colors.primaryDark,
  },
  lightingGuideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    marginBottom: Spacing.xs,
  },
  lightingGuideIcon: {
    fontSize: Typography.xs,
    marginRight: Spacing.xs,
  },
  lightingGuideText: {
    fontSize: Typography.xs,
    color: '#92400E',
    fontWeight: Typography.medium,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  cameraShell: {
    flex: 1,
    minHeight: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDark,
    marginBottom: 0,
    position: 'relative',
    ...Shadow.md,
  },
  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  fallbackTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.base,
    lineHeight: Typography.sm * 1.4,
  },
  guidanceOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
    paddingBottom: 130,
  },
  scanFrame: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.md,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: Colors.accent,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  bottomGuide: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  guideText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  liveQualityBadge: {
    position: 'absolute',
    top: Spacing.lg,
    alignSelf: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
  },
  liveQualityChecking: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  liveQualityReady: {
    backgroundColor: 'rgba(5, 150, 105, 0.92)',
    borderColor: '#A7F3D0',
  },
  liveQualityWarning: {
    backgroundColor: 'rgba(180, 83, 9, 0.92)',
    borderColor: '#FDE68A',
  },
  liveQualityText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  patientStrip: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  patientStripText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.semiBold,
    textAlign: 'center',
  },
  captureControls: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  smallControl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  captureControl: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 22,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  controlDisabled: { opacity: 0.5 },
});
