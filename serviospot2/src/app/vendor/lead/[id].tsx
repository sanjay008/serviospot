import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipSingle } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { LangToggle } from '@/components/LangToggle';
import { Notice } from '@/components/Notice';
import { RequestSummary } from '@/components/RequestSummary';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { b } from '@/data/options';
import { useApp } from '@/state/app';

export default function VendorLeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, leads, setLeadStatus } = useApp();
  const lead = leads.find((item) => item.id === id);

  if (!lead) {
    return (
      <Screen header={<Header title={t(b('Aanvraag', 'Request'))} back right={<LangToggle />} />}>
        <EmptyState icon="inbox" title={t(b('Niet gevonden', 'Not found'))} body={t(b('Deze aanvraag bestaat niet.', 'This request does not exist.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<Header title={lead.reference} subtitle={t(b('Aanvraag beoordelen', 'Review request'))} back right={<LangToggle />} />}>
      <Notice tone="info" body={t(b('De aanbieder neemt de aanvraag als uitgangspunt en bevestigt elk onderdeel. Een losse prijs is onvoldoende.', 'The provider starts from the request and confirms every item. A bare price is insufficient.'))} />

      <Card>
        <SectionTitle title={t(b('Je beschikbaarheid', 'Your availability'))} subtitle={t(b('Volledig, gedeeltelijk, onder voorbehoud of niet beschikbaar.', 'Full, partial, conditional or unavailable.'))} />
        <Field>
          <ChipSingle
            options={['full', 'partial', 'conditional', 'none']}
            value={lead.proposal?.availability ?? 'full'}
            onChange={(value) => setLeadStatus(lead.id, value === 'none' ? 'declined' : 'availability')}
            labelOf={(value) => (value === 'full' ? t(b('Volledig', 'Full')) : value === 'partial' ? t(b('Gedeeltelijk', 'Partial')) : value === 'conditional' ? t(b('Onder voorbehoud', 'Conditional')) : t(b('Niet beschikbaar', 'Unavailable')))}
          />
        </Field>
        <Notice tone="warning" body={t(b('Bij een harde eis die niet kan worden gehaald (datum, capaciteit, cateringtijden, verplichte dieet) stopt de flow.', 'A hard requirement that cannot be met (date, capacity, catering hours, required diet) stops the flow.'))} />
      </Card>

      <View style={styles.actions}>
        <Button label={t(b('Maak een voorstel', 'Compose proposal'))} onPress={() => router.push(`/vendor/proposal/${lead.id}`)} />
        <Button label={t(b('Afwijzen en sluiten', 'Decline and close'))} variant="secondary" onPress={() => { setLeadStatus(lead.id, 'declined'); router.back(); }} />
      </View>

      <SectionTitle title={t(b('Aanvraag van de klant', 'Customer request'))} subtitle={t(b('Zelfde structuur als de klant invulde.', 'Same structure the customer filled in.'))} />
      <RequestSummary request={lead.request} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
});
