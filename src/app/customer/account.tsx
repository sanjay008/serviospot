import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Icon } from '@/components/Icon';
import { PageTitle } from '@/components/Header';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { ListRow } from '@/components/ListRow';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { apiActions } from '@/api/actions';
import { useSignOut } from '@/hooks/use-sign-out';
import { useMeSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function AccountScreen() {
  const { session, setMode } = useApp();
  const { logOut, deleteAccount, loggingOut, deleting } = useSignOut();
  useMeSync();
  const [exportNote, setExportNote] = useState('');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <Screen tab>
      <View style={styles.top}>
        <View style={styles.title}>
          <PageTitle title="Me" subtitle="Account, alerts and settings" />
        </View>
        {session.signedIn ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Edit account" onPress={() => router.push('/account-edit')} style={styles.edit}>
            <Icon name="edit" color={palette.ink} size={18} />
          </Pressable>
        ) : null}
      </View>
      <Card>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            {session.photo ? <Image source={{ uri: session.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="person" color={palette.accent} size={28} />}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{session.signedIn ? session.name : 'Guest'}</Text>
            <Text style={styles.meta}>{session.signedIn ? session.email : 'Browsing without an account'}</Text>
            <Text style={styles.meta}>{session.phoneVerified ? 'Phone verified' : 'Phone not verified'}</Text>
          </View>
        </View>
      </Card>
      {exportNote ? <Notice tone="success" body={exportNote} /> : null}
      {!session.signedIn ? <Button label="Log in" onPress={() => router.replace('/role')} /> : null}
      <Card>
        <LanguageDropdown />
        <ListRow icon="bell" title="Notifications" onPress={() => router.push('/notifications')} />
        <ListRow icon="filter" title="Notification settings" onPress={() => router.push('/notification-settings')} />
        <ListRow icon="heart" title="Favorites" onPress={() => router.push('/customer/favorites')} />
        <ListRow icon="doc" title="Terms" onPress={() => router.push('/legal?doc=terms')} />
        <ListRow icon="lock" title="Privacy" onPress={() => router.push('/legal?doc=privacy')} />
        <ListRow icon="flag" title="Report something" onPress={() => router.push('/report?target=account')} />
      </Card>
      <Card>
        <ListRow
          icon="store"
          title="Switch to provider"
          subtitle={session.hasProviderProfile ? 'Open your business tools' : 'Create a provider profile'}
          onPress={() => {
            if (session.hasProviderProfile) {
              setMode('provider');
              router.push('/business');
            } else router.push('/vendor-onboarding');
          }}
        />
      </Card>
      {session.signedIn ? (
        <Card>
          <ListRow icon="mail" title="Export my data" subtitle="Request a copy of the information this app holds" onPress={async () => {
              const result = await apiActions.exportAccount();
              setExportNote(result.ok ? 'Request sent. A copy of your data will be emailed to you.' : result.reason);
            }} />
          <ListRow icon="trash" title="Delete account" subtitle="Permanently removes your account" onPress={() => setDeleteOpen(true)} />
          <Button label="Sign out" variant="secondary" onPress={() => setSignOutOpen(true)} />
        </Card>
      ) : null}
      <ConfirmModal
        visible={deleteOpen}
        title="Delete account?"
        body="This permanently removes your account and its data. You can register again later."
        confirmLabel="Delete account"
        icon="trash"
        danger
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteAccount(() => setDeleteOpen(false))}
      />
      <ConfirmModal
        visible={signOutOpen}
        title="Sign out?"
        body="You will leave this account. You can log in again later."
        confirmLabel="Sign out"
        danger
        loading={loggingOut}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => logOut(() => setSignOutOpen(false))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, minWidth: 0 },
  edit: {
    marginTop: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  profileText: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 20, fontWeight: '700', color: palette.ink },
  meta: { color: palette.muted, fontSize: 14 },
});
