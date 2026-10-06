import { parseEuro } from '@/data/format';
import type { Offering, Provider, SearchFilters } from '@/data/types';

export function searchProviders(providers: Provider[], offerings: Offering[], query: string, filters: SearchFilters) {
  const q = query.trim().toLowerCase();
  const guests = Number(filters.guests);
  const maxPrice = filters.maxPrice ? parseEuro(filters.maxPrice) : 0;
  const maxMinOrder = filters.maxMinOrder ? parseEuro(filters.maxMinOrder) : 0;

  return providers
    .filter((provider) => {
      const mine = offerings.filter((item) => item.providerId === provider.id && item.active);
      if (q) {
        const hay = [provider.name, provider.city, provider.intro, ...provider.cuisines, ...provider.services, ...mine.map((item) => item.title)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.city && !`${provider.city} ${provider.postcode}`.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.distanceKm != null && provider.distanceKm > filters.distanceKm) return false;
      if (filters.cuisine && !provider.cuisines.includes(filters.cuisine)) return false;
      if (filters.category) {
        const hit = provider.services.includes(filters.category) || mine.some((item) => item.category === filters.category);
        if (!hit) return false;
      }
      if (filters.eventType && !provider.eventTypes.includes(filters.eventType)) return false;
      if (guests && (guests < provider.minGuests || guests > provider.maxGuests)) return false;
      if (maxPrice && provider.startingPriceCents > maxPrice) return false;
      if (filters.dietary.length && !filters.dietary.every((tag) => provider.dietary.includes(tag) || mine.some((item) => item.dietary.includes(tag)))) return false;
      if (filters.fulfillment.length && !filters.fulfillment.every((mode) => mine.some((item) => item.fulfillment.includes(mode)))) return false;
      if (filters.staff && !provider.services.includes('Staff')) return false;
      if (filters.minRating != null && provider.rating < filters.minRating) return false;
      if (filters.verifiedOnly && !provider.verified) return false;
      if (maxMinOrder && provider.minOrderCents > maxMinOrder) return false;
      return true;
    })
    .sort((a, b) => relevance(b) - relevance(a));
}

function relevance(provider: Provider) {
  return provider.rating * 20 - provider.distanceKm * 0.12 + (provider.verified ? 1.5 : 0);
}
