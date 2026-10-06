import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageTitle } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function AccountScreen() {
  const { session, signOut, setMode } = useApp();
  const [exportNote, setExportNote] = useState('');
  return (
    <Screen tab>
      <PageTitle title="Me" subtitle="Account, alerts and settings" />
      <Card>
        <Text style={styles.name}>{session.signedIn ? session.name : 'Guest'}</Text>
        <Text style={styles.meta}>{session.signedIn ? session.email : 'Browsing without an account'}</Text>
        <Text style={styles.meta}>{session.phoneVerified ? 'Phone verified' : 'Phone not verified'}</Text>
      </Card>
      {exportNote ? <Notice tone="success" body={exportNote} /> : null}
      {!session.signedIn ? <Button label="Log in" onPress={() => router.replace('/login')} /> : null}
      <Card>
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
            setMode('provider');
            router.push(session.hasProviderProfile ? '/business' : '/setup');
          }}
        />
      </Card>
      {session.signedIn ? (
        <Card>
          <ListRow icon="mail" title="Export my data" subtitle="Request a copy of the information this app holds" onPress={() => setExportNote('Request noted. In the live product this would email a copy of your data.')} />
          <ListRow
            icon="trash"
            title="Delete account"
            subtitle="Removes this demo session"
            onPress={() => {
              signOut();
              router.replace('/login');
            }}
          />
          <Button
            label="Sign out"
            variant="secondary"
            onPress={() => {
              signOut();
              router.replace('/login');
            }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '700', color: palette.ink },
  meta: { color: palette.muted, fontSize: 14 },
});
