import { useWindowDimensions } from 'react-native';

const MAX_CONTENT = 960;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const gutter = width < 360 ? 12 : width < 768 ? 16 : 24;
  const frame = Math.min(width, MAX_CONTENT);
  const contentWidth = Math.max(0, frame - gutter * 2);

  return {
    width,
    height,
    gutter,
    contentWidth,
    maxWidth: MAX_CONTENT,
    isCompact: width < 360,
    isTablet: width >= 768,
    isWide: width >= 1100,
    isShort: height < 700,
  };
}
