import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function ContinueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, requests, proposalsFor, releaseContact } = useApp();
  const proposal = requests.flatMap((request) => proposalsFor(request.id)).find((item) => item.id === id);
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  if (!proposal) {
    return (
      <Screen header={<Header title={t(b('Contact', 'Contact'))} back />}>
        <EmptyState icon="doc" title={t(b('Niet gevonden', 'Not found'))} body={t(b('Dit voorstel bestaat niet.', 'This proposal does not exist.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  const confirm = () => {
    releaseContact(proposal.id);
    setDone(true);
  };

  return (
    <Screen header={<Header title={t(b('Contact delen', 'Share contact'))} subtitle={proposal.providerName} back />}>
      <Notice
        tone="accent"
        title={t(b('Toestemming vereist', 'Consent required'))}
        body={t(b('Je deelt je naam, geverifieerde e-mail en telefoon met deze aanbieder. Dit is geen boeking.', 'You share your name, verified email and phone with this provider. This is not a booking.'))}
      />

      {done ? (
        <Card>
          <View style={styles.doneHead}>
            <View style={styles.doneIcon}>
              <Icon name="verified" color={palette.mintDark} size={22} />
            </View>
            <Text style={styles.doneTitle}>{t(b('Contact gedeeld', 'Contacts shared'))}</Text>
          </View>
          <Text style={styles.doneText}>
            {t(b('Klant', 'Customer'))}: klant@example.com · +31 6 0000 0000{'\n'}
            {t(b('Aanbieder', 'Provider'))}: {proposal.providerId}@example.com · +31 6 0000 0001
          </Text>
          <Notice tone="warning" body={t(b('Een latere statuswijziging kan al gedeelde gegevens niet terughalen.', 'A later status change cannot recall disclosed data.'))} />
          <Button label={t(b('Terug naar voorstellen', 'Back to proposals'))} onPress={() => router.replace(`/flow2/customer/request/${proposal.requestId}`)} />
        </Card>
      ) : (
        <Card>
          <Pressable style={styles.checkRow} onPress={() => setConsent((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>{consent ? <Icon name="check" color="#fff" size={14} /> : null}</View>
            <Text style={styles.checkText}>{t(b('Ik geef toestemming en begrijp dat dit geen boeking of definitieve keuze is.', 'I consent and understand this is not a booking or final decision.'))}</Text>
          </Pressable>
          <Button label={t(b('Contact aanvragen', 'Request contact'))} disabled={!consent} onPress={confirm} />
          <Button label={t(b('Annuleren', 'Cancel'))} variant="secondary" onPress={() => router.back()} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 18, fontWeight: '800', color: palette.ink },
  doneText: { fontSize: 14, lineHeight: 21, color: palette.ink },
});
