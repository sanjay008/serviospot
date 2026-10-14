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
import { euro, parseEuro, proposalTotal } from '@/data/format';
import { ME } from '@/data/mock';
import type { Proposal, YesNo } from '@/data/types';
import { useLeadSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const COSTS = 'All costs for the offered scope are included, including VAT, travel and setup. No unknown fees.';

export default function ProposalBuilder() {
  const { leadId } = useLocalSearchParams<{ leadId: string }>();
  const { leads, proposals, saveLeadProposal } = useApp();
  useLeadSync(leadId);
  const lead = leads.find((item) => item.id === leadId);
  const existing = proposals.find((item) => item.id === lead?.proposalId);
  const [dateOk, setDateOk] = useState<YesNo>('');
  const [placeOk, setPlaceOk] = useState<YesNo>('');
  const [guestsOk, setGuestsOk] = useState<YesNo>('');
  const [timesOk, setTimesOk] = useState<YesNo>('');
  const [dietOk, setDietOk] = useState<YesNo>('');
  const [dishes, setDishes] = useState('');
  const [staffCount, setStaffCount] = useState('');
  const [staffRoles, setStaffRoles] = useState('');
  const [staffHours, setStaffHours] = useState('');
  const [setupHours, setSetupHours] = useState('');
  const [teardownHours, setTeardownHours] = useState('');
  const [equipmentNote, setEquipmentNote] = useState('');
  const [drinksPackage, setDrinksPackage] = useState('');
  const [deviations, setDeviations] = useState(existing?.assumptions ?? '');
  const [food, setFood] = useState(existing ? String(existing.foodCents / 100) : '');
  const [drinks, setDrinks] = useState(existing ? String(existing.drinksCents / 100) : '');
  const [staff, setStaff] = useState(existing ? String(existing.staffCents / 100) : '');
  const [delivery, setDelivery] = useState(existing ? String(existing.deliveryCents / 100) : '');
  const [equipment, setEquipment] = useState(existing ? String(existing.equipmentCents / 100) : '');
  const [other, setOther] = useState(existing ? String(existing.otherCents / 100) : '');
  const [discount, setDiscount] = useState(existing ? String(existing.discountCents / 100) : '0');
  const [deposit, setDeposit] = useState('');
  const [expires, setExpires] = useState(existing?.expiresAt ?? '');
  const [costsIncluded, setCostsIncluded] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  if (!lead) return <Screen header={<Header title="Proposal" back />}><Notice tone="error" body="Lead not found." /></Screen>;
  if (lead.status === 'proposal_submitted' || lead.status === 'continued') {
    return (
      <Screen header={<Header title="Proposal" back />}>
        <Notice tone="info" body="This price is already sent. Withdraw it before you change it." />
        <Button label="Back to request" onPress={() => router.back()} />
      </Screen>
    );
  }
  if (!['available', 'partial', 'maybe', 'proposal_draft'].includes(lead.status)) {
    return (
      <Screen header={<Header title="Proposal" back />}>
        <Notice tone="warning" body="Confirm availability on the lead before writing a proposal." />
        <Button label="Back to lead" onPress={() => router.back()} />
      </Screen>
    );
  }

  const stopped = [dateOk, placeOk, guestsOk, timesOk, dietOk].includes('no');
  const confirmed = dateOk === 'yes' && placeOk === 'yes' && guestsOk === 'yes' && timesOk === 'yes' && dietOk === 'yes';
  const build = (): Proposal => ({
    id: existing?.id ?? '',
    requestId: lead.request.id,
    providerId: ME,
    leadId: lead.id,
    availability: lead.status === 'partial' ? 'partial' : lead.status === 'maybe' ? 'maybe' : 'available',
    partialNote: lead.availabilityNote,
    message: deviations.trim() || 'Indicative all-in price for the requested scope.',
    guests: lead.request.guests,
    items: dishes.split('\n').map((item) => item.trim()).filter(Boolean),
    services: [staffRoles, equipmentNote, drinksPackage].map((item) => item.trim()).filter(Boolean),
    foodCents: parseEuro(food),
    drinksCents: parseEuro(drinks),
    staffCents: parseEuro(staff),
    deliveryCents: parseEuro(delivery),
    equipmentCents: parseEuro(equipment),
    otherCents: parseEuro(other),
    discountCents: parseEuro(discount),
    vatNote: 'One indicative total including VAT for this scope and these guests.',
    included: costsIncluded ? [COSTS] : [],
    excluded: [],
    assumptions: deviations,
    expiresAt: expires,
    details: {
      date_ok: dateOk,
      place_ok: placeOk,
      guests_ok: guestsOk,
      times_ok: timesOk,
      diet_ok: dietOk,
      dishes,
      staff_count: Number(staffCount) || 0,
      staff_roles: staffRoles,
      staff_hours: staffHours,
      setup_hours: setupHours,
      teardown_hours: teardownHours,
      equipment: equipmentNote,
      drinks_package: drinksPackage,
      deposit_cents: parseEuro(deposit),
      costs_included: costsIncluded,
    },
    status: 'draft',
    matchScore: 75,
  });

  const save = async (submit: boolean) => {
    if (submit && !confirmed) {
      setError('Answer date, place, guests, times and diet with yes or no. No on any of these stops the price.');
      return;
    }
    if (submit && stopped) {
      setError('No on the date, place, guests, times or diet stops this proposal. Decline the request instead of sending a price.');
      return;
    }
    if (submit && !expires.trim()) {
      setError('Add the date this price is valid until.');
      return;
    }
    if (submit && !costsIncluded) {
      setError('Confirm that the all-in price includes VAT, travel and setup for the offered scope.');
      return;
    }
    const proposal = build();
    if (submit && proposalTotal(proposal) <= 0) {
      setError('Add the all-in price. The lines must add up to that total.');
      return;
    }
    const result = await saveLeadProposal(proposal, submit);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError('');
    setOk(submit ? 'Price sent.' : 'Price saved.');
    if (submit) setTimeout(() => router.back(), 500);
  };

  return (
    <Screen header={<Header title="Indicative proposal" back />} footer={stopped ? undefined : <Button label="Send proposal" onPress={() => save(true)} />}>
      {error ? <Notice tone="error" body={error} /> : null}
      {ok ? <Notice tone="success" body={ok} /> : null}
      <Disclaimer />
      <Text style={styles.label}>Customer request · read only</Text>
      <Text style={styles.muted}>{lead.request.guests} guests · {lead.request.date} · {lead.request.city} {lead.request.postcode}</Text>
      <Text style={styles.muted}>{lead.request.eventType || 'Occasion not set'} · {lead.request.setting || 'Indoor / outdoor not set'}</Text>
      <Text style={styles.muted}>Food: {lead.request.cuisines.join(', ') || 'Not set'} · Halal {lead.request.halal ? 'yes' : 'no'}</Text>
      {(lead.request.summary ?? []).map((line) => <Text key={line} style={styles.muted}>{line}</Text>)}
      {lead.request.allergies ? <Text style={styles.muted}>Allergies: {lead.request.allergies}</Text> : null}
      {lead.request.notes ? <Text style={styles.muted}>{lead.request.notes}</Text> : null}
      <Answer label="Can you do the date?" value={dateOk} onChange={setDateOk} />
      <Answer label="Can you cover the place?" value={placeOk} onChange={setPlaceOk} />
      <Answer label="Can you cover the guest count?" value={guestsOk} onChange={setGuestsOk} />
      <Answer label="Can you cover the times?" value={timesOk} onChange={setTimesOk} />
      <Answer label="Can you meet the diet requirements?" value={dietOk} onChange={setDietOk} />
      {stopped ? <Notice tone="warning" body="No on the date, place, guests, times or diet stops this proposal. Decline the request instead of sending a price." /> : null}
      {confirmed ? (
        <>
          <Input label="Dishes you offer" value={dishes} onChangeText={setDishes} multiline hint="One dish per line. Counts and names are yours to write." />
          <Input label="Staff count" value={staffCount} onChangeText={setStaffCount} keyboardType="number-pad" />
          <Input label="Staff roles" value={staffRoles} onChangeText={setStaffRoles} />
          <Input label="Staff hours" value={staffHours} onChangeText={setStaffHours} />
          <Input label="Setup hours" value={setupHours} onChangeText={setSetupHours} hint="Separate from the catering start and end." />
          <Input label="Teardown hours" value={teardownHours} onChangeText={setTeardownHours} />
          <Input label="Equipment" value={equipmentNote} onChangeText={setEquipmentNote} hint="Counts and what you bring." />
          <Input label="Drinks package" value={drinksPackage} onChangeText={setDrinksPackage} />
          <Input label="Deviations from the request" value={deviations} onChangeText={setDeviations} multiline />
          <Input label="Food € incl. VAT" value={food} onChangeText={setFood} keyboardType="decimal-pad" />
          <Input label="Included drinks €" value={drinks} onChangeText={setDrinks} keyboardType="decimal-pad" />
          <Input label="Staff €" value={staff} onChangeText={setStaff} keyboardType="decimal-pad" />
          <Input label="Travel €" value={delivery} onChangeText={setDelivery} keyboardType="decimal-pad" />
          <Input label="Equipment €" value={equipment} onChangeText={setEquipment} keyboardType="decimal-pad" />
          <Input label="Setup and teardown €" value={other} onChangeText={setOther} keyboardType="decimal-pad" />
          <Input label="Discount €" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
          <Text style={styles.total}>All-in price {euro(proposalTotal(build()))}</Text>
          <Text style={styles.muted}>One indicative total for this scope and these guests. The lines above are the whole price and must add up.</Text>
          <Input label="Deposit €" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" hint="Separate from the all-in price." />
          <ChipSingle options={[COSTS]} value={costsIncluded ? COSTS : ''} onChange={() => setCostsIncluded(true)} />
          <Input label="Valid until" value={expires} onChangeText={setExpires} placeholder="2026-11-01" />
          <Button label="Save draft" variant="secondary" onPress={() => save(false)} />
        </>
      ) : null}
    </Screen>
  );
}

function Answer({ label, value, onChange }: { label: string; value: YesNo; onChange: (value: YesNo) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <ChipSingle options={['Yes', 'No']} value={value === 'yes' ? 'Yes' : value === 'no' ? 'No' : ''} onChange={(item) => onChange(item === 'Yes' ? 'yes' : 'no')} />
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  muted: { color: palette.muted, fontSize: 14 },
  total: { fontSize: 18, fontWeight: '700', color: palette.ink },
});
