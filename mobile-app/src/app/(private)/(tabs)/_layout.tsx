import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { colors, Icon, type IconName } from '@/components/common/ui';

export default function TabsLayout() {
  const icon = (name: IconName) =>
    function TabIcon({ focused }: { focused: boolean }) {
      return (
        <View
          style={{
            width: 48,
            height: 29,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? colors.tint : 'transparent',
          }}
        >
          <Icon name={name} color={focused ? colors.primary : colors.muted} size={21} />
        </View>
      );
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: '#fff', paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingBottom: 3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Tổng quan', tabBarIcon: icon('grid-outline') }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Giao dịch', tabBarIcon: icon('swap-vertical-outline') }}
      />
      <Tabs.Screen
        name="budget"
        options={{ title: 'Ngân sách', tabBarIcon: icon('wallet-outline') }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Báo cáo', tabBarIcon: icon('bar-chart-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Tài khoản', tabBarIcon: icon('person-outline') }}
      />
    </Tabs>
  );
}
