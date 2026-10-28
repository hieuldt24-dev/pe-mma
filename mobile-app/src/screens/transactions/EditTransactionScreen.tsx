import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Busy, Button, Notice, Screen } from '@/components/common/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/useRemote';
import { api } from '@/services/api';
import type { Transaction } from '@/types/finance';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { data, loading, error, reload } = useRemote(
    useCallback(
      (signal: AbortSignal) =>
        api<{ transaction: Transaction }>(`/transactions/${id}`, { token, signal }),
      [id, token],
    ),
  );
  if (data) return <TransactionForm key={data.transaction.id} transaction={data.transaction} />;
  return (
    <Screen>
      {loading && <Busy />}
      <Notice message={error} onRetry={reload} />
      <Button
        title="Về danh sách"
        variant="secondary"
        onPress={() => router.dismissTo('/transactions')}
      />
    </Screen>
  );
}
