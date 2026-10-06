import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup, ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ALLERGEN_NOTE } from '@/constants/copy';
import { palette } from '@/constants/theme';
import { draftDescription, improveText, suggestCatalog } from '@/data/ai';
import { parseEuro, toggleIn, uid } from '@/data/format';
import { ALLERGENS, CATEGORIES, CUISINES, DIETARY, ME, PRICE_TYPES } from '@/data/mock';
import type { Fulfillment, Offering, PriceType } from '@/data/types';
import { useApp } from '@/state/store';

export default function OfferingForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { offerings, catalog, saveOffering, spendAi } = useApp();
  const existing = offerings.find((item) => item.id === id);
  const [query, setQuery] = useState(existing?.title ?? '');
  const [masterId, setMasterId] = useState<string | null>(existing?.masterItemId ?? null);
  const [pending, setPending] = useState(existing?.pendingCatalogName ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Food');
  const [cuisine, setCuisine] = useState(existing?.cuisine ?? '');
  const [priceType, setPriceType] = useState<PriceType>(existing?.priceType ?? 'per_person');
  const [price, setPrice] = useState(existing?.priceCents != null ? String(existing.priceCents / 100) : '');
  const [minQty, setMinQty] = useState(String(existing?.minQuantity ?? 10));
  const [leadTime, setLeadTime] = useState(String(existing?.leadTimeDays ?? 7));
  const [fulfillment, setFulfillment] = useState<Fulfillment[]>(existing?.fulfillment ?? ['delivery']);
  const [dietary, setDietary] = useState<string[]>(existing?.dietary ?? []);
  const [allergens, setAllergens] = useState<string[]>(existing?.allergens ?? []);
  const [confirmed, setConfirmed] = useState(existing?.allergensConfirmed ?? false);
  const [error, setError] = useState('');
  const matches = suggestCatalog(query, catalog);
  const selected = catalog.find((item) => item.id === masterId);

  const save = () => {
    if (!title.trim()) {
      setError('Add a display title.');
      return;
    }
    const offering: Offering = {
      id: existing?.id ?? uid('off'),
      providerId: ME,
      masterItemId: masterId,
      pendingCatalogName: masterId ? null : pending || title,
      title: title.trim(),
      description,
      offerType: selected?.type ?? 'dish',
      cuisine,
      category,
      priceType,
      priceCents: priceType === 'on_request' ? null : parseEuro(price),
      minQuantity: Number(minQty) || 1,
      maxCapacity: null,
      leadTimeDays: Number(leadTime) || 1,
      fulfillment,
      dietary,
      allergens,
      allergensConfirmed: confirmed || allergens.length === 0,
      included: existing?.included ?? [],
      active: existing?.active ?? true,
    };
    const result = saveOffering(offering);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    router.back();
  };

  return (
    <Screen header={<Header title={existing ? 'Edit offering' : 'Add offering'} back />} footer={<Button label="Save offering" onPress={save} />}>
      {error ? <Notice tone="error" body={error} /> : null}
      <Input label="Search the catalog" value={query} onChangeText={setQuery} placeholder="Nasi, ice cream cart, waiting staff" hint="Pick an existing item when it is the same product." />
      {matches.map((item) => (
        <Pressable key={item.id} onPress={() => { setMasterId(item.id); setPending(''); setTitle(title || item.name); setCuisine(item.cuisine); setCategory(item.category); }} style={[styles.match, masterId === item.id && styles.on]}>
          <Text style={styles.matchTitle}>{item.name}</Text>
          <Text style={styles.meta}>{item.type} · {item.category}{item.cuisine ? ` · ${item.cuisine}` : ''}</Text>
        </Pressable>
      ))}
      {query.trim().length > 2 && matches.length === 0 ? (
        <Notice tone="info" title="No close catalog match" body="You can suggest a new item. It stays on your listing while a duplicate check would normally happen." />
      ) : null}
      {matches.length > 0 && query.trim().length > 2 ? <Notice tone="warning" title="Possible duplicate" body="These catalog items look similar. Link one of them unless yours is genuinely different." /> : null}
      <Button label="Suggest new catalog item" variant="secondary" onPress={() => { setMasterId(null); setPending(query || title); }} />
      {pending && !masterId ? <Text style={styles.meta}>Pending suggestion: {pending}</Text> : null}
      <Input label="Display title" value={title} onChangeText={setTitle} />
      <Input label="Description" value={description} onChangeText={setDescription} multiline />
      <Button
        label={description.trim() ? 'Improve description' : 'Draft description'}
        variant="ghost"
        onPress={() => {
          const credit = spendAi();
          if (!credit.ok) {
            setError(credit.reason);
            return;
          }
          setDescription(description.trim() ? improveText(description) : draftDescription(title || 'This offering', cuisine, selected?.type ?? 'offering'));
        }}
      />
      <Text style={styles.label}>Category</Text>
      <ChipSingle options={CATEGORIES} value={category} onChange={setCategory} />
      <Text style={styles.label}>Cuisine</Text>
      <ChipSingle options={['None', ...CUISINES]} value={cuisine || 'None'} onChange={(value) => setCuisine(value === 'None' ? '' : value)} />
      <Text style={styles.label}>Price type</Text>
      <ChipSingle options={[...PRICE_TYPES]} value={priceType} onChange={(value) => setPriceType(value as PriceType)} />
      {priceType !== 'on_request' ? <Input label="Starting price €" value={price} onChangeText={setPrice} keyboardType="decimal-pad" /> : null}
      <Input label="Minimum quantity" value={minQty} onChangeText={setMinQty} keyboardType="number-pad" />
      <Input label="Lead time (days)" value={leadTime} onChangeText={setLeadTime} keyboardType="number-pad" />
      <Text style={styles.label}>Fulfilment</Text>
      <ChipGroup options={['Delivery', 'Pickup', 'On-site']} selected={fulfillment.map(labelFor)} onToggle={(item) => setFulfillment(toggleIn(fulfillment, idFor(item)) as Fulfillment[])} />
      <Text style={styles.label}>Dietary support you confirm</Text>
      <ChipGroup options={DIETARY} selected={dietary} onToggle={(item) => setDietary(toggleIn(dietary, item))} />
      <Text style={styles.label}>Allergens you declare</Text>
      <ChipGroup options={ALLERGENS} selected={allergens} onToggle={(item) => { setAllergens(toggleIn(allergens, item)); setConfirmed(false); }} />
      <Text style={styles.meta}>{ALLERGEN_NOTE}</Text>
      {allergens.length ? <ChipSingle options={['Not confirmed', 'I confirm these allergens']} value={confirmed ? 'I confirm these allergens' : 'Not confirmed'} onChange={(value) => setConfirmed(value.startsWith('I confirm'))} /> : null}
    </Screen>
  );
}

function labelFor(value: Fulfillment) {
  if (value === 'on_site') return 'On-site';
  return value[0].toUpperCase() + value.slice(1);
}

function idFor(label: string): Fulfillment {
  if (label === 'On-site') return 'on_site';
  return label.toLowerCase() as Fulfillment;
}

const styles = StyleSheet.create({
  match: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 12, gap: 4 },
  on: { borderColor: palette.accent },
  matchTitle: { fontSize: 16, fontWeight: '700', color: palette.ink },
  meta: { fontSize: 13, lineHeight: 18, color: palette.muted },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
});
