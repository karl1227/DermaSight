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
import { generatePatientId } from '../utils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PatientInfo'>;
};

const LESION_LOCATIONS = [
  'Face', 'Neck', 'Arm', 'Torso', 'Shoulder',
  'Back', 'Chest', 'Hand', 'Leg', 'Foot', 'Other',
];

const SEX_OPTIONS: Array<PatientInfo['sex']> = ['Male', 'Female', 'Other'];

const STEPS = ['Information', 'Symptoms', 'Scan'];

export const PatientInfoScreen: React.FC<Props> = ({ navigation }) => {
  const [patientId] = useState(generatePatientId());
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<PatientInfo['sex']>('');
  const [lesionLocation, setLesionLocation] = useState('');

  const handleContinue = () => {
    if (!fullName.trim()) {
      Alert.alert('Required', "Please enter the patient's full name.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Required', 'Please enter a valid age (1-120).');
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
    navigation.navigate('SymptomChecklist', {
      patientInfo: { patientId, fullName: fullName.trim(), age: ageNum, sex, lesionLocation },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Basic Screening Information</Text>
        <Text style={styles.pageSubtitle}>
          This information helps improve the context of the preliminary screening
        </Text>

        <View style={styles.progressWrapper}>
          <ProgressSteps steps={STEPS} currentStep={0} />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: Spacing.md }]}>
            <View style={styles.labelRow}>
            
              <Text style={styles.fieldLabel}>Patient ID</Text>
            </View>
            <View style={styles.idField}>
              <Text style={styles.idText}>Auto-assigned</Text>
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
              maxLength={3}
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
  
            <Text style={styles.fieldLabel}>Full Name</Text>
          </View>
          <TextInput
            style={styles.input}
            value={fullName}
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
          <View style={styles.sexDropdown}>
            {SEX_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.sexOption, sex === option && styles.sexOptionSelected]}
                onPress={() => setSex(option)}
                activeOpacity={0.8}>
                <Text style={[styles.sexOptionText, sex === option && styles.sexOptionTextSelected]}>
                  {option}
                </Text>
                {sex === option && <Text style={styles.sexChevron}>v</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
           
            <Text style={styles.fieldLabel}>Lesion Location</Text>
          </View>
          <View style={styles.chipRow}>
            {LESION_LOCATIONS.map(loc => (
              <TouchableOpacity
                key={loc}
                style={[styles.locationChip, lesionLocation === loc && styles.locationChipSelected]}
                onPress={() => setLesionLocation(loc)}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.locationChipText,
                    lesionLocation === loc && styles.locationChipTextSelected,
                  ]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            This information helps the AI model provide more accurate preliminary
            screening results by considering demographic and anatomical factors.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    paddingTop: Spacing.xxxl,
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
    color: Colors.textPrimary,
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
  noteCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    marginTop: Spacing.sm,
  },
  noteText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
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
