import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useRemote } from '@/hooks/useRemote';
import { api } from '@/services/api';
import type { Summary } from '@/types/finance';
import { currency, errorMessage, parseMoney } from '@/utils/format';
import { BudgetProgress } from '@/components/budget/BudgetProgress';
import {
  Busy,
  Button,
  Card,
  colors,
  Field,
  Heading,
  Icon,
  MonthPicker,
  Notice,
  Screen,
  Section,
  shared,
} from '@/components/common/ui';

export default function BudgetScreen() {
  const { month } = useMonth();
  return <BudgetMonth key={month} month={month} />;
}

function BudgetMonth({ month }: { month: string }) {
  const { token } = useAuth();
  const [limit, setLimit] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState('');
  const submitting = useRef(false);
  const { data, loading, error, reload } = useRemote(
    useCallback(
      (signal: AbortSignal) => api<Summary>(`/summary?month=${month}`, { token, signal }),
      [token, month],
    ),
  );
  async function save() {
    if (submitting.current) return;
    submitting.current = true;
    setSaveError('');
    setSaved('');
    try {
      const amount = parseMoney(limit ?? String(data?.budget ?? ''));
      setBusy(true);
      await api(`/budgets/${month}`, { token, method: 'PUT', body: { limit: amount } });
      setSaved(`Đã lưu ngân sách ${currency(amount)}.`);
      reload();
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading eyebrow="KẾ HOẠCH CỦA BẠN" title="Ngân sách" />
      <MonthPicker disabled={busy} />
      <Notice message={error} onRetry={reload} />
      {loading && <Busy />}
      {data && (
        <>
          <Card>
            <View style={shared.between}>
              <Text style={shared.muted}>TỔNG CHI THÁNG NÀY</Text>
              <Icon name="wallet-outline" />
            </View>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                ...shared.bold,
                fontSize: 34,
                letterSpacing: -1,
                fontVariant: ['tabular-nums'],
              }}
            >
              {currency(data.expense)}
            </Text>
            {data.budget ? (
              <BudgetProgress expense={data.expense} limit={data.budget} />
            ) : (
              <Text style={shared.muted}>Bạn chưa đặt ngân sách cho tháng này.</Text>
            )}
          </Card>
          <Section title="Hạn mức chi tiêu" />
          <Card>
            <Field
              label="Ngân sách tháng (VND)"
              icon="cash-outline"
              placeholder="Ví dụ: 3000000"
              keyboardType="number-pad"
              value={limit ?? String(data.budget ?? '')}
              onChangeText={(value) => {
                setLimit(value);
                setSaved('');
              }}
              maxLength={13}
              editable={!busy}
              helper="Tổng số tiền bạn dự định chi trong tháng, không có dấu phân cách."
            />
            <Text style={shared.muted}>Chọn nhanh một hạn mức</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[2000000, 3000000, 5000000].map((value) => (
                <Button
                  key={value}
                  title={`${value / 1000000} triệu`}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => {
                    setLimit(String(value));
                    setSaved('');
                  }}
                />
              ))}
            </View>
            <Notice message={saveError} />
            {!!saved && (
              <View
                accessibilityRole="alert"
                style={{
                  backgroundColor: colors.tint,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Icon name="checkmark-circle" size={20} />
                <Text style={[shared.link, { flex: 1 }]}>{saved}</Text>
              </View>
            )}
            <Button
              title={data.budget ? 'Cập nhật ngân sách' : 'Lưu ngân sách'}
              icon="checkmark"
              loading={busy}
              onPress={() => void save()}
            />
          </Card>
          <Card style={{ backgroundColor: colors.warningTint, borderColor: '#EFE1C8' }}>
            <View style={shared.row}>
              <Icon name="bulb-outline" color="#946523" />
              <Text style={shared.bold}>Chủ động từ những điều nhỏ</Text>
            </View>
            <Text style={shared.muted}>
              Dành trước tiền cho nhà ở, ăn uống và học tập. Ứng dụng hiển thị nhắc nhở khi bạn dùng
              từ 80% ngân sách và khi chạm hoặc vượt hạn mức.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
