import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ChipGroup, ChipSingle } from '@/components/Chip';
import { Input } from '@/components/Input';
import { palette } from '@/constants/theme';
import { CATEGORIES, CUISINES, DIETARY, EVENT_TYPES } from '@/data/mock';
import { toggleIn } from '@/data/format';
import type { Fulfillment, SearchFilters } from '@/data/types';

const DISTANCES = ['10', '25', '40', '60'];
const RATINGS = ['4', '4.5'];

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
  const set = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters</Text>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Input label="City or postcode" value={filters.city} onChangeText={(city) => set({ city })} placeholder="Utrecht" />
          <Text style={styles.label}>Distance</Text>
          <ChipSingle
            options={['Any', ...DISTANCES.map((km) => `${km} km`)]}
            value={filters.distanceKm ? `${filters.distanceKm} km` : 'Any'}
            onChange={(value) => set({ distanceKm: value === 'Any' ? null : Number(value.replace(' km', '')) })}
          />
          <Text style={styles.label}>Cuisine</Text>
          <ChipSingle options={['Any', ...CUISINES]} value={filters.cuisine ?? 'Any'} onChange={(value) => set({ cuisine: value === 'Any' ? null : value })} />
          <Text style={styles.label}>Category</Text>
          <ChipSingle options={['Any', ...CATEGORIES]} value={filters.category ?? 'Any'} onChange={(value) => set({ category: value === 'Any' ? null : value })} />
          <Text style={styles.label}>Event type</Text>
          <ChipSingle options={['Any', ...EVENT_TYPES]} value={filters.eventType ?? 'Any'} onChange={(value) => set({ eventType: value === 'Any' ? null : value })} />
          <Input label="Guests" value={filters.guests} onChangeText={(guests) => set({ guests })} keyboardType="number-pad" placeholder="80" />
          <Input label="Max starting price (€)" value={filters.maxPrice} onChangeText={(maxPrice) => set({ maxPrice })} keyboardType="decimal-pad" placeholder="40" />
          <Input label="Max minimum order (€)" value={filters.maxMinOrder} onChangeText={(maxMinOrder) => set({ maxMinOrder })} keyboardType="decimal-pad" />
          <Text style={styles.label}>Dietary</Text>
          <ChipGroup options={DIETARY} selected={filters.dietary} onToggle={(item) => set({ dietary: toggleIn(filters.dietary, item) })} />
          <Text style={styles.label}>Fulfilment</Text>
          <ChipGroup
            options={['Delivery', 'Pickup', 'On-site']}
            selected={filters.fulfillment.map((item) => (item === 'on_site' ? 'On-site' : item[0].toUpperCase() + item.slice(1)))}
            onToggle={(item) => {
              const id = (item === 'On-site' ? 'on_site' : item.toLowerCase()) as Fulfillment;
              set({ fulfillment: toggleIn(filters.fulfillment, id) as Fulfillment[] });
            }}
          />
          <Text style={styles.label}>Rating</Text>
          <ChipSingle
            options={['Any', ...RATINGS.map((rating) => `${rating}+`)]}
            value={filters.minRating ? `${filters.minRating}+` : 'Any'}
            onChange={(value) => set({ minRating: value === 'Any' ? null : Number(value.replace('+', '')) })}
          />
          <ChipGroup
            options={['Verified only', 'Staff included']}
            selected={[filters.verifiedOnly ? 'Verified only' : '', filters.staff ? 'Staff included' : ''].filter(Boolean)}
            onToggle={(item) => set(item === 'Verified only' ? { verifiedOnly: !filters.verifiedOnly } : { staff: !filters.staff })}
          />
        </ScrollView>
        <View style={styles.actions}>
          <Button label="Clear" variant="secondary" onPress={onClear} style={styles.action} />
          <Button label="Show results" onPress={onClose} style={styles.action} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,25,21,0.35)' },
  sheet: { maxHeight: '88%', backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink, paddingHorizontal: 20 },
  content: { padding: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  action: { flex: 1 },
});
