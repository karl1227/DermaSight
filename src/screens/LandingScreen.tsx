import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
};

const ICON_SIZE = 72;

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top scan icon */}
      <View style={styles.topSection}>
        <View style={styles.iconCircle}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        <Text style={styles.heroTitle}>Scan. Understand. Act Early.</Text>
        <Text style={styles.heroSubtitle}>
          DermaSight helps users perform preliminary skin lesion screening using
          a smartphone camera and AI-assisted image processing.
        </Text>

        {/* Notice card */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <View style={styles.noticeCircle}>
              <Text style={styles.noticeI}>i</Text>
            </View>
          </View>
          <Text style={styles.noticeText}>
            Educational screening only — not a medical diagnosis
          </Text>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('MedicalDisclaimer')}
          activeOpacity={0.85}>
          {/* Scan corner icon inside button */}
          <View style={styles.btnIcon}>
            <View style={[styles.btnCorner, styles.btnCornerTL]} />
            <View style={[styles.btnCorner, styles.btnCornerTR]} />
            <View style={[styles.btnCorner, styles.btnCornerBL]} />
            <View style={[styles.btnCorner, styles.btnCornerBR]} />
          </View>
          <Text style={styles.primaryBtnText}>Start Screening</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('LesionGuide')}
          activeOpacity={0.75}>
          {/* Book icon */}
          <View style={styles.bookIcon}>
            <View style={styles.bookSpine} />
            <View style={styles.bookPage} />
          </View>
          <Text style={styles.secondaryBtnText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  scanFrame: {
    width: 30,
    height: 30,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: Colors.white,
    borderWidth: 2.5,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 2 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 2 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 2 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 2 },
  heroTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: Typography.xxl * 1.25,
    marginBottom: Spacing.base,
  },
  heroSubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.65,
    marginBottom: Spacing.xl,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'stretch',
  },
  noticeIcon: {
    marginRight: Spacing.md,
  },
  noticeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeI: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    lineHeight: 16,
  },
  noticeText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: Typography.sm * 1.5,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  btnIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  btnCorner: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderColor: Colors.white,
    borderWidth: 2,
  },
  btnCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 1 },
  btnCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 1 },
  btnCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 1 },
  btnCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 1 },
  primaryBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
  secondaryBtn: {
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  bookIcon: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bookSpine: {
    width: 4,
    backgroundColor: Colors.textMuted,
  },
  bookPage: {
    flex: 1,
  },
  secondaryBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
});
