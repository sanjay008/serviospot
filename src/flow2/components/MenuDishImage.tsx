import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { menuImageFor } from '@/flow2/data/menu-images';

export function MenuDishImage({ name, description, imageUri, style }: { name: string; description: string; imageUri?: string; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  const source = imageUri || menuImageFor(name, name, description);

  return (
    <View style={[styles.frame, style]}>
      {failed ? (
        <View style={styles.fallback}><Icon name="food" color={palette.accentDark} size={26} /></View>
      ) : (
        <Image
          source={{ uri: source }}
          style={styles.image}
          contentFit="cover"
          transition={160}
          accessibilityLabel={`${name} dish`}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: palette.accentSoft },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
});
