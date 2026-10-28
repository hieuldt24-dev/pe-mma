import { Stack } from 'expo-router';
import { MonthProvider } from '@/contexts/MonthContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivateLayout() {
  const { user } = useAuth();
  return (
    <MonthProvider key={user?.id}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transaction/new" />
        <Stack.Screen name="transaction/[id]" />
        <Stack.Screen name="transaction/edit/[id]" />
      </Stack>
    </MonthProvider>
  );
}
