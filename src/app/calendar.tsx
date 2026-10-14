import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useCalendarSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScreen() {
  const { days, cycleDay, entitlements } = useApp();
  useCalendarSync();
  const { contentWidth } = useResponsive();
  const [error, setError] = useState('');
  const cell = Math.floor(contentWidth / 7);
  const size = Math.min(cell, 72);
  const gridWidth = cell * 7;
  const year = 2026;
  const month = 9;
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  return (
    <Screen header={<Header title="Availability" subtitle="October 2026" back />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {!entitlements.calendar ? <Notice tone="warning" body="The calendar is included with Gold and Platinum. You can still answer each request directly." /> : <Notice tone="info" body="Optional. Tap a day to cycle available, limited and unavailable. A reply on a request is what customers rely on." />}
      <View style={{ width: gridWidth, alignSelf: 'center' }}>
        <View style={styles.week}>
          {WEEK.map((day) => (
            <Text key={day} style={[styles.weekDay, { width: cell }]} numberOfLines={1}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, index) => {
            if (!day) return <View key={`e-${index}`} style={[styles.cell, { width: cell, height: size }]} />;
            const iso = `2026-10-${String(day).padStart(2, '0')}`;
            const status = days[iso];
            return (
              <Pressable key={iso} accessibilityRole="button" accessibilityLabel={`${day} ${status ?? 'unknown'}`} disabled={!entitlements.calendar} onPress={async () => {
                const result = await cycleDay(iso);
                setError(result.ok ? '' : result.reason);
              }} style={[styles.cell, { width: cell, height: size }, status && styles[status]]}>
                <Text style={styles.day}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={styles.legend}>Green available · Gold limited · Red unavailable</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row' },
  weekDay: { textAlign: 'center', color: palette.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  day: { color: palette.ink, fontWeight: '600' },
  available: { backgroundColor: palette.accentSoft },
  limited: { backgroundColor: palette.goldSoft },
  unavailable: { backgroundColor: palette.dangerSoft },
  legend: { color: palette.muted, fontSize: 13 },
});
