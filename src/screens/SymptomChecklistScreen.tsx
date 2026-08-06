import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, SelectedSymptoms, ABCDEAnswers, OtherSymptoms } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { ProgressSteps } from '../components/ProgressSteps';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SymptomChecklist'>;
  route: RouteProp<RootStackParamList, 'SymptomChecklist'>;
};

const STEPS = ['Information', 'Symptoms', 'Scan'];

interface ABCDEItem {
  key: keyof ABCDEAnswers;
  letter: string;
  name: string;
  description: string;
}

const ABCDE_ITEMS: ABCDEItem[] = [
  {
    key: 'asymmetry',
    letter: 'A',
    name: 'Asymmetry',
    description: 'One half does not match the other half',
  },
  {
    key: 'borderIrregularity',
    letter: 'B',
    name: 'Border Irregularity',
    description: 'Edges are uneven, jagged, blurred, or poorly defined',
  },
  {
    key: 'colorVariation',
    letter: 'C',
    name: 'Color Variation',
    description: 'Multiple colors such as brown, black, red, blue, or white',
  },
  {
    key: 'diameterLarge',
    letter: 'D',
    name: 'Diameter > 6mm',
    description: 'Lesion is larger than 6mm (about the size of a pencil eraser)',
  },
  {
    key: 'evolution',
    letter: 'E',
    name: 'Evolution',
    description: 'Lesion changes in size, shape, color, or symptoms over time',
  },
];

interface OtherItem {
  key: keyof OtherSymptoms;
  label: string;
}

const OTHER_SYMPTOMS: OtherItem[] = [
  { key: 'pearlyOrWaxyBump', label: 'Pearly or waxy bump' },
  { key: 'roughOrScalyTexture', label: 'Rough or scaly texture' },
  { key: 'bleedingOrCrusting', label: 'Bleeding or crusting' },
  { key: 'firmSmallNodule', label: 'Firm small nodule' },
  { key: 'dimplingWhenPinched', label: 'Dimpling when pinched' },
  { key: 'blanchingWhenPressed', label: 'Blanching or fading when pressed' },
  { key: 'redOrPurpleBump', label: 'Red or purple bump' },
  { key: 'stableAppearance', label: 'Stable appearance' },
  { key: 'painOrTenderness', label: 'Pain or tenderness' },
  { key: 'itching', label: 'Itching' },
];

export const SymptomChecklistScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { patientInfo } = route.params;

  const [abcde, setAbcde] = useState<ABCDEAnswers>({
    asymmetry: false,
    borderIrregularity: false,
    colorVariation: false,
    diameterLarge: false,
    evolution: false,
  });

  const [other, setOther] = useState<OtherSymptoms>({
    pearlyOrWaxyBump: false,
    roughOrScalyTexture: false,
    bleedingOrCrusting: false,
    firmSmallNodule: false,
    dimplingWhenPinched: false,
    blanchingWhenPressed: false,
    redOrPurpleBump: false,
    stableAppearance: false,
    painOrTenderness: false,
    itching: false,
  });

  const toggleAbcde = (key: keyof ABCDEAnswers) => {
    setAbcde(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOther = (key: keyof OtherSymptoms) => {
    setOther(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    const symptoms: SelectedSymptoms = { abcde, other };
    navigation.navigate('Camera', { patientInfo, symptoms });
  };

  const selectedAbcdeCount = Object.values(abcde).filter(Boolean).length;
  const selectedOtherCount = Object.values(other).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ABCDE & Lesion Symptom Checklist</Text>
        <Text style={styles.headerSubtitle}>Observe the lesion and select all that apply</Text>
        <View style={styles.progressRow}>
          <ProgressSteps steps={STEPS} currentStep={1} />
        </View>

        {/* Summary badge */}
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>
            {selectedAbcdeCount + selectedOtherCount} signs selected
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ABCDE as cards */}
        {ABCDE_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.abcdeCard, abcde[item.key] && styles.abcdeCardSelected]}
            onPress={() => toggleAbcde(item.key)}
            activeOpacity={0.8}>
            <View style={[styles.abcdeLetter, abcde[item.key] && styles.abcdeLetterSelected]}>
              <Text style={[styles.letterText, abcde[item.key] && styles.letterTextSelected]}>
                {item.letter}
              </Text>
            </View>
            <View style={styles.abcdeTextArea}>
              <Text style={[styles.abcdeName, abcde[item.key] && styles.abcdeNameSelected]}>
                {item.name}
              </Text>
              <Text style={styles.abcdeDesc}>{item.description}</Text>
            </View>
            {abcde[item.key] && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Other Signs */}
        <View style={styles.otherSection}>
          <View style={styles.otherHeader}>
            <View style={styles.otherNumberBadge}>
              <Text style={styles.otherNumber}>3</Text>
            </View>
            <Text style={styles.otherTitle}>Other Lesion Signs</Text>
          </View>

          <View style={styles.chipContainer}>
            {OTHER_SYMPTOMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.symptomChip, other[item.key] && styles.symptomChipSelected]}
                onPress={() => toggleOther(item.key)}
                activeOpacity={0.75}>
                {other[item.key] && <Text style={styles.chipCheck}>✓</Text>}
                <Text style={[styles.chipText, other[item.key] && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Symptom data is combined with the captured image for CNN-based preliminary screening
          </Text>
        </View>
      </ScrollView>

      {/* Sticky bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          {/* Camera icon */}
          <View style={styles.cameraIcon}>
            <View style={styles.cameraBody} />
            <View style={styles.cameraLens} />
          </View>
          <Text style={styles.continueBtnText}>Continue to Image Capture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  progressRow: {
    marginBottom: Spacing.md,
  },
  selectedBadge: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  selectedBadgeText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  // ABCDE cards
  abcdeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  abcdeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryUltraLight,
  },
  abcdeLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
    flexShrink: 0,
  },
  abcdeLetterSelected: {
    backgroundColor: Colors.primary,
  },
  letterText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
  },
  letterTextSelected: {
    color: Colors.white,
  },
  abcdeTextArea: { flex: 1 },
  abcdeName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  abcdeNameSelected: { color: Colors.primary },
  abcdeDesc: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  // Other signs section
  otherSection: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  otherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  otherNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  otherTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 5,
  },
  symptomChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipCheck: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
  noteCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  noteText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
  },
  // Bottom sticky bar
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  cameraIcon: {
    width: 22,
    height: 18,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBody: {
    width: 22,
    height: 15,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cameraLens: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  continueBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
