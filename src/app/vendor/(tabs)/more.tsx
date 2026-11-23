import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  API_ENABLED,
  useGetAnalyticsQuery,
  useGetCalendarQuery,
  useGetInvoicesQuery,
  useGetVendorProfileQuery,
  useGetPlansQuery,
  useGetPreferencesQuery,
  useGetSubscriptionQuery,
  useGetTemplatesQuery,
  useGetVendorReviewsQuery,
  useDeleteTemplateMutation,
  useSaveCalendarMutation,
  useSavePreferencesMutation,
  useSaveReviewResponseMutation,
  useCreateMolliePaymentMutation,
  useGetMolliePaymentMutation,
  useSaveSubscriptionMutation,
  useSaveTemplateMutation,
  useSaveVendorServicesMutation,
  useSaveVerificationMutation,
  type PlanName,
} from '@/api';
import { recordOf, rowsOf, textOf } from '@/api/mappers';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Screen } from '@/flow2/components/Screen';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Input } from '@/flow2/components/Input';
import { ListRow } from '@/flow2/components/ListRow';
import { Notice } from '@/flow2/components/Notice';
import { ProfileSettings } from '@/flow2/components/ProfileSettings';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { useApp as useFlow2 } from '@/flow2/state/app';
import { router } from 'expo-router';
import { useApp as useSession } from '@/state/store';
import { checkoutUrlOf, mollieReturnUrl, openMollieCheckout, paymentIdOf, paymentStatusOf } from '@/payments/mollie';

import { useType } from '@/hooks/use-type';

