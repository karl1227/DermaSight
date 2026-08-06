import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
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
  'Center the lesion in the frame',
  'Use bright, natural light',
  'Keep phone steady — avoid blur',
  'Capture only the affected skin area',
];

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientInfo, symptoms } = route.params;
  const [loading, setLoading] = useState(false);

  const handleImageResult = (response: ImagePickerResponse) => {
    setLoading(false);
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage ?? 'Could not access camera or gallery.');
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('Error', 'No image was captured. Please try again.');
      return;
    }
    navigation.navigate('ConfirmImage', { patientInfo, symptoms, imageUri: asset.uri });
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'SkinSense needs camera access to capture skin lesion images.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
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
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Enable camera access in Settings to use this feature.');
      return;
    }
    setLoading(true);
    launchCamera({ mediaType: 'photo', quality: 0.9, saveToPhotos: false, cameraType: 'back' }, handleImageResult);
  };

  const handleGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Enable photo library access in Settings to use this feature.');
      return;
    }
    setLoading(true);
    launchImageLibrary({ mediaType: 'photo', quality: 0.9, selectionLimit: 1 }, handleImageResult);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Image Capture</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressSteps steps={STEPS} currentStep={2} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Scan frame */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.scanCenter}>
              <Text style={styles.scanLabel}>Scan Area</Text>
              <Text style={styles.scanHint}>Position lesion within the frame</Text>
            </View>
          </View>
        </View>

        {/* Patient strip */}
        <View style={styles.patientStrip}>
          <Text style={styles.patientStripText}>
            {patientInfo.fullName} · {patientInfo.age}y · {patientInfo.sex} · {patientInfo.lesionLocation}
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Capture Tips</Text>
          {TIPS.map(tip => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <AppButton label="Capture Image" onPress={handleCapture} size="lg" loading={loading} style={styles.captureBtn} />
        <AppButton label="Upload from Gallery" onPress={handleGallery} variant="outline" size="lg" loading={loading} />

        <Text style={styles.footNote}>
          Image quality directly affects classification accuracy. Use a clear, well-lit photo.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backText: { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', fontWeight: Typography.medium },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  scanArea: { alignItems: 'center', marginBottom: Spacing.base },
  scanFrame: {
    width: 220,
    height: 220,
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.accent, borderWidth: 2.5 },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 5 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 5 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 5 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 5 },
  scanCenter: { alignItems: 'center' },
  scanLabel: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.accent },
  scanHint: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.55)', marginTop: 4, textAlign: 'center' },
  patientStrip: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  patientStripText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semiBold, textAlign: 'center' },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  tipsTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  tipBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginRight: Spacing.md },
  tipText: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
  captureBtn: { marginBottom: Spacing.md },
  footNote: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.base,
    lineHeight: Typography.xs * 1.6,
  },
});
