import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { accountApi } from '@/api/accountApi';
import { chatApi } from '@/api/chatApi';
import { customerApi } from '@/api/customerApi';
import type { ApiRecord, AvailabilityBody, OfferingBody, RequestBody } from '@/api/types';
import { vendorApi } from '@/api/vendorApi';
import { parseEuro } from '@/data/format';
import type { DayStatus, Lead, LeadPreferences, NotifyPrefs, Offering, Outcome, PlanId, Proposal, ProposalTemplate, Provider, QuoteDraft, Review } from '@/data/types';
import { store, type RootState } from '@/store';

type Action = ThunkAction<unknown, RootState, unknown, UnknownAction>;

export type ActionResult = { ok: true; data: ApiRecord } | { ok: false; reason: string };

/** Waits for the backend. A screen updates only after this returns ok. */
function call(action: Action): Promise<ActionResult> {
  const dispatched = store.dispatch(action) as { unwrap: () => Promise<ApiRecord> };
  return dispatched
    .unwrap()
    .then((data) => ({ ok: true as const, data: data && typeof data === 'object' ? data : {} }))
    .catch((error: unknown) => ({
      ok: false as const,
      reason:
        error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Could not reach the server.',
    }));
}

function dietOf(draft: QuoteDraft) {
  const answers = draft.answers;
  const diet = [
    answers?.vegetarian ? `vegetarian:${answers.vegetarian}` : '',
    answers?.vegan === 'yes' ? 'vegan' : '',
    answers?.halal === 'yes' || draft.halal ? 'halal' : '',
  ].filter((item) => item !== '');
  if (diet.length) return diet;
  return draft.dietary.length ? draft.dietary : undefined;
}

function requestBody(draft: QuoteDraft): RequestBody {
  const answers = draft.answers;
  const budget = parseEuro(draft.budget);
  const vegetarian = answers?.vegetarian === 'yes';
  const count = (value: string | undefined) => Number(value) || 0;
  const tasks = answers
    ? [
        answers.decoration === 'yes' ? 'Decoration / setup' : '',
        answers.buffetSetup === 'yes' ? 'Buffet setup' : '',
        answers.serving === 'yes' ? 'Serving' : '',
        answers.drinksService === 'yes' ? 'Drinks service' : '',
        answers.dishwashing === 'yes' ? 'Dishwashing' : '',
        answers.cleanup === 'yes' ? 'Cleanup / teardown' : '',
      ].filter((item): item is string => item !== '')
    : draft.servicePrefs;
  return {
    event_type: answers?.occasion || draft.eventType,
    event_date: draft.date,
    start_time: answers?.cateringStart || draft.startTime || undefined,
    end_time: answers?.cateringEnd || draft.endTime || undefined,
    flexible_date: draft.flexibleDate,
    city: draft.city,
    postcode: draft.postcode || undefined,
    location: answers?.venueName || draft.location || undefined,
    indoor_outdoor: draft.setting || undefined,
    guest_count: Number(draft.guests) || 0,
    needs: draft.needs.length ? draft.needs : ['food'],
    cuisines: [answers?.cuisine, answers?.cuisineStyle].filter((item): item is string => !!item).length
      ? [answers?.cuisine, answers?.cuisineStyle].filter((item): item is string => !!item)
      : draft.cuisines.length
        ? draft.cuisines
        : undefined,
    dietary: dietOf(draft),
    services: tasks.length ? tasks : undefined,
    budget_total_cents: parseEuro(draft.budgetTotal) || undefined,
    budget_per_person_cents: budget || undefined,
    description: draft.notes.trim() || undefined,
    details: answers
      ? {
          venue_kind: answers.venueKind || undefined,
          venue_name: answers.venueName || undefined,
          access_notes: answers.accessNotes || undefined,
          occasion: answers.occasion || undefined,
          cuisine: answers.cuisine || undefined,
          cuisine_style: answers.cuisineStyle || undefined,
          vegetarian: answers.vegetarian || undefined,
          base_dishes: count(answers.base),
          chicken_dishes: vegetarian ? 0 : count(answers.chicken),
          pork_dishes: vegetarian ? 0 : count(answers.pork),
          beef_dishes: vegetarian ? 0 : count(answers.beef),
          fish_dishes: vegetarian ? 0 : count(answers.fish),
          shrimp_dishes: vegetarian ? 0 : count(answers.shrimp),
          vegetable_dishes: count(answers.vegetables),
          extra_vegetarian_dishes: count(answers.extraVegetarian),
          starters: count(answers.starters),
          desserts: count(answers.desserts),
          serving_format: answers.servingFormat || undefined,
          staffed: answers.staffed || undefined,
          warming: answers.warming || undefined,
          tableware: answers.tableware || undefined,
          plates: answers.plates || undefined,
          cutlery: answers.cutlery || undefined,
          glasses: answers.glasses || undefined,
          catering_start: answers.cateringStart || undefined,
          catering_end_date: answers.cateringEndDate || undefined,
          catering_end: answers.cateringEnd || undefined,
          tasks,
          handoff: answers.handoff || undefined,
          handoff_time: answers.handoffTime || undefined,
          drinks: answers.drinks || undefined,
          drink_details: answers.drinkDetails || undefined,
          halal: answers.halal === 'yes',
          allergies: draft.allergies || undefined,
          forbidden: answers.forbidden || undefined,
          vegan: answers.vegan || undefined,
          other_diet: answers.otherDiet || undefined,
        }
      : undefined,
  };
}

