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
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

export default function ContinueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, proposalsFor, releaseContact } = useApp();
  const proposal = requests.flatMap((request) => proposalsFor(request.id)).find((item) => item.id === id);
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const type = useType();

  if (!proposal) {
    return (
      <Screen header={<Header title='Contact' back />}>
        <EmptyState icon="doc" title='Not found' body='This proposal does not exist.' action='Back' onAction={() => router.back()} />
      </Screen>
    );
  }

  const confirm = () => {
    releaseContact(proposal.id);
    setDone(true);
  };

  return (
    <Screen header={<Header title='Share contact' subtitle={proposal.providerName} back />}>
      <Notice
        tone="accent"
        title='Consent required'
        body='You share your name, verified email and phone with this provider. This is not a booking.'
      />

      {done ? (
        <Card>
          <View style={styles.doneHead}>
            <View style={styles.doneIcon}>
              <Icon name="verified" color={palette.mintDark} size={22} />
            </View>
            <Text style={[styles.doneTitle, { fontSize: type.sectionTitle }]}>Contacts shared</Text>
          </View>
          <Text style={[styles.doneText, { fontSize: type.secondary, lineHeight: leading(type.secondary, 7) }]}>
            Customer: klant@example.com · +31 6 0000 0000{'\n'}
            Provider: {proposal.providerId}@example.com · +31 6 0000 0001
          </Text>
          <Notice tone="warning" body='A later status change cannot recall disclosed data.' />
          <Button label={'Back to proposals'} onPress={() => router.replace(`/customer/request/${proposal.requestId}`)} />
        </Card>
      ) : (
        <Card>
          <Pressable style={styles.checkRow} onPress={() => setConsent((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>{consent ? <Icon name="check" color="#fff" size={14} /> : null}</View>
            <Text style={[styles.checkText, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>I consent and understand this is not a booking or final decision.</Text>
          </Pressable>
          <Button label={'Request contact'} disabled={!consent} onPress={confirm} />
          <Button label={'Cancel'} variant="secondary" onPress={() => router.back()} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkText: { flex: 1, color: palette.ink },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontWeight: '800', color: palette.ink },
  doneText: { color: palette.ink },
});
