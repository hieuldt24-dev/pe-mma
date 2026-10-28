import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useRemote } from '@/hooks/useRemote';
import { api } from '@/services/api';
import type { Transaction } from '@/types/finance';
import { currency, dateLabel, errorMessage } from '@/utils/format';
import {
  Busy,
  Button,
  Card,
  colors,
  Confirm,
  Heading,
  Icon,
  Notice,
  Screen,
  shared,
} from '@/components/common/ui';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { setMonth } = useMonth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const submitting = useRef(false);
  const { data, loading, error, reload } = useRemote(
    useCallback(
      (signal: AbortSignal) =>
        api<{ transaction: Transaction }>(`/transactions/${id}`, { token, signal }),
      [id, token],
    ),
  );
  function goToList() {
    if (data) setMonth(data.transaction.date.slice(0, 7));
    router.dismissTo('/transactions');
  }
  async function remove() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setDeleteError('');
    try {
      await api(`/transactions/${id}`, { token, method: 'DELETE' });
      setConfirm(false);
      goToList();
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const item = data?.transaction;
  return (
    <Screen bottomSafe>
      <Heading
        eyebrow="GIAO DỊCH CỦA BẠN"
        title="Chi tiết giao dịch"
        subtitle="Tất cả thông tin trong một khoản thu chi."
      />
      <Notice message={error} onRetry={reload} />
      {loading && <Busy />}
      {item && (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <View style={s.icon}>
              <Icon name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} size={30} />
            </View>
            <Text style={shared.muted}>{item.type === 'income' ? 'Khoản thu' : 'Khoản chi'}</Text>
            <Text
              style={[s.amount, { color: item.type === 'income' ? colors.primary : colors.text }]}
            >
              {item.type === 'income' ? '+' : '−'}
              {currency(item.amount)}
            </Text>
            <Text style={shared.bold}>{item.category}</Text>
          </Card>
          <Card>
            <View style={shared.between}>
              <Text style={shared.muted}>Ngày giao dịch</Text>
              <Text style={shared.bold}>{dateLabel(item.date)}</Text>
            </View>
            <Text style={shared.muted}>Ghi chú</Text>
            <Text style={shared.text}>{item.note || 'Không có ghi chú'}</Text>
          </Card>
          <Button
            title="Chỉnh sửa giao dịch"
            icon="create-outline"
            onPress={() => router.push(`/transaction/edit/${item.id}`)}
          />
          <Button
            title="Xóa giao dịch"
            variant="danger"
            icon="trash-outline"
            onPress={() => {
              setDeleteError('');
              setConfirm(true);
            }}
          />
        </>
      )}
      <Button title="Về danh sách" variant="secondary" disabled={busy} onPress={goToList} />
      <Confirm
        visible={confirm}
        title="Xóa giao dịch này?"
        description="Giao dịch sẽ bị xóa và số liệu thu chi, ngân sách sẽ được tính lại. Thao tác này không thể hoàn tác."
        onCancel={() => setConfirm(false)}
        onConfirm={() => void remove()}
        busy={busy}
        error={deleteError}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  icon: { backgroundColor: colors.tint, padding: 20, borderRadius: 25 },
  amount: {
    fontWeight: '800',
    fontSize: 30,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.8,
  },
});
