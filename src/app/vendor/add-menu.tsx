// Menu item creation is paused. Vendor packages use dummy data for now.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PhotoPicker } from '@/components/PhotoPicker';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';

export default function AddMenuScreen() {
  const { addMenuItem } = useApp();
  const type = useType();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const amount = Number(price.trim().replace(',', '.'));
    if (!name.trim()) {
      setError('Add a name for this dish or menu package.');
      return;
    }
    if (!description.trim()) {
      setError('Describe what is included in this menu.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a starting price greater than €0.');
      return;
    }
    if (!imageUri) {
      setError('Add a dish photo so customers can see this menu item.');
      return;
    }

    addMenuItem({ name: name.trim(), description: description.trim(), price: amount, imageUri });
    router.back();
  };

  return (
    <Screen
      header={<Header title="Add menu item" subtitle="Add a dish photo, clear details and starting price." back />}
      footer={<Button label="Save menu item" onPress={save} style={styles.saveButton} />}>
      <Card style={styles.photoCard}>
        <SectionTitle title="Dish photo" subtitle="Use a clear photo of the dish customers will receive." />
        <PhotoPicker label="Menu image" value={imageUri} onChange={setImageUri} />
      </Card>

      <Card style={styles.formCard}>
        <SectionTitle title="Menu details" subtitle="Keep the name and description easy to understand." />
        <Input label="Dish or package name" value={name} onChangeText={setName} placeholder="e.g. Surinamese chicken curry" autoCapitalize="words" />
        <Input label="Description and included items" value={description} onChangeText={setDescription} placeholder="Describe portions, sides and what is included" multiline />
        <Input label="Starting price per guest (€)" value={price} onChangeText={setPrice} placeholder="25.00" keyboardType="decimal-pad" />
        <Text style={[styles.priceHint, { fontSize: type.small }]}>Customers will see this as a starting price.</Text>
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: { gap: 14 },
  formCard: { gap: 13 },
  priceHint: { color: palette.muted, marginTop: -5 },
  saveButton: { minHeight: 52 },
});
