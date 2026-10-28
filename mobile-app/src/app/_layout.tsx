import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Busy, Button, Heading, Notice, Screen } from '@/components/common/ui';

function Routes() {
  const { token, loading, startupError, restore } = useAuth();
  if (loading)
    return (
      <Screen>
        <Busy />
      </Screen>
    );
  if (startupError)
    return (
      <Screen>
        <Heading
          title="Kết nối lại"
          subtitle="Cần xác minh phiên đã lưu trước khi mở dữ liệu của bạn."
        />
        <Notice message={startupError} />
        <Button title="Thử kết nối lại" onPress={() => void restore()} />
      </Screen>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(private)" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Routes />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
