import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, ScreeningRecord, ScreeningStatus } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { AppButton } from '../components/AppButton';
import { DisclaimerCard } from '../components/DisclaimerCard';
import { getScreeningById, deleteScreening } from '../database/database';
import { deleteLocalImage, toImageUri } from '../services/imageStorageService';
import { formatDate, formatConfidence, getStatusColor, safeJsonParse } from '../utils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Report'>;
  route: RouteProp<RootStackParamList, 'Report'>;
};

export const ReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recordId } = route.params;
  const [record, setRecord] = useState<ScreeningRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScreeningById(recordId)
      .then(r => setRecord(r))
      .finally(() => setLoading(false));
  }, [recordId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Record',
      'This will permanently delete this screening record and its image. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!record) return;
            await deleteLocalImage(record.image_path);
            await deleteScreening(recordId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Record not found.</Text>
        <AppButton
          label="Go Back"
          onPress={() => navigation.goBack()}
          size="md"
          style={{ marginTop: Spacing.base, width: 140 }}
        />
      </View>
    );
  }

  const statusColor = getStatusColor(record.screening_status as ScreeningStatus);
  const abcde = safeJsonParse<Record<string, boolean>>(record.abcde_answers, {});
  const symptoms = safeJsonParse<Record<string, boolean>>(record.selected_symptoms, {});
  const features = safeJsonParse<string[]>(record.matching_visual_features, []);
  const imageUri = toImageUri(record.image_path);

  const abcdeLabels: Record<string, string> = {
    asymmetry: 'A - Asymmetry',
    borderIrregularity: 'B - Border Irregularity',
    colorVariation: 'C - Color Variation',
    diameterLarge: 'D - Diameter > 6mm',
    evolution: 'E - Evolution',
  };

  const symptomLabels: Record<string, string> = {
    pearlyOrWaxyBump: 'Pearly or waxy bump',
    roughOrScalyTexture: 'Rough or scaly texture',
    bleedingOrCrusting: 'Bleeding or crusting',
    firmSmallNodule: 'Firm small nodule',
    dimplingWhenPinched: 'Dimpling when pinched',
    blanchingWhenPressed: 'Blanching when pressed',
    redOrPurpleBump: 'Red or purple bump',
    stableAppearance: 'Stable appearance',
    painOrTenderness: 'Pain or tenderness',
    itching: 'Itching',
  };

  const selectedAbcde = Object.entries(abcde)
    .filter(([, v]) => v)
    .map(([k]) => abcdeLabels[k] ?? k);

  const selectedSymptoms = Object.entries(symptoms)
    .filter(([, v]) => v)
    .map(([k]) => symptomLabels[k] ?? k);

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screening Report</Text>
        <Text style={styles.headerDate}>{formatDate(record.created_at)}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Lesion image */}
        {record.image_path ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No image available</Text>
          </View>
        )}

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <InfoRow label="Patient ID" value={record.patient_id} />
          <View style={styles.divider} />
          <InfoRow label="Full Name" value={record.full_name} />
          <View style={styles.divider} />
          <InfoRow label="Age" value={record.age.toString()} />
          <View style={styles.divider} />
          <InfoRow label="Sex" value={record.sex} />
          <View style={styles.divider} />
          <InfoRow label="Lesion Location" value={record.lesion_location} />
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Symptoms</Text>
          <Text style={styles.subLabel}>ABCDE Criteria</Text>
          {selectedAbcde.length > 0 ? (
            selectedAbcde.map(s => (
              <View key={s} style={styles.tagRow}>
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noneText}>None selected</Text>
          )}
          <Text style={[styles.subLabel, { marginTop: Spacing.md }]}>Other Signs</Text>
          {selectedSymptoms.length > 0 ? (
            selectedSymptoms.map(s => (
              <View key={s} style={styles.tagRow}>
                <View style={[styles.tagDot, { backgroundColor: Colors.primaryDark }]} />
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noneText}>None selected</Text>
          )}
        </View>

        {/* Classification Result */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classification Result</Text>
          <InfoRow label="Predicted Lesion" value={record.predicted_lesion_type} />
          <View style={styles.divider} />
          <InfoRow
            label="Confidence Score"
            value={formatConfidence(record.confidence_score)}
          />
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Screening Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {record.screening_status}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <InfoRow label="Threshold Status" value={record.threshold_status} />
        </View>

        {/* Matching Visual Features */}
        {features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matching Visual Features</Text>
            {features.map((f, idx) => (
              <View key={idx} style={styles.tagRow}>
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <Text style={styles.recommendText}>{record.recommendation}</Text>
        </View>

        {/* Medical Disclaimer */}
        <DisclaimerCard type="medical" />

        {/* Delete */}
        <AppButton
          label="Delete This Record"
          onPress={handleDelete}
          variant="danger"
          size="md"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
  },
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
  headerDate: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  image: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    marginBottom: Spacing.base,
    ...Shadow.md,
  },
  noImage: {
    height: 120,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  noImageText: { fontSize: Typography.sm, color: Colors.textMuted },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  subLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
    marginRight: 8,
    flexShrink: 0,
  },
  tagText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  noneText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusText: { fontSize: Typography.xs, fontWeight: Typography.semiBold },
  recommendText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.65,
  },
});
