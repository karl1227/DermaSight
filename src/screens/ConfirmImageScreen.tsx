import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { AppButton } from '../components/AppButton';
import { assessImageQuality, type QualityCheck } from '../services/imageProcessingService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ConfirmImage'>;
  route: RouteProp<RootStackParamList, 'ConfirmImage'>;
};

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - Spacing.xl * 2;

export const ConfirmImageScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientInfo, symptoms, imageUri, imagePath, imageData, imageType, imageMeta } = route.params;
  const [qualityChecks, setQualityChecks] = React.useState<QualityCheck[]>([]);
  const [qualitySummary, setQualitySummary] = React.useState('Assessing image quality...');
  const [isAssessing, setIsAssessing] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    assessImageQuality(
      {
        base64: imageData,
        mimeType: imageType,
        filePath: imagePath ?? imageUri,
      },
      imageMeta,
    )
      .then(result => {
        if (!isMounted) return;
        setQualityChecks(result.checks);
        setQualitySummary(result.summary);
      })
      .catch(() => {
        if (!isMounted) return;
        setQualityChecks([
          {
            id: 'quality-error',
            label: 'Image quality check unavailable',
            status: 'info',
            detail: 'The image could not be analyzed automatically, but you can still continue if it looks clear.',
          },
        ]);
        setQualitySummary('Automatic quality analysis could not be completed.');
      })
      .finally(() => {
        if (isMounted) setIsAssessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [imageMeta, imageUri]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Retake</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Captured Image</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Image preview */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText}>Preview</Text>
          </View>
        </View>

        {/* Quality assessment */}
        <View style={styles.qualityCard}>
          <Text style={styles.qualityTitle}>Image Quality Assessment</Text>
          <Text style={styles.qualitySummary}>{qualitySummary}</Text>
          {isAssessing ? (
            <View style={styles.qualityLoadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.qualityLoadingText}>Analyzing lighting, sharpness, and resolution...</Text>
            </View>
          ) : (
            qualityChecks.map(item => (
              <View key={item.id} style={styles.qualityItem}>
                <View style={styles.qualityRow}>
                  <Text style={styles.qualityLabel}>{item.label}</Text>
                  <View
                    style={[
                      styles.qualityBadge,
                      item.status === 'pass'
                        ? styles.qualityPass
                        : item.status === 'warn'
                          ? styles.qualityWarn
                          : styles.qualityInfo,
                    ]}>
                    <Text
                      style={[
                        styles.qualityBadgeText,
                        item.status === 'pass'
                          ? styles.qualityPassText
                          : item.status === 'warn'
                            ? styles.qualityWarnText
                            : styles.qualityInfoText,
                      ]}>
                      {item.status === 'pass' ? 'Good' : item.status === 'warn' ? 'Review' : 'Info'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.qualityDetail}>{item.detail}</Text>
              </View>
            ))
          )}
        </View>

        {/* Patient info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Patient & Scan Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient</Text>
            <Text style={styles.infoValue}>{patientInfo.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValue}>{patientInfo.patientId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{patientInfo.lesionLocation}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <AppButton
          label="Proceed to Preprocessing →"
          onPress={() =>
            navigation.navigate('ImagePreprocessing', {
              patientInfo,
              symptoms,
              imageUri,
              imagePath,
              imageData,
              imageType,
            })
          }
          size="lg"
          style={styles.proceedBtn}
        />

        <AppButton
          label="Retake Image"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="lg"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  imageWrapper: {
    position: 'relative',
    marginBottom: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Radius.xl,
  },
  imageBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  imageBadgeText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
  qualityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  qualityTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  qualitySummary: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sm * 1.45,
  },
  qualityLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  qualityLoadingText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  qualityItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityLabel: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  qualityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  qualityPass: { backgroundColor: Colors.successLight },
  qualityWarn: { backgroundColor: 'rgba(245, 158, 11, 0.16)' },
  qualityInfo: { backgroundColor: Colors.primaryUltraLight },
  qualityBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semiBold },
  qualityPassText: { color: Colors.success },
  qualityWarnText: { color: '#B45309' },
  qualityInfoText: { color: Colors.primary },
  qualityDetail: {
    marginTop: 4,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: Typography.xs * 1.45,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  infoTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: Typography.sm, color: Colors.textMuted },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  proceedBtn: { marginBottom: Spacing.md },
});
