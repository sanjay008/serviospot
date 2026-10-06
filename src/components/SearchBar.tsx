import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search dishes, cuisines, providers',
  onFilter,
  onSubmit,
  autoFocus,
}: {
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.field} pointerEvents={onChangeText ? 'auto' : 'none'}>
        <Icon name="search" color={palette.muted} size={18} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8B86A3"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          editable={!!onChangeText}
        />
      </View>
      {onFilter ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Filters" onPress={onFilter} style={styles.filter}>
          <Icon name="filter" color={palette.accent} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  field: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: palette.well,
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, color: palette.ink, paddingVertical: 10 },
  filter: { width: 48, height: 48, borderRadius: 14, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
