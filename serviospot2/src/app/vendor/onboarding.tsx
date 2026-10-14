import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup, ChipSingle } from '@/components/Chip';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Notice } from '@/components/Notice';
import { ProgressSteps } from '@/components/ProgressSteps';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Stepper } from '@/components/Stepper';
import { palette } from '@/constants/theme';
import { b, CAPABILITIES, CUISINES, CUISINE_STYLES } from '@/data/options';
import { useApp } from '@/state/app';

export default function VendorOnboardingScreen() {
  const { t, onboarding, patchOnboarding, resetOnboarding, submitOnboarding, approveOnboarding, rejectOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const steps = [
    t(b('Account & verificatie', 'Account & verification')),
    t(b('Aanbieder & adres', 'Provider & address')),
    t(b('Werkgebied & werkwijze', 'Service area & fulfilment')),
    t(b('Mogelijkheden', 'Capabilities')),
    t(b('Capaciteit', 'Capacity')),
    t(b('Profiel & media', 'Profile & media')),
    t(b('Gratis periode', 'Free period')),
    t(b('Controleren', 'Review')),
  ];

  const validate = (index: number): string => {
    if (index === 0) {
      if (!onboarding.name.trim() || !onboarding.email.trim() || !onboarding.phone.trim()) return t(b('Vul naam, e-mail en telefoon in.', 'Enter name, email and phone.'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboarding.email)) return t(b('Vul een geldig e-mailadres in.', 'Enter a valid email.'));
      if (!onboarding.emailVerified || !onboarding.phoneVerified) return t(b('Verifieer eerst e-mail én telefoon.', 'Verify both email and phone first.'));
    }
    if (index === 1) {
      if (!onboarding.profileName.trim() || !onboarding.street.trim() || !onboarding.city.trim()) return t(b('Vul profielnaam en volledige NAW in.', 'Enter profile name and full address.'));
      if (onboarding.type === 'business' && !onboarding.company.trim()) return t(b('Bedrijfsnaam is nodig bij type bedrijf.', 'Business name is required for business providers.'));
    }
    if (index === 2 && !onboarding.delivery && !onboarding.pickup && !onboarding.onsite) return t(b('Kies minimaal één werkwijze.', 'Choose at least one fulfilment type.'));
    if (index === 3) {
      if (!onboarding.cuisines.length || !onboarding.capabilities.length) return t(b('Kies minimaal één keuken en één mogelijkheid.', 'Choose at least one cuisine and one capability.'));
      if (onboarding.cuisines.includes('surinamese') && !onboarding.cuisineStyles.length) return t(b('Kies minimaal één Surinaamse stijl.', 'Choose at least one Surinamese style.'));
    }
    if (index === 5 && onboarding.description.trim().length < 20) return t(b('Beschrijf je profiel in minimaal 20 tekens.', 'Describe your profile in at least 20 characters.'));
    if (index === 6 && !onboarding.trialConsent) return t(b('Bevestig de uitleg over de gratis periode.', 'Confirm the free period explanation.'));
    if (index === 7 && !onboarding.terms) return t(b('Bevestig je gegevens en de voorwaarden.', 'Confirm your details and the terms.'));
    return '';
  };

  const next = () => {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const back = () => {
    setError('');
    setStep((current) => Math.max(0, current - 1));
  };

  const submit = () => {
    const message = validate(7);
    if (message) {
      setError(message);
      return;
    }
    submitOnboarding();
  };

  if (onboarding.status === 'pending' || onboarding.status === 'approved' || onboarding.status === 'rejected') {
    return (
      <Screen header={<Header title={t(b('Onboarding', 'Onboarding'))} subtitle={onboarding.profileName || onboarding.name} back right={<Badge label={onboarding.status === 'approved' ? t(b('Goedgekeurd', 'Approved')) : onboarding.status === 'rejected' ? t(b('Afgewezen', 'Rejected')) : t(b('Wacht op beoordeling', 'Pending review'))} tone={onboarding.status === 'approved' ? 'good' : onboarding.status === 'rejected' ? 'bad' : 'warn'} />} />}>
        {onboarding.status === 'pending' ? (
          <>
            <Notice tone="warning" title={t(b('Wacht op admin-goedkeuring', 'Awaiting admin approval'))} body={t(b('Profiel nog niet openbaar. Geen aanvragen. De gratis periode start bij goedkeuring.', 'Profile not public. No leads. The free period starts on approval.'))} />
            <Card>
              <SectionTitle title={t(b('Admin-demo (alleen simulatie)', 'Admin demo (simulation only)'))} subtitle={t(b('De echte adminomgeving vereist aparte rechten.', 'Real admin requires separate permissions.'))} />
              <Input label={t(b('Reden afwijzing / aanvulling', 'Rejection reason / changes'))} value={reason} onChangeText={setReason} multiline />
              <Button label={t(b('Goedkeuren — demo', 'Approve — demo'))} onPress={approveOnboarding} />
              <Button label={t(b('Afwijzen — demo', 'Reject — demo'))} variant="secondary" onPress={() => rejectOnboarding(reason || t(b('Aanvulling nodig.', 'Changes required.')))} />
            </Card>
          </>
        ) : null}
        {onboarding.status === 'approved' ? (
          <Notice tone="success" title={t(b('Goedgekeurd — demo', 'Approved — demo'))} body={t(b('Profiel zichtbaar en 6 maanden gratis pakket gestart. Ontvang nu aanvragen.', 'Profile visible and 6 months free plan started. Receive requests now.'))} />
        ) : null}
        {onboarding.status === 'rejected' ? (
          <Notice tone="error" title={t(b('Aanpassing nodig', 'Changes required'))} body={onboarding.adminReason} />
        ) : null}
        <Button label={t(b('Onboarding opnieuw beginnen', 'Restart onboarding'))} variant="secondary" onPress={resetOnboarding} />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title={t(b('Aanbieder aanmelden', 'Provider onboarding'))} subtitle={t(b('8 stappen · particulier en bedrijf', '8 steps · private and business'))} back />}
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? <Button label={t(b('Vorige', 'Back'))} variant="secondary" onPress={back} style={styles.footerBtn} /> : null}
          {step < steps.length - 1 ? <Button label={t(b('Volgende', 'Next'))} onPress={next} style={styles.footerBtn} /> : <Button label={t(b('Indienen — demo', 'Submit — demo'))} onPress={submit} style={styles.footerBtn} />}
        </View>
      }>
      <ProgressSteps steps={steps} current={step} onPress={(index) => setStep(index)} />
      <Text style={styles.stepTitle}>{steps[step]}</Text>
      {error ? <Notice tone="error" body={error} /> : null}

      {step === 0 ? (
        <>
          <Card>
            <Input label={t(b('Volledige naam', 'Full name'))} value={onboarding.name} onChangeText={(value) => patchOnboarding({ name: value })} autoCapitalize="words" />
            <Input label={t(b('E-mailadres', 'Email'))} value={onboarding.email} onChangeText={(value) => patchOnboarding({ email: value, emailVerified: false })} keyboardType="email-address" autoCapitalize="none" />
            <Input label={t(b('Telefoonnummer', 'Phone'))} value={onboarding.phone} onChangeText={(value) => patchOnboarding({ phone: value, phoneVerified: false })} keyboardType="phone-pad" />
            <Input label={t(b('Wachtwoord (min. 8 tekens)', 'Password (min. 8 characters)'))} value={onboarding.password} onChangeText={(value) => patchOnboarding({ password: value })} secure autoCapitalize="none" />
          </Card>
          <Card>
            <View style={styles.verifyRow}>
              <Text style={styles.verifyText}>{t(b('E-mail verificatie', 'Email verification'))}</Text>
              <Button label={onboarding.emailVerified ? t(b('Geverifieerd', 'Verified')) : t(b('Simuleer', 'Simulate'))} variant={onboarding.emailVerified ? 'secondary' : 'primary'} disabled={onboarding.emailVerified} onPress={() => patchOnboarding({ emailVerified: true })} />
            </View>
            <View style={styles.verifyRow}>
              <Text style={styles.verifyText}>{t(b('Telefoon verificatie', 'Phone verification'))}</Text>
              <Button label={onboarding.phoneVerified ? t(b('Geverifieerd', 'Verified')) : t(b('Simuleer', 'Simulate'))} variant={onboarding.phoneVerified ? 'secondary' : 'primary'} disabled={onboarding.phoneVerified} onPress={() => patchOnboarding({ phoneVerified: true })} />
            </View>
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <Card>
          <Field label={t(b('Type aanbieder', 'Provider type'))}>
            <ChipSingle
              options={['private', 'business']}
              value={onboarding.type}
              onChange={(value) => patchOnboarding({ type: value as 'private' | 'business' })}
              labelOf={(value) => (value === 'private' ? t(b('Particulier / thuiskok', 'Private / home cook')) : t(b('Bedrijf', 'Business')))}
            />
          </Field>
          <Input label={t(b('Openbare profielnaam', 'Public profile name'))} value={onboarding.profileName} onChangeText={(value) => patchOnboarding({ profileName: value })} autoCapitalize="words" />
          {onboarding.type === 'business' ? (
            <>
              <Input label={t(b('Bedrijfsnaam', 'Business name'))} value={onboarding.company} onChangeText={(value) => patchOnboarding({ company: value })} autoCapitalize="words" />
              <Input label={t(b('KvK-nummer — optioneel', 'KvK number — optional'))} value={onboarding.kvk} onChangeText={(value) => patchOnboarding({ kvk: value })} autoCapitalize="none" />
            </>
          ) : null}
          <Input label={t(b('Straat — privé', 'Street — private'))} value={onboarding.street} onChangeText={(value) => patchOnboarding({ street: value })} autoCapitalize="words" />
          <Input label={t(b('Huisnummer — privé', 'House number — private'))} value={onboarding.house} onChangeText={(value) => patchOnboarding({ house: value })} autoCapitalize="none" />
          <Input label={t(b('Postcode — privé', 'Postcode — private'))} value={onboarding.postal} onChangeText={(value) => patchOnboarding({ postal: value })} autoCapitalize="characters" />
          <Input label={t(b('Stad', 'City'))} value={onboarding.city} onChangeText={(value) => patchOnboarding({ city: value })} autoCapitalize="words" />
          <Notice tone="info" body={t(b('Je adres wordt niet openbaar. Alleen stad en werkgebied staan op je profiel.', 'Your address is not public. Only city and service area appear on your profile.'))} />
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card>
            <Input label={t(b('Vestigingspostcode', 'Base postcode'))} value={onboarding.postal} onChangeText={(value) => patchOnboarding({ postal: value })} autoCapitalize="characters" />
            <Stepper label={t(b('Werkgebied: straal in km', 'Service area: radius in km'))} value={onboarding.radius} onChange={(value) => patchOnboarding({ radius: value })} min={1} max={120} />
          </Card>
          <Card>
            <SectionTitle title={t(b('Welke werkwijzen bied je aan?', 'Which fulfilment types do you offer?'))} />
            <Field>
              <ChipGroup
                options={['delivery', 'pickup', 'onsite']}
                selected={[onboarding.delivery && 'delivery', onboarding.pickup && 'pickup', onboarding.onsite && 'onsite'].filter(Boolean) as string[]}
                onToggle={(value) => patchOnboarding(value === 'delivery' ? { delivery: !onboarding.delivery } : value === 'pickup' ? { pickup: !onboarding.pickup } : { onsite: !onboarding.onsite })}
                labelOf={(value) => (value === 'delivery' ? t(b('Bezorgen', 'Delivery')) : value === 'pickup' ? t(b('Ophalen', 'Pickup')) : t(b('Catering op locatie', 'On-site catering')))}
              />
            </Field>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Card>
            <SectionTitle title={t(b('Keukens', 'Cuisines'))} />
            <Field>
              <ChipGroup options={CUISINES.map((item) => item.value)} selected={onboarding.cuisines} onToggle={(value) => patchOnboarding({ cuisines: onboarding.cuisines.includes(value) ? onboarding.cuisines.filter((item) => item !== value) : [...onboarding.cuisines, value] })} labelOf={(value) => t(CUISINES.find((item) => item.value === value)?.label ?? value)} />
            </Field>
            {onboarding.cuisines.includes('surinamese') ? (
              <>
                <SectionTitle title={t(b('Surinaamse stijlen', 'Surinamese styles'))} />
                <Field>
                  <ChipGroup options={CUISINE_STYLES.map((item) => item.value)} selected={onboarding.cuisineStyles} onToggle={(value) => patchOnboarding({ cuisineStyles: onboarding.cuisineStyles.includes(value) ? onboarding.cuisineStyles.filter((item) => item !== value) : [...onboarding.cuisineStyles, value] })} labelOf={(value) => t(CUISINE_STYLES.find((item) => item.value === value)?.label ?? value)} />
                </Field>
              </>
            ) : null}
          </Card>
          <Card>
            <SectionTitle title={t(b('Wat kun je aanbieden?', 'What can you offer?'))} />
            <Field>
              <ChipGroup options={CAPABILITIES.map((item) => item.value)} selected={onboarding.capabilities} onToggle={(value) => patchOnboarding({ capabilities: onboarding.capabilities.includes(value) ? onboarding.capabilities.filter((item) => item !== value) : [...onboarding.capabilities, value] })} labelOf={(value) => t(CAPABILITIES.find((item) => item.value === value)?.label ?? value)} />
            </Field>
          </Card>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Notice tone="info" body={t(b('Elke ingeschakelde werkwijze heeft een eigen minimum en maximum aantal personen.', 'Each enabled fulfilment type has its own minimum and maximum guest count.'))} />
          {onboarding.delivery ? <Card><SectionTitle title={t(b('Bezorgen', 'Delivery'))} /><Stepper label={t(b('Minimaal', 'Minimum'))} value={onboarding.minDelivery} onChange={(value) => patchOnboarding({ minDelivery: value })} min={1} max={500} /><Stepper label={t(b('Maximaal', 'Maximum'))} value={onboarding.maxDelivery} onChange={(value) => patchOnboarding({ maxDelivery: value })} min={1} max={1000} /></Card> : null}
          {onboarding.pickup ? <Card><SectionTitle title={t(b('Ophalen', 'Pickup'))} /><Stepper label={t(b('Minimaal', 'Minimum'))} value={onboarding.minPickup} onChange={(value) => patchOnboarding({ minPickup: value })} min={1} max={500} /><Stepper label={t(b('Maximaal', 'Maximum'))} value={onboarding.maxPickup} onChange={(value) => patchOnboarding({ maxPickup: value })} min={1} max={1000} /></Card> : null}
          {onboarding.onsite ? <Card><SectionTitle title={t(b('Op locatie', 'On-site'))} /><Stepper label={t(b('Minimaal', 'Minimum'))} value={onboarding.minOnsite} onChange={(value) => patchOnboarding({ minOnsite: value })} min={1} max={500} /><Stepper label={t(b('Maximaal', 'Maximum'))} value={onboarding.maxOnsite} onChange={(value) => patchOnboarding({ maxOnsite: value })} min={1} max={1000} /></Card> : null}
          <Card>
            <Stepper label={t(b('Minimale voorbereidingstijd (dagen)', 'Minimum preparation time (days)'))} value={onboarding.leadDays} onChange={(value) => patchOnboarding({ leadDays: value })} min={0} max={30} />
          </Card>
        </>
      ) : null}

      {step === 5 ? (
        <Card>
          <Input label={t(b('Profielbeschrijving', 'Profile description'))} value={onboarding.description} onChangeText={(value) => patchOnboarding({ description: value })} multiline hint={t(b('Minimaal 20 tekens.', 'At least 20 characters.'))} />
          <Input label={t(b('Vanafprijs per persoon (€ incl. btw) — optioneel', 'Starting price per guest (€ incl. VAT) — optional'))} value={onboarding.fromPrice} onChangeText={(value) => patchOnboarding({ fromPrice: value })} keyboardType="numeric" />
          <Notice tone="info" title={t(b('Menu-PDF en foto’s', 'Menu PDF and photos'))} body={t(b('Optioneel. In de productieapp worden bestanden veilig opgeslagen en gemodereerd. Deze demo toont geen upload.', 'Optional. In production files are stored securely and moderated. This demo does not upload.'))} />
        </Card>
      ) : null}

      {step === 6 ? (
        <Card>
          <SectionTitle title={t(b('Volwaardig pakket · 6 maanden gratis', 'Full plan · 6 months free'))} subtitle={t(b('Voor alle nieuwe aanbieders, particulier én bedrijf.', 'For all new providers, private and business.'))} />
          <Text style={styles.paragraph}>{t(b('Start bij admin-goedkeuring. Geen betaalgegevens nodig. Na afloop kies je expliciet een betaald pakket of Gratis. Zonder actief pakket stoppen nieuwe aanvragen.', 'Starts on admin approval. No billing details needed. After expiry you explicitly choose paid or Free. Without an active plan new leads stop.'))}</Text>
          <CheckRow checked={onboarding.trialConsent} onPress={() => patchOnboarding({ trialConsent: !onboarding.trialConsent })} label={t(b('Ik begrijp de gratis periode en de pakketkeuze daarna.', 'I understand the free period and the plan choice after.'))} />
        </Card>
      ) : null}

      {step === 7 ? (
        <>
          <Card>
            <SectionTitle title={t(b('Samenvatting', 'Summary'))} />
            <Row label={t(b('Profielnaam', 'Profile name'))} value={onboarding.profileName || '—'} />
            <Row label={t(b('Type', 'Type'))} value={onboarding.type === 'private' ? t(b('Particulier', 'Private')) : t(b('Bedrijf', 'Business'))} />
            <Row label={t(b('Verificatie', 'Verification'))} value={`${onboarding.emailVerified ? 'e-mail ✓' : 'e-mail ✗'} · ${onboarding.phoneVerified ? 'telefoon ✓' : 'telefoon ✗'}`} />
            <Row label={t(b('Stad', 'City'))} value={onboarding.city || '—'} />
            <Row label={t(b('Werkgebied', 'Service area'))} value={`${onboarding.radius} km`} />
            <Row label={t(b('Keukens', 'Cuisines'))} value={String(onboarding.cuisines.length)} />
            <Row label={t(b('Mogelijkheden', 'Capabilities'))} value={String(onboarding.capabilities.length)} />
            <Row label={t(b('Vanafprijs', 'Starting price'))} value={onboarding.fromPrice ? `€ ${onboarding.fromPrice}` : '—'} />
          </Card>
          <CheckRow checked={onboarding.terms} onPress={() => patchOnboarding({ terms: !onboarding.terms })} label={t(b('Ik bevestig dat mijn gegevens kloppen en accepteer de voorwaarden.', 'I confirm my details are accurate and accept the terms.'))} />
        </>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function CheckRow({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked ? <Text style={styles.checkmark}>✓</Text> : null}</View>
      <Text style={styles.checkText} onPress={onPress}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: palette.ink },
  verifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  verifyText: { flex: 1, fontSize: 15, color: palette.ink },
  paragraph: { fontSize: 14, lineHeight: 21, color: palette.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  rowLabel: { flex: 1, fontSize: 14, color: palette.muted },
  rowValue: { flex: 1, fontSize: 14, fontWeight: '600', color: palette.ink, textAlign: 'right' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkmark: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 18 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink },
});
