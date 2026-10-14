import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { SectionTitle } from '@/components/SectionTitle';
import { palette } from '@/constants/theme';
import { dateLong, money, pluralGuests } from '@/data/format';
import { b, COUNT_FIELDS, CUISINES, CUISINE_STYLES, FORMATS, OCCASIONS, SETTINGS, TASKS, WARE, labelOf, totalDishes } from '@/data/options';
import type { RequestDraft } from '@/data/types';
import { useApp } from '@/state/app';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function RequestSummary({ request }: { request: RequestDraft }) {
  const { t, lang } = useApp();
  const yesNo = (value: 'yes' | 'no') => (value === 'yes' ? t(b('Ja', 'Yes')) : t(b('Nee', 'No')));
  const visibleCounts = COUNT_FIELDS.filter((field) => request.counts[field.key] > 0);
  const enabledTasks = TASKS.filter((task) => request.tasks[task.key] === 'yes');

  return (
    <View style={styles.wrap}>
      <Card>
        <SectionTitle title={t(b('Evenement en locatie', 'Event and location'))} />
        <Row label={t(b('Aantal personen', 'Guests'))} value={pluralGuests(request.guests, lang)} />
        <Row label={t(b('Datum', 'Date'))} value={dateLong(request.date, lang)} />
        <Row label={t(b('Stad', 'City'))} value={`${request.city} ${request.postcode}`} />
        <Row label={t(b('Locatie', 'Location'))} value={request.venueType === 'venue' ? request.venueName || t(b('Venue', 'Venue')) : t(b('Thuis', 'Home'))} />
        <Row label={t(b('Binnen / buiten', 'Indoor / outdoor'))} value={labelOf(SETTINGS, request.setting, lang)} />
        <Row label={t(b('Gelegenheid', 'Occasion'))} value={labelOf(OCCASIONS, request.occasion, lang)} />
      </Card>

      <Card>
        <SectionTitle title={t(b('Cateringperiode', 'Catering period'))} />
        <Row label={t(b('Catering start / einde', 'Catering start / end'))} value={`${request.start} - ${request.end}`} />
        <Row label={t(b('Einddatum (na middernacht)', 'End date (overnight)'))} value={dateLong(request.endDate, lang)} />
        <Row label={t(b('Bezorgen / ophalen', 'Delivery / pickup'))} value={request.staff === 'yes' ? t(b('Bediening op locatie', 'Staffed on-site')) : request.fulfilment === 'delivery' ? t(b('Bezorgen', 'Delivery')) : t(b('Ophalen', 'Pickup'))} />
        {request.staff === 'no' ? <Row label={t(b('Bezorg- / ophaaltijd', 'Delivery / pickup time'))} value={request.handoverTime} /> : null}
      </Card>

      <Card>
        <SectionTitle title={t(b('Keuken en gerechten', 'Cuisine and dishes'))} subtitle={`${totalDishes(request.counts)} ${t(b('verschillende gerechten', 'distinct dishes'))}`} />
        <Row label={t(b('Keuken', 'Cuisine'))} value={labelOf(CUISINES, request.cuisine, lang)} />
        {request.cuisine === 'surinamese' ? <Row label={t(b('Stijl', 'Style'))} value={labelOf(CUISINE_STYLES, request.cuisineStyle, lang)} /> : null}
        <Row label={t(b('Vegetarisch', 'Vegetarian'))} value={request.vegetarian === 'full' ? t(b('Volledig', 'Full')) : request.vegetarian === 'mixed' ? t(b('Gemixt', 'Mixed')) : t(b('Nee', 'No'))} />
        <Row label={t(b('Serveervorm', 'Serving format'))} value={labelOf(FORMATS, request.format, lang)} />
        {visibleCounts.map((field) => (
          <Row key={field.key} label={t(field.label)} value={String(request.counts[field.key])} />
        ))}
      </Card>

      <Card>
        <SectionTitle title={t(b('Bediening, taken en materialen', 'Staff, tasks and equipment'))} />
        <Row label={t(b('Bediening', 'Staff'))} value={yesNo(request.staff)} />
        {enabledTasks.length ? <Row label={t(b('Taken', 'Tasks'))} value={enabledTasks.map((task) => t(task.label)).join(', ')} /> : null}
        <Row label={t(b('Servies', 'Tableware'))} value={labelOf(WARE, request.ware, lang)} />
        {request.ware !== 'own' ? <Row label={t(b('Borden / bestek / glazen', 'Plates / cutlery / glasses'))} value={`${yesNo(request.plates)} / ${yesNo(request.cutlery)} / ${yesNo(request.glasses)}`} /> : null}
        <Row label={t(b('Warmhoudbakken', 'Warming trays'))} value={yesNo(request.warm)} />
      </Card>

      <Card>
        <SectionTitle title={t(b('Extra wensen en dieet', 'Extra wishes and diet'))} />
        <Row label={t(b('Drank', 'Drinks'))} value={yesNo(request.drinks)} />
        <Row label={t(b('Halal vereist', 'Halal required'))} value={yesNo(request.halal)} />
        <Row label={t(b('Veganistische opties', 'Vegan options'))} value={yesNo(request.vegan)} />
        <Row label={t(b('Allergieën', 'Allergies'))} value={request.allergies || t(b('Geen opgegeven', 'None given'))} />
        <Row label={t(b('Verboden ingrediënten', 'Forbidden ingredients'))} value={request.forbidden || t(b('Geen', 'None'))} />
        <Row label={t(b('Budget (incl. btw)', 'Budget (incl. VAT)'))} value={request.budget > 0 ? money(request.budget, lang) : t(b('Onbekend', 'Unknown'))} />
        {request.comments ? <Row label={t(b('Opmerkingen', 'Comments'))} value={request.comments} /> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  label: { flex: 1, fontSize: 14, color: palette.muted },
  value: { flex: 1, fontSize: 14, fontWeight: '600', color: palette.ink, textAlign: 'right' },
});
