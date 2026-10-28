import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/utils/format';
import {
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

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function signOut() {
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    setBusy(true);
    try {
      await logout();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading eyebrow="KHÔNG GIAN CỦA BẠN" title="Tài khoản" />
      <Card
        style={{
          alignItems: 'center',
          paddingVertical: 32,
          backgroundColor: colors.primaryDark,
          borderColor: colors.primaryDark,
        }}
      >
        <View style={s.avatar}>
          <Text style={s.initial}>{user?.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, textAlign: 'center' }}>
          {user?.name}
        </Text>
        <Text style={{ color: '#C5DACF', fontSize: 14, textAlign: 'center' }}>{user?.email}</Text>
        <View style={s.badge}>
          <Icon name="leaf-outline" size={14} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>
            Mỗi ngày một thói quen tốt
          </Text>
        </View>
      </Card>
      <Card>
        <View style={shared.row}>
          <Icon name="shield-checkmark-outline" />
          <Text style={shared.bold}>Dữ liệu theo tài khoản</Text>
        </View>
        <Text style={shared.muted}>
          Giao dịch và ngân sách được lưu riêng cho tài khoản của bạn. Đăng nhập lại để tiếp tục sử
          dụng trên thiết bị này.
        </Text>
      </Card>
      <Card>
        <View style={shared.row}>
          <Icon name="wallet-outline" />
          <Text style={shared.bold}>Ví Sinh Viên</Text>
        </View>
        <Text style={shared.muted}>Quản lý thu chi và ngân sách cá nhân.</Text>
        <View style={s.infoRow}>
          <Text style={shared.muted}>Đơn vị tiền tệ</Text>
          <Text style={shared.bold}>VND · Việt Nam Đồng</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={shared.muted}>Phiên bản</Text>
          <Text style={shared.bold}>1.0.0</Text>
        </View>
      </Card>
      <Notice message={error} />
      <Button
        title="Đăng xuất"
        icon="log-out-outline"
        variant="secondary"
        onPress={() => {
          setError('');
          setConfirm(true);
        }}
      />
      <Confirm
        visible={confirm}
        title="Đăng xuất tài khoản?"
        busy={busy}
        error={error}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void signOut()}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#375F4C',
  },
  initial: { color: colors.primaryDark, fontSize: 32, fontWeight: '800' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    backgroundColor: '#285342',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
