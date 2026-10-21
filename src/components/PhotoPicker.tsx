import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';

type Shape = 'logo' | 'wide';

export function PhotoPicker({
  label,
  value,
  onChange,
  shape = 'wide',
  centered = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (uri: string) => void;
  shape?: Shape;
  /** Round photo in the middle, with no gallery text beside it. */
  centered?: boolean;
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [pickError, setPickError] = useState('');
  const logo = shape === 'logo';

  const pick = async () => {
    if (busy) return;
    setBusy(true);
    setPickError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted && permission.status === 'denied' && !permission.canAskAgain) {
        setPickError('Allow photo access in Settings, then try again.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: logo ? [1, 1] : [4, 3],
        quality: 0.6,
        base64: true,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;
      onChange(asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri);
    } catch {
      setPickError('Could not open your gallery. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, centered && styles.centered]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, !logo && styles.column, centered && styles.centeredRow]}>
        <View style={centered ? styles.avatarWrap : styles.fill}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={value ? `Change ${label.toLowerCase() || 'photo'}` : `Choose ${label.toLowerCase() || 'photo'}`}
            onPress={pick}
            style={({ pressed }) => [logo ? styles.logo : styles.wide, centered && styles.logoLarge, pressed && styles.pressed]}>
            {value ? (
              <Image source={{ uri: value }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <View style={styles.empty}>
                <Icon name={centered ? 'person' : 'photo'} color={palette.accent} size={centered ? 36 : logo ? 28 : 32} />
                {!logo ? <Text style={styles.hint}>Tap to choose from gallery</Text> : null}
              </View>
            )}
          </Pressable>
          {centered ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Choose from gallery" onPress={pick} style={styles.badge} hitSlop={6}>
              <Icon name="photo" color="#fff" size={16} />
            </Pressable>
          ) : null}
        </View>
        {centered ? null : (
          <View style={[styles.actions, !logo && styles.actionsWide]}>
            <Pressable accessibilityRole="button" onPress={pick} style={styles.action} hitSlop={8}>
              <Icon name="photo" color={palette.accent} size={18} />
              <Text style={styles.actionText}>{busy ? 'Opening gallery…' : value ? 'Change photo' : 'Choose from gallery'}</Text>
            </Pressable>
            {value ? (
              <Pressable accessibilityRole="button" onPress={() => onChange('')} style={styles.action} hitSlop={8}>
                <Icon name="trash" color={palette.danger} size={18} />
                <Text style={[styles.actionText, styles.remove]}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
      {centered && value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => onChange('')} hitSlop={8}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      ) : null}
      {pickError || error ? <Text style={styles.error}>{pickError || error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  centered: { alignItems: 'center' },
  centeredRow: { justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700', color: palette.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  column: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  fill: { width: '100%' },
  avatarWrap: { width: 120, height: 120 },
  logo: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: palette.line },
  logoLarge: { width: 120, height: 120, borderRadius: 60 },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    borderWidth: 3,
    borderColor: palette.bg,
  },
  wide: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, overflow: 'hidden', backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: palette.line },
  pressed: { opacity: 0.85 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  hint: { fontSize: 14, color: palette.muted },
  actions: { flex: 1, gap: 12 },
  actionsWide: { flex: 0, flexDirection: 'row', gap: 20 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  actionText: { fontSize: 15, fontWeight: '600', color: palette.accentDark },
  remove: { color: palette.danger },
  error: { fontSize: 13, color: palette.danger },
});
