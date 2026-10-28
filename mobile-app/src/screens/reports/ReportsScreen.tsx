import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useRemote } from '@/hooks/useRemote';
import { api } from '@/services/api';
import type { Summary } from '@/types/finance';
import { currency } from '@/utils/format';
import { categoryColors } from '@/constants/categories';
import {
  Busy,
  Card,
  colors,
  Empty,
  Heading,
  Icon,
  MonthPicker,
  Notice,
  Screen,
  Section,
  shared,
} from '@/components/common/ui';

export default function ReportsScreen() {
  const { token } = useAuth();
  const { month } = useMonth();
  const { data, loading, error, reload } = useRemote(
    useCallback(
      (signal: AbortSignal) => api<Summary>(`/summary?month=${month}`, { token, signal }),
      [token, month],
    ),
  );
  const max = Math.max(data?.income ?? 0, data?.expense ?? 0, 1);
  return (
    <Screen>
      <Heading eyebrow="HIỂU THÓI QUEN CỦA BẠN" title="Báo cáo tháng" />
      <MonthPicker />
      <Notice message={error} onRetry={reload} />
      {loading && <Busy />}
      {data && (
        <>
          <Card style={{ backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }}>
            <View style={shared.between}>
              <Text style={{ color: '#C5DACF', fontSize: 12, fontWeight: '700' }}>
                CHÊNH LỆCH THU CHI
              </Text>
              <Icon name="analytics-outline" color={colors.accent} />
            </View>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                color: '#fff',
                fontSize: 32,
                fontWeight: '800',
                letterSpacing: -1,
                fontVariant: ['tabular-nums'],
              }}
            >
              {currency(data.balance)}
            </Text>
            <Text style={{ color: '#C5DACF', fontSize: 13 }}>
              {data.count} giao dịch trong tháng đã chọn
            </Text>
          </Card>
          <Card>
            <Text style={shared.bold}>Thu nhập & chi tiêu</Text>
            {[
              { label: 'Tổng thu', amount: data.income, color: colors.primary },
              { label: 'Tổng chi', amount: data.expense, color: '#B68029' },
            ].map((row) => (
              <View key={row.label} style={s.group}>
                <View style={shared.between}>
                  <View style={shared.row}>
                    <View style={[s.dot, { backgroundColor: row.color }]} />
                    <Text style={shared.muted}>{row.label}</Text>
                  </View>
                  <Text style={[shared.bold, { flexShrink: 1 }]}>{currency(row.amount)}</Text>
                </View>
                <View accessibilityLabel={`${row.label}: ${currency(row.amount)}`} style={s.track}>
                  <View
                    style={[
                      s.bar,
                      { width: `${(row.amount / max) * 100}%`, backgroundColor: row.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Card>
          <Section title="Chi tiêu theo danh mục" />
          {data.categories.length ? (
            <Card>
              <View style={s.stacked}>
                {data.categories.map((row, index) => (
                  <View
                    key={row.category}
                    style={{
                      flex: row.amount,
                      backgroundColor: categoryColors[index % categoryColors.length],
                    }}
                  />
                ))}
              </View>
              {data.categories.map((row, index) => (
                <View key={row.category} style={s.group}>
                  <View style={shared.between}>
                    <View style={[shared.row, { flex: 1 }]}>
                      <View
                        style={[
                          s.dot,
                          { backgroundColor: categoryColors[index % categoryColors.length] },
                        ]}
                      />
                      <Text style={shared.text}>{row.category}</Text>
                    </View>
                    <Text style={shared.bold}>
                      {Math.round((row.amount / data.expense) * 100)}%
                    </Text>
                  </View>
                  <Text style={[shared.muted, { marginLeft: 22 }]}>{currency(row.amount)}</Text>
                </View>
              ))}
              <Text style={shared.muted}>
                Chi nhiều nhất: {data.categories[0].category}. Biểu đồ tính theo tổng chi của tháng
                được chọn.
              </Text>
            </Card>
          ) : (
            <Empty
              title="Chưa có khoản chi"
              description="Biểu đồ sẽ xuất hiện khi bạn ghi lại chi tiêu trong tháng này."
            />
          )}
        </>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  group: { gap: 9, marginVertical: 8 },
  track: { height: 12, backgroundColor: colors.tint, borderRadius: 8, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 8 },
  stacked: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 12,
    gap: 3,
  },
  dot: { width: 10, height: 10, borderRadius: 4 },
});
