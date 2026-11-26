import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { Icon, type IconName } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette, shadowSoft } from '@/flow2/constants/theme';
import { dateLong, money } from '@/flow2/data/format';
import type { Lang } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';
import { useResponsive } from '@/hooks/use-responsive';
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

const COVER_KEYS = ['photo', 'image', 'image_url', 'photo_url', 'cover_image', 'cover_photo', 'photos', 'images', 'gallery'];
const LOGO_KEYS = ['logo', 'profile_photo'];
const FOOD_FALLBACK = require('../../../../assets/images/welcome-scene.png');

type Highlight = { icon: IconName; label: string; value: string; accent?: boolean };

export default function ProviderDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { lang, resetDraft, patchDraft, t } = useApp();
  const tx = (en: string) => t({ en, nl: en });
  const { session, restored } = useSession();
  const type = useType();
  const { gutter, width, isCompact, isTablet } = useResponsive();
  const frameWidth = Math.min(width, 960);
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
  const [failedLogoId, setFailedLogoId] = useState('');
  const name = present(textOf(provider, 'business_name', 'provider_name', 'vendor_name', 'name', 'title'));
  const loading = detailsQuery.isLoading || offeringsQuery.isLoading || reviewsQuery.isLoading;
  const refreshing = (detailsQuery.isFetching || offeringsQuery.isFetching || reviewsQuery.isFetching || favoritesQuery.isFetching) && !loading;
  const heroHeight = isCompact ? 210 : isTablet ? 320 : 252;

  const toggleFavorite = () => {
    if (!signedIn || !id) return;
    if (favoriteId) void deleteFavorite(favoriteId);
    else void saveFavorite({ type: 'provider', id });
  };

  const requestProposal = () => {
    resetDraft();
    patchDraft({ providerId: id });
    router.push({ pathname: '/customer/request', params: { providerId: id, fresh: String(Date.now()) } });
  };

  if (!API_ENABLED) {
    return (
      <Screen header={<Header title={tx('Caterer')} back />}>
        <EmptyState icon="store" title={tx('API unavailable')} body={tx('Connect to the API to load provider details.')} />
      </Screen>
    );
  }
  if (!loading && !provider) {
    return (
      <Screen header={<Header title={tx('Caterer')} back />}>
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

  const covers = provider ? imagesOf(provider, COVER_KEYS) : [];
  const logo = provider ? imagesOf(provider, LOGO_KEYS)[0] : undefined;
  const showLogo = !!logo && failedLogoId !== id;
  const description = present(textOf(provider, 'description', 'story', 'about', 'short_description', 'intro'));
  const city = present(textOf(provider, 'city', 'service_city'));
  const tags = provider ? listOf(provider, 'categories', 'cuisines', 'cuisine_types', 'services') : [];
  const reviewCount = numberOf(provider, 'review_count', 'reviews_count', 'total_reviews') ?? 0;
  const serverRating = numberOf(provider, 'rating', 'average_rating', 'avg_rating');
  const rating = reviewCount > 0 && serverRating && serverRating > 0 ? serverRating : undefined;
  const minGuests = positiveNumber(provider, 'min_guests', 'minimum_guests');
  const maxGuests = positiveNumber(provider, 'max_guests', 'maximum_guests', 'max_capacity');
  const radius = positiveNumber(provider, 'radius_km');
  const startingPrice = priceOf(provider, lang);
  const verification = verificationOf(provider);
  const guestLabel = minGuests && maxGuests ? `${minGuests}–${maxGuests}` : minGuests ? `${minGuests}+` : maxGuests ? `Up to ${maxGuests}` : undefined;
  const plan = present(textOf(provider, 'plan'));
  const planLabel = plan && plan.toLowerCase() !== 'free' ? prettyLabel(plan) : undefined;
  const highlights: Highlight[] = [];
  if (guestLabel) highlights.push({ icon: 'people', label: 'Guests', value: guestLabel });
  if (startingPrice) highlights.push({ icon: 'card', label: 'Starting at', value: startingPrice, accent: true });
  if (tags.length) highlights.push({ icon: 'food', label: 'Cuisine', value: tags.length === 1 ? prettyLabel(tags[0]) : `${prettyLabel(tags[0])} +${tags.length - 1}` });
  if (radius) highlights.push({ icon: 'pin', label: 'Service area', value: `${radius} km` });
  if (planLabel) highlights.push({ icon: 'spark', label: 'Plan', value: planLabel });

  return (
    <Screen
      canvas={palette.bg}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => {
        void detailsQuery.refetch();
        void offeringsQuery.refetch();
        void reviewsQuery.refetch();
      }}
      style={styles.canvas}
      footer={<Button label={tx('Request a proposal')} onPress={requestProposal} />}>
      {provider ? (
        <View>
          <View style={[styles.hero, { height: heroHeight }]}>
            <HeroMedia uris={covers} width={frameWidth} height={heroHeight} label={name ? `${name} catering` : 'Catering photo'} />
            <View pointerEvents="none" style={styles.heroScrim} />
            <View style={styles.heroActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.heroButton}>
                <Icon name="back" color={palette.ink} size={18} />
              </Pressable>
              {signedIn ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={favoriteId ? 'Remove favorite' : 'Save favorite'}
                  disabled={saveFavoriteState.isLoading || deleteFavoriteState.isLoading}
                  onPress={toggleFavorite}
                  style={styles.heroButton}>
                  <Icon name="heart" color={favoriteId ? palette.danger : palette.ink} size={18} filled={!!favoriteId} />
                </Pressable>
              ) : <View />}
            </View>
          </View>

          <View style={[styles.sheet, { marginHorizontal: gutter, marginTop: showLogo ? -46 : -28, paddingTop: showLogo ? (isCompact ? 58 : 66) : 18 }]}>
            {showLogo ? <LogoMark uri={logo} compact={isCompact} onError={() => setFailedLogoId(id)} /> : null}
            {name ? <Text style={[styles.providerName, { fontSize: isTablet ? type.pageTitle : type.screenTitle }]}>{name}</Text> : null}
            <View style={styles.identityRow}>
              {city ? (
                <View style={styles.metaLine}>
                  <Icon name="pin" color={palette.accent} size={14} />
                  <Text style={[styles.metaText, { fontSize: type.secondary }]}>{city}</Text>
                </View>
              ) : null}
              {rating !== undefined ? (
                <View style={styles.ratingPill}>
                  <Icon name="star" color={palette.accent} size={14} filled />
                  <Text style={[styles.ratingText, { fontSize: type.secondary }]}>{formatRating(rating)}</Text>
                  <Text style={[styles.reviewCount, { fontSize: type.small }]}>{reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}</Text>
                </View>
              ) : reviewCount > 0 ? (
                <Text style={[styles.reviewCount, { fontSize: type.small }]}>{reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}</Text>
              ) : null}
            </View>
            {verification ? (
              <View style={[styles.verifyBadge, { backgroundColor: verification.bg }]}>
                <Icon name="verified" color={verification.color} size={14} />
                <Text style={[styles.verifyText, { color: verification.color, fontSize: type.small }]}>{verification.label}</Text>
              </View>
            ) : null}
            {description ? <Text style={[styles.description, { fontSize: type.body, lineHeight: type.body + 8 }]}>{description}</Text> : null}
            {tags.length ? (
              <View style={styles.tags}>
                {tags.map((item) => (
                  <Tag key={item} label={prettyLabel(item)} />
                ))}
              </View>
            ) : null}
          </View>

          {highlights.length ? (
            <View style={[styles.highlights, { paddingHorizontal: gutter }]}>
              {highlights.map((item) => (
                <HighlightCard key={item.label} item={item} wide={isTablet} />
              ))}
            </View>
          ) : null}

          {offeringsQuery.isError || offerings.length ? (
            <View style={{ paddingHorizontal: gutter, gap: 12 }}>
              <SectionHeading title={tx('Packages')} count={offerings.length} />
              {offeringsQuery.isError ? (
                <EmptyState title={tx('Could not load offerings')} body={tx('Refresh to try loading the provider’s packages again.')} />
              ) : (
                offerings.map((offering, index) => (
                  <OfferingCard key={String(offering.offering_id ?? offering.id ?? index)} offering={offering} lang={lang} wide={isTablet} />
                ))
              )}
            </View>
          ) : null}

          <View style={[styles.sectionRule, { marginHorizontal: gutter }]} />

          <View style={{ paddingHorizontal: gutter, gap: 12 }}>
            <SectionHeading title={tx('Reviews')} count={reviewCount} />
            {rating !== undefined ? (
              <View style={styles.reviewSummary}>
                <Text style={[styles.summaryScore, { fontSize: isTablet ? 40 : 34 }]}>{formatRating(rating)}</Text>
                <View style={styles.summaryCopy}>
                  <View style={styles.starRow}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Icon key={index} name="star" color={index < Math.round(rating) ? palette.accent : palette.lineStrong} size={16} filled={index < Math.round(rating)} />
                    ))}
                  </View>
                  <Text style={[styles.summaryMeta, { fontSize: type.secondary }]}>{reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}</Text>
                </View>
              </View>
            ) : null}
            {reviewsQuery.isError ? (
              <EmptyState title={tx('Could not load reviews')} body={tx('Refresh to try loading reviews again.')} />
            ) : reviews.length ? (
              reviews.map((review, index) => <ReviewCard key={String(review.review_id ?? review.id ?? index)} review={review} lang={lang} />)
            ) : (
              <View style={styles.emptyReviews}>
                <View style={styles.emptyIcon}>
                  <Icon name="star" color={palette.accent} size={18} />
                </View>
                <View style={styles.emptyCopy}>
                  <Text style={[styles.emptyReviewsTitle, { fontSize: type.cardTitle }]}>No reviews yet</Text>
                  <Text style={[styles.emptyReviewsBody, { fontSize: type.secondary, lineHeight: type.secondary + 6 }]}>Customers have not left a review for this caterer.</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function HeroMedia({ uris, width, height, label }: { uris: string[]; width: number; height: number; label: string }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const visible = uris.filter((uri) => !hidden[uri]);
  if (!visible.length) {
    return <Image source={FOOD_FALLBACK} style={{ width, height }} contentFit="cover" accessibilityLabel="Catering kitchen" />;
  }
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width, height }}>
      {visible.map((uri, index) => (
        <Image
          key={`${uri}-${index}`}
          source={{ uri }}
          style={{ width, height }}
          contentFit="cover"
          transition={180}
          accessibilityLabel={`${label} ${index + 1}`}
          onError={() => setHidden((current) => ({ ...current, [uri]: true }))}
        />
      ))}
    </ScrollView>
  );
}

