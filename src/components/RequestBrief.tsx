import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ApiRecord } from '@/api/types';
import { euro } from '@/data/format';
import { Icon, type IconName } from '@/flow2/components/Icon';
import { palette, radius, spacing } from '@/flow2/constants/theme';
import { COUNT_FIELDS, CUISINES, CUISINE_STYLES, DRINK_TYPES, FORMATS, FULFILMENTS, OCCASIONS, SETTINGS, TASKS, VENUE_TYPES, WARE, YES_NO, b, labelOf } from '@/flow2/data/options';
import type { Lang } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';
import { phrase } from '@/localization/phrase';
import { leading, useType } from '@/hooks/use-type';

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'accent';

const HIDDEN = new Set([
  'id', 'request_id', 'provider_id', 'vendor_id', 'outcome_vendor_id', 'outcome_provider_id',
  'parent_request_id', 'revision', 'revision_number', 'created_at', 'updated_at', 'deleted_at',
  'user_id', 'customer_id', 'draft_id', 'token', 'lead_id', 'proposal_id',
]);

const STATUS_LABELS: Record<string, { nl: string; en: string; tone: Tone }> = {
  draft: { nl: 'Concept', en: 'Draft', tone: 'neutral' },
  submitted: { nl: 'Verstuurd', en: 'Submitted', tone: 'accent' },
  open: { nl: 'Open', en: 'Open', tone: 'accent' },
  pending: { nl: 'In afwachting', en: 'Pending', tone: 'warn' },
  matched: { nl: 'Gekoppeld', en: 'Matched', tone: 'good' },
  contact_released: { nl: 'Contact gedeeld', en: 'Contact Shared', tone: 'good' },
  continued: { nl: 'In gesprek', en: 'In conversation', tone: 'accent' },
  proposal: { nl: 'Voorstel ontvangen', en: 'Proposal received', tone: 'accent' },
  closed: { nl: 'Gesloten', en: 'Closed', tone: 'neutral' },
  cancelled: { nl: 'Geannuleerd', en: 'Cancelled', tone: 'bad' },
  canceled: { nl: 'Geannuleerd', en: 'Cancelled', tone: 'bad' },
  completed: { nl: 'Afgerond', en: 'Completed', tone: 'good' },
  expired: { nl: 'Verlopen', en: 'Expired', tone: 'warn' },
  updated: { nl: 'Bijgewerkt', en: 'Updated', tone: 'accent' },
  closed_no_match: { nl: 'Gesloten – geen match', en: 'Closed – No Match', tone: 'neutral' },
  needs_reconfirm: { nl: 'Opnieuw bevestigen', en: 'Needs Reconfirmation', tone: 'warn' },
  interested: { nl: 'Geïnteresseerd', en: 'Interested', tone: 'good' },
  rejected: { nl: 'Afgewezen', en: 'Rejected', tone: 'bad' },
};

const PAST_STATUSES = new Set(['closed', 'closed_no_match', 'cancelled', 'canceled', 'completed', 'expired']);

export function isPastRequest(status: string) {
  return PAST_STATUSES.has(status.toLowerCase());
}

export function requestStatus(status: string) {
  return STATUS_LABELS[status.toLowerCase()] ?? null;
}

export function readableStatus(status: string) {
  return readable(status);
}

export function requestReference(record: ApiRecord, fallback = '') {
  const explicit = text(record, 'reference', 'request_number', 'public_id', 'code');
  if (explicit) return explicit.startsWith('#') ? explicit : `#${explicit}`;
  const raw = text(record, 'request_id', 'id') || fallback;
  if (/^\d+$/.test(raw)) return `#REQ-${raw.padStart(3, '0')}`;
  return raw ? `#${raw.replace(/^#/, '')}` : '';
}

export function requestTitle(record: ApiRecord, lang: Lang) {
  const details = detailsOf(record);
  const occasion = text(details, 'occasion') || text(record, 'occasion');
  const eventType = text(record, 'event_type') || text(details, 'event_type');
  const code = OCCASIONS.some((item) => item.value === occasion) ? occasion : OCCASIONS.some((item) => item.value === eventType) ? eventType : '';
  if (code) return labelOf(OCCASIONS, code, lang);
  const named = text(record, 'event_name', 'title') || eventType;
  return named && named.toLowerCase() !== 'event' ? readable(named) : phrase(b('Evenement', 'Event'), lang);
}

