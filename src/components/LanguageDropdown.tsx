import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';
import i18n, { changeAppLanguage, DEFAULT_LANGUAGE, getSelectableLanguages, waitForI18n, type LanguageOption } from '@/localization/i18n';

export function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [languages, setLanguages] = useState<LanguageOption[]>(() => getSelectableLanguages());
  const [activeCode, setActiveCode] = useState(i18n.language || DEFAULT_LANGUAGE);

  useEffect(() => {
    let alive = true;
    waitForI18n().then(() => {
      if (!alive) return;
      setLanguages(getSelectableLanguages());
      setActiveCode(i18n.language || DEFAULT_LANGUAGE);
    });
    return () => {
      alive = false;
    };
  }, [i18n]);

  useEffect(() => {
    const onChange = (lng: string) => setActiveCode(lng || DEFAULT_LANGUAGE);
    i18n.on('languageChanged', onChange);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, [i18n]);

  const active = languages.find((item) => item.language_shortname === activeCode) ?? languages.find((item) => item.language_shortname === DEFAULT_LANGUAGE) ?? languages[0];

  const select = async (lang: LanguageOption) => {
    setOpen(false);
    await changeAppLanguage(lang.language_shortname);
    setActiveCode(lang.language_shortname);
  };

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.row}>
        <View style={styles.well}>
          <Icon name="globe" color={palette.accent} size={18} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>Language</Text>
          <Text style={styles.subtitle}>Choose the language for this app</Text>
        </View>
        <View style={styles.trigger}>
          <Text style={styles.triggerText} numberOfLines={1}>
            {active?.language_name ?? activeCode}
          </Text>
          <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
            <Icon name="chevron" color={palette.accent} size={14} />
          </View>
        </View>
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {languages.map((item, index) => {
            const selected = item.language_shortname === active?.language_shortname;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => select(item)}
                style={[styles.option, index > 0 && styles.optionBorder, selected && styles.optionOn]}>
                <Text style={[styles.optionText, selected && styles.optionTextOn]}>{item.language_name}</Text>
                {selected ? <Icon name="check" color={palette.accent} size={16} /> : <View style={styles.checkSpace} />}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  well: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 16, color: palette.ink, fontWeight: '600' },
  subtitle: { fontSize: 13, color: palette.muted, lineHeight: 18 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 150,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  triggerText: { fontSize: 14, fontWeight: '700', color: palette.accentDark },
  menu: {
    marginTop: 4,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
  },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: palette.surface },
  optionBorder: { borderTopWidth: 1, borderTopColor: palette.line },
  optionOn: { backgroundColor: palette.accentSoft },
  optionText: { fontSize: 16, color: palette.ink },
  optionTextOn: { color: palette.accentDark, fontWeight: '700' },
  checkSpace: { width: 16 },
});
