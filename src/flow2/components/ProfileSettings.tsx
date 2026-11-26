import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import type { Lang } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';
import { useApp as useSession } from '@/state/store';

const LANGUAGES: { code: Lang; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ar', name: 'Arabic' },
];

export function ProfileSettings({ onLogout, onDeleteAccount }: { onLogout: () => void; onDeleteAccount: () => void }) {
  const { lang, setLang, notificationsEnabled, setNotificationsEnabled, t } = useApp();
  const { setNotify } = useSession();
  const type = useType();
  const insets = useSafeAreaInsets();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'logout' | 'delete' | null>(null);
  // Export my data is hidden for now.
  // const [exportNotice, setExportNotice] = useState('');
  // const [exportError, setExportError] = useState('');
  // const [exporting, setExporting] = useState(false);
  const deleting = confirmAction === 'delete';
  const languageName = LANGUAGES.find((item) => item.code === lang)?.name ?? 'English';
  const dismissConfirm = () => setConfirmAction(null);
  const performConfirm = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === 'delete') onDeleteAccount();
    if (action === 'logout') onLogout();
  };

  const onToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    void setNotify({ push: enabled });
  };

  // const onExport = async () => {
  //   setExportNotice('');
  //   setExportError('');
  //   setExporting(true);
  //   const result = await exportAccount();
  //   setExporting(false);
  //   if (!result.ok) {
  //     setExportError(result.reason);
  //     return;
  //   }
  //   setExportNotice(t({ en: 'Export requested. Check your email when it is ready.', nl: 'Export aangevraagd. Check je e-mail wanneer deze klaar is.' }));
  // };

  return (
    <>
      <Card style={styles.settings}>
        <Text style={[styles.heading, { fontSize: type.cardTitle }]}>{t({ en: 'Preferences', nl: 'Voorkeuren' })}</Text>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={[styles.label, { fontSize: type.secondary }]}>{t({ en: 'Language', nl: 'Taal' })}</Text>
            <Text style={[styles.hint, { fontSize: type.small, lineHeight: leading(type.small, 5) }]}>{t({ en: 'Choose your app language', nl: 'Kies de taal van de app' })}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: languageOpen }} onPress={() => setLanguageOpen((open) => !open)} style={styles.languageButton}>
            <Text style={[styles.languageValue, { fontSize: type.caption }]}>{languageName}</Text>
            <Text style={[styles.chevron, { fontSize: type.sectionTitle }]}>{languageOpen ? '⌃' : '⌄'}</Text>
          </Pressable>
        </View>
        {languageOpen ? (
          <View style={styles.options}>
            {LANGUAGES.map((option) => (
              <Pressable
                key={option.code}
                accessibilityRole="button"
                accessibilityState={{ selected: lang === option.code }}
                onPress={() => { setLang(option.code); setLanguageOpen(false); }}
                style={[styles.option, lang === option.code && styles.optionSelected]}>
                <Text style={[styles.optionText, { fontSize: type.secondary }, lang === option.code && styles.optionTextSelected]}>{option.name}</Text>
                {lang === option.code ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={[styles.row, styles.notificationRow]}>
          <View style={styles.copy}>
            <Text style={[styles.label, { fontSize: type.secondary }]}>{t({ en: 'Notifications', nl: 'Meldingen' })}</Text>
            <Text style={[styles.hint, { fontSize: type.small, lineHeight: leading(type.small, 5) }]}>{t({ en: 'Get updates about requests and messages', nl: 'Ontvang updates over aanvragen en berichten' })}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{ false: palette.line, true: palette.accentSoft }}
            thumbColor={notificationsEnabled ? palette.accent : '#FFFFFF'}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/notification-settings' as any)} style={styles.termsRow}>
          <Text style={[styles.label, { fontSize: type.secondary }]}>{t({ en: 'Notification settings', nl: 'Meldingsinstellingen' })}</Text>
          <Text style={[styles.chevron, { fontSize: type.sectionTitle }]}>›</Text>
        </Pressable>
      </Card>

      <Card style={styles.actions}>
        <Text style={[styles.heading, { fontSize: type.cardTitle }]}>{t({ en: 'Account', nl: 'Account' })}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/account-terms' as any)} style={styles.termsRow}>
          <Text style={[styles.label, { fontSize: type.secondary }]}>{t({ en: 'Terms & Conditions', nl: 'Algemene voorwaarden' })}</Text>
          <Text style={[styles.chevron, { fontSize: type.sectionTitle }]}>›</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/privacy-policy' as any)} style={styles.termsRow}>
          <Text style={[styles.label, { fontSize: type.secondary }]}>{t({ en: 'Privacy Policy', nl: 'Privacybeleid' })}</Text>
          <Text style={[styles.chevron, { fontSize: type.sectionTitle }]}>›</Text>
        </Pressable>
        {/* <Button label={t({ en: 'Export my data', nl: 'Mijn gegevens exporteren' })} variant="secondary" loading={exporting} onPress={() => void onExport()} /> */}
        <Button label={t({ en: 'Log out', nl: 'Uitloggen' })} variant="secondary" onPress={() => setConfirmAction('logout')} />
        <Button label={t({ en: 'Delete account', nl: 'Account verwijderen' })} variant="danger" onPress={() => setConfirmAction('delete')} />
      </Card>

      <Modal visible={confirmAction !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={dismissConfirm}>
        <View style={[styles.modalRoot, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t({ en: 'Close confirmation', nl: 'Bevestiging sluiten' })} onPress={dismissConfirm} style={styles.backdrop} />
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={[styles.dialogIcon, deleting && styles.deleteIcon]}>
              <Icon name={deleting ? 'warning' : 'person'} color={deleting ? palette.danger : palette.accentDark} size={24} />
            </View>
            <Text style={[styles.dialogTitle, { fontSize: type.screenTitle }]}>{deleting ? t({ en: 'Delete your account?', nl: 'Je account verwijderen?' }) : t({ en: 'Log out of ServioSpot?', nl: 'Uitloggen bij ServioSpot?' })}</Text>
            <Text style={[styles.dialogBody, { fontSize: type.secondary, lineHeight: leading(type.secondary, 7) }]}>
              {deleting
                ? t({ en: 'Your demo profile details will be removed from this session. This action cannot be undone.', nl: 'Je demoprofiel wordt uit deze sessie verwijderd. Dit kan niet ongedaan worden gemaakt.' })
                : t({ en: 'You will return to the start screen and can choose Customer or Vendor again.', nl: 'Je keert terug naar het startscherm en kunt opnieuw Customer of Vendor kiezen.' })}
            </Text>
            <View style={styles.dialogActions}>
              <Button label={t({ en: 'Cancel', nl: 'Annuleren' })} variant="secondary" onPress={dismissConfirm} style={styles.dialogButton} />
              <Button
                label={deleting ? t({ en: 'Delete account', nl: 'Verwijderen' }) : t({ en: 'Log out', nl: 'Uitloggen' })}
                variant={deleting ? 'danger' : 'primary'}
                onPress={performConfirm}
                style={styles.dialogButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  settings: { gap: 14 },
  actions: { gap: 10 },
  heading: { color: palette.ink, fontWeight: '800', marginBottom: 2 },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  notificationRow: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 10 },
  copy: { flex: 1, gap: 3 },
  label: { color: palette.ink, fontWeight: '700' },
  hint: { color: palette.muted },
  languageButton: { minWidth: 148, minHeight: 42, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.well, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  languageValue: { color: palette.ink, fontWeight: '700' },
  chevron: { color: palette.accentDark, fontWeight: '700' },
  options: { borderWidth: 1, borderColor: palette.line, borderRadius: 12, overflow: 'hidden', backgroundColor: palette.surface },
  option: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { backgroundColor: palette.accentSoft },
  optionText: { color: palette.ink },
  optionTextSelected: { color: palette.accentDark, fontWeight: '800' },
  check: { color: palette.accentDark, fontWeight: '800' },
  termsRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#15122B99' },
  dialog: { width: '100%', maxWidth: 420, alignItems: 'center', borderRadius: 24, padding: 22, backgroundColor: palette.surface, gap: 12 },
  dialogIcon: { width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  deleteIcon: { backgroundColor: palette.dangerSoft },
  dialogTitle: { color: palette.ink, fontWeight: '800', textAlign: 'center' },
  dialogBody: { color: palette.muted, textAlign: 'center' },
  dialogActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 6 },
  dialogButton: { flex: 1, paddingHorizontal: 8 },
});
