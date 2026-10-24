import { StyleSheet, Text } from 'react-native';

import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

export default function AccountTermsScreen() {
  const { t } = useApp();
  const type = useType();
  return (
    <Screen header={<Header title={t({ en: 'Terms & Conditions', nl: 'Algemene voorwaarden' })} back />}>
      <Text style={[styles.title, { fontSize: type.sectionTitle }]}>{t({ en: 'ServioSpot demo terms', nl: 'ServioSpot demo voorwaarden' })}</Text>
      <Text style={[styles.body, { fontSize: type.secondary, lineHeight: leading(type.secondary, 8) }]}>{t({
        en: 'This prototype is for demonstration only. Requests, provider profiles and conversations are stored locally in this session. A request does not confirm a booking. Customers and providers must agree on availability, final price and service details directly before confirming an event.',
        nl: 'Dit prototype is alleen bedoeld voor demonstratie. Aanvragen, providerprofielen en gesprekken worden lokaal in deze sessie opgeslagen. Een aanvraag bevestigt geen boeking. Klanten en providers spreken beschikbaarheid, definitieve prijs en details rechtstreeks af voordat een evenement wordt bevestigd.',
      })}</Text>
      <Text style={[styles.body, { fontSize: type.secondary, lineHeight: leading(type.secondary, 8) }]}>{t({
        en: 'Do not enter sensitive payment or identity information in this demo.',
        nl: 'Voer in deze demo geen gevoelige betaal- of identiteitsgegevens in.',
      })}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.ink, fontWeight: '800' },
  body: { color: palette.muted },
});
