import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, PatientInfo } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { ProgressSteps } from '../components/ProgressSteps';
import {
  PRIMARY_LOCATIONS,
  OTHER_LOCATIONS,
  OCCUPATIONS,
  screeningLabel,
} from '../utils/screeningInformation';
import { secureId } from '../utils/secureId';
import { AGE_ERROR, isValidAge } from '../utils/ageValidation';
import { useAuth } from '../auth/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PatientInfo'>;
};

const SEX_OPTIONS: Array<PatientInfo['sex']> = ['Male', 'Female', 'Other'];

const STEPS = ['Information', 'Symptoms', 'Scan'];

export const PatientInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { state, owner } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const [patientId] = useState(secureId);
  const [createdAt] = useState(() => new Date().toISOString());
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [moreLocations, setMoreLocations] = useState(false);
  const [sexExpanded, setSexExpanded] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [otherOccupation, setOtherOccupation] = useState('');
  const [sunburnHistory, setSunburnHistory] = useState<boolean | null>(null);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<PatientInfo['sex']>(user?.sex ?? '');
  const [lesionLocation, setLesionLocation] = useState('');

  const missing = [
    !owner || !patientId ? 'Enter guest mode or sign in' : '',
    !(user?.name ?? fullName).trim() ? 'Full name is required' : '',
    !isValidAge(age) ? AGE_ERROR : '',
    !(user?.sex ?? sex) ? 'Select sex' : '',
    !lesionLocation ? 'Select a lesion location' : '',
    !occupation || (occupation === 'Other' && !otherOccupation.trim())
      ? 'Enter your occupation'
      : '',
    sunburnHistory === null ? 'Select sunburn history' : '',
  ].filter(Boolean);
  const handleContinue = () => {
    if (!owner || !patientId) {
      Alert.alert(
        'Session required',
        'Please enter guest mode or sign in again.',
      );
      return;
    }
    if (!(user?.name ?? fullName).trim()) {
      Alert.alert('Required', "Please enter the patient's full name.");
      return;
    }
    const ageNum = Number(age);
    if (!isValidAge(age)) {
      Alert.alert('Invalid age', AGE_ERROR);
      return;
    }
    if (!sex) {
      Alert.alert('Required', 'Please select sex.');
      return;
    }
    if (!lesionLocation) {
      Alert.alert('Required', 'Please select the lesion location.');
      return;
    }
    if (!occupation || (occupation === 'Other' && !otherOccupation.trim())) {
      Alert.alert('Required', 'Please select or specify your occupation.');
      return;
    }
    if (sunburnHistory === null) {
      Alert.alert(
        'Required',
        'Please select Yes or No for history of sunburn.',
      );
      return;
    }
    navigation.navigate('SymptomChecklist', {
      patientInfo: {
        patientId,
        screeningId: patientId,
        createdAt,
        owner,
        fullName: (user?.name ?? fullName).trim(),
        age: ageNum,
        sex: user?.sex ?? sex,
        lesionLocation,
        occupation:
          occupation === 'Other' ? otherOccupation.trim() : occupation,
        sunburnHistory,
      },
    });
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Basic Screening Information</Text>
        <Text style={styles.pageSubtitle}>
          This information helps improve the context of the preliminary
          screening
        </Text>

        <View style={styles.progressWrapper}>
          <ProgressSteps steps={STEPS} currentStep={0} />
        </View>

        <View style={styles.rowFields}>
          <View
            style={[styles.fieldGroup, { flex: 1, marginRight: Spacing.md }]}
          >
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Screening ID</Text>
            </View>
            <View style={styles.idField}>
              <Text style={styles.idText}>{screeningLabel(patientId)}</Text>
            </View>
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Age</Text>
            </View>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 25"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              accessibilityLabel="Age"
              returnKeyType="done"
            />
            {age !== '' && !isValidAge(age) && (
              <Text accessibilityRole="alert" style={styles.ageError}>
                {AGE_ERROR}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Full Name</Text>
          </View>
          <TextInput
            style={styles.input}
            value={user?.name ?? fullName}
            editable={!user}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Sex</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.input,
              { flexDirection: 'row', justifyContent: 'space-between' },
            ]}
            disabled={!!user}
            onPress={() => setSexExpanded(!sexExpanded)}
            accessibilityRole="button"
            accessibilityLabel="Sex"
          >
            <Text
              style={{ color: sex ? Colors.textPrimary : Colors.textMuted }}
            >
              {user?.sex ?? (sex || 'Select sex')}
            </Text>
            {!user && <Text style={{ color: Colors.primary }}>⌄</Text>}
          </TouchableOpacity>
          {sexExpanded && !user && (
            <View style={[styles.sexDropdown, { marginTop: 8 }]}>
              {SEX_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sexOption,
                    sex === option && styles.sexOptionSelected,
                  ]}
                  onPress={() => {
                    setSex(option);
                    setSexExpanded(false);
                  }}
                >
                  <Text style={styles.sexOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Lesion Location</Text>
          </View>
          <View style={styles.chipRow}>
            {(moreLocations
              ? [...PRIMARY_LOCATIONS, ...OTHER_LOCATIONS]
              : PRIMARY_LOCATIONS
            ).map(loc => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationChip,
                  lesionLocation === loc && styles.locationChipSelected,
                ]}
                onPress={() => setLesionLocation(loc)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    lesionLocation === loc && styles.locationChipTextSelected,
                  ]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setMoreLocations(!moreLocations)}
            style={{ paddingTop: 12 }}
          >
            <Text style={{ color: Colors.primary }}>
              {moreLocations ? 'Fewer locations' : 'Other Locations'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Occupation</Text>
          <View style={styles.chipRow}>
            {OCCUPATIONS.map(option => (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: occupation === option }}
                style={[
                  styles.locationChip,
                  occupation === option && styles.locationChipSelected,
                ]}
                onPress={() => setOccupation(option)}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    occupation === option && styles.locationChipTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {occupation === 'Other' && (
            <TextInput
              style={styles.input}
              accessibilityLabel="Specific occupation"
              value={otherOccupation}
              onChangeText={setOtherOccupation}
              placeholder="Specify your occupation"
              placeholderTextColor={Colors.textMuted}
              maxLength={120}
            />
          )}
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>History of Sunburn</Text>
          <View style={styles.chipRow}>
            {[true, false].map(value => (
              <TouchableOpacity
                key={String(value)}
                accessibilityRole="button"
                accessibilityLabel={`History of Sunburn: ${
                  value ? 'Yes' : 'No'
                }`}
                accessibilityState={{ selected: sunburnHistory === value }}
                style={[
                  styles.locationChip,
                  sunburnHistory === value && styles.locationChipSelected,
                ]}
                onPress={() => setSunburnHistory(value)}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    sunburnHistory === value && styles.locationChipTextSelected,
                  ]}
                >
                  {value ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {missing.length > 0 && (
          <Text
            accessibilityRole="alert"
            style={{ color: Colors.textSecondary, marginBottom: 8 }}
          >
            {missing.join(' · ')}
          </Text>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: missing.length > 0 }}
          disabled={missing.length > 0}
          style={[styles.continueBtn, missing.length > 0 && { opacity: 0.5 }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ageError: {
    color: Colors.danger,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backBtn: {},
  backText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  pageTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.55,
    marginBottom: Spacing.base,
  },
  progressWrapper: {
    marginBottom: Spacing.xl,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 6,
  },
  labelIcon: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.primary,
    width: 14,
  },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  idField: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
  },
  idText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  sexDropdown: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sexOption: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  sexOptionSelected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  sexOptionText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  sexOptionTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  sexChevron: {
    fontSize: Typography.xs,
    color: Colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  locationChip: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  locationChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  locationChipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  locationChipTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
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
  },
  continueBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
