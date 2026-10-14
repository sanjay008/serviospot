import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { apiActions } from '@/api/actions';
import { useVendorProfileSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function VerificationScreen() {
  const { me, updateProvider, session } = useApp();
  useVendorProfileSync();
  const [kvk, setKvk] = useState(me.kvkNumber);
  const [vat, setVat] = useState(me.vatNumber);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  return (
    <Screen header={<Header title="Verification" back />}>
      <Badge label={me.kvkState === 'verified' ? 'KvK verified' : me.kvkState === 'pending' ? 'KvK pending' : 'KvK not submitted'} tone={me.kvkState === 'verified' ? 'good' : 'warn'} />
      <Badge label={session.emailVerified ? 'Email verified' : 'Email not verified'} tone={session.emailVerified ? 'good' : 'warn'} />
      <Badge label={session.phoneVerified ? 'Phone verified' : 'Phone not verified'} tone={session.phoneVerified ? 'good' : 'warn'} />
      <Text style={styles.body}>You can keep selling a listing while KvK review is pending. Customers see the status on your profile.</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      {saved ? <Notice tone="success" body="Details saved. Status is pending until a reviewer accepts them." /> : null}
      <Input label="KvK number" value={kvk} onChangeText={setKvk} keyboardType="number-pad" />
      <Input label="VAT number" value={vat} onChangeText={setVat} />
      <Button
        label="Submit for review"
        loading={saving}
        onPress={async () => {
          if (!kvk.trim()) {
            setError('Add the KvK number.');
            return;
          }
          setSaving(true);
          const result = await apiActions.verification(kvk, vat, me.legalName || me.name);
          setSaving(false);
          if (!result.ok) {
            setSaved(false);
            setError(result.reason);
            return;
          }
          updateProvider({ kvkNumber: kvk, vatNumber: vat, kvkState: 'pending' });
          setError('');
          setSaved(true);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
});
