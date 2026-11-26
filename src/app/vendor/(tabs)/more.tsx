import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  useGetVendorOfferingsQuery,
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
import type { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Screen } from '@/flow2/components/Screen';
import { Header } from '@/flow2/components/Header';
import { Icon, type IconName } from '@/flow2/components/Icon';
import { Input } from '@/flow2/components/Input';
import { ListRow } from '@/flow2/components/ListRow';
import { Notice } from '@/flow2/components/Notice';
import { ProfileSettings } from '@/flow2/components/ProfileSettings';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette, shadowSoft } from '@/flow2/constants/theme';
import { useApp as useFlow2 } from '@/flow2/state/app';
import { router } from 'expo-router';
import { useApp as useSession } from '@/state/store';
import { checkoutUrlOf, clearMollieSuccess, currentMollieSuccess, mollieReturnUrl, openMollieCheckout, paymentIdOf, paymentPlanOf, paymentStatusOf, publishMollieSuccess, rememberMollieCheckout, subscribeMollieSuccess } from '@/payments/mollie';

import { useType } from '@/hooks/use-type';

export default function VendorMoreTab() {
  const { onboarding, t } = useFlow2();
  const tx = (en: string) => t({ en, nl: en });
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
  const offeringsQuery = useGetVendorOfferingsQuery(undefined, { skip: !enabled });

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
  const [paidPlan, setPaidPlan] = useState<string | null>(() => currentMollieSuccess());
  const [templateName, setTemplateName] = useState('Standard quote');
  const [templateMessage, setTemplateMessage] = useState('Happy to quote for your event.');
  const [reviewReply, setReviewReply] = useState('');
  const [stepFeedback, setStepFeedback] = useState<{ id: string; tone: 'success' | 'error'; message: string } | null>(null);
  const [openStep, setOpenStep] = useState('verification');
  const scrollRef = useRef<ScrollView>(null);
  const stepOffsets = useRef<Record<string, number>>({});
  const scrollTarget = useRef<string | null>(null);

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

  const planCode = subscriptionPlan(subscriptionQuery.data) || subscriptionPlan(session.planId) || 'free';
  const plansPayload = plansQuery.data && !Array.isArray(plansQuery.data) ? plansQuery.data : null;
  const paymentMode = (textOf(plansPayload, 'payment') || textOf(subscriptionQuery.data ?? null, 'payment') || 'preview').toLowerCase();
  const mollieReady = paymentMode === 'mollie' || paymentMode === 'live';
  const analytics = recordOf(analyticsQuery.data) ?? {};
  const profileViews = Number(analytics.profile_views ?? 0);
  const leadsReceived = Number(analytics.leads_received ?? analytics.leads ?? 0);
  const proposalsSubmitted = Number(analytics.proposals_submitted ?? analytics.proposals ?? 0);
  const invoices = invoiceRows(invoicesQuery.data);
  const invoiceCount = invoices.length;
  const reviewRows = rowsOf(reviewsQuery.data);
  const templateRows = rowsOf(templatesQuery.data);
  const calendarDays = rowsOf(calendarQuery.data);
  const planOptions = rowsOf(plansQuery.data)
    .map((row) => String(row.code ?? row.plan ?? row.id ?? ''))
    .filter((code): code is PlanName => code === 'free' || code === 'gold' || code === 'platinum');
  const firstOpenReview = reviewRows.find((row) => !textOf(row, 'vendor_response', 'response'));
  const profileRecord = recordOf(vendorProfileQuery.data, 'profile', 'vendor', 'provider');
  const savedLegalName = textOf(profileRecord, 'legal_name', 'registered_name', 'company_legal_name') || onboarding.company;
  const savedKvk = textOf(profileRecord, 'kvk_number', 'kvk') || onboarding.kvk;
  const profileCategories = Array.isArray(profileRecord?.categories) ? profileRecord.categories.map(String).filter(Boolean) : [];
  const prefsRecord = recordOf(prefsQuery.data, 'preferences');
  const savedServices = Array.isArray(prefsRecord?.services) ? prefsRecord.services.map(String).filter(Boolean) : [];
  const savedRadius = typeof prefsRecord?.radius_km === 'number' ? prefsRecord.radius_km : undefined;
  const packageCount = rowsOf(offeringsQuery.data).length;
  const verificationDone = onboarding.status === 'approved' || Boolean(savedLegalName.trim() && savedKvk.trim());
  const servicesDone = (savedServices.length > 0 || profileCategories.length > 0 || onboarding.cuisines.length > 0 || onboarding.capabilities.length > 0) && (savedRadius !== undefined || Boolean(onboarding.city.trim()));
  const availabilityDone = calendarDays.length > 0;
  const templatesDone = templateRows.length > 0;
  const reviewsDone = !firstOpenReview;
  const subscriptionDone = planCode === 'free' || planCode === 'gold' || planCode === 'platinum';
  const setupSteps: SetupStep[] = [
    { id: 'verification', title: tx('Business verification'), detail: tx('Legal name and registration.'), icon: 'verified', done: verificationDone },
    { id: 'services', title: tx('Services & coverage'), detail: tx('What you offer and how far you travel.'), icon: 'pin', done: servicesDone },
    { id: 'availability', title: tx('Availability'), detail: tx('Dates you can take bookings.'), icon: 'calendar', done: availabilityDone },
    { id: 'templates', title: tx('Quote reply templates'), detail: tx('Reusable replies for requests.'), icon: 'doc', done: templatesDone },
    { id: 'reviews', title: tx('Customer reviews'), detail: firstOpenReview ? tx('A review is waiting for your reply.') : tx('Reply when a customer leaves a review.'), icon: 'star', done: reviewsDone },
    { id: 'subscription', title: tx('Subscription plan'), detail: mollieReady ? tx('Gold and Platinum open Mollie checkout.') : tx('Choose a subscription plan.'), icon: 'card', done: subscriptionDone },
  ];
  const completedSteps = setupSteps.filter((step) => step.done).length;
  const completion = Math.round((completedSteps / setupSteps.length) * 100);
  const nextStep = setupSteps.find((step) => !step.done);
  const businessType = onboarding.type === 'business' ? (onboarding.company || tx('Business')) : tx('Independent caterer');
  const verificationLabel = onboarding.status === 'approved' ? tx('Approved') : onboarding.status ? onboarding.status : tx('Incomplete');

  useEffect(() => subscribeMollieSuccess(() => setPaidPlan(currentMollieSuccess())), []);

  const scrollToStep = (id: string) => {
    if (scrollTarget.current !== id) return;
    const y = stepOffsets.current[id];
    if (y == null) return;
    scrollTarget.current = null;
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  const openAndScroll = (id: string) => {
    scrollTarget.current = id;
    setOpenStep(id);
    setTimeout(() => scrollToStep(id), 80);
  };

  const rememberStep = (id: string, y: number) => {
    stepOffsets.current[id] = y;
    scrollToStep(id);
  };

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    setStepFeedback(null);
    try {
      await action();
      if (success) setStepFeedback({ id, tone: 'success', message: success });
    } catch (cause) {
      const message = cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' && cause.message.trim()
        ? cause.message
        : 'Could not save. Try again.';
      setStepFeedback({ id, tone: 'error', message });
      setOpenStep(id);
    }
  };

  const stepNotice = (id: string) => stepFeedback?.id === id ? <Notice tone={stepFeedback.tone} body={stepFeedback.message} /> : null;

  return (
    <Screen canvas={palette.bg} scrollRef={scrollRef} header={<Header title={tx('Business Profile')} subtitle={tx('This is how customers see your business.')} right={(
      <Pressable accessibilityRole="button" accessibilityLabel={tx('Edit profile')} onPress={() => router.push('/vendor/profile-edit' as any)} style={styles.editButton}>
        <Icon name="edit" color={palette.accentDark} size={18} />
        <Text style={[styles.editLabel, { fontSize: type.small }]}>{tx('Edit')}</Text>
      </Pressable>
    )} />}>
      <Card style={styles.identity}>
        <View style={styles.avatar}>
          {onboarding.profileImageUri ? (
            <Image source={{ uri: onboarding.profileImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Business logo" />
          ) : (
            <Icon name="food" color={palette.accent} size={26} />
          )}
        </View>
        <View style={styles.identityCopy}>
          <Text style={[styles.name, { fontSize: type.cardTitle }]} numberOfLines={2}>{onboarding.profileName || tx('Your business name')}</Text>
          <Text style={[styles.meta, { fontSize: type.small }]} numberOfLines={1}>{businessType}</Text>
          <View style={styles.locationRow}>
            <Icon name="pin" color={palette.accent} size={14} />
            <Text style={[styles.meta, { fontSize: type.small }]} numberOfLines={1}>{onboarding.city || tx('Location not set')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.completion}>
        <View style={styles.completionTop}>
          <View style={styles.identityCopy}>
            <Text style={[styles.completionTitle, { fontSize: type.cardTitle }]}>{tx('Profile completion')}</Text>
            <Text style={[styles.meta, { fontSize: type.small, lineHeight: type.small + 5 }]}>
              {completion === 100 ? tx('Your profile is ready for customers.') : tx('Complete your profile to build customer trust.')}
            </Text>
          </View>
          <Text style={[styles.percent, { fontSize: type.screenTitle }]}>{completion}%</Text>
        </View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: completion }}>
          <View style={[styles.trackFill, { width: `${completion}%` }]} />
        </View>
        <Text style={[styles.meta, { fontSize: type.small }]}>{completedSteps} {tx('of')} {setupSteps.length} {tx('steps complete')}</Text>
        {nextStep ? <Button label={tx('Complete profile')} onPress={() => openAndScroll(nextStep.id)} /> : null}
      </Card>

      <SectionTitle title={tx('Business overview')} subtitle={tx('The facts customers and you rely on.')} />
      <View style={styles.overview}>
        <OverviewTile icon="verified" label={tx('Verification')} value={verificationLabel} />
        <OverviewTile icon="box" label={tx('Packages')} value={String(packageCount)} onPress={() => router.push('/vendor/(tabs)/packages' as any)} />
        <OverviewTile icon="pin" label={tx('Service area')} value={onboarding.city ? `${onboarding.city}${savedRadius ? ` · ${savedRadius} km` : ''}` : tx('Not set')} />
        <OverviewTile icon="calendar" label={tx('Availability')} value={calendarDays.length ? `${calendarDays.length} ${tx('dates')}` : tx('Not set')} />
        <OverviewTile icon="card" label={tx('Plan')} value={`${planCode}${invoiceCount ? ` · ${invoiceCount} ${tx('invoices')}` : ''}`} arrow onPress={() => router.push('/vendor/invoices' as any)} />
        <OverviewTile icon="chart" label={tx('Performance')} value={`${profileViews} ${tx('views')} · ${leadsReceived} ${tx('requests')} · ${proposalsSubmitted} ${tx('proposals')}`} />
      </View>

      <SectionTitle title={tx('Business setup')} subtitle={tx('Finish each step once. Open a step to update it.')} />
      <ProfileStep number="1" title={setupSteps[0].title} subtitle={setupSteps[0].detail} icon={setupSteps[0].icon} done={setupSteps[0].done} expanded={openStep === 'verification'} onLayout={(y) => rememberStep('verification', y)} onPress={() => setOpenStep(openStep === 'verification' ? '' : 'verification')} type={type}>
        {stepNotice('verification')}
        <Text style={[styles.stepHint, { fontSize: type.small }]}>{tx('These details help us verify your business. Your registered name should match your official documents.')}</Text>
        <Input label={tx('Registered business name')} value={legalName} onChangeText={setLegalName} autoCapitalize="words" hint={tx('The legal name shown on your registration.')} />
        <Input label={tx('Chamber of Commerce number (KVK)')} value={kvk} onChangeText={setKvk} autoCapitalize="characters" />
        <Input label={tx('VAT / tax number (optional)')} value={vat} onChangeText={setVat} autoCapitalize="characters" />
        <Button
          label={tx('Save verification')}
          loading={verificationState.isLoading}
          onPress={() => void run('verification',
            () => saveVerification({ kvk_number: kvk.trim(), vat_number: vat.trim() || undefined, legal_name: legalName.trim() }).unwrap(),
            tx('Verification details submitted.'),
          )}
        />
      </ProfileStep>

      <ProfileStep number="2" title={setupSteps[1].title} subtitle={setupSteps[1].detail} icon={setupSteps[1].icon} done={setupSteps[1].done} expanded={openStep === 'services'} onLayout={(y) => rememberStep('services', y)} onPress={() => setOpenStep(openStep === 'services' ? '' : 'services')} type={type}>
        {stepNotice('services')}
        <Text style={[styles.stepHint, { fontSize: type.small }]}>{tx('Customers use this information to find vendors who can serve their event.')}</Text>
        <Input label={tx('What do you provide?')} value={servicesText} onChangeText={setServicesText} placeholder={tx('Food, drinks, staff')} hint={tx('Separate each service with a comma.')} />
        <Input label={tx('Maximum travel distance (km)')} value={radiusKm} onChangeText={setRadiusKm} keyboardType="number-pad" />
        <Button
          label={tx('Save services')}
          loading={servicesState.isLoading}
          onPress={() => void run('services',
            () => saveVendorServices(servicesText.split(',').map((item) => item.trim()).filter(Boolean)).unwrap(),
            tx('Services saved.'),
          )}
        />
        <Button
          label={tx('Save preferences')}
          loading={preferencesState.isLoading}
          variant="secondary"
          onPress={() => void run('services',
            () => savePreferences({
              city: onboarding.city || undefined,
              radius_km: Number(radiusKm) || undefined,
              cuisines: Array.isArray(onboarding.cuisines) && onboarding.cuisines.length ? onboarding.cuisines : undefined,
            }).unwrap(),
            tx('Preferences saved.'),
          )}
        />
      </ProfileStep>

      <ProfileStep number="3" title={setupSteps[2].title} subtitle={setupSteps[2].detail} icon={setupSteps[2].icon} done={setupSteps[2].done} expanded={openStep === 'availability'} onLayout={(y) => rememberStep('availability', y)} onPress={() => setOpenStep(openStep === 'availability' ? '' : 'availability')} type={type}>
        {stepNotice('availability')}
        <Input label={tx('Date (year-month-day)')} value={calendarDate} onChangeText={setCalendarDate} autoCapitalize="none" hint={tx('Example: 2026-12-25')} />
        <Button
          label={tx('Mark available')}
          loading={calendarState.isLoading}
          onPress={() => void run('availability', () => saveCalendar({ date: calendarDate.trim(), status: 'available' }).unwrap(), tx('Calendar day saved.'))}
        />
        <Button
          label={tx('Mark unavailable')}
          variant="secondary"
          loading={calendarState.isLoading}
          onPress={() => void run('availability', () => saveCalendar({ date: calendarDate.trim(), status: 'unavailable' }).unwrap(), tx('Calendar day saved.'))}
        />
      </ProfileStep>

      <ProfileStep number="4" title={setupSteps[3].title} subtitle={setupSteps[3].detail} icon={setupSteps[3].icon} done={setupSteps[3].done} expanded={openStep === 'templates'} onLayout={(y) => rememberStep('templates', y)} onPress={() => setOpenStep(openStep === 'templates' ? '' : 'templates')} type={type}>
        {stepNotice('templates')}
        <Input label={tx('Template name (only you can see this)')} value={templateName} onChangeText={setTemplateName} />
        <Input label={tx('Message customers will receive')} value={templateMessage} onChangeText={setTemplateMessage} multiline />
        <Button
          label={tx('Save template')}
          loading={templateState.isLoading}
          onPress={() => void run('templates',
            () => saveTemplate({ name: templateName.trim(), body: { message: templateMessage.trim() } }).unwrap(),
            tx('Template saved.'),
          )}
        />
        {templateRows.slice(0, 3).map((row) => {
          const id = String(row.id ?? row.template_id ?? '');
          if (!id) return null;
          return (
            <Button
              key={id}
              label={`${tx('Delete')} ${textOf(row, 'name') || id}`}
              variant="danger"
              loading={deleteTemplateState.isLoading}
              onPress={() => void run('templates', () => deleteTemplate(id).unwrap(), tx('Template deleted.'))}
            />
          );
        })}
      </ProfileStep>

      <ProfileStep number="5" title={setupSteps[4].title} subtitle={setupSteps[4].detail} icon={setupSteps[4].icon} done={setupSteps[4].done} expanded={openStep === 'reviews'} onLayout={(y) => rememberStep('reviews', y)} onPress={() => setOpenStep(openStep === 'reviews' ? '' : 'reviews')} type={type}>
        {stepNotice('reviews')}
        {firstOpenReview ? (
          <>
            <Text style={[styles.meta, { fontSize: type.secondary }]}>{textOf(firstOpenReview, 'body', 'comment') || tx('Customer review')}</Text>
            <Input label={tx('Your response')} value={reviewReply} onChangeText={setReviewReply} multiline />
            <Button
              label={tx('Send review response')}
              loading={reviewResponseState.isLoading}
              onPress={() => void run('reviews',
                () => saveReviewResponse({ review_id: String(firstOpenReview.id ?? firstOpenReview.review_id ?? ''), response: reviewReply.trim() }).unwrap(),
                tx('Review response saved.'),
              )}
            />
          </>
        ) : (
          <Text style={[styles.meta, { fontSize: type.secondary }]}>{reviewRows.length ? tx('All loaded reviews already have a response.') : tx('No vendor reviews returned yet.')}</Text>
        )}
      </ProfileStep>

      <ProfileStep number="6" title={setupSteps[5].title} subtitle={setupSteps[5].detail} icon={setupSteps[5].icon} done={setupSteps[5].done} expanded={openStep === 'subscription'} onLayout={(y) => rememberStep('subscription', y)} onPress={() => setOpenStep(openStep === 'subscription' ? '' : 'subscription')} type={type}>
        {stepNotice('subscription')}
        {(planOptions.length ? planOptions : (['free', 'gold', 'platinum'] as PlanName[])).map((plan) => {
          const planRow = rowsOf(plansQuery.data).find((row) => String(row.code ?? row.plan ?? '') === plan);
          const cents = priceCents(planRow?.price_cents);
          const priceLabel = cents != null && cents > 0 ? ` · €${(cents / 100).toFixed(2)}` : '';
          return (
            <Button
              key={plan}
              label={plan === 'free' ? tx('Switch to free') : mollieReady ? `Pay for ${plan}${priceLabel}` : `Switch to ${plan}${priceLabel}`}
              variant={plan === planCode ? 'primary' : 'secondary'}
              loading={subscriptionState.isLoading || mollieCreateState.isLoading || mollieStatusState.isLoading}
              onPress={() => void run('subscription', async () => {
                if (!mollieReady || plan === 'free') {
                  await saveSubscription(plan).unwrap();
                  void subscriptionQuery.refetch();
                  return;
                }
                const created = await createMolliePayment({ plan, redirect_url: mollieReturnUrl() }).unwrap();
                const checkoutUrl = checkoutUrlOf(created);
                const paymentId = paymentIdOf(created);
                if (!checkoutUrl || !paymentId) throw new Error('The server did not return a Mollie checkout link.');
                rememberMollieCheckout(paymentId, plan);
                await openMollieCheckout(checkoutUrl);
                const statusReply = await getMolliePayment({ payment_id: paymentId }).unwrap();
                const status = paymentStatusOf(statusReply);
                if (status !== 'paid' && status !== 'authorized') {
                  throw new Error(status === 'canceled' || status === 'cancelled' || status === 'expired' || status === 'failed'
                    ? 'Mollie did not complete this payment.'
                    : 'Payment is still pending. The plan updates when Mollie confirms it.');
                }
                publishMollieSuccess(paymentPlanOf(statusReply) || plan);
                void subscriptionQuery.refetch();
                void invoicesQuery.refetch();
              }, mollieReady && plan !== 'free' ? '' : `Plan set to ${plan}.`)}
            />
          );
        })}
      </ProfileStep>

      <SectionTitle title={tx('Account settings')} subtitle={tx('Language, notifications, and your login.')} />
      <ProfileSettings
        onLogout={() => { signOut(); router.replace('/'); }}
        onDeleteAccount={async () => { const result = await deleteAccount(); if (result.ok) router.replace('/'); }}
      />
      <Modal visible={!!paidPlan} transparent animationType="fade" onRequestClose={() => clearMollieSuccess()}>
        <View style={styles.popupBackdrop}>
          <View style={styles.popupCard}>
            <View style={styles.checkWrap}>
              <Icon name="check" color={palette.mintDark} size={34} />
            </View>
            <Text style={[styles.popupTitle, { fontSize: type.screenTitle }]}>{tx('Payment successful')}</Text>
            <Text style={[styles.popupPlan, { fontSize: type.sectionTitle }]}>{paidPlan}</Text>
            <Text style={[styles.popupBody, { fontSize: type.secondary, lineHeight: type.secondary + 6 }]}>
              {paidPlan ? `Your ${paidPlan} plan is now active.` : tx('Your plan is now active.')}
            </Text>
            <Button label={tx('Close')} onPress={() => clearMollieSuccess()} style={styles.popupButton} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function subscriptionPlan(data: unknown) {
  if (typeof data === 'string') return knownPlan(data);
  const record = data && typeof data === 'object' && !Array.isArray(data) ? data as ApiRecord : null;
  const direct = knownPlan(textOf(record, 'code', 'plan'));
  if (direct) return direct;
  return knownPlan(textOf(recordOf(data, 'subscription'), 'code', 'plan'));
}

function knownPlan(value?: string) {
  const code = value?.trim().toLowerCase();
  return code === 'free' || code === 'gold' || code === 'platinum' ? code : '';
}

function priceCents(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function invoiceRows(data: unknown) {
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { invoices?: unknown }).invoices)) {
    return rowsOf((data as { invoices: unknown }).invoices);
  }
  return rowsOf(data);
}

