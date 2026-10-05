import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { getAllScreenings } from '../database/database';
import { ScreeningRecord } from '../types';
import { AccountScreen, a, AccountColors } from '../components/AccountUI';
export function AnalyticsScreen() {
  const { owner } = useAuth();
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [error, setError] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setRecords([]);
      setError(false);
      if (owner)
        getAllScreenings(owner)
          .then(rows => {
            if (active) setRecords(rows);
          })
          .catch(() => {
            if (active) setError(true);
          });
      return () => {
        active = false;
      };
    }, [owner]),
  );
  const counts = records.reduce<Record<string, number>>((all, record) => {
    all[record.predicted_lesion_type] =
      (all[record.predicted_lesion_type] ?? 0) + 1;
    return all;
  }, {});
  return (
    <AccountScreen>
      <Text style={a.title}>Analytics</Text>
      <Text style={a.subtitle}>Your saved screenings on this device</Text>
      {error ? (
        <Text style={a.error}>
          Could not load your records. Return to this screen to retry.
        </Text>
      ) : (
        <View style={[a.card, { padding: 24 }]}>
          <Text style={s.total}>{records.length}</Text>
          <Text style={a.caption}>Saved screenings</Text>
        </View>
      )}
      {Object.entries(counts).map(([label, count]) => (
        <View key={label} style={[a.card, { padding: 20 }]}>
          <Text style={s.label}>{label}</Text>
          <Text style={a.caption}>
            {count} screening{count === 1 ? '' : 's'}
          </Text>
          <View style={s.track}>
            <View
              style={[s.bar, { width: `${(count / records.length) * 100}%` }]}
            />
          </View>
        </View>
      ))}
      {!error && records.length === 0 && (
        <Text style={a.caption}>
          Save a screening to see your records here.
        </Text>
      )}
      <Text style={[a.caption, { marginTop: 20 }]}>
        These are preliminary educational predictions, not diagnoses.
      </Text>
    </AccountScreen>
  );
}
const s = StyleSheet.create({
  total: {
    color: AccountColors.teal,
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: { fontSize: 16, color: AccountColors.text, marginBottom: 8 },
  track: {
    height: 8,
    backgroundColor: '#E7F3F4',
    borderRadius: 4,
    marginTop: 12,
  },
  bar: { height: 8, backgroundColor: AccountColors.teal, borderRadius: 4 },
});
