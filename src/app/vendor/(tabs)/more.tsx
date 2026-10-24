import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/flow2/components/Card';
import { Screen } from '@/flow2/components/Screen';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { ListRow } from '@/flow2/components/ListRow';
import { ProfileSettings } from '@/flow2/components/ProfileSettings';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { useApp as useFlow2 } from '@/flow2/state/app';
import { router } from 'expo-router';
import { useApp as useSession } from '@/state/store';

import { useType } from '@/hooks/use-type';

export default function VendorMoreTab() {
  const { onboarding, packages } = useFlow2();
  const { signOut } = useSession();
  const type = useType();
  return (
    <Screen header={<Header title="Vendor profile" subtitle={onboarding.profileName || 'Your public profile'} right={(
      <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push('/vendor/profile-edit' as any)} style={styles.editIcon}>
        <Icon name="edit" color={palette.accentDark} size={19} />
      </Pressable>
    )} />}>
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          {onboarding.profileImageUri ? <Image source={{ uri: onboarding.profileImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={[styles.avatarText, { fontSize: type.hero }]}>{(onboarding.profileName || 'V').charAt(0).toUpperCase()}</Text>}
        </View>
        <Text style={[styles.name, { fontSize: type.screenTitle }]}>{onboarding.profileName || 'Your vendor name'}</Text>
        <Text style={[styles.meta, { fontSize: type.secondary }]}>{[onboarding.city, onboarding.type === 'business' ? onboarding.company : 'Private caterer'].filter(Boolean).join(' · ')}</Text>
      </Card>
      <SectionTitle title="Your business" />
      <Card style={styles.list}>
        <ListRow icon="verified" title="Onboarding" subtitle={onboarding.status === 'approved' ? 'Approved · profile is visible to customers' : onboarding.status} />
        <ListRow icon="box" title="Packages" subtitle={`${packages.length} packages`} />
        <ListRow icon="inbox" title="Service area" subtitle={`${onboarding.city || 'Set your city'} · ${onboarding.radius} km`} />
      </Card>
      <ProfileSettings
        onLogout={() => { signOut(); router.replace('/'); }}
        onDeleteAccount={() => { signOut(); router.replace('/'); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  editIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  profile: { alignItems: 'center', gap: 8 },
  avatar: { width: 70, height: 70, borderRadius: 24, overflow: 'hidden', backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: palette.accentDark },
  name: { fontWeight: '800', color: palette.ink },
  meta: { color: palette.muted },
  list: { paddingVertical: 4 },
});
