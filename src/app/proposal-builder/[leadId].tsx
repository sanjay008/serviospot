import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ChipSingle } from '@/components/Chip';
import { Disclaimer } from '@/components/Disclaimer';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { draftProposalIntro } from '@/data/ai';
import { euro, parseEuro, proposalTotal, uid } from '@/data/format';
import { ME } from '@/data/mock';
import type { Proposal } from '@/data/types';
import { useApp } from '@/state/store';

export default function ProposalBuilder() {
  const { leadId } = useLocalSearchParams<{ leadId: string }>();
  const { leads, proposals, templates, saveLeadProposal, spendAi } = useApp();
  const lead = leads.find((item) => item.id === leadId);
  const existing = proposals.find((item) => item.id === lead?.proposalId);
  const [proposalId] = useState(existing?.id ?? uid('prop'));
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [message, setMessage] = useState(existing?.message ?? '');
  const [items, setItems] = useState(existing?.items.join(', ') ?? '');
  const [services, setServices] = useState(existing?.services.join(', ') ?? '');
  const [food, setFood] = useState(existing ? String(existing.foodCents / 100) : '');
  const [drinks, setDrinks] = useState(existing ? String(existing.drinksCents / 100) : '');
  const [staff, setStaff] = useState(existing ? String(existing.staffCents / 100) : '');
  const [delivery, setDelivery] = useState(existing ? String(existing.deliveryCents / 100) : '');
  const [equipment, setEquipment] = useState(existing ? String(existing.equipmentCents / 100) : '');
  const [other, setOther] = useState(existing ? String(existing.otherCents / 100) : '');
  const [discount, setDiscount] = useState(existing ? String(existing.discountCents / 100) : '0');
  const [included, setIncluded] = useState(existing?.included.join(', ') ?? '');
  const [excluded, setExcluded] = useState(existing?.excluded.join(', ') ?? '');
  const [assumptions, setAssumptions] = useState(existing?.assumptions ?? '');
  const [expires, setExpires] = useState(existing?.expiresAt ?? '2026-10-28');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  if (!lead) return <Screen header={<Header title="Proposal" back />}><Notice tone="error" body="Lead not found." /></Screen>;
  if (!['available', 'partial', 'maybe', 'proposal_draft', 'proposal_submitted', 'continued'].includes(lead.status)) {
    return (
      <Screen header={<Header title="Proposal" back />}>
        <Notice tone="warning" body="Confirm availability on the lead before writing a proposal." />
        <Button label="Back to lead" onPress={() => router.back()} />
      </Screen>
    );
  }

  const build = (): Proposal => ({
    id: proposalId,
    requestId: lead.request.id,
    providerId: ME,
    leadId: lead.id,
    availability: lead.status === 'partial' ? 'partial' : lead.status === 'maybe' ? 'maybe' : 'available',
    partialNote: lead.availabilityNote,
    message,
    guests: lead.request.guests,
    items: split(items),
    services: split(services),
    foodCents: parseEuro(food),
    drinksCents: parseEuro(drinks),
    staffCents: parseEuro(staff),
    deliveryCents: parseEuro(delivery),
    equipmentCents: parseEuro(equipment),
    otherCents: parseEuro(other),
    discountCents: parseEuro(discount),
    vatNote: 'Indicative VAT treatment. The final invoice is agreed directly.',
    included: split(included),
    excluded: split(excluded),
    assumptions,
    expiresAt: expires,
    status: 'draft',
    matchScore: 75,
  });

  const save = (submit: boolean) => {
    const proposal = build();
    if (submit && !proposal.message.trim()) {
      setError('Add a short introduction.');
      return;
    }
    if (submit && proposalTotal(proposal) <= 0) {
      setError('Add at least one estimated amount.');
      return;
    }
    const result = saveLeadProposal(proposal, submit);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError('');
    setOk(submit ? 'Proposal sent as an indication.' : 'Draft saved.');
    if (submit) setTimeout(() => router.back(), 500);
  };

  const applyTemplate = () => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    const guests = lead.request.guests || 1;
    setMessage(template.message);
    setItems(template.items.join(', '));
    setServices(template.services.join(', '));
    setIncluded(template.included.join(', '));
    setExcluded(template.excluded.join(', '));
    setAssumptions(template.assumptions);
    setFood(String((template.foodPerPersonCents * guests) / 100));
    setDrinks(String((template.drinksPerPersonCents * guests) / 100));
    setStaff(String((template.staffPerPersonCents * guests) / 100));
    setDelivery(String(template.deliveryCents / 100));
  };

  return (
    <Screen header={<Header title="Indicative proposal" back />} footer={<Button label="Send proposal" onPress={() => save(true)} />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {ok ? <Notice tone="success" body={ok} /> : null}
      <Disclaimer />
      {templates.length ? (
        <>
          <Text style={styles.label}>Template</Text>
          <ChipSingle options={templates.map((item) => item.name)} value={templates.find((item) => item.id === templateId)?.name ?? ''} onChange={(name) => setTemplateId(templates.find((item) => item.name === name)?.id ?? '')} />
          <Button label="Insert template" variant="secondary" onPress={applyTemplate} />
        </>
      ) : (
        <Text style={styles.muted}>No templates on this plan yet.</Text>
      )}
      <Button
        label="Draft introduction"
        variant="ghost"
        onPress={() => {
          const credit = spendAi();
          if (!credit.ok) {
            setError(credit.reason);
            return;
          }
          setMessage(draftProposalIntro(lead.request.eventType, lead.request.city, lead.request.guests));
        }}
      />
      <Input label="Introduction" value={message} onChangeText={setMessage} multiline />
      <Input label="Menu or dishes" value={items} onChangeText={setItems} hint="Comma separated" />
      <Input label="Services" value={services} onChangeText={setServices} />
      <Input label="Food €" value={food} onChangeText={setFood} keyboardType="decimal-pad" />
      <Input label="Drinks €" value={drinks} onChangeText={setDrinks} keyboardType="decimal-pad" />
      <Input label="Staff €" value={staff} onChangeText={setStaff} keyboardType="decimal-pad" />
      <Input label="Delivery / travel €" value={delivery} onChangeText={setDelivery} keyboardType="decimal-pad" />
      <Input label="Equipment €" value={equipment} onChangeText={setEquipment} keyboardType="decimal-pad" />
      <Input label="Other €" value={other} onChangeText={setOther} keyboardType="decimal-pad" />
      <Input label="Discount €" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
      <Text style={styles.total}>Indicative total {euro(proposalTotal(build()))}</Text>
      <Input label="Included" value={included} onChangeText={setIncluded} />
      <Input label="Excluded" value={excluded} onChangeText={setExcluded} />
      <Input label="Assumptions" value={assumptions} onChangeText={setAssumptions} multiline />
      <Input label="Expiry date" value={expires} onChangeText={setExpires} placeholder="2026-10-28" />
      <Button label="Save draft" variant="secondary" onPress={() => save(false)} />
    </Screen>
  );
}

function split(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  muted: { color: palette.muted, fontSize: 14 },
  total: { fontSize: 18, fontWeight: '700', color: palette.ink },
});
