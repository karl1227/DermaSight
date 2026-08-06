import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { LesionClassCard } from '../components/LesionClassCard';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Guide'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const ABCDE_ITEMS = [
  { letter: 'A', name: 'Asymmetry', desc: 'One half of the mole does not match the other half in size, shape, color, or thickness.' },
  { letter: 'B', name: 'Border', desc: 'The edges are uneven, ragged, notched, blurred, or irregularly defined.' },
  { letter: 'C', name: 'Color', desc: 'The color is not the same throughout. May include shades of brown, black, pink, red, white, or blue.' },
  { letter: 'D', name: 'Diameter', desc: 'The mole is larger than 6mm in diameter (about the size of a pencil eraser).' },
  { letter: 'E', name: 'Evolution', desc: 'The mole is changing over time in size, shape, color, or new symptoms such as bleeding or itching.' },
];

const LESION_CLASSES = [
  {
    name: 'Melanoma',
    abbreviation: 'MEL',
    riskLevel: 'high' as const,
    description: 'Melanoma is the most serious form of skin cancer, developing in melanocytes (pigment-producing cells). It can spread rapidly to other parts of the body if not caught early.',
    commonSigns: [
      'Asymmetric, irregularly shaped mole',
      'Border with notched or ragged edges',
      'Multiple colors (brown, black, tan, pink, white, blue)',
      'Diameter larger than 6mm',
      'Evolving size, shape, or color over weeks or months',
    ],
  },
  {
    name: 'Basal Cell Carcinoma',
    abbreviation: 'BCC',
    riskLevel: 'high' as const,
    description: 'The most common form of skin cancer, basal cell carcinoma begins in basal cells. It rarely spreads but can cause significant local tissue destruction if left untreated.',
    commonSigns: [
      'Pearly or waxy bump, often with visible blood vessels',
      'Flat, flesh-colored or brown scar-like lesion',
      'Bleeding or scabbing sore that heals and recurs',
      'Pink growth with raised edges and central indentation',
      'Usually appears on sun-exposed areas (face, neck, hands)',
    ],
  },
  {
    name: 'Actinic Keratoses',
    abbreviation: 'AKIEC',
    riskLevel: 'precancerous' as const,
    description: 'Actinic keratosis is a rough, scaly patch caused by years of sun exposure. It is considered precancerous and may develop into squamous cell carcinoma if untreated.',
    commonSigns: [
      'Rough, dry, scaly patch of skin (less than 1 inch)',
      'Flat or slightly raised reddish patch',
      'Hard, wart-like surface',
      'Itching, burning, or tenderness in the affected area',
      'Appears on face, lips, ears, forearms, and scalp',
    ],
  },
  {
    name: 'Melanocytic Nevi',
    abbreviation: 'NV',
    riskLevel: 'benign' as const,
    description: 'Commonly known as moles, melanocytic nevi are benign growths that form when melanocytes grow in clusters. Most moles are harmless but should be monitored for changes.',
    commonSigns: [
      'Uniform round or oval shape',
      'Consistent brown, tan, or black color throughout',
      'Smooth, well-defined borders',
      'Flat or slightly raised surface',
      'Stable appearance over time (no changes)',
    ],
  },
  {
    name: 'Benign Keratosis',
    abbreviation: 'BKL',
    riskLevel: 'benign' as const,
    description: 'Benign keratosis-like lesions include seborrheic keratoses and other harmless growths. They are non-cancerous and very common in older adults.',
    commonSigns: [
      'Waxy, "stuck-on" appearance',
      'Tan, brown, or black color, may vary',
      'Well-defined, round or oval shape',
      'Slightly raised, rough or warty surface',
      'Can appear anywhere on the body',
    ],
  },
  {
    name: 'Dermatofibroma',
    abbreviation: 'DF',
    riskLevel: 'benign' as const,
    description: 'Dermatofibromas are benign skin growths (fibrous nodules) most commonly found on the lower legs. They are generally harmless and require no treatment.',
    commonSigns: [
      'Small, firm, raised nodule',
      'Brownish, reddish-brown, or tan color',
      'Dimpling or puckering when pinched (classic sign)',
      'Often found on lower legs',
      'Usually asymptomatic; may itch slightly',
    ],
  },
  {
    name: 'Vascular Lesions',
    abbreviation: 'VASC',
    riskLevel: 'benign' as const,
    description: 'Vascular skin lesions are caused by abnormal blood vessels near the surface of the skin. Most are benign and range from cherry angiomas to port-wine stains.',
    commonSigns: [
      'Bright red, purple, or blue color',
      'Blanching (fading) when pressed firmly',
      'Smooth surface, soft texture',
      'Can range from tiny dots to larger flat patches',
      'Common in adults over 30 (cherry angiomas)',
    ],
  },
];

