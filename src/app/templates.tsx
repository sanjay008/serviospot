import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { draftTemplate } from '@/data/ai';
import { parseEuro } from '@/data/format';
import type { ProposalTemplate } from '@/data/types';
import { useTemplatesSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function TemplatesScreen() {
  const { templates, saveTemplate, removeTemplate, entitlements, spendAi, me } = useApp();
  useTemplatesSync();
  const [editing, setEditing] = useState<ProposalTemplate | null>(null);
  const [error, setError] = useState('');
  const blank = (): ProposalTemplate => ({
    id: '',
    name: '',
    message: '',
    items: [],
    services: ['Delivery'],
    included: [],
    excluded: [],
    assumptions: '',
    foodPerPersonCents: 0,
    drinksPerPersonCents: 0,
    staffPerPersonCents: 0,
    deliveryCents: 0,
  });
  return (
    <Screen refresh header={<Header title="Templates" subtitle={`${templates.length} of ${entitlements.templateLimit}`} back />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {!entitlements.templateLimit ? <Notice tone="warning" body="Saved quotes start on Gold. You can still type a price by hand." /> : null}
      {templates.map((template) => (
        <Card key={template.id}>
          <Text style={styles.name}>{template.name}</Text>
          <Text style={styles.meta}>{template.items.join(', ')}</Text>
          <Button label="Edit" variant="secondary" onPress={() => setEditing(template)} />
          <Button
            label="Delete"
            variant="ghost"
            onPress={async () => {
              const result = await removeTemplate(template.id);
              if (!result.ok) setError(result.reason);
            }}
          />
        </Card>
      ))}
      {editing ? (
        <TemplateEditor
          template={editing}
          onCancel={() => setEditing(null)}
          onSave={async (template) => {
            const result = await saveTemplate(template);
            if (!result.ok) {
              setError(result.reason);
              return;
            }
            setError('');
            setEditing(null);
          }}
        />
      ) : (
        <>
          <Button label="New template" onPress={() => setEditing(blank())} disabled={!entitlements.templateLimit} />
          <Button
            label="Draft a template"
            variant="secondary"
            onPress={() => {
              const credit = spendAi();
              if (!credit.ok) {
                setError(credit.reason);
                return;
              }
              const draft = draftTemplate(me.cuisines[0] ?? '');
              setEditing({ ...blank(), ...draft, items: draft.items, services: draft.services, included: draft.included, excluded: draft.excluded });
            }}
          />
        </>
      )}
    </Screen>
  );
}

function TemplateEditor({ template, onSave, onCancel }: { template: ProposalTemplate; onSave: (template: ProposalTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(template.name);
  const [message, setMessage] = useState(template.message);
  const [items, setItems] = useState(template.items.join(', '));
  const [food, setFood] = useState(String(template.foodPerPersonCents / 100));
  const [delivery, setDelivery] = useState(String(template.deliveryCents / 100));
  return (
    <Card>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Message" value={message} onChangeText={setMessage} multiline />
      <Input label="Items" value={items} onChangeText={setItems} />
      <Input label="Food € per person" value={food} onChangeText={setFood} keyboardType="decimal-pad" />
      <Input label="Delivery €" value={delivery} onChangeText={setDelivery} keyboardType="decimal-pad" />
      <Button
        label="Save template"
        onPress={() =>
          onSave({
            ...template,
            name,
            message,
            items: items.split(',').map((item) => item.trim()).filter(Boolean),
            foodPerPersonCents: parseEuro(food),
            deliveryCents: parseEuro(delivery),
          })
        }
      />
      <Button label="Cancel" variant="ghost" onPress={onCancel} />
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  meta: { fontSize: 14, color: palette.muted },
});
