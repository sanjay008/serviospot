import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { Stepper } from '@/flow2/components/Stepper';
import { useApp } from '@/flow2/state/app';

export default function AddPackageScreen() {
  const { addPackage } = useApp();
  const [name, setName] = useState('');
  const [people, setPeople] = useState(50);
  const [category, setCategory] = useState('');
  const [dishes, setDishes] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const dishList = dishes.split(',').map((item) => item.trim()).filter(Boolean);
    if (!name.trim()) {
      setError('Enter a package name.');
      return;
    }
    if (!category.trim()) {
      setError('Enter a category.');
      return;
    }
    if (dishList.length === 0) {
      setError('Add at least one dish, separated by commas.');
      return;
    }
    addPackage({ name: name.trim(), people, category: category.trim(), dishes: dishList });
    router.back();
  };

  return (
    <Screen
      header={<Header title="Add package" subtitle="Name, people, category and dishes" back />}
      footer={<Button label="Save package" onPress={save} style={styles.save} />}>
      <Card style={styles.form}>
        <Input label="Package name" value={name} onChangeText={setName} placeholder="e.g. My package one" autoCapitalize="words" />
        <Stepper label="Number of people" value={people} onChange={setPeople} min={1} max={9999} />
        <Input label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Wedding buffet" autoCapitalize="words" />
        <Input label="Dishes" value={dishes} onChangeText={setDishes} placeholder="Rice, Chicken curry, Salad" autoCapitalize="words" />
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  save: { minHeight: 52 },
});