type SetupStep = { id: string; title: string; detail: string; icon: IconName; done: boolean };

function OverviewTile({ icon, label, value, onPress, arrow }: { icon: IconName; label: string; value: string; onPress?: () => void; arrow?: boolean }) {
  const type = useType();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={styles.tile}>
      {arrow ? <View style={styles.tileArrow}><Icon name="chevron" color={palette.accentDark} size={16} /></View> : null}
      <Icon name={icon} color={palette.accent} size={16} />
      <Text style={[styles.tileLabel, { fontSize: type.micro }]}>{label}</Text>
      <Text style={[styles.tileValue, { fontSize: type.small, lineHeight: type.small + 4 }]} numberOfLines={2}>{value}</Text>
    </Pressable>
  );
}

function ProfileStep({
  number,
  title,
  subtitle,
  icon,
  done,
  expanded,
  onPress,
  onLayout,
  type,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon: IconName;
  done: boolean;
  expanded: boolean;
  onPress: () => void;
  onLayout?: (y: number) => void;
  type: ReturnType<typeof useType>;
  children: React.ReactNode;
}) {
  return (
    <View onLayout={(event) => onLayout?.(event.nativeEvent.layout.y)}>
    <Card style={[styles.stepCard, expanded && styles.stepCardExpanded]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={styles.stepHeader}>
        <View style={[styles.stepIcon, done && styles.stepIconDone]}>
          <Icon name={icon} color={done ? palette.accentDark : palette.accent} size={16} />
          <Text style={[styles.stepIndex, { fontSize: type.micro }]}>{number}</Text>
        </View>
        <View style={styles.stepCopy}>
          <Text style={[styles.stepTitle, { fontSize: type.secondary }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.stepSubtitle, { fontSize: type.small, lineHeight: type.small + 4 }]} numberOfLines={2}>{subtitle}</Text>
        </View>
        <Text style={[styles.status, { fontSize: type.micro }, done ? styles.statusDone : styles.statusPending]}>{done ? 'Done' : 'Pending'}</Text>
      </Pressable>
      {expanded ? <View style={styles.stepBody}>{children}</View> : null}
    </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  editButton: { minHeight: 40, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: palette.accentMid },
  editLabel: { color: palette.accentDark, fontWeight: '700' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  avatar: { width: 64, height: 64, borderRadius: 20, overflow: 'hidden', backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, gap: 3 },
  name: { fontWeight: '800', color: palette.ink },
  meta: { color: palette.inkSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completion: { gap: 12 },
  completionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  completionTitle: { color: palette.ink, fontWeight: '800' },
  percent: { color: palette.accentDark, fontWeight: '800' },
  track: { height: 8, borderRadius: 999, backgroundColor: palette.well, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 999, backgroundColor: palette.accent },
  overview: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: '47%', gap: 6, minHeight: 88, padding: 12, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  tileArrow: { position: 'absolute', top: 10, right: 10 },
  tileLabel: { color: palette.muted, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  tileValue: { color: palette.ink, fontWeight: '700' },
  stepCard: { padding: 0, overflow: 'hidden', gap: 0 },
  stepCardExpanded: { borderColor: palette.accentMid, borderWidth: 1.5 },
  stepHeader: { minHeight: 72, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: { width: 40, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: 12, backgroundColor: palette.well },
  stepIconDone: { backgroundColor: palette.accentSoft },
  stepIndex: { color: palette.accentDark, fontWeight: '800' },
  stepCopy: { flex: 1, gap: 2 },
  stepTitle: { color: palette.ink, fontWeight: '800' },
  stepSubtitle: { color: palette.muted },
  status: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontWeight: '800' },
  statusDone: { backgroundColor: palette.accentSoft, color: palette.accentDark },
  statusPending: { backgroundColor: palette.well, color: palette.muted },
  stepBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1, borderTopColor: palette.line, gap: 12 },
  stepHint: { color: palette.muted, lineHeight: 20 },
  popupBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: palette.overlay },
  popupCard: { width: '100%', maxWidth: 420, alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 28, borderRadius: 24, backgroundColor: palette.surface, ...shadowSoft },
  checkWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint, marginBottom: 4 },
  popupTitle: { color: palette.ink, fontWeight: '800', textAlign: 'center' },
  popupPlan: { color: palette.accentDark, fontWeight: '800', textAlign: 'center' },
  popupBody: { color: palette.inkSecondary, textAlign: 'center', marginBottom: 8 },
  popupButton: { alignSelf: 'stretch' },
});
