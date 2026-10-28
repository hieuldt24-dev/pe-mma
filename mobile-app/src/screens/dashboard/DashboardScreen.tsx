import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useRemote } from '@/hooks/useRemote';
import { api } from '@/services/api';
import type { Summary, TransactionPage } from '@/types/finance';
import { currency } from '@/utils/format';
import {
  Busy,
  Button,
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
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { BudgetProgress } from '@/components/budget/BudgetProgress';

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const { month } = useMonth();
  const { data, loading, error, reload } = useRemote(
    useCallback(
      async (signal: AbortSignal) => {
        const [summary, recent] = await Promise.all([
          api<Summary>(`/summary?month=${month}`, { token, signal }),
          api<TransactionPage>(`/transactions?month=${month}&limit=5`, { token, signal }),
        ]);
        return { summary, recent };
      },
      [token, month],
    ),
  );
  return (
    <Screen>
      <Heading
        eyebrow="VÍ SINH VIÊN"
        title={`Chào ${user?.name.split(' ').pop() ?? 'bạn'}`}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tải lại"
            onPress={reload}
            style={({ pressed }) => [s.refresh, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Icon name="refresh-outline" size={21} />
          </Pressable>
        }
      />
      <MonthPicker />
      <Notice message={error} onRetry={reload} />
      {loading && <Busy />}
      {data && (
        <>
          <View style={s.balance}>
            <View style={shared.between}>
              <Text style={s.balanceLabel}>SỐ DƯ TRONG THÁNG</Text>
              <View style={s.wallet}>
                <Icon name="wallet-outline" color={colors.accent} size={21} />
              </View>
            </View>
            <Text adjustsFontSizeToFit numberOfLines={1} style={s.balanceAmount}>
              {currency(data.summary.balance)}
            </Text>
            <Text style={s.balanceHint}>Thu nhập trừ chi tiêu của tháng đã chọn</Text>
            <View style={s.divider} />
            <View style={s.metrics}>
              <View style={s.metric}>
                <View style={shared.row}>
                  <Icon name="arrow-down-circle" color={colors.accent} size={20} />
                  <Text style={s.metricLabel}>Tổng thu</Text>
                </View>
                <Text adjustsFontSizeToFit numberOfLines={1} style={s.metricValue}>
                  {currency(data.summary.income)}
                </Text>
              </View>
              <View style={s.metric}>
                <View style={shared.row}>
                  <Icon name="arrow-up-circle" color="#F2CCA0" size={20} />
                  <Text style={s.metricLabel}>Tổng chi</Text>
                </View>
                <Text adjustsFontSizeToFit numberOfLines={1} style={s.metricValue}>
                  {currency(data.summary.expense)}
                </Text>
              </View>
            </View>
          </View>
          <Button
            title="Thêm giao dịch"
            icon="add"
            onPress={() => router.push('/transaction/new')}
          />
          <Section
            title="Ngân sách tháng"
            action={
              <Pressable onPress={() => router.push('/budget')}>
                <Text style={shared.link}>Điều chỉnh</Text>
              </Pressable>
            }
          />
          <Card>
            {data.summary.budget ? (
              <BudgetProgress expense={data.summary.expense} limit={data.summary.budget} />
            ) : (
              <>
                <Text style={shared.bold}>Mỗi tháng, một kế hoạch</Text>
                <Text style={shared.muted}>
                  Đặt hạn mức để chủ động với những khoản chi của bạn.
                </Text>
                <Button
                  title="Đặt ngân sách"
                  variant="secondary"
                  onPress={() => router.push('/budget')}
                />
              </>
            )}
          </Card>
          <Section
            title="Giao dịch gần đây"
            action={
              <Pressable onPress={() => router.push('/transactions')}>
                <Text style={shared.link}>Xem tất cả</Text>
              </Pressable>
            }
          />
          {data.recent.items.length ? (
            <Card>
              {data.recent.items.map((item) => (
                <TransactionRow key={item.id} item={item} />
              ))}
            </Card>
          ) : (
            <Empty
              title="Khởi đầu từ một giao dịch"
              description="Ghi lại khoản thu hoặc chi đầu tiên trong tháng này."
            />
          )}
        </>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  refresh: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: {
    backgroundColor: colors.primaryDark,
    borderRadius: 28,
    padding: 24,
    gap: 12,
    boxShadow: '0 10px 24px rgba(16,62,48,0.14)',
  },
  wallet: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#285342',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: { color: '#C6E2D1', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  balanceAmount: {
    color: '#fff',
    fontSize: 38,
    lineHeight: 49,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  balanceHint: { color: '#B6DCC5', fontSize: 12, lineHeight: 19 },
  divider: { height: 1, backgroundColor: '#375F4C', marginVertical: 6 },
  metrics: { flexDirection: 'row', gap: 16 },
  metric: { flex: 1, minWidth: 0, gap: 10 },
  metricLabel: { color: '#C6E2D1', fontSize: 12 },
  metricValue: { color: '#fff', fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
