import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import Svg, { Path } from 'react-native-svg';

const ICONS = {
  search: { ios: 'magnifyingglass', android: 'search' },
  heart: { ios: 'heart', android: 'favorite_border' },
  heartOn: { ios: 'heart.fill', android: 'favorite' },
  chat: { ios: 'bubble.left.and.bubble.right.fill', android: 'chat_bubble' },
  person: { ios: 'person.fill', android: 'person' },
  home: { ios: 'house.fill', android: 'home' },
  food: { ios: 'fork.knife', android: 'restaurant' },
  inbox: { ios: 'tray.fill', android: 'inbox' },
  store: { ios: 'storefront.fill', android: 'storefront' },
  bell: { ios: 'bell.fill', android: 'notifications' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'tune' },
  star: { ios: 'star.fill', android: 'star' },
  pin: { ios: 'mappin', android: 'location_on' },
  plus: { ios: 'plus', android: 'add' },
  close: { ios: 'xmark', android: 'close' },
  check: { ios: 'checkmark', android: 'check' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  doc: { ios: 'doc.text.fill', android: 'description' },
  verified: { ios: 'checkmark.seal.fill', android: 'verified' },
  card: { ios: 'creditcard.fill', android: 'credit_card' },
  send: { ios: 'paperplane.fill', android: 'send' },
  edit: { ios: 'pencil', android: 'edit' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  bookmark: { ios: 'bookmark.fill', android: 'bookmark' },
  people: { ios: 'person.2.fill', android: 'group' },
  book: { ios: 'book.fill', android: 'menu_book' },
  chart: { ios: 'chart.bar.fill', android: 'bar_chart' },
  premium: { ios: 'crown.fill', android: 'workspace_premium' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  place: { ios: 'mappin.circle.fill', android: 'location_on' },
  party: { ios: 'sparkles', android: 'celebration' },
  drink: { ios: 'drop.fill', android: 'local_bar' },
  ice: { ios: 'snowflake', android: 'ac_unit' },
  coffee: { ios: 'cup.and.saucer.fill', android: 'coffee' },
  box: { ios: 'shippingbox.fill', android: 'inventory_2' },
  review: { ios: 'star.bubble.fill', android: 'reviews' },
  lock: { ios: 'lock.fill', android: 'lock' },
  info: { ios: 'info.circle.fill', android: 'info' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  error: { ios: 'xmark.circle.fill', android: 'error' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  forward: { ios: 'chevron.right', android: 'arrow_forward' },
  trash: { ios: 'trash.fill', android: 'delete' },
  photo: { ios: 'photo.fill', android: 'photo' },
  globe: { ios: 'globe', android: 'public' },
  badge: { ios: 'seal.fill', android: 'military_tech' },
  receipt: { ios: 'doc.plaintext', android: 'receipt_long' },
  compare: { ios: 'rectangle.split.2x1', android: 'compare_arrows' },
  forum: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum' },
  event: { ios: 'calendar', android: 'event' },
  done: { ios: 'checkmark.circle.fill', android: 'done' },
  undo: { ios: 'arrow.uturn.backward', android: 'undo' },
  eye: { ios: 'eye.fill', android: 'visibility' },
  phone: { ios: 'phone.fill', android: 'phone' },
  spark: { ios: 'sparkles', android: 'auto_awesome' },
  list: { ios: 'list.bullet', android: 'list' },
  flag: { ios: 'flag.fill', android: 'flag' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  if (name === 'heart' || name === 'heartOn') {
    return <HeartShape filled={name === 'heartOn'} color={color} size={size} />;
  }
  const spec = ICONS[name];
  return (
    <SymbolView
      name={{ ios: spec.ios, android: spec.android, web: spec.android } as SymbolViewProps['name']}
      tintColor={color}
      size={size}
    />
  );
}

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function HeartShape({ filled, color, size }: { filled: boolean; color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HEART}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
