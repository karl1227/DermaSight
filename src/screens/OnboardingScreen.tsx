import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ListRenderItem,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  /** Which icon variant to render */
  iconVariant: 'phone' | 'checklist' | 'chip';
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    iconVariant: 'phone',
    title: 'Smartphone-Based Screening',
    description:
      'Use your mobile phone camera to capture a clear image of a pigmented skin lesion for preliminary screening.',
  },
  {
    id: '2',
    iconVariant: 'checklist',
    title: 'Symptom-Aware Assessment',
    description:
      'DermaSight combines image input with age, gender, lesion location, and selected symptoms to provide better screening context.',
  },
  {
    id: '3',
    iconVariant: 'chip',
    title: 'Offline Local Processing',
    description:
      'The app processes screening data locally on the smartphone using CNN and TensorFlow Lite.',
  },
];

// ─── Simple SVG-like icon components ─────────────────────────────────────────

const PhoneIcon = () => (
  <View style={iconStyles.phoneOuter}>
    <View style={iconStyles.phoneScreen} />
    <View style={iconStyles.phoneCamera} />
  </View>
);

const ChecklistIcon = () => (
  <View style={iconStyles.clipboard}>
    <View style={iconStyles.clipboardTop} />
    {[0, 1, 2].map(i => (
      <View key={i} style={[iconStyles.clipboardLine, i === 2 && { width: '55%' }]} />
    ))}
  </View>
);

const ChipIcon = () => (
  <View style={iconStyles.chip}>
    <View style={iconStyles.chipInner} />
    {/* Pins */}
    {[0, 1].map(i => (
      <View key={`t${i}`} style={[iconStyles.pin, iconStyles.pinTop, { left: 10 + i * 14 }]} />
    ))}
    {[0, 1].map(i => (
      <View key={`b${i}`} style={[iconStyles.pin, iconStyles.pinBottom, { left: 10 + i * 14 }]} />
    ))}
    {[0, 1].map(i => (
      <View key={`l${i}`} style={[iconStyles.pin, iconStyles.pinLeft, { top: 10 + i * 14 }]} />
    ))}
    {[0, 1].map(i => (
      <View key={`r${i}`} style={[iconStyles.pin, iconStyles.pinRight, { top: 10 + i * 14 }]} />
    ))}
  </View>
);

const ICONS = { phone: PhoneIcon, checklist: ChecklistIcon, chip: ChipIcon };

// ─── Screen ───────────────────────────────────────────────────────────────────

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(prev => prev + 1);
    } else {
      navigation.replace('Landing');
    }
  };

  const handleSkip = () => navigation.replace('Landing');

  const renderItem: ListRenderItem<OnboardingSlide> = ({ item }) => {
    const Icon = ICONS[item.iconVariant];
    return (
      <View style={styles.slide}>
        {/* Icon area */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.outerCircle}>
            <View style={styles.iconCircle}>
              <Icon />
            </View>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.flatList}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA button */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.nextBtn} onPress={goToNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {currentIndex < SLIDES.length - 1 ? 'Next →' : 'Get Started →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Icon styles ──────────────────────────────────────────────────────────────

const iconStyles = StyleSheet.create({
  // Phone icon
  phoneOuter: {
    width: 36,
    height: 52,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  phoneScreen: {
    width: 22,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
  },
  phoneCamera: {
    position: 'absolute',
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
    opacity: 0.8,
  },
  // Checklist icon
  clipboard: {
    width: 36,
    height: 44,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: Colors.white,
    paddingHorizontal: 5,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  clipboardTop: {
    position: 'absolute',
    top: -5,
    alignSelf: 'center',
    width: 14,
    height: 8,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  clipboardLine: {
    width: '85%',
    height: 3,
    backgroundColor: Colors.white,
    borderRadius: 2,
    marginBottom: 5,
    opacity: 0.9,
  },
  // Chip icon
  chip: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipInner: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: Colors.white,
    opacity: 0.8,
  },
  pin: {
    position: 'absolute',
    backgroundColor: Colors.white,
  },
  pinTop: { width: 3, height: 7, top: -7 },
  pinBottom: { width: 3, height: 7, bottom: -7 },
  pinLeft: { width: 7, height: 3, left: -7 },
  pinRight: { width: 7, height: 3, right: -7 },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingTop: Spacing.xl,
    paddingRight: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  skipText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  flatList: {
    flexGrow: 0,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  illustrationWrapper: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: Typography.xl * 1.3,
    marginBottom: Spacing.base,
  },
  description: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.65,
    paddingHorizontal: Spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 28,
  },
  buttonRow: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxxl,
    marginTop: 'auto',
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