function offeringBody(offering: Offering): OfferingBody {
  return {
    title: offering.title,
    category: offering.category,
    description: offering.description || undefined,
    price_cents: offering.priceCents ?? 0,
    price_type: offering.priceType,
    cuisine: offering.cuisine || undefined,
    diet: offering.dietary,
    photo: offering.photo.startsWith('http') ? undefined : offering.photo,
  };
}

const AVAILABILITY = ['available', 'partial', 'maybe', 'unavailable'] as const;

export const apiActions = {
  verifyEmail: () => call(accountApi.endpoints.verifyEmail.initiate()),
  verifyPhone: (phone: string) => call(accountApi.endpoints.verifyPhone.initiate({ phone })),
  savePushToken: (token: string) => call(accountApi.endpoints.savePushToken.initiate({ expo_token: token })),
  markRead: (id: string) => call(accountApi.endpoints.markNotificationRead.initiate(id)),
  markAllRead: () => call(accountApi.endpoints.markAllNotificationsRead.initiate()),
  notifySettings: (prefs: NotifyPrefs) =>
    call(
      accountApi.endpoints.updateNotificationSettings.initiate({
        push: prefs.push,
        email: prefs.email,
        request: prefs.requests,
        message: prefs.messages,
        proposal: prefs.proposals,
        review: prefs.reviews,
      }),
    ),
  report: (target: string, reason: string, details: string) => {
    const [type, ...rest] = target.split(':');
    return call(accountApi.endpoints.saveReport.initiate({ target_type: type, target_id: rest.join(':') || type, reason, details: details || undefined }));
  },
  exportAccount: () => call(accountApi.endpoints.exportAccount.initiate()),
  deleteAccount: () => call(accountApi.endpoints.deleteAccount.initiate()),

  favorite: (kind: 'providers' | 'offerings', id: string, saved: boolean, favoriteId?: string) =>
    call(
      saved
        ? customerApi.endpoints.saveFavorite.initiate({ type: kind === 'providers' ? 'provider' : 'offering', id })
        : customerApi.endpoints.deleteFavorite.initiate(favoriteId || id),
    ),
  requestDraft: (draft: QuoteDraft) => call(customerApi.endpoints.saveRequestDraft.initiate(requestBody(draft))),
  submitRequest: (draft: QuoteDraft) => call(customerApi.endpoints.submitRequest.initiate(requestBody(draft))),
  cancelRequest: (id: string, reason: string) => call(customerApi.endpoints.cancelRequest.initiate({ request_id: id, reason })),
  continueWith: (proposalId: string) => call(customerApi.endpoints.continueWithProvider.initiate(proposalId)),
  outcome: (outcome: Outcome) =>
    call(customerApi.endpoints.saveOutcome.initiate({ request_id: outcome.requestId, outcome: outcome.choice, provider_id: outcome.providerId })),
  review: (review: Review) =>
    call(
      customerApi.endpoints.saveReview.initiate({
        request_id: review.requestId ?? '',
        provider_id: review.providerId,
        overall: review.overall,
        food: review.food,
        communication: review.communication,
        reliability: review.reliability,
        value: review.value,
        service: review.service,
        body: review.text,
      }),
    ),
  sendMessage: (conversationId: string, text: string) => call(chatApi.endpoints.sendMessage.initiate({ conversation_id: conversationId, message: text })),

  subscription: (plan: PlanId) => call(vendorApi.endpoints.saveSubscription.initiate(plan)),
  vendorServices: (services: string[]) => call(vendorApi.endpoints.saveVendorServices.initiate(services)),
  vendorProfile: (provider: Partial<Provider>) =>
    call(vendorApi.endpoints.updateVendorProfile.initiate({ name: provider.name, city: provider.city, story: provider.description, logo: provider.photo })),
  verification: (kvk: string, vat: string, legalName: string) =>
    call(vendorApi.endpoints.saveVerification.initiate({ kvk_number: kvk, vat_number: vat || undefined, legal_name: legalName })),
  availability: (leadId: string, status: Lead['status'], note: string) => {
    const known = AVAILABILITY.find((item) => item === status);
    if (!known) return Promise.resolve({ ok: false as const, reason: 'That answer is not saved on the server.' });
    const body: AvailabilityBody = { lead_id: leadId, status: known, note: note || undefined };
    return call(vendorApi.endpoints.saveAvailability.initiate(body));
  },
  proposal: (proposal: Proposal) =>
    call(
      vendorApi.endpoints.saveProposal.initiate({
        lead_id: proposal.leadId ?? '',
        message: proposal.message,
        guest_count: proposal.guests,
        food_cents: proposal.foodCents,
        drinks_cents: proposal.drinksCents,
        staff_cents: proposal.staffCents,
        delivery_cents: proposal.deliveryCents,
        equipment_cents: proposal.equipmentCents,
        other_cents: proposal.otherCents,
        discount_cents: proposal.discountCents,
        included: proposal.included.join(', ') || undefined,
        excluded: proposal.excluded.join(', ') || undefined,
        assumptions: proposal.assumptions || undefined,
        expires_at: proposal.expiresAt || undefined,
        details: proposal.details,
      }),
    ),
  withdrawProposal: (id: string) => call(vendorApi.endpoints.withdrawProposal.initiate(id)),
  offering: (offering: Offering, isNew: boolean) =>
    call(
      isNew
        ? vendorApi.endpoints.saveOffering.initiate(offeringBody(offering))
        : vendorApi.endpoints.updateOffering.initiate({ ...offeringBody(offering), offering_id: offering.id }),
    ),
  offeringActive: (id: string, active: boolean) => call(vendorApi.endpoints.setOfferingActive.initiate({ offering_id: id, active })),
  preferences: (prefs: LeadPreferences) =>
    call(
      vendorApi.endpoints.savePreferences.initiate({
        city: prefs.cities || undefined,
        min_guests: Number(prefs.minGuests) || undefined,
        max_guests: Number(prefs.maxGuests) || undefined,
        cuisines: prefs.cuisines,
        radius_km: prefs.radiusKm,
      }),
    ),
  calendar: (date: string, status: DayStatus) => call(vendorApi.endpoints.saveCalendar.initiate({ date, status })),
  template: (template: ProposalTemplate) => call(vendorApi.endpoints.saveTemplate.initiate({ name: template.name, body: { ...template, id: template.id || undefined } })),
  deleteTemplate: (id: string) => call(vendorApi.endpoints.deleteTemplate.initiate(id)),
  reviewResponse: (id: string, response: string) => call(vendorApi.endpoints.saveReviewResponse.initiate({ review_id: id, response })),
};
