import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { leading, useType } from '@/hooks/use-type';

export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon = 'lock',
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { isTablet } = useResponsive();
  const type = useType();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.backdrop} onPress={loading ? undefined : onClose} />
        <View style={[styles.card, isTablet && styles.cardWide]}>
          <View style={[styles.icon, danger && styles.iconDanger]}>
            <Icon name={icon} color={danger ? palette.danger : palette.accent} size={20} />
          </View>
          <Text style={[styles.title, { fontSize: type.screenTitle }]}>{title}</Text>
          <Text style={[styles.body, { fontSize: type.body, lineHeight: leading(type.body, 7) }]}>{body}</Text>
          <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} />
          <Button label={cancelLabel} variant="secondary" disabled={loading} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: palette.overlay },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 22,
    gap: 12,
  },
  cardWide: { maxWidth: 400 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: palette.dangerSoft, borderColor: '#FECACA' },
  title: { fontWeight: '800', color: palette.ink, letterSpacing: -0.2 },
  body: { color: palette.muted, marginBottom: 4, fontWeight: '500' },
});
