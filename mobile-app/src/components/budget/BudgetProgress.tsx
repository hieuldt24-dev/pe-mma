import { StyleSheet, Text, View } from 'react-native';
import { currency } from '@/utils/format';
import { colors, shared } from '@/components/common/ui';

export function BudgetProgress({ expense, limit }: { expense: number; limit: number }) {
  const percent = limit > 0 ? Math.max(0, (expense / limit) * 100) : 0;
  const color = percent >= 100 ? colors.danger : percent >= 80 ? colors.gold : colors.primary;
  return (
    <View style={s.container}>
      <View style={shared.between}>
        <Text style={shared.muted}>Đã dùng {Math.round(percent)}%</Text>
        <Text style={[shared.bold, { color, flexShrink: 1 }]}>{currency(expense)}</Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Ngân sách đã sử dụng"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.min(100, Math.round(percent)),
          text: `${Math.round(percent)}%`,
        }}
        style={s.track}
      >
        <View style={[s.bar, { width: `${Math.min(100, percent)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[shared.muted, { color }]}>
        {expense > limit
          ? `Vượt ngân sách ${currency(expense - limit)}`
          : expense === limit
            ? 'Bạn đã sử dụng hết ngân sách tháng này.'
            : `Còn ${currency(limit - expense)} trong ngân sách`}
      </Text>
      {percent >= 80 && percent < 100 && (
        <Text style={[shared.muted, { color }]}>
          Bạn đã dùng từ 80% hạn mức. Hãy cân nhắc các khoản chi tiếp theo.
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container: { gap: 12 },
  track: { height: 10, backgroundColor: colors.tint, borderRadius: 10, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 10 },
});
