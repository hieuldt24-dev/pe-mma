import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Transaction } from '@/types/finance';
import { currency, dateLabel } from '@/utils/format';
import { colors, Icon } from '@/components/common/ui';

export function TransactionRow({ item }: { item: Transaction }) {
  const income = item.type === 'income';
  const categoryIcons = {
    'Ăn uống': 'restaurant-outline',
    'Nhà ở': 'home-outline',
    'Đi lại': 'bus-outline',
    'Học tập': 'book-outline',
    'Mua sắm': 'bag-handle-outline',
    'Giải trí': 'game-controller-outline',
    'Sức khỏe': 'medkit-outline',
    'Gia đình': 'people-outline',
    'Làm thêm': 'briefcase-outline',
    'Học bổng': 'school-outline',
    'Quà tặng': 'gift-outline',
  } as const;
  const icon =
    categoryIcons[item.category as keyof typeof categoryIcons] ??
    (income ? 'arrow-down-outline' : 'arrow-up-outline');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.category}, ${currency(item.amount)}, ${dateLabel(item.date)}`}
      onPress={() => router.push(`/transaction/${item.id}`)}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[s.icon, { backgroundColor: income ? colors.tint : colors.warningTint }]}>
        <Icon name={icon} size={21} color={income ? colors.primary : '#946523'} />
      </View>
      <View style={s.content}>
        <Text style={s.category}>{item.category}</Text>
        {!!item.note && (
          <Text numberOfLines={1} style={s.note}>
            {item.note}
          </Text>
        )}
        <Text style={s.date}>{dateLabel(item.date)}</Text>
      </View>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[s.amount, { color: income ? colors.primary : colors.text }]}
      >
        {income ? '+' : '−'}
        {currency(item.amount)}
      </Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minWidth: 0, gap: 5 },
  category: { color: colors.text, fontWeight: '700', fontSize: 14 },
  note: { color: colors.muted, fontSize: 12 },
  date: { color: colors.muted, fontSize: 11 },
  amount: { fontWeight: '700', fontSize: 14, maxWidth: '43%', fontVariant: ['tabular-nums'] },
});
