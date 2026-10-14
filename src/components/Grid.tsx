import { Children, isValidElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsive } from '@/hooks/use-responsive';

export function Grid({
  children,
  minItem = 160,
  maxColumns = 4,
  gap = 10,
  style,
}: {
  children: ReactNode;
  minItem?: number;
  maxColumns?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { contentWidth } = useResponsive();
  const items = Children.toArray(children);
  const columns = Math.max(1, Math.min(maxColumns, Math.floor((contentWidth + gap) / (minItem + gap)) || 1));
  const itemWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>
      {items.map((child, index) => {
        const key = isValidElement(child) && child.key != null ? String(child.key) : String(index);
        return (
          <View key={key} style={{ width: itemWidth }}>
            {child}
          </View>
        );
      })}
    </View>
  );
}
