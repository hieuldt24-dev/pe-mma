import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useRemote } from '@/hooks/useRemote';
import { api } from '@/services/api';
import type { TransactionPage } from '@/types/finance';
import { categories } from '@/constants/categories';
import {
  Busy,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  Heading,
  MonthPicker,
  Notice,
  Screen,
  shared,
} from '@/components/common/ui';
import { TransactionRow } from '@/components/transactions/TransactionRow';

export default function TransactionsScreen() {
  const { month } = useMonth();
  return <TransactionsMonth key={month} month={month} />;
}

function TransactionsMonth({ month }: { month: string }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  const { data, loading, error, reload } = useRemote(
    useCallback(
      async (signal: AbortSignal) => {
        const params = new URLSearchParams({ month, page: String(page), limit: '20' });
        if (type !== 'all') params.set('type', type);
        if (category !== 'all') params.set('category', category);
        if (search) params.set('q', search);
        const result = await api<TransactionPage>(`/transactions?${params}`, { token, signal });
        const lastPage = Math.max(1, result.pages);
        if (page > lastPage) {
          params.set('page', String(lastPage));
          return api<TransactionPage>(`/transactions?${params}`, { token, signal });
        }
        return result;
      },
      [month, token, page, type, category, search],
    ),
  );
  const categoryOptions =
    type === 'income'
      ? categories.income
      : type === 'expense'
        ? categories.expense
        : [...categories.income, ...categories.expense];
  return (
    <Screen>
      <Heading eyebrow="SỔ THU CHI" title="Giao dịch" />
      <MonthPicker />
      <Button title="Thêm giao dịch" icon="add" onPress={() => router.push('/transaction/new')} />
      <Field
        label="Tìm kiếm giao dịch"
        icon="search-outline"
        placeholder="Ghi chú hoặc danh mục…"
        value={query}
        onChangeText={setQuery}
        maxLength={100}
        returnKeyType="search"
        autoCorrect={false}
      />
      <Chips
        values={[
          { value: 'all', label: 'Tất cả' },
          { value: 'income', label: 'Khoản thu' },
          { value: 'expense', label: 'Khoản chi' },
        ]}
        selected={type}
        onChange={(value) => {
          setType(value);
          setCategory('all');
          setPage(1);
        }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chips
          values={[
            { value: 'all', label: 'Mọi danh mục' },
            ...categoryOptions.map((value) => ({ value, label: value })),
          ]}
          selected={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
      </ScrollView>
      <Notice message={error} onRetry={reload} />
      {loading && <Busy />}
      {data && (
        <>
          <Text style={shared.muted}>{data.total} giao dịch phù hợp</Text>
          {data.items.length ? (
            <Card>
              {data.items.map((item) => (
                <TransactionRow key={item.id} item={item} />
              ))}
            </Card>
          ) : (
            <Empty
              title="Chưa có giao dịch phù hợp"
              description="Thử một từ khóa, bộ lọc hoặc tháng khác, hoặc thêm giao dịch mới."
              action={
                <Button
                  title="Xóa bộ lọc"
                  variant="secondary"
                  onPress={() => {
                    setQuery('');
                    setSearch('');
                    setType('all');
                    setCategory('all');
                    setPage(1);
                  }}
                />
              }
            />
          )}
          {data.pages > 1 && (
            <View style={{ gap: 12 }}>
              <Text style={[shared.muted, { textAlign: 'center' }]}>
                Trang {data.page} / {data.pages}
              </Text>
              <View style={shared.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Trang trước"
                    variant="secondary"
                    disabled={data.page <= 1}
                    onPress={() => setPage(data.page - 1)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Trang sau"
                    variant="secondary"
                    disabled={data.page >= data.pages}
                    onPress={() => setPage(data.page + 1)}
                  />
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
