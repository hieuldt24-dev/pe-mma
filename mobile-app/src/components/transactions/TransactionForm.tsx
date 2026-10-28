import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { api } from '@/services/api';
import type { Transaction, TransactionType } from '@/types/finance';
import { categories } from '@/constants/categories';
import { currency, errorMessage, parseMoney, today, transactionDateForMonth } from '@/utils/format';
import {
  Button,
  Card,
  Chips,
  colors,
  Field,
  Heading,
  Icon,
  Notice,
  Screen,
  shared,
} from '@/components/common/ui';

export function TransactionForm({ transaction }: { transaction?: Transaction }) {
  const { token } = useAuth();
  const { month, setMonth } = useMonth();
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [category, setCategory] = useState(transaction?.category ?? categories.expense[0]);
  const [date, setDate] = useState(transaction?.date ?? transactionDateForMonth(month));
  const [note, setNote] = useState(transaction?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function save() {
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      const value = parseMoney(amount);
      const parsed = new Date(`${date}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date ||
        +date.slice(0, 4) < 2000 ||
        +date.slice(0, 4) > 2100
      )
        throw new Error('Nhập ngày hợp lệ dạng YYYY-MM-DD, năm từ 2000 đến 2100.');
      setBusy(true);
      const result = await api<{ transaction: Transaction }>(
        transaction ? `/transactions/${transaction.id}` : '/transactions',
        {
          token,
          method: transaction ? 'PUT' : 'POST',
          body: { type, amount: value, category, date, note: note.trim() },
        },
      );
      setMonth(date.slice(0, 7));
      if (transaction) router.dismissTo(`/transaction/${result.transaction.id}`);
      else router.replace(`/transaction/${result.transaction.id}`);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen bottomSafe>
      <Heading
        eyebrow="SỔ THU CHI"
        title={transaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}
        subtitle="Ghi lại hôm nay để dễ dàng nhìn lại ngày mai."
      />
      <Card>
        <Chips
          values={[
            { value: 'expense', label: '↗  Khoản chi' },
            { value: 'income', label: '↙  Khoản thu' },
          ]}
          selected={type}
          onChange={(value) => {
            if (!busy) {
              setType(value);
              setCategory(categories[value][0]);
            }
          }}
        />
        <View style={{ backgroundColor: colors.tint, padding: 16, borderRadius: 18, gap: 10 }}>
          <Field
            label="Số tiền (VND)"
            icon="cash-outline"
            placeholder="0"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            maxLength={13}
            editable={!busy}
            helper="Nhập số nguyên, không có dấu phân cách."
          />
          <Text
            style={{
              color: colors.primary,
              fontWeight: '800',
              fontSize: 23,
              fontVariant: ['tabular-nums'],
            }}
          >
            {currency(/^\d+$/.test(amount) ? Number(amount) : 0)}
          </Text>
        </View>
        <Text style={shared.bold}>Danh mục</Text>
        <Chips
          values={categories[type].map((value) => ({ value, label: value }))}
          selected={category}
          onChange={(value) => {
            if (!busy) setCategory(value);
          }}
        />
        <Field
          label="Ngày giao dịch"
          icon="calendar-outline"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          autoCorrect={false}
          maxLength={10}
          editable={!busy}
          helper={`Dạng năm-tháng-ngày, ví dụ: ${today()}`}
        />
        <Field
          label="Ghi chú (không bắt buộc)"
          placeholder="Khoản này dành cho…"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={500}
          editable={!busy}
          helper={`${note.length}/500 ký tự`}
        />
      </Card>
      <View style={shared.row}>
        <Icon name="information-circle-outline" size={18} />
        <Text style={[shared.muted, { flex: 1 }]}>Bạn có thể chỉnh sửa giao dịch sau khi lưu.</Text>
      </View>
      <Notice message={error} />
      <Button
        title={transaction ? 'Lưu thay đổi' : 'Lưu giao dịch'}
        icon="checkmark"
        loading={busy}
        onPress={() => void save()}
      />
      <Button
        title="Hủy và quay lại"
        variant="secondary"
        disabled={busy}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/transactions'))}
      />
    </Screen>
  );
}
