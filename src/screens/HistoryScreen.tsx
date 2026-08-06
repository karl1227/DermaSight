import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ScreeningRecord, ScreeningStatus, TabParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { getAllScreenings } from '../database/database';
import { formatDate, formatConfidence, getStatusColor } from '../utils';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'History'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = async () => {
    try {
      const data = await getAllScreenings();
      setRecords(data);
    } catch {
      setRecords([]);
    }
  };

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const renderItem: ListRenderItem<ScreeningRecord> = ({ item }) => {
    const statusColor = getStatusColor(item.screening_status as ScreeningStatus);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.lesionType}>{item.predicted_lesion_type}</Text>
            <Text style={styles.patientName}>{item.full_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.screening_status}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Patient ID</Text>
            <Text style={styles.metaValue}>{item.patient_id}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Confidence</Text>
            <Text style={[styles.metaValue, { color: Colors.primary }]}>
              {formatConfidence(item.confidence_score)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(item.created_at).split('at')[0]}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() =>
            navigation.navigate('Report', { recordId: item.id! })
          }
          activeOpacity={0.8}>
          <Text style={styles.viewBtnText}>View Report →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Saved Screenings</Text>
      <Text style={styles.emptyText}>
        Complete a screening and save the result to view it here.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('PatientInfo')}
        activeOpacity={0.8}>
        <Text style={styles.emptyBtnText}>Start First Screening</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Screening History</Text>
        <Text style={styles.headerSubtitle}>
          {records.length} saved screening{records.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={item => item.id!.toString()}
        contentContainerStyle={[
          styles.listContent,
          records.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: Typography.medium,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  lesionType: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  patientName: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  viewBtn: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  viewBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
    ...Shadow.sm,
  },
  emptyBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
