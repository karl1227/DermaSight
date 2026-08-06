import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Welcome to DermaSight</Text>
          <Text style={styles.headerSubtitle}>AI-Assisted Skin Lesion Screening</Text>
          <View style={styles.offlineBadge}>
            {/* wifi-slash icon */}
            <Text style={styles.offlineIcon}>&#8212;</Text>
            <Text style={styles.offlineBadgeText}>Offline Mode Ready</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.75}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Central scan CTA */}
      <View style={styles.ctaArea}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing}>
            <TouchableOpacity
              style={styles.scanCircle}
              onPress={() => navigation.navigate('PatientInfo')}
              activeOpacity={0.82}>
              {/* Scan frame corners */}
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanText}>Start New{'\n'}Screening</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Disclaimer card */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          DermaSight supports early awareness and does not provide final diagnosis
        </Text>
      </View>
    </View>
  );
};

const SCAN_SIZE = 150;
const INNER_RING_SIZE = 190;
const OUTER_RING_SIZE = 230;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  offlineIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
  offlineBadgeText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  settingsBtn: {
    marginTop: 4,
    padding: Spacing.sm,
  },
  settingsIcon: {
    fontSize: 24,
  },
  ctaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: OUTER_RING_SIZE,
    height: OUTER_RING_SIZE,
    borderRadius: OUTER_RING_SIZE / 2,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: INNER_RING_SIZE,
    height: INNER_RING_SIZE,
    borderRadius: INNER_RING_SIZE / 2,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCircle: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  scanFrame: {
    width: 34,
    height: 34,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderColor: Colors.white,
    borderWidth: 2.5,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 2 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 2 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 2 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 2 },
  scanText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: Typography.base * 1.4,
  },
  disclaimerCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  disclaimerText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.55,
  },
});
