import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  API_ENABLED,
  useDeleteFavoriteMutation,
  useGetFavoritesQuery,
  useGetOfferingQuery,
  useGetProviderDetailsQuery,
  useGetProviderOfferingsQuery,
  useGetProviderReviewsQuery,
  useSaveFavoriteMutation,
} from '@/api';
import { recordOf, rowsOf, textOf } from '@/api/mappers';
import { apiMediaUri } from '@/api/media';
import type { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { money } from '@/flow2/data/format';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';
import { useApp as useSession } from '@/state/store';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food',
  drinks: 'Drinks',
  dessert: 'Dessert',
  desserts: 'Dessert',
  staff: 'Staff',
  gear: 'Equipment',
  equipment: 'Equipment',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  halal: 'Halal',
  warm: 'Warm dishes',
  other: 'Other',
};

export default function ProviderDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { lang, resetDraft, patchDraft } = useApp();
  const { session, restored } = useSession();
  const type = useType();
  const signedIn = API_ENABLED && restored && session.signedIn && session.mode === 'customer';
  const detailsQuery = useGetProviderDetailsQuery(id, { skip: !API_ENABLED || !id });
  const offeringsQuery = useGetProviderOfferingsQuery(id, { skip: !API_ENABLED || !id });
  const reviewsQuery = useGetProviderReviewsQuery(id, { skip: !API_ENABLED || !id });
  const favoritesQuery = useGetFavoritesQuery(undefined, { skip: !signedIn });
  const [saveFavorite, saveFavoriteState] = useSaveFavoriteMutation();
  const [deleteFavorite, deleteFavoriteState] = useDeleteFavoriteMutation();
  const provider = recordOf(detailsQuery.data, 'provider', 'vendor', 'provider_details', 'details');
  const offerings = rowsOf(offeringsQuery.data).filter((item) => item.is_active !== false && item.active !== false);
  const reviews = rowsOf(reviewsQuery.data);
  const favorite = useMemo(() => {
    const rows = rowsOf(favoritesQuery.data);
    return rows.find((row) => {
      const typeName = textOf(row, 'type', 'favorite_type');
      const target = String(row.target_id ?? row.provider_id ?? row.id ?? '');
      const nested = row.provider && typeof row.provider === 'object' ? String((row.provider as ApiRecord).id ?? '') : '';
      return (typeName === 'provider' || !typeName) && (target === id || nested === id);
    });
  }, [favoritesQuery.data, id]);
  const favoriteId = favorite ? String(favorite.favorite_id ?? favorite.id ?? '') : '';
  const name = present(textOf(provider, 'business_name', 'provider_name', 'vendor_name', 'name', 'title'));
  const loading = detailsQuery.isLoading || offeringsQuery.isLoading || reviewsQuery.isLoading;
  const refreshing = (detailsQuery.isFetching || offeringsQuery.isFetching || reviewsQuery.isFetching || favoritesQuery.isFetching) && !loading;

  const toggleFavorite = () => {
    if (!signedIn || !id) return;
    if (favoriteId) void deleteFavorite(favoriteId);
    else void saveFavorite({ type: 'provider', id });
  };

  if (!API_ENABLED) {
    return (
      <Screen header={<Header title="Caterer" back />}>
        <EmptyState icon="store" title="API unavailable" body="Connect to the API to load provider details." />
      </Screen>
    );
  }
  if (!loading && !provider) {
    return (
      <Screen header={<Header title="Caterer" back />}>
        <EmptyState
          icon="store"
          title={detailsQuery.isError ? 'Could not load provider' : 'Not found'}
          body={detailsQuery.isError ? 'The provider details could not be loaded from the server. Pull down to retry.' : 'The server returned no provider details.'}
          action="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const images = provider ? imagesOf(provider) : [];
  const description = present(textOf(provider, 'description', 'story', 'about', 'short_description', 'intro'));
  const city = present(textOf(provider, 'city', 'service_city'));
  const tags = provider ? listOf(provider, 'categories', 'cuisines', 'cuisine_types', 'services') : [];
  const rating = numberOf(provider, 'rating', 'average_rating', 'avg_rating');
  const reviewCount = numberOf(provider, 'review_count', 'reviews_count', 'total_reviews') ?? reviews.length;
  const minGuests = positiveNumber(provider, 'min_guests', 'minimum_guests');
  const maxGuests = positiveNumber(provider, 'max_guests', 'maximum_guests', 'max_capacity');
  const radius = positiveNumber(provider, 'radius_km');
  const startingPrice = priceOf(provider, lang);
  const verification = verificationOf(provider);
  const guestLabel = minGuests && maxGuests ? `${minGuests}–${maxGuests} guests` : minGuests ? `From ${minGuests} guests` : maxGuests ? `Up to ${maxGuests} guests` : undefined;

  return (
    <Screen
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => {
        void detailsQuery.refetch();
        void offeringsQuery.refetch();
        void reviewsQuery.refetch();
      }}
      header={(
        <Header
          title={name ?? 'Caterer'}
          subtitle={city ?? ''}
          back
          right={signedIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={favoriteId ? 'Remove favorite' : 'Save favorite'}
              disabled={saveFavoriteState.isLoading || deleteFavoriteState.isLoading}
              onPress={toggleFavorite}
              style={styles.favoriteButton}>
              <Icon name="heart" color={favoriteId ? palette.danger : palette.accentDark} size={19} filled={!!favoriteId} />
            </Pressable>
          ) : undefined}
        />
      )}
      footer={
        <Button
          label="Request a proposal"
          onPress={() => {
            resetDraft();
            patchDraft({ providerId: id });
            router.push({ pathname: '/customer/request', params: { providerId: id, fresh: String(Date.now()) } });
          }}
        />
      }>
      {provider ? (
        <View style={styles.profileCard}>
          {images.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {images.map((uri, index) => (
                <Image key={`${uri}-${index}`} source={{ uri }} contentFit="cover" transition={180} style={styles.heroImage} accessibilityLabel={`${name ?? 'Caterer'} ${index + 1}`} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroInitial}>{(name ?? 'C').slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.profileBody}>
            <View style={styles.nameRow}>
              <View style={styles.nameBlock}>
                {name ? <Text style={[styles.providerName, { fontSize: type.sectionTitle }]}>{name}</Text> : null}
                {city ? (
                  <View style={styles.metaLine}>
                    <Icon name="pin" color={palette.muted} size={14} />
                    <Text style={styles.metaText}>{city}{radius ? ` · ${radius} km` : ''}</Text>
                  </View>
                ) : null}
              </View>
              {rating !== undefined ? (
                <View style={styles.rating}>
                  <Icon name="star" color={palette.gold} size={15} filled />
                  <Text style={styles.ratingText}>{formatRating(rating)}</Text>
                  <Text style={styles.reviewCount}>({reviewCount})</Text>
                </View>
              ) : null}
            </View>
            {verification ? (
              <View style={[styles.verifyBadge, { backgroundColor: verification.bg }]}>
                <Icon name="verified" color={verification.color} size={14} />
                <Text style={[styles.verifyText, { color: verification.color }]}>{verification.label}</Text>
              </View>
            ) : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {tags.length ? (
              <View style={styles.tags}>
                {tags.map((item) => (
                  <Tag key={item} label={prettyLabel(item)} />
                ))}
              </View>
            ) : null}
            {guestLabel || startingPrice ? (
              <View style={styles.stats}>
                {guestLabel ? <Stat label="Guests" value={guestLabel} /> : null}
                {startingPrice ? <Stat label="From" value={startingPrice} accent /> : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {offeringsQuery.isError ? (
        <EmptyState title="Could not load offerings" body="Refresh to try loading the provider’s packages again." />
      ) : offerings.length ? (
        <>
          <SectionHeading title="Packages" count={offerings.length} />
          {offerings.map((offering, index) => (
            <OfferingCard key={String(offering.offering_id ?? offering.id ?? index)} offering={offering} lang={lang} />
          ))}
        </>
      ) : null}

      <SectionHeading title="Reviews" count={reviewCount} />
      {rating !== undefined ? (
        <View style={styles.reviewSummary}>
          <View style={styles.rating}>
            <Icon name="star" color={palette.gold} size={18} filled />
            <Text style={styles.summaryScore}>{formatRating(rating)}</Text>
          </View>
          <Text style={styles.summaryMeta}>{reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}</Text>
        </View>
      ) : null}
      {reviewsQuery.isError ? (
        <EmptyState title="Could not load reviews" body="Refresh to try loading reviews again." />
      ) : reviews.length ? (
        reviews.map((review, index) => <ReviewCard key={String(review.review_id ?? review.id ?? index)} review={review} />)
      ) : (
        <View style={styles.emptyReviews}>
          <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
          <Text style={styles.emptyReviewsBody}>Customers have not left a review for this caterer.</Text>
        </View>
      )}
    </Screen>
  );
}

function OfferingCard({ offering, lang }: { offering: ApiRecord; lang: 'nl' | 'en' }) {
  const type = useType();
  const offeringId = String(offering.offering_id ?? offering.id ?? '');
  const detailQuery = useGetOfferingQuery(offeringId, { skip: !API_ENABLED || !offeringId });
  const detail = recordOf(detailQuery.data, 'offering') ?? {};
  const row = { ...offering, ...detail };
  const title = present(textOf(row, 'title', 'name', 'offering_name', 'package_name'));
  const image = imagesOf(row)[0];
  const amount = priceValue(row);
  const unit = prettyUnit(textOf(row, 'price_type', 'price_unit', 'unit'));
  const category = prettyLabel(textOf(row, 'category_name', 'category', 'cuisine'));
  const parsed = splitDescription(present(textOf(row, 'description', 'details', 'package_description')));
  const included = listOf(row, 'included', 'dishes', 'items', 'contents');
  const extras = included.length ? included : parsed.includes;
  const diet = listOf(row, 'diet', 'dietary', 'allergens');

  if (!title && !parsed.body && !amount) return null;

  return (
    <View style={styles.offeringCard}>
      {image ? <Image source={{ uri: image }} contentFit="cover" transition={180} style={styles.offeringImage} accessibilityLabel={title ?? 'Package image'} /> : null}
      <View style={styles.offeringContent}>
        <View style={styles.offeringTitleRow}>
          <View style={styles.offeringHeading}>
            {category ? <Text style={styles.category}>{category}</Text> : null}
            {title ? <Text style={[styles.offeringTitle, { fontSize: type.cardTitle }]}>{title}</Text> : null}
          </View>
          {amount ? (
            <View style={styles.priceBadge}>
              <Text style={styles.offeringPrice}>{money(amount.value, lang)}</Text>
              {unit ? <Text style={styles.priceUnit}>{unit}</Text> : null}
            </View>
          ) : null}
        </View>
        {parsed.body ? <Text style={styles.description}>{parsed.body}</Text> : null}
        {extras.length ? (
          <View style={styles.includedBlock}>
            <Text style={styles.blockLabel}>Included</Text>
            {extras.map((item) => (
              <View key={item} style={styles.includedRow}>
                <View style={styles.checkIcon}>
                  <Icon name="check" color={palette.accent} size={12} />
                </View>
                <Text style={styles.includedText}>{prettyLabel(item)}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {diet.length ? <Text style={styles.diet}>{diet.map(prettyLabel).join(' · ')}</Text> : null}
      </View>
    </View>
  );
}

function ReviewCard({ review }: { review: ApiRecord }) {
  const author = present(textOf(review, 'customer_name', 'reviewer_name', 'author', 'name')) ?? 'Customer';
  const rating = numberOf(review, 'rating', 'overall', 'score');
  const date = present(textOf(review, 'created_at', 'review_date', 'date'));
  const body = present(textOf(review, 'body', 'comment', 'review', 'text'));
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <Text style={styles.reviewAuthor}>{author}</Text>
        {rating !== undefined ? (
          <View style={styles.rating}>
            <Icon name="star" color={palette.gold} size={14} filled />
            <Text style={styles.ratingText}>{formatRating(rating)}</Text>
          </View>
        ) : null}
      </View>
      {date ? <Text style={styles.reviewDate}>{date.slice(0, 10)}</Text> : null}
      {body ? <Text style={styles.description}>{body}</Text> : null}
    </View>
  );
}

function verificationOf(provider: ApiRecord | null) {
  if (!provider) return null;
  const status = String(provider.verification_status ?? provider.kvk_state ?? provider.kvk_status ?? '').trim().toLowerCase();
  if (provider.verified === true || status === 'verified' || status === 'approved') {
    return { label: 'Verified caterer', color: palette.mintDark, bg: palette.mint };
  }
  if (status === 'pending' || status === 'in_review' || status === 'submitted' || status === 'processing') {
    return { label: 'Verification pending', color: palette.gold, bg: palette.goldSoft };
  }
  if (status === 'rejected' || status === 'failed' || status === 'declined') {
    return { label: 'Verification rejected', color: palette.danger, bg: palette.dangerSoft };
  }
  if (status === 'none' || status === 'unverified' || provider.verified === false) {
    return { label: 'Not verified', color: palette.muted, bg: palette.well };
  }
  if (status) return { label: prettyLabel(status), color: palette.muted, bg: palette.well };
  return { label: 'Not verified', color: palette.muted, bg: palette.well };
}

function formatRating(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
    </View>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function present(value?: string | null) {
  if (!value) return undefined;
  const clean = value.trim();
  if (!clean || clean === '0' || clean.toLowerCase() === 'none' || clean.toLowerCase() === 'null') return undefined;
  return clean;
}

function prettyLabel(value?: string) {
  if (!value) return '';
  const key = value.trim().toLowerCase().replaceAll(' ', '_');
  return CATEGORY_LABELS[key] ?? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function prettyUnit(value?: string) {
  if (!value) return undefined;
  const unit = value.trim().toLowerCase();
  if (unit === 'per_person' || unit === 'person') return 'per person';
  if (unit === 'flat' || unit === 'fixed') return 'fixed';
  return prettyLabel(unit);
}

function splitDescription(value?: string) {
  if (!value) return { body: undefined as string | undefined, includes: [] as string[] };
  const match = value.match(/includes?:\s*(.+)$/i);
  if (!match) return { body: value, includes: [] };
  const body = value.slice(0, match.index).replace(/[.\s]+$/, '').trim();
  const includes = match[1].split(/,|·|;/).map((item) => item.trim()).filter(Boolean);
  return { body: body || undefined, includes };
}

function imagesOf(record: ApiRecord) {
  const images: string[] = [];
  for (const key of ['photo', 'image', 'image_url', 'photo_url', 'cover_image', 'cover_photo', 'logo', 'profile_photo', 'photos', 'images', 'gallery']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      const normalized = apiMediaUri(value);
      if (normalized) images.push(normalized);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string' && entry.trim()) {
          const normalized = apiMediaUri(entry);
          if (normalized) images.push(normalized);
        } else if (entry && typeof entry === 'object') {
          const uri = textOf(entry as ApiRecord, 'url', 'photo', 'photo_url', 'image', 'image_url', 'path');
          if (uri) {
            const normalized = apiMediaUri(uri);
            if (normalized) images.push(normalized);
          }
        }
      }
    }
  }
  return [...new Set(images)];
}

function listOf(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value) && value.length) {
      return value
        .map((item) => (typeof item === 'string' ? item : item && typeof item === 'object' ? textOf(item as ApiRecord, 'name', 'title', 'label') ?? '' : ''))
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function numberOf(record: ApiRecord | null, ...keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return undefined;
}

function positiveNumber(record: ApiRecord | null, ...keys: string[]) {
  const value = numberOf(record, ...keys);
  return value && value > 0 ? value : undefined;
}

function priceValue(record: ApiRecord): { value: number } | undefined {
  for (const key of ['price_cents', 'starting_price_cents', 'total_cents']) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value > 0) return { value: value / 100 };
  }
  for (const key of ['price', 'starting_price', 'amount', 'total']) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value > 0) return { value };
  }
  return undefined;
}

function priceOf(record: ApiRecord | null, lang: 'nl' | 'en') {
  if (!record) return undefined;
  const price = priceValue(record);
  return price ? money(price.value, lang) : undefined;
}

const styles = StyleSheet.create({
  favoriteButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#E6DEFF' },
  gallery: { height: 210, marginHorizontal: -16, marginTop: -16, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', backgroundColor: palette.accentSoft },
  heroImage: { width: 320, height: 210, backgroundColor: palette.accentSoft },
  heroFallback: { height: 88, marginHorizontal: -16, marginTop: -16, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  heroInitial: { color: palette.accentDark, fontSize: 36, fontWeight: '800' },
  profileCard: { overflow: 'hidden', borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  profileBody: { padding: 16, gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nameBlock: { flex: 1, gap: 5 },
  providerName: { color: palette.ink, fontWeight: '800' },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: palette.muted, fontSize: 13 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: palette.ink, fontWeight: '800', fontSize: 13 },
  reviewCount: { color: palette.muted, fontSize: 11 },
  verifyBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  verifyText: { fontSize: 12, fontWeight: '700' },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  summaryScore: { color: palette.ink, fontSize: 22, fontWeight: '800' },
  summaryMeta: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  emptyReviews: { gap: 4, padding: 16, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  emptyReviewsTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  emptyReviewsBody: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  description: { color: palette.ink, fontSize: 14, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: palette.accentSoft },
  tagText: { color: palette.accentDark, fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  stat: { flex: 1, gap: 4, padding: 12, borderRadius: 14, backgroundColor: palette.bg },
  statLabel: { color: palette.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  statValue: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  statAccent: { color: palette.accentDark },
  blockLabel: { color: palette.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.35, textTransform: 'uppercase' },
  includedBlock: { gap: 8, paddingTop: 2 },
  includedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIcon: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  includedText: { flex: 1, color: palette.ink, fontSize: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { color: palette.ink, fontSize: 19, fontWeight: '800' },
  sectionCount: { minWidth: 26, textAlign: 'center', paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden', borderRadius: 12, backgroundColor: palette.accentSoft, color: palette.accentDark, fontWeight: '800' },
  offeringCard: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  offeringImage: { width: '100%', height: 172, backgroundColor: palette.accentSoft },
  offeringContent: { padding: 14, gap: 9 },
  offeringTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  offeringHeading: { flex: 1, gap: 4 },
  offeringTitle: { color: palette.ink, fontWeight: '800' },
  priceBadge: { alignItems: 'flex-end', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, backgroundColor: palette.accentSoft },
  offeringPrice: { color: palette.accentDark, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  priceUnit: { color: palette.muted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  category: { color: palette.accentDark, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  diet: { color: palette.muted, fontSize: 12 },
  reviewCard: { padding: 15, gap: 7, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  reviewDate: { color: palette.muted, fontSize: 12 },
});
