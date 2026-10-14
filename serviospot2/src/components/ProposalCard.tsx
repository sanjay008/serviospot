import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { money } from '@/data/format';
import { b } from '@/data/options';
import type { Proposal, ProposalStatus } from '@/data/types';
import { useApp } from '@/state/app';

const STATUS_TONE: Record<ProposalStatus, { nl: string; en: string }> = {
  new: b('Nieuw', 'New'),
  interested: b('Interesse', 'Interested'),
  contact: b('Contact aangevraagd', 'Contact requested'),
  rejected: b('Afgewezen', 'Rejected'),
  sent: b('Verzonden', 'Sent'),
};

export function ProposalCard({ proposal, onPress }: { proposal: Proposal; onPress: () => void }) {
  const { t, lang } = useApp();
  const deviations = proposal.lines.filter((line) => line.differs).length;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{proposal.providerName}</Text>
        <View style={styles.status}>
          <Text style={styles.statusText}>{t(STATUS_TONE[proposal.status])}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Icon name="compare" color={palette.accent} size={15} />
          <Text style={styles.metricText}>
            {t(b('Match', 'Match'))} {proposal.matchScore}%
          </Text>
        </View>
        <Text style={styles.price}>{money(proposal.total, lang)}</Text>
      </View>
      <Text style={styles.desc}>{t(proposal.description)}</Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {money(proposal.perGuest, lang)} {t(b('p.p.', 'p.p.'))}
        </Text>
        {deviations > 0 ? (
          <Text style={styles.deviations}>
            {deviations} {t(b('afwijking(en)', 'deviation(s)'))}
          </Text>
        ) : (
          <Text style={styles.match}>{t(b('Voldoet aan aanvraag', 'Meets the request'))}</Text>
        )}
        <Icon name="chevron" color={palette.muted} size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: palette.ink },
  status: { backgroundColor: palette.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700', color: palette.accentDark },
  metrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { fontSize: 13, color: palette.muted },
  price: { fontSize: 20, fontWeight: '800', color: palette.ink },
  desc: { fontSize: 14, lineHeight: 20, color: palette.ink },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerText: { fontSize: 13, color: palette.muted },
  deviations: { flex: 1, fontSize: 13, fontWeight: '600', color: palette.warning },
  match: { flex: 1, fontSize: 13, fontWeight: '600', color: palette.mintDark },
});