export function requestDate(value: string | undefined, lang: Lang) {
  return prettyDate(value ?? '', lang);
}

export function requestGuestLabel(value: unknown, lang: Lang) {
  return guestLabel(value, lang);
}

/** Prefer the nested request, then fill any missing fields from the parent lead. */
export function requestRecord(lead: ApiRecord | null | undefined): ApiRecord | null {
  if (!lead) return null;
  const nested = lead.request && typeof lead.request === 'object' && !Array.isArray(lead.request) ? lead.request as ApiRecord : null;
  if (!nested) return lead;
  return { ...lead, ...nested, details: nested.details ?? lead.details };
}

export function RequestBrief({ request }: { request: ApiRecord }) {
  const { t, lang } = useApp();
  const type = useType();
  const title = requestTitle(request, lang);
  const when = [prettyDate(field(request, 'event_date', 'date'), lang), timeRange(request, lang)].filter(Boolean).join(' · ');
  const place = [field(request, 'city'), field(request, 'postcode')].filter(Boolean).join(', ');
  const location = [place, field(request, 'location')].filter(Boolean).join(' · ');
  const sections = cateringSections(request, lang, t);
  return (
    <>
      <Text style={[styles.heroTitle, { fontSize: type.screenTitle, lineHeight: leading(type.screenTitle, 4) }]}>{title}</Text>
      <View style={styles.card}>
        <View style={styles.grid}>
          <EventDetailItem icon="calendar" label={t(b('Datum en tijd', 'Date and time'))} value={when} />
          <EventDetailItem icon="people" label={t(b('Gasten', 'Guest count'))} value={guestLabel(field(request, 'guest_count', 'guests'), lang)} />
          <EventDetailItem icon="pin" label={t(b('Plaats', 'City and postcode'))} value={location} />
          <EventDetailItem icon="store" label={t(b('Locatie', 'Venue type'))} value={named(field(request, 'venue_type'), lang, VENUE_TYPES)} />
          <EventDetailItem icon="calendar" label={t(b('Flexibiliteit', 'Date flexibility'))} value={flexibilityLabel(request.flexible_date ?? detailsOf(request).flexible_date, t)} />
        </View>
      </View>
      {sections.length > 0 ? (
        <View style={styles.card}>
          {sections.map((section) => (
            <View key={section.title} style={styles.block}>
              <Text style={[styles.section, { fontSize: type.sectionTitle, lineHeight: leading(type.sectionTitle, 4) }]}>{section.title}</Text>
              {section.rows.map((row) => (
                <View key={`${section.title}-${row.label}`} style={styles.line}>
                  <Text style={[styles.lineLabel, { fontSize: type.caption }]}>{row.label}</Text>
                  <Text style={[styles.lineValue, { fontSize: type.body, lineHeight: leading(type.body, 4) }]}>{row.value}</Text>
                </View>
              ))}
              {section.note ? <Text style={[styles.note, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{section.note}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

export function EventDetailItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const type = useType();
  const { width } = useWindowDimensions();
  if (!value) return null;
  return (
    <View style={[styles.item, width < 360 && styles.itemFull]}>
      <View style={styles.iconBox}>
        <Icon name={icon} color={palette.accentDark} size={16} />
      </View>
      <View style={styles.itemCopy}>
        <Text style={[styles.itemLabel, { fontSize: type.caption, lineHeight: leading(type.caption, 3) }]}>{label}</Text>
        <Text style={[styles.itemValue, { fontSize: type.body, lineHeight: leading(type.body, 4) }]}>{value}</Text>
      </View>
    </View>
  );
}

function cateringSections(record: ApiRecord, lang: Lang, t: (value: { nl: string; en: string }) => string) {
  const details = detailsOf(record);
  const description = splitDescription(field(record, 'description'));
  const sections: { title: string; rows: { label: string; value: string }[]; note?: string }[] = [];
  const services = [...list(record.needs ?? details.needs), ...list(record.services ?? details.services)]
    .map((item) => taskName(item, lang))
    .filter((item) => item && !/^\d+$/.test(item));
  addSection(sections, t(b('Opbouw', 'Event setup')), [
    row(t(b('Service', 'Service type')), join(services)),
    row(t(b('Binnen of buiten', 'Indoor or outdoor')), named(field(record, 'indoor_outdoor'), lang, SETTINGS)),
    row(t(b('Venue', 'Venue')), named(field(record, 'venue_type'), lang, VENUE_TYPES)),
    row(t(b('Levering', 'Delivery or service')), [named(field(record, 'fulfilment'), lang, FULFILMENTS), field(record, 'handover_time')].filter(Boolean).join(' · ')),
  ]);
  addSection(sections, t(b('Menukeuze', 'Menu preferences')), [
    row(t(b('Keuken', 'Cuisine')), join([...list(record.cuisines ?? details.cuisines).map((item) => named(item, lang, CUISINES)), named(field(record, 'cuisine_style'), lang, CUISINE_STYLES)])),
    row(t(b('Serveren', 'Serving style')), named(field(record, 'serving_format'), lang, FORMATS)),
    row(t(b('Dieetvoorkeur', 'Dietary preference')), join(list(record.dietary ?? details.dietary).map((item) => dietName(item, lang)).filter((item) => !/^\d+$/.test(item)))),
    row(t(b('Drank', 'Drinks')), drinksLine(details, record, lang, t)),
  ]);
  addSection(sections, t(b('Gerechten', 'Menu selection')), dishRows(details.counts ?? record.counts, lang));
  addSection(sections, t(b('Dieet en allergieën', 'Dietary requirements')), [
    row(t(b('Halal', 'Halal')), flag(details.halal ?? record.halal, t(b('Ja', 'Yes')))),
    row(t(b('Vegan', 'Vegan')), flag(details.vegan ?? record.vegan, t(b('Ja', 'Yes')))),
    row(t(b('Notities', 'Notes')), field(record, 'diet_notes')),
    row(t(b('Allergieën', 'Allergies')), description.allergies),
    row(t(b('Vermijden', 'Foods to avoid')), description.avoid),
  ]);
  addSection(sections, t(b('Locatievoorzieningen', 'Venue facilities')), [
    row(t(b('Servies', 'Tableware')), named(field(record, 'tableware'), lang, WARE)),
    row(t(b('Borden', 'Plates')), flag(details.plates ?? record.plates, t(b('Ja', 'Yes')))),
    row(t(b('Bestek', 'Cutlery')), flag(details.cutlery ?? record.cutlery, t(b('Ja', 'Yes')))),
    row(t(b('Glazen', 'Glasses')), flag(details.glasses ?? record.glasses, t(b('Ja', 'Yes')))),
    row(t(b('Bediening', 'Staff')), flag(details.staff ?? record.staff, t(b('Ja', 'Yes')))),
    row(t(b('Warmhouden', 'Warming')), flag(details.warming ?? record.warming, t(b('Ja', 'Yes')))),
    row(t(b('Budget', 'Budget')), budgetLabel(record.budget_total_cents ?? details.budget_total_cents)),
  ]);
  if (description.notes) sections.push({ title: t(b('Extra notities', 'Additional notes')), rows: [], note: description.notes });
  return sections;
}

function row(label: string, value: string) {
  return value.trim() ? { label, value: value.trim() } : null;
}

function addSection(sections: { title: string; rows: { label: string; value: string }[]; note?: string }[], title: string, rows: ({ label: string; value: string } | null)[]) {
  const clean = rows.filter((item): item is { label: string; value: string } => Boolean(item));
  if (clean.length > 0) sections.push({ title, rows: clean });
}

function join(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter((item) => item && !/^\d+$/.test(item)))].join(', ');
}

function detailsOf(record: ApiRecord): ApiRecord {
  const value = record.details;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as ApiRecord;
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : {};
}

function field(record: ApiRecord, ...keys: string[]) {
  return text(record, ...keys) || text(detailsOf(record), ...keys);
}

function text(record: ApiRecord | undefined, ...keys: string[]) {
  if (!record) return '';
  for (const key of keys) {
    if (HIDDEN.has(key)) continue;
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : '')).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return list(parsed);
  } catch {
    /* plain text */
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function prettyDate(value: string, lang: Lang) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : lang === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function clock(value: string, lang: Lang) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : lang === 'ar' ? 'ar' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function timeRange(record: ApiRecord, lang: Lang) {
  const start = field(record, 'start_time');
  const end = field(record, 'end_time');
  if (start && end) return `${clock(start, lang)} – ${clock(end, lang)}`;
  return start ? clock(start, lang) : end ? clock(end, lang) : '';
}

function guestLabel(value: unknown, lang: Lang) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return '';
  if (lang === 'nl') return `${count} personen`;
  if (lang === 'ar') return `${count} ضيوف`;
  return `${count} guests`;
}

function flexibilityLabel(value: unknown, t: (value: { nl: string; en: string }) => string) {
  if (value == null || value === '') return '';
  const flexible = value === true || value === 1 || value === '1' || value === 'true';
  return flexible ? t(b('Flexibele datum', 'Flexible date')) : t(b('Vaste datum', 'Fixed date'));
}

function named(value: string, lang: Lang, options?: { value: string; label: { nl: string; en: string } }[]) {
  if (!value) return '';
  if (options?.some((item) => item.value === value)) return labelOf(options, value, lang);
  return readable(value);
}

function taskName(value: string, lang: Lang) {
  const task = TASKS.find((item) => item.key === value);
  return task ? phrase(task.label, lang) : readable(value);
}

function dietName(value: string, lang: Lang) {
  if (value.startsWith('vegetarian:')) {
    const code = value.split(':')[1] ?? '';
    return labelOf([{ value: 'no', label: b('Niet vegetarisch', 'Not vegetarian') }, { value: 'full', label: b('Volledig vegetarisch', 'Fully vegetarian') }, { value: 'mixed', label: b('Gemixt vegetarisch', 'Mixed vegetarian') }], code, lang);
  }
  if (YES_NO.some((item) => item.value === value)) return labelOf(YES_NO, value, lang);
  return readable(value);
}

function dishRows(value: unknown, lang: Lang) {
  const counts = typeof value === 'string' ? parsedObject(value) : value;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return [];
  const record = counts as Record<string, unknown>;
  return COUNT_FIELDS.flatMap((item) => {
    const count = Number(record[item.key]);
    if (!Number.isFinite(count) || count <= 0) return [];
    return [{ label: phrase(item.label, lang), value: String(count) }];
  });
}

function drinksLine(details: ApiRecord, record: ApiRecord, lang: Lang, t: (value: { nl: string; en: string }) => string) {
  const drinks = details.drinks ?? record.drinks;
  if (drinks !== 'yes' && drinks !== true) return '';
  const kind = field(record, 'drink_type');
  const quantity = field(record, 'drink_quantity');
  const label = DRINK_TYPES.some((item) => item.value === kind) ? labelOf(DRINK_TYPES, kind, lang) : '';
  return [t(b('Drank', 'Drinks')), label, quantity].filter(Boolean).join(' · ');
}

function flag(value: unknown, label: string) {
  return value === 'yes' || value === true || value === 1 || value === '1' ? label : '';
}

function budgetLabel(value: unknown) {
  const cents = Number(value);
  if (!Number.isFinite(cents) || cents <= 0) return '';
  return euro(cents);
}

function splitDescription(value: string) {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
  const allergies = lines.find((line) => /^allerg/i.test(line))?.replace(/^allerg(?:y|ies)?\s*:\s*/i, '') ?? '';
  const avoid = lines.find((line) => /^avoid\b/i.test(line))?.replace(/^avoid\s*:\s*/i, '') ?? '';
  const notes = lines.filter((line) => !/^allerg/i.test(line) && !/^avoid\b/i.test(line)).join('\n');
  return { allergies, avoid, notes };
}

function parsedObject(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function readable(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  heroTitle: { color: palette.ink, fontWeight: '700', letterSpacing: -0.3 },
  card: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  item: { width: '50%', paddingHorizontal: 6, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemFull: { width: '100%' },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  itemCopy: { flex: 1, minWidth: 0, gap: 1 },
  itemLabel: { color: palette.muted, fontWeight: '500' },
  itemValue: { color: palette.ink, fontWeight: '500' },
  block: { gap: spacing.sm },
  section: { color: palette.ink, fontWeight: '600' },
  line: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 2 },
  lineLabel: { flex: 1, color: palette.muted, fontWeight: '500' },
  lineValue: { flex: 1, color: palette.ink, fontWeight: '500', textAlign: 'right' },
  note: { color: palette.inkSecondary, fontWeight: '400' },
});
