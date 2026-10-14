import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSaveOfferingMutation, useUpdateOfferingMutation, type ApiFailure, type OfferingBody } from '@/api';
import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { parseEuro } from '@/data/format';
import { useCategoriesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function OfferingForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { offerings, categories, categoryName } = useApp();
  useCategoriesSync();
  const existing = offerings.find((item) => item.id === id);
  const [saveOffering, saveState] = useSaveOfferingMutation();
  const [updateOffering, updateState] = useUpdateOfferingMutation();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [cuisine, setCuisine] = useState(existing?.cuisine ?? '');
  const [priceType, setPriceType] = useState(existing?.priceType ?? '');
  const [price, setPrice] = useState(existing?.priceCents != null ? String(existing.priceCents / 100) : '');
  const [dietary, setDietary] = useState((existing?.dietary ?? []).join(', '));
  const [photo, setPhoto] = useState(existing?.photo ?? '');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saveError, setSaveError] = useState('');

  const clear = (field: Field) => setErrors((current) => ({ ...current, [field]: undefined }));

  const save = async () => {
    const next: Partial<Record<Field, string>> = {};
    if (!title.trim()) next.title = 'Add a title.';
    if (!category) next.category = 'Pick a category.';
    if (priceType.trim().toLowerCase() !== 'on_request' && !price.trim()) next.price = 'Add a price.';
    setErrors(next);
    setSaveError('');
    if (Object.keys(next).length > 0) return;
    const body: OfferingBody = {
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      price_cents: priceType.trim().toLowerCase() === 'on_request' ? 0 : parseEuro(price),
      price_type: priceType.trim() || undefined,
      cuisine: cuisine || undefined,
      diet: dietary.split(',').map((item) => item.trim()).filter(Boolean),
      photo: photo.startsWith('http') ? undefined : photo,
    };
    try {
      if (existing) await updateOffering({ ...body, offering_id: existing.id }).unwrap();
      else await saveOffering(body).unwrap();
      router.back();
    } catch (failure) {
      const message = (failure as ApiFailure).message || 'The dish could not be saved. Try again.';
      const field = fieldOf(message);
      if (field) setErrors({ [field]: message });
      else setSaveError(message);
    }
  };

  return (
    <Screen
      header={<Header title={existing ? 'Edit dish' : 'Add dish'} back />}
      footer={
        <View style={styles.footer}>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <Button label="Save dish" loading={saveState.isLoading || updateState.isLoading} onPress={save} />
        </View>
      }>
      <PhotoPicker label="Photo" value={photo} error={errors.photo} onChange={(uri) => { setPhoto(uri); clear('photo'); }} />
      <Input label="Title" value={title} error={errors.title} onChangeText={(value) => { setTitle(value); clear('title'); }} />
      <Input label="Description" value={description} error={errors.description} onChangeText={(value) => { setDescription(value); clear('description'); }} multiline />
      <Text style={styles.label}>Category</Text>
      <ChipSingle options={categories.map((item) => item.code)} labelOf={categoryName} value={category} onChange={(value) => { setCategory(value); clear('category'); }} />
      {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
      <Input label="Cuisine" value={cuisine} error={errors.cuisine} onChangeText={(value) => { setCuisine(value); clear('cuisine'); }} />
      <Input label="Price type" value={priceType} onChangeText={(value) => { setPriceType(value); clear('price'); }} />
      {priceType.trim().toLowerCase() !== 'on_request' ? (
        <Input label="Price €" value={price} error={errors.price} onChangeText={(value) => { setPrice(value); clear('price'); }} keyboardType="decimal-pad" />
      ) : null}
      <Input label="Diet" value={dietary} error={errors.diet} onChangeText={(value) => { setDietary(value); clear('diet'); }} hint="Separate with commas." />
      {errors.diet ? <Text style={styles.error}>{errors.diet}</Text> : null}
    </Screen>
  );
}

type Field = 'photo' | 'title' | 'description' | 'category' | 'cuisine' | 'price' | 'diet';

function fieldOf(message: string): Field | null {
  const lower = message.toLowerCase();
  if (lower.includes('price')) return 'price';
  if (lower.includes('categor')) return 'category';
  if (lower.includes('cuisine')) return 'cuisine';
  if (lower.includes('diet')) return 'diet';
  if (lower.includes('photo') || lower.includes('image')) return 'photo';
  if (lower.includes('description')) return 'description';
  if (lower.includes('title') || lower.includes('name')) return 'title';
  return null;
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  error: { fontSize: 13, lineHeight: 18, color: palette.danger },
  footer: { gap: 8 },
});
