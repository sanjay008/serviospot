import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { MenuDishImage } from '@/flow2/components/MenuDishImage';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';

export default function VendorMenuTab() {
  const { menuItems, toggleMenuItem } = useApp();

  return (
    <Screen header={<Header title="Your menu" subtitle="Packages customers can discover on your profile" />}>
      <View style={styles.topRow}>
        <View><Text style={styles.count}>{menuItems.length}</Text><Text style={styles.sub}>menu packages</Text></View>
        <Button label="+ Add menu" onPress={() => router.push('/vendor/add-menu' as any)} />
      </View>
      <SectionTitle title="Published packages" subtitle="Switch a package off to hide it from customers." />
      {menuItems.length === 0 ? <Card><Text style={styles.emptyText}>Add your first dish or menu package to show it on your customer profile.</Text><Button label="Add first menu item" onPress={() => router.push('/vendor/add-menu' as any)} /></Card> : null}
      {menuItems.map((item) => <Card key={item.id} style={[styles.item, !item.active && styles.inactive]}>
        <MenuDishImage name={item.name} description={item.description} imageUri={item.imageUri} style={styles.dishImage} />
        <View style={styles.itemHead}>
          <View style={styles.itemText}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.price}>€{item.price.toFixed(2)} <Text style={styles.per}>/ guest · starting price</Text></Text></View>
        </View>
        <Text style={styles.description}>{item.description}</Text>
        <Button label={item.active ? 'Visible to customers · Hide' : 'Hidden · Show to customers'} variant="secondary" onPress={() => toggleMenuItem(item.id)} />
      </Card>)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { color: palette.ink, fontSize: 25, fontWeight: '800' },
  sub: { color: palette.muted, fontSize: 13 },
  item: { gap: 10 },
  inactive: { opacity: 0.65 },
  dishImage: { height: 160, borderRadius: 14 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { flex: 1, gap: 3 },
  itemName: { fontSize: 16, fontWeight: '800', color: palette.ink },
  price: { color: palette.accentDark, fontWeight: '800' },
  per: { color: palette.muted, fontSize: 12, fontWeight: '500' },
  description: { color: palette.ink, fontSize: 14, lineHeight: 20 },
  emptyText: { color: palette.muted, fontSize: 14, lineHeight: 20 },
});