export default function VendorMoreTab() {
  const { onboarding } = useFlow2();
  const { signOut, deleteAccount, session, restored } = useSession();
  const type = useType();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';

  // Reload saved vendor profile fields when this tab opens again.
  const vendorProfileQuery = useGetVendorProfileQuery(undefined, { skip: !enabled });
  const prefsQuery = useGetPreferencesQuery(undefined, { skip: !enabled });
  const calendarQuery = useGetCalendarQuery(undefined, { skip: !enabled });
  const templatesQuery = useGetTemplatesQuery(undefined, { skip: !enabled });
  const analyticsQuery = useGetAnalyticsQuery(undefined, { skip: !enabled });
  const reviewsQuery = useGetVendorReviewsQuery(undefined, { skip: !enabled });
  const subscriptionQuery = useGetSubscriptionQuery(undefined, { skip: !enabled });
  const invoicesQuery = useGetInvoicesQuery(undefined, { skip: !enabled });
  const plansQuery = useGetPlansQuery(undefined, { skip: !enabled });

  const [saveVerification, verificationState] = useSaveVerificationMutation();
  const [saveVendorServices, servicesState] = useSaveVendorServicesMutation();
  const [saveSubscription, subscriptionState] = useSaveSubscriptionMutation();
  const [createMolliePayment, mollieCreateState] = useCreateMolliePaymentMutation();
  const [getMolliePayment, mollieStatusState] = useGetMolliePaymentMutation();
  const [savePreferences, preferencesState] = useSavePreferencesMutation();
  const [saveCalendar, calendarState] = useSaveCalendarMutation();
  const [saveTemplate, templateState] = useSaveTemplateMutation();
  const [deleteTemplate, deleteTemplateState] = useDeleteTemplateMutation();
  const [saveReviewResponse, reviewResponseState] = useSaveReviewResponseMutation();

  const [kvk, setKvk] = useState('');
  const [vat, setVat] = useState('');
  const [legalName, setLegalName] = useState(onboarding.company || '');
  const [servicesText, setServicesText] = useState('food, drinks, staff');
  const [radiusKm, setRadiusKm] = useState(String(onboarding.radius || 25));
  const [calendarDate, setCalendarDate] = useState(new Date().toISOString().slice(0, 10));
  const [templateName, setTemplateName] = useState('Standard quote');
  const [templateMessage, setTemplateMessage] = useState('Happy to quote for your event.');
  const [reviewReply, setReviewReply] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [openStep, setOpenStep] = useState('verification');

  useEffect(() => {
    const profile = recordOf(vendorProfileQuery.data, 'profile', 'vendor', 'provider');
    if (profile) {
      const savedLegalName = textOf(profile, 'legal_name', 'registered_name', 'company_legal_name');
      const savedKvk = textOf(profile, 'kvk_number', 'kvk');
      const savedVat = textOf(profile, 'vat_number', 'vat');
      if (savedLegalName !== undefined) setLegalName(savedLegalName);
      if (savedKvk !== undefined) setKvk(savedKvk);
      if (savedVat !== undefined) setVat(savedVat);
    }

    const categories = Array.isArray(profile?.categories) ? profile.categories.map(String).filter(Boolean) : [];
    const prefs = recordOf(prefsQuery.data, 'preferences') ?? prefsQuery.data;
    if (prefs && typeof prefs === 'object') {
      const radius = prefs.radius_km;
      if (typeof radius === 'number') setRadiusKm(String(radius));
      const services = Array.isArray((prefs as { services?: unknown }).services)
        ? ((prefs as { services: unknown[] }).services).map(String).join(', ')
        : '';
      if (services) setServicesText(services);
      else if (categories.length) setServicesText(categories.join(', '));
    } else if (categories.length) {
      setServicesText(categories.join(', '));
    }
  }, [prefsQuery.data, vendorProfileQuery.data]);

  const planCode = textOf(recordOf(subscriptionQuery.data, 'subscription', 'plan') ?? subscriptionQuery.data ?? {}, 'code', 'plan', 'name') || session.planId || 'free';
  const plansPayload = plansQuery.data && !Array.isArray(plansQuery.data) ? plansQuery.data : null;
  const paymentMode = (textOf(plansPayload, 'payment') || textOf(subscriptionQuery.data ?? null, 'payment') || 'preview').toLowerCase();
  const mollieReady = paymentMode === 'mollie' || paymentMode === 'live';
  const analytics = recordOf(analyticsQuery.data) ?? {};
  const profileViews = Number(analytics.profile_views ?? 0);
  const leadsReceived = Number(analytics.leads_received ?? analytics.leads ?? 0);
  const proposalsSubmitted = Number(analytics.proposals_submitted ?? analytics.proposals ?? 0);
  const invoiceCount = rowsOf(invoicesQuery.data).length;
  const reviewRows = rowsOf(reviewsQuery.data);
  const templateRows = rowsOf(templatesQuery.data);
  const calendarDays = rowsOf(calendarQuery.data);
  const planOptions = rowsOf(plansQuery.data)
    .map((row) => String(row.code ?? row.plan ?? row.id ?? ''))
    .filter((code): code is PlanName => code === 'free' || code === 'gold' || code === 'platinum');
  const firstOpenReview = reviewRows.find((row) => !textOf(row, 'vendor_response', 'response'));

  const run = async (action: () => Promise<unknown>, success: string) => {
    setNotice('');
    setError('');
    try {
      await action();
      setNotice(success);
    } catch (cause) {
      setError(cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : 'Could not save. Try again.');
    }
  };

  return (
    <Screen header={<Header title="Your profile" subtitle="Manage what customers see and how your business works" right={(
      <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push('/vendor/profile-edit' as any)} style={styles.editButton}>
        <Icon name="edit" color={palette.accentDark} size={19} />
        <Text style={[styles.editLabel, { fontSize: type.small }]}>Edit</Text>
      </Pressable>
    )} />}>
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          {onboarding.profileImageUri ? <Image source={{ uri: onboarding.profileImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={[styles.avatarText, { fontSize: type.hero }]}>{(onboarding.profileName || 'V').charAt(0).toUpperCase()}</Text>}
        </View>
        <Text style={[styles.name, { fontSize: type.screenTitle }]}>{onboarding.profileName || 'Your vendor name'}</Text>
        <Text style={[styles.meta, { fontSize: type.secondary }]}>{[onboarding.city, onboarding.type === 'business' ? onboarding.company : 'Independent caterer'].filter(Boolean).join(' · ')}</Text>
        <Text style={[styles.profileHint, { fontSize: type.small }]}>This is how customers can recognize your business.</Text>
      </Card>

      <View style={styles.setupIntro}>
        <Text style={[styles.setupEyebrow, { fontSize: type.micro }]}>YOUR BUSINESS SETUP</Text>
        <Text style={[styles.setupTitle, { fontSize: type.cardTitle }]}>Build a profile customers trust</Text>
        <Text style={[styles.setupCopy, { fontSize: type.secondary }]}>Update each section below. Tap a step to see what it does and make changes.</Text>
      </View>
      <SectionTitle title="Business overview" subtitle="A quick snapshot of your vendor account." />
      <Card style={styles.list}>
        <ListRow icon="verified" title="Profile approval" subtitle={onboarding.status === 'approved' ? 'Approved — customers can see your profile' : `Current status: ${onboarding.status || 'incomplete'}`} />
        <ListRow icon="box" title="Your packages" subtitle="View or update the food packages customers can request" onPress={() => router.push('/vendor/(tabs)/packages' as any)} />
        <ListRow icon="inbox" title="Service area" subtitle={`${onboarding.city || 'City not set'} · serving within ${onboarding.radius} km`} />
        <ListRow icon="card" title="Subscription plan" subtitle={`${planCode}${invoiceCount ? ` · ${invoiceCount} invoices` : ''}`} />
        <ListRow icon="chart" title="Performance" subtitle={`${profileViews} profile views · ${leadsReceived} requests · ${proposalsSubmitted} proposals · ${reviewRows.length} reviews`} />
        <ListRow icon="calendar" title="Availability calendar" subtitle={`${calendarDays.length} saved dates — manage dates below`} />
        <ListRow icon="doc" title="Quote message templates" subtitle={`${templateRows.length} saved — reuse messages when replying to requests`} />
      </Card>

      {notice ? <Notice tone="success" body={notice} /> : null}
      {error ? <Notice tone="error" body={error} /> : null}

      <ProfileStep number="01" title="Business verification" subtitle="Confirm your legal business details." expanded={openStep === 'verification'} onPress={() => setOpenStep(openStep === 'verification' ? '' : 'verification')} type={type}>
        <Text style={[styles.stepHint, { fontSize: type.small }]}>These details help us verify your business. Your registered name should match your official documents.</Text>
        <Input label="Registered business name" value={legalName} onChangeText={setLegalName} autoCapitalize="words" hint="The legal name shown on your registration." />
        <Input label="Chamber of Commerce number (KVK)" value={kvk} onChangeText={setKvk} autoCapitalize="characters" />
        <Input label="VAT / tax number (optional)" value={vat} onChangeText={setVat} autoCapitalize="characters" />
        <Button
          label="Save verification"
          loading={verificationState.isLoading}
          onPress={() => void run(
            () => saveVerification({ kvk_number: kvk.trim(), vat_number: vat.trim() || undefined, legal_name: legalName.trim() }).unwrap(),
            'Verification details submitted.',
          )}
        />
      </ProfileStep>

      <ProfileStep number="02" title="Services and coverage" subtitle="Choose what you offer and where you work." expanded={openStep === 'services'} onPress={() => setOpenStep(openStep === 'services' ? '' : 'services')} type={type}>
        <Text style={[styles.stepHint, { fontSize: type.small }]}>Customers use this information to find vendors who can serve their event.</Text>
        <Input label="What do you provide?" value={servicesText} onChangeText={setServicesText} placeholder="Food, drinks, staff" hint="Separate each service with a comma." />
        <Input label="Maximum travel distance (km)" value={radiusKm} onChangeText={setRadiusKm} keyboardType="number-pad" />
        <Button
          label="Save services"
          loading={servicesState.isLoading}
          onPress={() => void run(
            () => saveVendorServices(servicesText.split(',').map((item) => item.trim()).filter(Boolean)).unwrap(),
            'Services saved.',
          )}
        />
        <Button
          label="Save preferences"
          loading={preferencesState.isLoading}
          variant="secondary"
          onPress={() => void run(
            () => savePreferences({
              city: onboarding.city || undefined,
              radius_km: Number(radiusKm) || undefined,
              cuisines: Array.isArray(onboarding.cuisines) && onboarding.cuisines.length ? onboarding.cuisines : undefined,
            }).unwrap(),
            'Preferences saved.',
          )}
        />
      </ProfileStep>

      <ProfileStep number="03" title="Availability" subtitle="Let customers know which dates you can take bookings." expanded={openStep === 'availability'} onPress={() => setOpenStep(openStep === 'availability' ? '' : 'availability')} type={type}>
        <Input label="Date (year-month-day)" value={calendarDate} onChangeText={setCalendarDate} autoCapitalize="none" hint="Example: 2026-12-25" />
        <Button
          label="Mark available"
          loading={calendarState.isLoading}
          onPress={() => void run(() => saveCalendar({ date: calendarDate.trim(), status: 'available' }).unwrap(), 'Calendar day saved.')}
        />
        <Button
          label="Mark unavailable"
          variant="secondary"
          loading={calendarState.isLoading}
          onPress={() => void run(() => saveCalendar({ date: calendarDate.trim(), status: 'unavailable' }).unwrap(), 'Calendar day saved.')}
        />
      </ProfileStep>

      <ProfileStep number="04" title="Quote replies" subtitle="Create a reusable message for customer requests." expanded={openStep === 'templates'} onPress={() => setOpenStep(openStep === 'templates' ? '' : 'templates')} type={type}>
        <Input label="Template name (only you can see this)" value={templateName} onChangeText={setTemplateName} />
        <Input label="Message customers will receive" value={templateMessage} onChangeText={setTemplateMessage} multiline />
        <Button
          label="Save template"
          loading={templateState.isLoading}
          onPress={() => void run(
            () => saveTemplate({ name: templateName.trim(), body: { message: templateMessage.trim() } }).unwrap(),
            'Template saved.',
          )}
        />
        {templateRows.slice(0, 3).map((row) => {
          const id = String(row.id ?? row.template_id ?? '');
          if (!id) return null;
          return (
            <Button
              key={id}
              label={`Delete ${textOf(row, 'name') || id}`}
              variant="danger"
              loading={deleteTemplateState.isLoading}
              onPress={() => void run(() => deleteTemplate(id).unwrap(), 'Template deleted.')}
            />
          );
        })}
      </ProfileStep>

      <ProfileStep number="05" title="Customer reviews" subtitle="Reply publicly to reviews that need a response." expanded={openStep === 'reviews'} onPress={() => setOpenStep(openStep === 'reviews' ? '' : 'reviews')} type={type}>
        {firstOpenReview ? (
          <>
            <Text style={[styles.meta, { fontSize: type.secondary }]}>{textOf(firstOpenReview, 'body', 'comment') || 'Customer review'}</Text>
            <Input label="Your response" value={reviewReply} onChangeText={setReviewReply} multiline />
            <Button
              label="Send review response"
              loading={reviewResponseState.isLoading}
              onPress={() => void run(
                () => saveReviewResponse({ review_id: String(firstOpenReview.id ?? firstOpenReview.review_id ?? ''), response: reviewReply.trim() }).unwrap(),
                'Review response saved.',
              )}
            />
          </>
        ) : (
          <Text style={[styles.meta, { fontSize: type.secondary }]}>{reviewRows.length ? 'All loaded reviews already have a response.' : 'No vendor reviews returned yet.'}</Text>
        )}
      </ProfileStep>

      <ProfileStep number="06" title="Subscription plan" subtitle={mollieReady ? `Current plan: ${planCode}. Paid plans open Mollie.` : `Current plan: ${planCode}. Payment is still a preview on the server.`} expanded={openStep === 'subscription'} onPress={() => setOpenStep(openStep === 'subscription' ? '' : 'subscription')} type={type}>
        <Text style={[styles.meta, { fontSize: type.secondary }]}>
          {mollieReady
            ? `Current plan: ${planCode}. Gold and Platinum open Mollie checkout.`
            : `Current plan: ${planCode}. The server marks payment as preview, so a plan change is saved without opening Mollie.`}
        </Text>
        {(planOptions.length ? planOptions : (['free', 'gold', 'platinum'] as PlanName[])).map((plan) => {
          const planRow = rowsOf(plansQuery.data).find((row) => String(row.code ?? row.plan ?? '') === plan);
          const cents = typeof planRow?.price_cents === 'number' ? planRow.price_cents : null;
          const priceLabel = cents != null && cents > 0 ? ` · €${(cents / 100).toFixed(2)}` : '';
          return (
            <Button
              key={plan}
              label={plan === 'free' ? 'Switch to free' : mollieReady ? `Pay for ${plan}${priceLabel}` : `Switch to ${plan}${priceLabel}`}
              variant={plan === planCode ? 'primary' : 'secondary'}
              loading={subscriptionState.isLoading || mollieCreateState.isLoading || mollieStatusState.isLoading}
              onPress={() => void run(async () => {
                if (!mollieReady || plan === 'free') {
                  await saveSubscription(plan).unwrap();
                  void subscriptionQuery.refetch();
                  return;
                }
                const created = await createMolliePayment({ plan, redirect_url: mollieReturnUrl() }).unwrap();
                const checkoutUrl = checkoutUrlOf(created);
                const paymentId = paymentIdOf(created);
                if (!checkoutUrl || !paymentId) throw new Error('The server did not return a Mollie checkout link.');
                await openMollieCheckout(checkoutUrl);
                const statusReply = await getMolliePayment({ payment_id: paymentId }).unwrap();
                const status = paymentStatusOf(statusReply);
                if (status !== 'paid' && status !== 'authorized') {
                  throw new Error(status === 'canceled' || status === 'cancelled' || status === 'expired' || status === 'failed'
                    ? 'Mollie did not complete this payment.'
                    : 'Payment is still pending. The plan updates when Mollie confirms it.');
                }
                void subscriptionQuery.refetch();
              }, mollieReady && plan !== 'free' ? `${plan} payment confirmed.` : `Plan set to ${plan}.`)}
            />
          );
        })}
      </ProfileStep>

      <ProfileSettings
        onLogout={() => { signOut(); router.replace('/'); }}
        onDeleteAccount={async () => { const result = await deleteAccount(); if (result.ok) router.replace('/'); }}
      />
    </Screen>
  );
}

function ProfileStep({
  number,
  title,
  subtitle,
  expanded,
  onPress,
  type,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  expanded: boolean;
  onPress: () => void;
  type: ReturnType<typeof useType>;
  children: React.ReactNode;
}) {
  return (
    <Card style={[styles.stepCard, expanded && styles.stepCardExpanded]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={styles.stepHeader}>
        <View style={[styles.stepNumber, expanded && styles.stepNumberActive]}>
          <Text style={[styles.stepNumberText, { fontSize: type.small }, expanded && styles.stepNumberTextActive]}>{number}</Text>
        </View>
        <View style={styles.stepCopy}>
          <Text style={[styles.stepTitle, { fontSize: type.cardTitle }]}>{title}</Text>
          <Text style={[styles.stepSubtitle, { fontSize: type.small, lineHeight: type.small + 5 }]}>{subtitle}</Text>
        </View>
        <View style={[styles.stepChevron, expanded && styles.stepChevronActive]}>
          <Text style={[styles.stepChevronText, { fontSize: type.sectionTitle }]}>{expanded ? '−' : '+'}</Text>
        </View>
      </Pressable>
      {expanded ? <View style={styles.stepBody}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  editButton: { minHeight: 40, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  editLabel: { color: palette.accentDark, fontWeight: '700' },
  profile: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  avatar: { width: 70, height: 70, borderRadius: 24, overflow: 'hidden', backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: palette.accentDark },
  name: { fontWeight: '800', color: palette.ink },
  meta: { color: palette.muted },
  profileHint: { color: palette.muted, textAlign: 'center' },
  list: { paddingVertical: 4 },
  setupIntro: { gap: 5, paddingHorizontal: 2, paddingTop: 4 },
  setupEyebrow: { color: palette.accentDark, fontWeight: '800', letterSpacing: 1.1 },
  setupTitle: { color: palette.ink, fontWeight: '800' },
  setupCopy: { color: palette.muted, lineHeight: 22 },
  stepCard: { padding: 0, overflow: 'hidden', gap: 0 },
  stepCardExpanded: { borderColor: palette.accent, borderWidth: 1.5 },
  stepHeader: { minHeight: 84, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.well, borderWidth: 1, borderColor: palette.line },
  stepNumberActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent },
  stepNumberText: { color: palette.muted, fontWeight: '800' },
  stepNumberTextActive: { color: palette.accentDark },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { color: palette.ink, fontWeight: '800' },
  stepSubtitle: { color: palette.muted },
  stepChevron: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.well },
  stepChevronActive: { backgroundColor: palette.accentSoft },
  stepChevronText: { color: palette.accentDark, fontWeight: '700' },
  stepBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderTopWidth: 1, borderTopColor: palette.line, gap: 12 },
  stepHint: { color: palette.muted, lineHeight: 20 },
});
