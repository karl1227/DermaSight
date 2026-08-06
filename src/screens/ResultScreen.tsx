import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { AppButton } from '../components/AppButton';
import { ResultBasisCard } from '../components/ResultBasisCard';
import { DisclaimerCard } from '../components/DisclaimerCard';
import { insertScreening } from '../database/database';
import { saveImageLocally } from '../services/imageStorageService';
import { formatConfidence, getStatusColor } from '../utils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: RouteProp<RootStackParamList, 'Result'>;
};

export const ResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientInfo, symptoms, imageUri, result } = route.params;
  const [saving, setSaving] = useState(false);

  const isLowConfidence = result.thresholdStatus === 'Below Threshold';
  const statusColor = getStatusColor(result.screeningStatus);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save image to local storage and get persistent path
      const savedImagePath = await saveImageLocally(imageUri);

      // Insert screening record into SQLite
      const insertedId = await insertScreening({
        patient_id: patientInfo.patientId,
        full_name: patientInfo.fullName,
        age: patientInfo.age,
        sex: patientInfo.sex,
        lesion_location: patientInfo.lesionLocation,
        selected_symptoms: JSON.stringify(symptoms.other),
        abcde_answers: JSON.stringify(symptoms.abcde),
        image_path: savedImagePath,
        predicted_lesion_type: result.predictedLesionType,
        confidence_score: result.confidenceScore,
        screening_status: result.screeningStatus,
        threshold_status: result.thresholdStatus,
        matching_visual_features: JSON.stringify(result.matchingVisualFeatures),
        recommendation_basis: result.recommendationBasis,
        recommendation: result.recommendation,
        created_at: new Date().toISOString(),
      });

      Alert.alert(
        'Saved',
        'Screening record has been saved to your history.',
        [
          {
            text: 'View History',
            onPress: () => navigation.navigate('MainTabs'),
          },
          {
            text: 'View Report',
            onPress: () => navigation.navigate('Report', { recordId: insertedId }),
          },
        ],
      );
    } catch (err) {
      Alert.alert('Error', 'Could not save the record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Preliminary Screening Result</Text>
        <Text style={styles.headerSubtitle}>Educational screening completed</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Assessment message banner */}
        <View style={[styles.assessmentBanner, { borderLeftColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View style={styles.assessmentContent}>
            <Text style={styles.assessmentLabel}>Assessment Message</Text>
            <Text style={[styles.assessmentMsg, { color: statusColor }]}>
              {result.assessmentMessage}
            </Text>
          </View>
        </View>

        {/* Low confidence alert */}
        {isLowConfidence && (
          <View style={styles.lowConfCard}>
            <Text style={styles.lowConfTitle}>Low Confidence Result</Text>
            <Text style={styles.lowConfText}>
              The image did not meet the minimum confidence threshold
              (70%) for a reliable preliminary classification.
            </Text>
            <View style={styles.lowConfActions}>
              <TouchableOpacity
                style={styles.lowConfBtn}
                onPress={() => navigation.goBack()}>
                <Text style={styles.lowConfBtnText}>Retake Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lowConfBtn, styles.lowConfBtnSecondary]}
                onPress={() => navigation.navigate('LesionGuide')}>
                <Text style={[styles.lowConfBtnText, { color: Colors.primary }]}>
                  Consult Guide
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Result summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Result Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Predicted Lesion Type</Text>
            <Text style={styles.summaryValue}>{result.predictedLesionType}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Confidence Score</Text>
            <Text style={[styles.summaryValue, styles.confidenceValue]}>
              {formatConfidence(result.confidenceScore)}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Screening Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {result.screeningStatus}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Patient</Text>
            <Text style={styles.summaryValue}>{patientInfo.fullName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Age / Sex</Text>
            <Text style={styles.summaryValue}>
              {patientInfo.age} · {patientInfo.sex}
            </Text>
          </View>
        </View>

        {/* Result basis */}
        <ResultBasisCard result={result} />

        {/* Recommendation */}
        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>Recommendation</Text>
          <Text style={styles.recommendText}>{result.recommendation}</Text>
        </View>

        {/* Medical disclaimer */}
        <DisclaimerCard type="medical" />

        {/* Action buttons */}
        <AppButton
          label="Save Result to History"
          onPress={handleSave}
          size="lg"
          loading={saving}
          style={styles.saveBtn}
        />

        <AppButton
          label="New Screening"
          onPress={() => navigation.navigate('PatientInfo')}
          variant="outline"
          size="lg"
          style={styles.newBtn}
        />

        <AppButton
          label="Learn More"
          onPress={() => navigation.navigate('LesionGuide')}
          variant="ghost"
          size="md"
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  assessmentBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderLeftWidth: 5,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    alignItems: 'center',
    ...Shadow.card,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  assessmentContent: { flex: 1 },
  assessmentLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginBottom: 3,
  },
  assessmentMsg: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    lineHeight: Typography.base * 1.4,
  },
  lowConfCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  lowConfTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.warning,
    marginBottom: Spacing.sm,
  },
  lowConfText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  lowConfActions: { flexDirection: 'row', gap: Spacing.md },
  lowConfBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.warning,
    alignItems: 'center',
  },
  lowConfBtnSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  lowConfBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  summaryTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  summaryValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  confidenceValue: {
    fontSize: Typography.md,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
  },
  recommendCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  recommendTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  recommendText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.65,
  },
  saveBtn: { marginBottom: Spacing.md },
  newBtn: { marginBottom: Spacing.md },
});
