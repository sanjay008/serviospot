import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { ProfileSettings } from '@/flow2/components/ProfileSettings';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

export default function CustomerAccountTab() {
  const { t, customerAccount, setCustomerAccount, setRole } = useApp();
  const name = customerAccount?.name || 'Guest';
  const email = customerAccount?.email || '';
  const phone = customerAccount?.phone || '';
  const isGuest = !customerAccount;

  return (
    <Screen
      header={(
        <Header
          title={t({ en: 'My profile', nl: 'Mijn profiel' })}
          subtitle={t({ en: 'Your account and preferences', nl: 'Je account en voorkeuren' })}
          right={(
            <Pressable accessibilityRole="button" accessibilityLabel={t({ en: 'Edit profile', nl: 'Profiel bewerken' })} onPress={() => router.push('/customer/profile-edit' as any)} style={styles.editIcon}>
              <Icon name="edit" color={palette.accentDark} size={19} />
            </Pressable>
          )}
        />
      )}>
      <View style={styles.hero}>
        <View style={styles.avatarShell}>
          {customerAccount?.photo ? (
            <Image source={{ uri: customerAccount.photo }} style={styles.avatarPhoto} contentFit="cover" />
          ) : (
            <Text style={styles.avatarText}>{isGuest ? 'G' : name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{isGuest ? t({ en: 'GUEST ACCOUNT', nl: 'GASTACCOUNT' }) : t({ en: 'CUSTOMER ACCOUNT', nl: 'KLANTACCOUNT' })}</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>{isGuest ? t({ en: 'Browsing as a guest', nl: 'Je bekijkt de app als gast' }) : email}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>{isGuest ? t({ en: 'Guest', nl: 'Gast' }) : t({ en: 'Customer', nl: 'Klant' })}</Text></View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{t({ en: 'Personal details', nl: 'Persoonlijke gegevens' })}</Text>
        <Text style={styles.sectionHint}>{t({ en: 'Visible only to you', nl: 'Alleen zichtbaar voor jou' })}</Text>
      </View>
      <View style={styles.detailsCard}>
        <DetailRow label={t({ en: 'Full name', nl: 'Volledige naam' })} value={name} />
        <View style={styles.divider} />
        <DetailRow label={t({ en: 'Email address', nl: 'E-mailadres' })} value={email || t({ en: 'Not added', nl: 'Niet ingevuld' })} />
        <View style={styles.divider} />
        <DetailRow label={t({ en: 'Phone number', nl: 'Telefoonnummer' })} value={phone || t({ en: 'Not added', nl: 'Niet ingevuld' })} />
      </View>

      {isGuest ? (
        <Notice tone="info" title={t({ en: 'You are using Guest mode', nl: 'Je gebruikt de gastmodus' })} body={t({ en: 'Add your details from the edit button whenever you are ready. Your requests and chats stay available in this demo session.', nl: 'Voeg je gegevens toe via de bewerkknop wanneer je wilt. Je aanvragen en chats blijven beschikbaar in deze demosessie.' })} />
      ) : null}

      <ProfileSettings
        onLogout={() => { setCustomerAccount(null); setRole('customer'); router.replace('/'); }}
        onDeleteAccount={() => { setCustomerAccount(null); setRole('customer'); router.replace('/'); }}
      />
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  editIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  hero: { minHeight: 126, padding: 16, borderRadius: 20, backgroundColor: palette.accentDark, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatarShell: { width: 68, height: 68, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarPhoto: { width: 68, height: 68 },
  avatarText: { color: palette.accentDark, fontSize: 30, fontWeight: '800' },
  heroCopy: { flex: 1, gap: 4, minWidth: 0 },
  eyebrow: { color: '#DCD5FF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#EAE6FF', fontSize: 12 },
  badge: { position: 'absolute', right: 14, top: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFFFFF24' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 3 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  sectionHint: { color: palette.muted, fontSize: 11 },
  detailsCard: { borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 15 },
  detailRow: { minHeight: 57, justifyContent: 'center', gap: 3 },
  detailLabel: { color: palette.muted, fontSize: 11, fontWeight: '600' },
  detailValue: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: palette.line },
});
