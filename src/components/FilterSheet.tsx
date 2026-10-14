import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { Input } from '@/components/Input';
import { palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import type { SearchFilters } from '@/data/types';
import { useCategoriesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export function FilterSheet({
  visible,
  filters,
  onChange,
  onClose,
  onClear,
}: {
  visible: boolean;
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isTablet, gutter } = useResponsive();
  const { categories, categoryName } = useApp();
  useCategoriesSync();
  const set = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modal}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12, maxWidth: isTablet ? 560 : undefined, marginBottom: isTablet ? 24 : 0, borderRadius: isTablet ? 24 : undefined, width: '100%' }]}>
        <View style={styles.handle} />
        <Text style={[styles.title, { paddingHorizontal: gutter }]}>Filters</Text>
        <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} keyboardShouldPersistTaps="handled">
          <Input label="City or postcode" value={filters.city} onChangeText={(city) => set({ city })} placeholder="Utrecht" />
          <Input label="Distance (km)" value={filters.distanceKm ? String(filters.distanceKm) : ''} onChangeText={(value) => set({ distanceKm: Number(value) || null })} keyboardType="number-pad" />
          <Input label="Cuisine" value={filters.cuisine ?? ''} onChangeText={(cuisine) => set({ cuisine: cuisine.trim() || null })} />
          <Text style={styles.label}>Category</Text>
          <ChipSingle
            options={['Any', ...categories.map((item) => item.code)]}
            labelOf={(code) => (code === 'Any' ? code : categoryName(code))}
            value={filters.category ?? 'Any'}
            onChange={(value) => set({ category: value === 'Any' ? null : value })}
          />
          <Input label="Event type" value={filters.eventType ?? ''} onChangeText={(eventType) => set({ eventType: eventType.trim() || null })} />
          <Input label="Guests" value={filters.guests} onChangeText={(guests) => set({ guests })} keyboardType="number-pad" placeholder="80" />
          <Input label="Max starting price (€)" value={filters.maxPrice} onChangeText={(maxPrice) => set({ maxPrice })} keyboardType="decimal-pad" placeholder="40" />
          <Input label="Max minimum order (€)" value={filters.maxMinOrder} onChangeText={(maxMinOrder) => set({ maxMinOrder })} keyboardType="decimal-pad" />
          <Input label="Dietary" value={filters.dietary.join(', ')} onChangeText={(value) => set({ dietary: splitList(value) })} />
          <Input label="Minimum rating" value={filters.minRating ? String(filters.minRating) : ''} onChangeText={(value) => set({ minRating: Number(value) || null })} keyboardType="decimal-pad" />
        </ScrollView>
        <View style={[styles.actions, { paddingHorizontal: gutter }]}>
          <Button label="Clear" variant="secondary" onPress={onClear} style={styles.action} />
          <Button label="Show results" onPress={onClose} style={styles.action} />
        </View>
      </View>
      </View>
    </Modal>
  );
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(28,25,21,0.35)' },
  sheet: { maxHeight: '88%', backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink, paddingHorizontal: 20 },
  content: { padding: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  action: { flex: 1 },
});
