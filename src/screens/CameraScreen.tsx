import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { AppButton } from '../components/AppButton';
import { ProgressSteps } from '../components/ProgressSteps';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

const STEPS = ['Information', 'Symptoms', 'Scan'];

const TIPS = [
  'Center the lesion inside the guide',
  'Use bright, even lighting',
  'Hold steady to avoid blur',
  'Keep only the affected skin area in view',
];

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientInfo, symptoms } = route.params;
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();

  useEffect(() => {
    const status = Camera.getCameraPermissionStatus();
    setHasPermission(status === 'granted');
  }, []);

  const navigateToConfirm = (image: {
    uri: string;
    path?: string;
    base64?: string;
    type?: string;
    width?: number;
    height?: number;
    fileSize?: number;
  }) => {
    navigation.navigate('ConfirmImage', {
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
      Alert.alert('Error', response.errorMessage ?? 'Could not access gallery.');
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('Error', 'No image was selected. Please try again.');
      return;
    }
    navigateToConfirm({
      uri: asset.uri,
      path: asset.originalPath ?? asset.uri,
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
      Alert.alert('Permission Denied', 'Enable camera access in Settings to use guided capture.');
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
        message: 'SkinSense needs gallery access to select skin lesion images.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const handleCapture = async () => {
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) return;
    }

    if (!cameraRef.current) {
      Alert.alert('Camera Not Ready', 'Please wait for the camera preview to load.');
      return;
    }

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: true,
      });
      navigateToConfirm({
        uri: `file://${photo.path}`,
        path: photo.path,
        type: 'image/jpeg',
        width: photo.width,
        height: photo.height,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not capture image.';
      Alert.alert('Capture Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGallery = async () => {
    const granted = await requestGalleryPermission();
    if (!granted) {
      Alert.alert('Permission Denied', 'Enable photo library access in Settings to use this feature.');
      return;
    }
    setLoading(true);
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.9, selectionLimit: 1, includeBase64: false, includeExtra: true },
      handleImageResult,
    );
  };

  const [torchOn, setTorchOn] = useState(false);

  const canShowCamera = hasPermission && device;
  const supportsTorch = Boolean(device?.hasTorch);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guided Image Capture</Text>
          {supportsTorch ? (
            <TouchableOpacity
              onPress={() => setTorchOn(prev => !prev)}
              style={[styles.torchBtn, torchOn && styles.torchBtnActive]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.torchText, torchOn && styles.torchTextActive]}>
                {torchOn ? '💡 Light ON' : '🔦 Light'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        <ProgressSteps steps={STEPS} currentStep={2} />
      </View>

      <View style={styles.content}>
        {/* Lighting guidance badge */}
        <View style={styles.lightingGuideBanner}>
          <Text style={styles.lightingGuideIcon}>💡</Text>
          <Text style={styles.lightingGuideText}>
            Ensure even, bright light with no harsh shadows or direct glare.
          </Text>
        </View>

        <View style={styles.cameraShell}>
          {canShowCamera ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isFocused}
              torch={torchOn ? 'on' : 'off'}
              photo
            />
          ) : (
            <View style={styles.cameraFallback}>
              {!device ? (
                <>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.fallbackText}>Loading back camera...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.fallbackTitle}>Camera permission needed</Text>
                  <Text style={styles.fallbackText}>
                    Allow camera access to use live guided capture.
                  </Text>
                  <AppButton label="Allow Camera" onPress={requestCameraPermission} size="md" />
                </>
              )}
            </View>
          )}

          <View pointerEvents="none" style={styles.guidanceOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <View style={styles.centerDot} />
            </View>

            <View style={styles.bottomGuide}>
              <Text style={styles.guideText}>Place lesion inside frame & hold steady</Text>
            </View>
          </View>
        </View>

        <View style={styles.patientStrip}>
          <Text style={styles.patientStripText} numberOfLines={1}>
            {patientInfo.fullName} • {patientInfo.age}y • {patientInfo.sex} • {patientInfo.lesionLocation}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <AppButton
            label="Capture Guided Image"
            onPress={handleCapture}
            size="lg"
            loading={loading}
            style={styles.captureBtn}
          />
          <AppButton
            label="Upload from Gallery"
            onPress={handleGallery}
            variant="outline"
            size="md"
            loading={loading}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  backText: { fontSize: Typography.base, color: 'rgba(255,255,255,0.9)', fontWeight: Typography.medium },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white },
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  cameraShell: {
    flex: 1,
    minHeight: 280,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDark,
    marginBottom: Spacing.sm,
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
  },
  scanFrame: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.md,
  },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: Colors.accent, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
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
  actionsContainer: {
    width: '100%',
  },
  captureBtn: {
    marginBottom: Spacing.sm,
  },
});