const ASSESSMENT_LEVELS = [
  { dot: Colors.redDot, label: 'High Concern', classes: 'Melanoma, Basal Cell Carcinoma' },
  { dot: Colors.orangeDot, label: 'Precancerous Indicator', classes: 'Actinic Keratoses' },
  { dot: Colors.greenDot, label: 'Generally Benign', classes: 'Melanocytic Nevi, Benign Keratosis, Dermatofibroma, Vascular Lesions' },
];

export const LesionGuideScreen: React.FC<Props> = () => {
  const [abcdeExpanded, setAbcdeExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pigmented Skin Lesion Guide</Text>
        <Text style={styles.headerSubtitle}>
          Educational reference · Not for self-diagnosis
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Educational notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            This guide is for educational purposes only. The ABCDE method
            and lesion descriptions below are reference material and do not
            replace professional medical diagnosis.
          </Text>
        </View>

        {/* ABCDE Method */}
        <TouchableOpacity
          style={styles.abcdeHeader}
          onPress={() => setAbcdeExpanded(p => !p)}
          activeOpacity={0.85}>
          <View style={styles.abcdeTitleRow}>
            <Text style={styles.abcdeTitle}>ABCDE Method</Text>
            <Text style={styles.abcdeSubtitle}>Melanoma Early Detection Guide</Text>
          </View>
          <Text style={styles.chevron}>{abcdeExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {abcdeExpanded && (
          <View style={styles.abcdeContent}>
            <Text style={styles.abcdeIntro}>
              The ABCDE criteria are a widely used guide to help identify early
              warning signs of melanoma. SkinSense asks about these criteria as
              part of the symptom checklist before every screening.
            </Text>
            {ABCDE_ITEMS.map(item => (
              <View key={item.letter} style={styles.abcdeItem}>
                <View style={styles.abcdeLetter}>
                  <Text style={styles.abcdeLetterText}>{item.letter}</Text>
                </View>
                <View style={styles.abcdeBody}>
                  <Text style={styles.abcdeItemName}>{item.name}</Text>
                  <Text style={styles.abcdeItemDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Assessment level color guide */}
        <View style={styles.colorGuideCard}>
          <Text style={styles.colorGuideTitle}>Screening Status Color Guide</Text>
          {ASSESSMENT_LEVELS.map(level => (
            <View key={level.label} style={styles.colorGuideRow}>
              <View style={[styles.colorDot, { backgroundColor: level.dot }]} />
              <View style={styles.colorGuideContent}>
                <Text style={styles.colorGuideLabel}>{level.label}</Text>
                <Text style={styles.colorGuideClasses}>{level.classes}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Lesion class cards */}
        <Text style={styles.classesTitle}>7 HAM10000 Lesion Classes</Text>
        {LESION_CLASSES.map(item => (
          <LesionClassCard key={item.name} {...item} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All descriptions are based on published dermatology literature.
            Always consult a licensed dermatologist for clinical evaluation.
          </Text>
        </View>
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
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  noticeCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  noticeText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    lineHeight: Typography.sm * 1.6,
    fontWeight: Typography.medium,
  },
  abcdeHeader: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.card,
  },
  abcdeTitleRow: { flex: 1 },
  abcdeTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  abcdeSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: { fontSize: 12, color: Colors.textMuted },
  abcdeContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
    ...Shadow.sm,
  },
  abcdeIntro: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.base,
    fontStyle: 'italic',
  },
  abcdeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  abcdeLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  abcdeLetterText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  abcdeBody: { flex: 1 },
  abcdeItemName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  abcdeItemDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  colorGuideCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  colorGuideTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  colorGuideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: Spacing.md,
    marginTop: 3,
    flexShrink: 0,
  },
  colorGuideContent: { flex: 1 },
  colorGuideLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  colorGuideClasses: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  classesTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  footer: {
    marginTop: Spacing.base,
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  footerText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: Typography.xs * 1.65,
  },
});
