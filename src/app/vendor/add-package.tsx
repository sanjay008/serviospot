import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { API_ENABLED, useGetCategoriesQuery, useSaveOfferingMutation } from '@/api';
import { rowsOf, textOf } from '@/api/mappers';
import { useApp as useSession } from '@/state/store';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Field } from '@/flow2/components/Field';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { Stepper } from '@/flow2/components/Stepper';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';

export default function AddPackageScreen() {
  const { session } = useSession();
  const enabled = API_ENABLED && session.signedIn && session.mode === 'provider';
  const categoriesQuery = useGetCategoriesQuery(undefined, { skip: !enabled });
  const categories = rowsOf(categoriesQuery.data).map((row) => ({
    code: String(row.code ?? row.category_id ?? row.id ?? ''),
    label: textOf(row, 'label_en', 'name', 'title', 'label') || String(row.code ?? row.category_id ?? row.id ?? ''),
  })).filter((item) => item.code && item.label);
  const [saveOffering, saveState] = useSaveOfferingMutation();
  const [name, setName] = useState('');
  const [people, setPeople] = useState(50);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [dishInput, setDishInput] = useState('');
  const [dishes, setDishes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const type = useType();
  const selectedCategory = categories.find((item) => item.code === category);

  const addDish = () => {
    const dish = dishInput.trim();
    if (!dish || dishes.some((item) => item.toLocaleLowerCase() === dish.toLocaleLowerCase())) return;
    setDishes((items) => [...items, dish]);
    setDishInput('');
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Enter a package name.');
      return;
    }
    if (!category) {
      setError('Enter a category.');
      return;
    }
    if (dishes.length === 0) {
      setError('Add at least one dish, separated by commas.');
      return;
    }
    const amount = Number(price.trim().replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a starting price greater than €0.');
      return;
    }
    if (!API_ENABLED || !session.signedIn || session.mode !== 'provider') {
      setError('Sign in as a vendor and enable the API before saving an offering.');
      return;
    }
    try {
      await saveOffering({
        title: name.trim(),
        category,
        description: `Serves ${people} people. Includes: ${dishes.join(', ')}`,
        price_cents: Math.round(amount * 100),
        price_type: 'per_person',
        is_active: true,
      }).unwrap();
      router.back();
    } catch (cause) {
      setError(cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : 'Could not save this offering.');
    }
  };

  return (
    <Screen
      loading={categoriesQuery.isLoading}
      refreshing={categoriesQuery.isFetching && !categoriesQuery.isLoading}
      onRefresh={() => { void categoriesQuery.refetch(); }}
      header={<Header title="Add package" subtitle="Name, people, category and dishes" back />}
      footer={<Button label="Save offering" loading={saveState.isLoading} onPress={save} style={styles.save} />}>
      <Card style={styles.form}>
        <Input label="Package name" value={name} onChangeText={setName} placeholder="e.g. My package one" autoCapitalize="words" />
        <Stepper label="Number of people" value={people} onChange={setPeople} min={1} max={9999} />
        <Field label="Category">
          {categoriesQuery.isLoading ? <Text style={styles.helper}>Loading categories…</Text> : null}
          {categoriesQuery.isError ? <Notice tone="error" body="Could not load categories from the server." /> : null}
          {categoriesQuery.isSuccess && categories.length === 0 ? <Text style={styles.helper}>The server returned no categories.</Text> : null}
          {categories.length > 0 ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose package category"
                accessibilityState={{ expanded: categoriesOpen }}
                onPress={() => setCategoriesOpen((open) => !open)}
                style={({ pressed }) => [styles.dropdown, categoriesOpen && styles.dropdownOpen, pressed && styles.buttonPressed]}>
                <Text style={[styles.dropdownText, { fontSize: type.caption }, !selectedCategory && styles.placeholder]} numberOfLines={1}>
                  {selectedCategory?.label || 'Select a category'}
                </Text>
                <Icon name="chevron" color={palette.muted} size={16} />
              </Pressable>
              {categoriesOpen ? (
                <View style={styles.dropdownOptions}>
                  {categories.map((item) => (
                    <Pressable
                      key={item.code}
                      accessibilityRole="button"
                      accessibilityState={{ selected: category === item.code }}
                      onPress={() => { setCategory(item.code); setCategoriesOpen(false); }}
                      style={({ pressed }) => [styles.dropdownOption, category === item.code && styles.dropdownOptionSelected, pressed && styles.buttonPressed]}>
                      <Text style={[styles.dropdownOptionText, { fontSize: type.small }, category === item.code && styles.dropdownOptionTextSelected]} numberOfLines={1}>{item.label}</Text>
                      {category === item.code ? <Icon name="check" color={palette.accentDark} size={15} /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </Field>
        <Input label="Starting price (€)" value={price} onChangeText={setPrice} placeholder="25.00" keyboardType="decimal-pad" />
        <Field label="Dishes" hint="Type one dish and tap the check button to add it.">
          <View style={styles.dishInputRow}>
            <TextInput
              value={dishInput}
              onChangeText={setDishInput}
              placeholder="e.g. Chicken curry"
              placeholderTextColor={palette.muted}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={addDish}
              style={[styles.dishInput, { fontSize: type.caption }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add dish"
              accessibilityState={{ disabled: !dishInput.trim() }}
              disabled={!dishInput.trim()}
              onPress={addDish}
              style={({ pressed }) => [styles.addDishButton, pressed && styles.buttonPressed, !dishInput.trim() && styles.buttonDisabled]}>
              <Icon name="check" color="#FFFFFF" size={20} />
            </Pressable>
          </View>
          <View style={styles.dishList}>
            {dishes.map((dish, index) => (
              <View key={`${dish}-${index}`} style={styles.dishItem}>
                <Text style={[styles.dishName, { fontSize: type.small }]}>{dish}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${dish}`}
                  onPress={() => setDishes((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  hitSlop={8}
                  style={styles.removeDishButton}>
                  <Icon name="close" color={palette.muted} size={16} />
                </Pressable>
              </View>
            ))}
          </View>
        </Field>
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  save: { minHeight: 52 },
  helper: { color: palette.muted, fontSize: 12 },
  dropdown: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dropdownOpen: { borderColor: palette.accent },
  dropdownText: { flex: 1, color: palette.ink, fontWeight: '600' },
  placeholder: { color: palette.muted, fontWeight: '400' },
  dropdownOptions: { borderWidth: 1, borderColor: palette.line, borderRadius: 10, backgroundColor: palette.surface, overflow: 'hidden' },
  dropdownOption: { minHeight: 36, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  dropdownOptionSelected: { backgroundColor: palette.accentSoft },
  dropdownOptionText: { flex: 1, color: palette.ink },
  dropdownOptionTextSelected: { color: palette.accentDark, fontWeight: '700' },
  dishInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dishInput: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: 11, color: palette.ink },
  addDishButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.45 },
  dishList: { gap: 8 },
  dishItem: { minHeight: 36, paddingLeft: 10, paddingRight: 6, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.well, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dishName: { flex: 1, color: palette.ink, fontWeight: '600' },
  removeDishButton: { width: 26, height: 26, borderRadius: 8, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
});
