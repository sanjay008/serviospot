import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Chip } from '@/flow2/components/Chip';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { LangToggle } from '@/flow2/components/LangToggle';
import { Notice } from '@/flow2/components/Notice';
import { ProviderCard } from '@/flow2/components/ProviderCard';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b, CUISINES } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function CustomerSearchScreen() {
  const { t, providers } = useApp();
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('all');

  const filtered = useMemo(() => {
    const query = city.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesCity = !query || provider.city.toLowerCase().includes(query);
      const matchesCuisine = cuisine === 'all' || provider.cuisine.en.toLowerCase().includes(cuisine) || provider.cuisine.nl.toLowerCase().includes(cuisine);
      return matchesCity && matchesCuisine;
    });
  }, [providers, city, cuisine]);

  return (
    <Screen header={<Header title={t(b('Aanbieders zoeken', 'Search providers'))} subtitle={t(b('Bekijk profielen; aanvragen vereist een account.', 'Browse profiles; requesting requires an account.'))} back right={<LangToggle />} />}>
      <View style={styles.actions}>
        <Button label={t(b('Mijn aanvragen', 'My requests'))} variant="secondary" onPress={() => router.push('/flow2/customer/requests')} style={styles.action} />
        <Button label={t(b('Nieuwe aanvraag', 'New request'))} onPress={() => router.push('/flow2/customer/request')} style={styles.action} />
      </View>

      <Input label={t(b('Locatie / stad', 'Location / city'))} value={city} onChangeText={setCity} placeholder="Rotterdam" autoCapitalize="words" />

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>{t(b('Keuken', 'Cuisine'))}</Text>
        <View style={styles.chips}>
          <Chip label={t(b('Alles', 'All'))} selected={cuisine === 'all'} onPress={() => setCuisine('all')} />
          {CUISINES.map((item) => (
            <Chip key={item.value} label={t(item.label)} selected={cuisine === item.value} onPress={() => setCuisine(item.value)} />
          ))}
        </View>
      </View>

      <Text style={styles.count}>
        {filtered.length} {t(b('aanbieders', 'providers'))}
      </Text>

      {filtered.length === 0 ? (
        <EmptyState
          title={t(b('Geen aanbieders gevonden', 'No providers found'))}
          body={t(b('Pas je locatie of keukenfilter aan en probeer opnieuw.', 'Adjust your location or cuisine filter and try again.'))}
          action={t(b('Filters wissen', 'Clear filters'))}
          onAction={() => {
            setCity('');
            setCuisine('all');
          }}
        />
      ) : (
        filtered.map((provider) => <ProviderCard key={provider.id} provider={provider} onPress={() => router.push(`/flow2/customer/provider/${provider.id}`)} />)
      )}

      <Notice tone="info" body={t(b('Beschikbaarheid is onbevestigd totdat een aanbieder reageert op je aanvraag.', 'Availability is unconfirmed until a provider responds to your request.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  filterBlock: { gap: 8 },
  filterLabel: { fontSize: 15, fontWeight: '700', color: palette.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  count: { fontSize: 13, fontWeight: '600', color: palette.muted },
});