function LogoMark({ uri, compact, onError }: { uri: string; compact: boolean; onError: () => void }) {
  const size = compact ? 72 : 84;
  return (
    <View style={[styles.logoWrap, { width: size, height: size, borderRadius: size / 2, top: -size / 2 }]}>
      <Image source={{ uri }} style={{ width: size - 6, height: size - 6, borderRadius: size }} contentFit="cover" accessibilityLabel="Caterer logo" onError={onError} />
    </View>
  );
}

function HighlightCard({ item, wide }: { item: Highlight; wide: boolean }) {
  const type = useType();
  return (
    <View style={[styles.highlight, item.accent && styles.highlightAccent, { flexBasis: wide ? '18%' : '47%' }]}>
      <View style={[styles.highlightIcon, item.accent && styles.highlightIconAccent]}>
        <Icon name={item.icon} color={palette.accent} size={16} />
      </View>
      <Text style={[styles.highlightLabel, { fontSize: type.micro }]}>{item.label}</Text>
      <Text style={[styles.highlightValue, item.accent && styles.highlightValueAccent, { fontSize: type.cardTitle }]} numberOfLines={2}>{item.value}</Text>
    </View>
  );
}

function OfferingCard({ offering, lang, wide }: { offering: ApiRecord; lang: Lang; wide: boolean }) {
  const type = useType();
  const [imageFailed, setImageFailed] = useState(false);
  const offeringId = String(offering.offering_id ?? offering.id ?? '');
  const detailQuery = useGetOfferingQuery(offeringId, { skip: !API_ENABLED || !offeringId });
  const detail = recordOf(detailQuery.data, 'offering') ?? {};
  const row = { ...offering, ...detail };
  const title = present(textOf(row, 'title', 'name', 'offering_name', 'package_name'));
  const image = imagesOf(row)[0];
  const showImage = !!image && !imageFailed;
  const amount = priceValue(row);
  const unit = prettyUnit(textOf(row, 'price_type', 'price_unit', 'unit'));
  const category = prettyLabel(textOf(row, 'category_name', 'category', 'cuisine'));
  const parsed = splitDescription(present(textOf(row, 'description', 'details', 'package_description')));
  const included = listOf(row, 'included', 'dishes', 'items', 'contents');
  const extras = included.length ? included : parsed.includes;
  const diet = listOf(row, 'diet', 'dietary', 'allergens');
  const serves = servesLabel(row);

  if (!title && !parsed.body && !amount) return null;

  return (
    <View style={[styles.offeringCard, wide && showImage && styles.offeringCardWide]}>
      {showImage ? (
        <Image
          source={{ uri: image }}
          contentFit="cover"
          transition={180}
          style={wide ? styles.offeringImageWide : styles.offeringImage}
          accessibilityLabel={title ?? 'Package image'}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <View style={styles.offeringContent}>
        <View style={styles.offeringTitleRow}>
          <View style={styles.offeringHeading}>
            {category ? <Text style={[styles.category, { fontSize: type.micro }]}>{category}</Text> : null}
            {title ? <Text style={[styles.offeringTitle, { fontSize: type.cardTitle, lineHeight: type.cardTitle + 4 }]}>{title}</Text> : null}
          </View>
          {amount ? (
            <View style={styles.priceBadge}>
              <Text style={[styles.offeringPrice, { fontSize: type.cardTitle }]}>{money(amount.value, lang)}</Text>
              {unit ? <Text style={[styles.priceUnit, { fontSize: type.micro }]}>{unit}</Text> : null}
            </View>
          ) : null}
        </View>
        {serves ? (
          <View style={styles.metaLine}>
            <Icon name="people" color={palette.accent} size={14} />
            <Text style={[styles.servesText, { fontSize: type.small }]}>{serves}</Text>
          </View>
        ) : null}
        {parsed.body ? <Text style={[styles.description, { fontSize: type.secondary, lineHeight: type.secondary + 6 }]}>{parsed.body}</Text> : null}
        {extras.length ? (
          <View style={styles.includedBlock}>
            <Text style={[styles.blockLabel, { fontSize: type.micro }]}>Included</Text>
            <View style={styles.tags}>
              {extras.map((item) => (
                <View key={item} style={styles.menuChip}>
                  <Text style={[styles.menuChipText, { fontSize: type.small }]}>{prettyLabel(item)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {diet.length ? (
          <View style={styles.tags}>
            {diet.map((item) => (
              <View key={item} style={styles.dietChip}>
                <Text style={[styles.dietText, { fontSize: type.small }]}>{prettyLabel(item)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ReviewCard({ review, lang }: { review: ApiRecord; lang: Lang }) {
  const type = useType();
  const author = present(textOf(review, 'customer_name', 'reviewer_name', 'author', 'name'));
  const rating = numberOf(review, 'rating', 'overall', 'score');
  const date = reviewDate(present(textOf(review, 'created_at', 'review_date', 'date')), lang);
  const body = present(textOf(review, 'body', 'comment', 'review', 'text'));
  const reply = present(textOf(review, 'vendor_response', 'response'));
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <View style={styles.reviewIdentity}>
          {author ? <Text style={[styles.reviewAuthor, { fontSize: type.cardTitle }]} numberOfLines={1}>{author}</Text> : null}
          {date ? <Text style={[styles.reviewDate, { fontSize: type.small }]}>{date}</Text> : null}
        </View>
        {rating !== undefined ? (
          <View style={styles.ratingPill}>
            <Icon name="star" color={palette.accent} size={13} filled />
            <Text style={[styles.ratingText, { fontSize: type.small }]}>{formatRating(rating)}</Text>
          </View>
        ) : null}
      </View>
      {body ? <Text style={[styles.description, { fontSize: type.secondary, lineHeight: type.secondary + 7 }]}>{body}</Text> : null}
      {reply ? <Text style={[styles.reviewReply, { fontSize: type.small, lineHeight: type.small + 5 }]}>Caterer: {reply}</Text> : null}
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
    return { label: 'Verification pending', color: palette.accentDark, bg: palette.accentSoft };
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

function reviewDate(value: string | undefined, lang: Lang) {
  if (!value) return undefined;
  const day = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return dateLong(day, lang);
  return value;
}

function servesLabel(record: ApiRecord) {
  const min = positiveNumber(record, 'min_guests', 'minimum_guests');
  const max = positiveNumber(record, 'max_guests', 'maximum_guests', 'serves', 'guest_count', 'people');
  if (min && max) return `${min}–${max} guests`;
  if (max) return `Serves ${max}`;
  if (min) return `From ${min} guests`;
  return undefined;
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  const type = useType();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { fontSize: type.sectionTitle }]}>{title}</Text>
      <Text style={[styles.sectionCount, { fontSize: type.small }]}>{count}</Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  const type = useType();
  return (
    <View style={styles.tag}>
      <Text style={[styles.tagText, { fontSize: type.small }]}>{label}</Text>
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

function displayable(uri: string) {
  if (/^https?:\/\/[^/\s]+\/data:/i.test(uri)) return false;
  if (/^data:/i.test(uri) && uri.length < 500) return false;
  return true;
}

function imagesOf(record: ApiRecord, keys = [...COVER_KEYS, ...LOGO_KEYS]) {
  const images: string[] = [];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      const normalized = apiMediaUri(value);
      if (normalized && displayable(normalized)) images.push(normalized);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string' && entry.trim()) {
          const normalized = apiMediaUri(entry);
          if (normalized && displayable(normalized)) images.push(normalized);
        } else if (entry && typeof entry === 'object') {
          const uri = textOf(entry as ApiRecord, 'url', 'photo', 'photo_url', 'image', 'image_url', 'path');
          if (uri) {
            const normalized = apiMediaUri(uri);
            if (normalized && displayable(normalized)) images.push(normalized);
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

function priceOf(record: ApiRecord | null, lang: Lang) {
  if (!record) return undefined;
  const price = priceValue(record);
  return price ? money(price.value, lang) : undefined;
}

const styles = StyleSheet.create({
  canvas: { paddingHorizontal: 0, paddingTop: 0, gap: 18, backgroundColor: palette.bg, flexGrow: 1 },
  hero: { backgroundColor: palette.well, overflow: 'hidden' },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 92, backgroundColor: 'rgba(31, 26, 51, 0.28)' },
  heroActions: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  heroButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    ...shadowSoft,
  },
  logoWrap: {
    position: 'absolute',
    left: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 3,
    borderColor: palette.white,
    ...shadowSoft,
  },
  sheet: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    ...shadowSoft,
  },
  providerName: { color: palette.ink, fontWeight: '800', letterSpacing: -0.3 },
  identityRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: palette.inkSecondary, fontWeight: '600' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: palette.accentSoft },
  ratingText: { color: palette.ink, fontWeight: '800' },
  reviewCount: { color: palette.inkSecondary, fontWeight: '600' },
  verifyBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  verifyText: { fontWeight: '700' },
  description: { color: palette.inkSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: palette.accentSoft },
  tagText: { color: palette.accentDark, fontWeight: '700' },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  highlight: { flexGrow: 1, gap: 6, minHeight: 96, padding: 12, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  highlightAccent: { backgroundColor: palette.accentSoft, borderColor: palette.accentMid },
  highlightIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  highlightIconAccent: { backgroundColor: palette.white },
  highlightLabel: { color: palette.muted, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  highlightValue: { color: palette.ink, fontWeight: '800' },
  highlightValueAccent: { color: palette.accentDark },
  sectionRule: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: palette.ink, fontWeight: '800', letterSpacing: -0.2 },
  sectionCount: { minWidth: 28, textAlign: 'center', paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden', borderRadius: 999, backgroundColor: palette.accentSoft, color: palette.accentDark, fontWeight: '800' },
  offeringCard: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, ...shadowSoft },
  offeringCardWide: { flexDirection: 'row' },
  offeringImage: { width: '100%', height: 176, backgroundColor: palette.well },
  offeringImageWide: { width: 230, height: '100%', minHeight: 180, backgroundColor: palette.well },
  offeringContent: { flex: 1, padding: 14, gap: 10 },
  offeringTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  offeringHeading: { flex: 1, gap: 4 },
  offeringTitle: { color: palette.ink, fontWeight: '800' },
  priceBadge: { flexShrink: 0, maxWidth: '48%', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: palette.accentSoft },
  offeringPrice: { color: palette.accentDark, fontWeight: '800', textAlign: 'right' },
  priceUnit: { color: palette.muted, fontWeight: '700', marginTop: 2, textAlign: 'right' },
  category: { color: palette.accentDark, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  servesText: { color: palette.muted, fontWeight: '600' },
  blockLabel: { color: palette.muted, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  includedBlock: { gap: 8 },
  menuChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.well, borderWidth: 1, borderColor: palette.line },
  menuChipText: { color: palette.ink, fontWeight: '600' },
  dietChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.accentSoft },
  dietText: { color: palette.accentDark, fontWeight: '700' },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  summaryScore: { color: palette.ink, fontWeight: '800', letterSpacing: -0.8 },
  summaryCopy: { flex: 1, gap: 4 },
  starRow: { flexDirection: 'row', gap: 3 },
  summaryMeta: { color: palette.inkSecondary, fontWeight: '600' },
  emptyReviews: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  emptyIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  emptyCopy: { flex: 1, gap: 3 },
  emptyReviewsTitle: { color: palette.ink, fontWeight: '800' },
  emptyReviewsBody: { color: palette.muted },
  reviewCard: { padding: 16, gap: 8, borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  reviewIdentity: { flex: 1, gap: 2 },
  reviewAuthor: { color: palette.ink, fontWeight: '800' },
  reviewReply: { color: palette.inkSecondary, fontWeight: '600' },
  reviewDate: { color: palette.muted, fontWeight: '600' },
});
