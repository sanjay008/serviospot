import { type ReactNode } from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'search'
  | 'store'
  | 'inbox'
  | 'chat'
  | 'person'
  | 'people'
  | 'calendar'
  | 'check'
  | 'close'
  | 'chevron'
  | 'back'
  | 'plus'
  | 'minus'
  | 'filter'
  | 'star'
  | 'pin'
  | 'send'
  | 'doc'
  | 'compare'
  | 'clock'
  | 'food'
  | 'info'
  | 'warning'
  | 'verified'
  | 'spark'
  | 'list'
  | 'heart'
  | 'globe'
  | 'receipt'
  | 'lock'
  | 'eye'
  | 'edit'
  | 'card'
  | 'refresh'
  | 'party'
  | 'drink'
  | 'box'
  | 'chart'
  | 'photo';

const ICONS: Record<IconName, () => ReactNode> = {
  home: () => (
    <>
      <Path d="M3 10.5 12 3l9 7.5" />
      <Path d="M5 9.8V21h14V9.8" />
      <Path d="M9.5 21v-6h5v6" />
    </>
  ),
  search: () => (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Line x1={20} y1={20} x2={16.2} y2={16.2} />
    </>
  ),
  store: () => (
    <>
      <Path d="M4 9.5 5.2 4h13.6L20 9.5" />
      <Path d="M4.5 9.5V20h15V9.5" />
      <Path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  inbox: () => (
    <>
      <Path d="M3 13h5l2 3h4l2-3h5" />
      <Path d="M6.5 5 3 13v6h18v-6L17.5 5z" />
    </>
  ),
  chat: () => <Path d="M4 5h16v11H8l-4 4z" />,
  person: () => (
    <>
      <Circle cx={12} cy={8} r={3.6} />
      <Path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  people: () => (
    <>
      <Circle cx={9} cy={8} r={3.2} />
      <Path d="M3 20a6 6 0 0 1 12 0" />
      <Path d="M16 5.4a3 3 0 0 1 1 5.6" />
      <Path d="M17 14.6a6 6 0 0 1 4 5.4" />
    </>
  ),
  calendar: () => (
    <>
      <Rect x={3.5} y={5} width={17} height={16} rx={2.5} />
      <Line x1={3.5} y1={10} x2={20.5} y2={10} />
      <Line x1={8} y1={3} x2={8} y2={6.5} />
      <Line x1={16} y1={3} x2={16} y2={6.5} />
    </>
  ),
  check: () => <Path d="M20 6.5 9.5 17 4 11.5" />,
  close: () => (
    <>
      <Line x1={6} y1={6} x2={18} y2={18} />
      <Line x1={18} y1={6} x2={6} y2={18} />
    </>
  ),
  chevron: () => <Path d="M9 5l7 7-7 7" />,
  back: () => <Path d="M15 5l-7 7 7 7" />,
  plus: () => (
    <>
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </>
  ),
  minus: () => <Line x1={5} y1={12} x2={19} y2={12} />,
  filter: () => <Path d="M3 5h18l-7 8.2V19l-4-2v-3.8z" />,
  star: () => <Path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z" />,
  pin: () => (
    <>
      <Path d="M12 21c4-4.6 7-8 7-11a7 7 0 1 0-14 0c0 3 3 6.4 7 11z" />
      <Circle cx={12} cy={10} r={2.6} />
    </>
  ),
  send: () => (
    <>
      <Path d="M21 3 10.5 13.5" />
      <Path d="M21 3l-6.5 18-4-8-8-4z" />
    </>
  ),
  doc: () => (
    <>
      <Path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <Path d="M13 3v6h6" />
    </>
  ),
  compare: () => (
    <>
      <Rect x={3.5} y={4} width={7} height={16} rx={1.5} />
      <Rect x={13.5} y={4} width={7} height={16} rx={1.5} />
    </>
  ),
  clock: () => (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M12 7.5V12l3 2" />
    </>
  ),
  food: () => (
    <>
      <Path d="M4 3v6a3 3 0 0 0 6 0V3" />
      <Line x1={7} y1={9} x2={7} y2={21} />
      <Path d="M16.5 3c-1.4 1.2-2.5 3-2.5 5v6h5V3" />
      <Line x1={19} y1={14} x2={19} y2={21} />
    </>
  ),
  info: () => (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Line x1={12} y1={11} x2={12} y2={16} />
      <Line x1={12} y1={8} x2={12} y2={8.4} />
    </>
  ),
  warning: () => (
    <>
      <Path d="M12 3.5 21 20H3z" />
      <Line x1={12} y1={10} x2={12} y2={14} />
      <Line x1={12} y1={17} x2={12} y2={17.4} />
    </>
  ),
  verified: () => (
    <>
      <Path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
      <Path d="M9 12l2 2 4-4" />
    </>
  ),
  spark: () => <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  list: () => (
    <>
      <Line x1={8} y1={6} x2={20} y2={6} />
      <Line x1={8} y1={12} x2={20} y2={12} />
      <Line x1={8} y1={18} x2={20} y2={18} />
      <Line x1={4} y1={6} x2={4} y2={6.4} />
      <Line x1={4} y1={12} x2={4} y2={12.4} />
      <Line x1={4} y1={18} x2={4} y2={18.4} />
    </>
  ),
  heart: () => <Path d="M12 20s-7-4.4-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.7C19 15.6 12 20 12 20z" />,
  globe: () => (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M3.5 12h17" />
      <Path d="M12 3.5c2.5 2.3 3.8 5.4 3.8 8.5S14.5 18.2 12 20.5C9.5 18.2 8.2 15.1 8.2 12S9.5 5.8 12 3.5z" />
    </>
  ),
  receipt: () => (
    <>
      <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <Line x1={9} y1={8} x2={15} y2={8} />
      <Line x1={9} y1={12} x2={15} y2={12} />
    </>
  ),
  lock: () => (
    <>
      <Rect x={5} y={10.5} width={14} height={10} rx={2.5} />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  eye: () => (
    <>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  edit: () => (
    <>
      <Path d="M4 20h4L19 9l-4-4L4 16z" />
      <Path d="M14 6l4 4" />
    </>
  ),
  card: () => (
    <>
      <Rect x={3} y={5.5} width={18} height={13} rx={2.5} />
      <Line x1={3} y1={10} x2={21} y2={10} />
    </>
  ),
  refresh: () => <Path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />,
  party: () => <Path d="M4 20l6-14 8 8z" />,
  drink: () => (
    <>
      <Path d="M6 4h12l-6 8z" />
      <Line x1={12} y1={12} x2={12} y2={20} />
      <Line x1={8} y1={20} x2={16} y2={20} />
    </>
  ),
  box: () => (
    <>
      <Path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <Path d="M4 8l8 4 8-4" />
      <Path d="M12 12v8" />
    </>
  ),
  chart: () => (
    <>
      <Line x1={4} y1={20} x2={4} y2={11} />
      <Line x1={12} y1={20} x2={12} y2={4} />
      <Line x1={20} y1={20} x2={20} y2={14} />
    </>
  ),
  photo: () => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2.5} />
      <Circle cx={8.5} cy={10} r={1.6} />
      <Path d="M4 17l4.5-4 3.5 3 3-2.5L20 17" />
    </>
  ),
};

export function Icon({ name, color, size = 22, filled }: { name: IconName; color: string; size?: number; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]()}
    </Svg>
  );
}
