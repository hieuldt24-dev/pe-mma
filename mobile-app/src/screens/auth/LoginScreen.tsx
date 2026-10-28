import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  Button,
  Card,
  colors,
  Field,
  Icon,
  Notice,
  PasswordField,
  Screen,
  shared,
} from '@/components/common/ui';
import { errorMessage } from '@/utils/format';

export default function LoginScreen() {
  const { authenticate } = useAuth();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    setError('');
    if (!email.trim() || !password || (register && !name.trim())) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (register && password.length < 8) {
      setError('Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }
    if (register && name.trim().length < 2) {
      setError('Họ tên cần có ít nhất 2 ký tự.');
      return;
    }
    if (register && password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await authenticate(email.trim(), password, register ? name.trim() : undefined);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen bottomSafe>
      <View style={s.hero}>
        <View style={s.brand}>
          <View style={s.logo}>
            <Icon name="wallet-outline" color={colors.primaryDark} size={25} />
          </View>
          <Text style={s.brandName}>
            ví sinh viên<Text style={{ color: colors.accent }}>.</Text>
          </Text>
        </View>
        <View style={s.heroBadge}>
          <Icon name="sparkles-outline" size={14} color={colors.accent} />
          <Text style={s.badgeText}>THÓI QUEN NHỎ · TƯƠNG LAI LỚN</Text>
        </View>
        <Text accessibilityRole="header" style={s.heroTitle}>
          Chi tiêu hôm nay.{'\n'}
          <Text style={{ color: colors.accent }}>Chủ động ngày mai.</Text>
        </Text>
        <Text style={s.heroDescription}>
          Quản lý thu chi, giữ vững ngân sách và dành nhiều hơn cho điều bạn muốn.
        </Text>
      </View>
      <Card>
        <View style={s.formHeading}>
          <Text style={s.formTitle}>
            {register ? 'Tạo tài khoản của bạn' : 'Chào mừng trở lại'}
          </Text>
        </View>
        {register && (
          <Field
            label="Họ và tên"
            icon="person-outline"
            placeholder="Nguyễn Minh Anh"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            maxLength={60}
            editable={!busy}
          />
        )}
        <Field
          label="Email"
          icon="mail-outline"
          placeholder="ban@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          maxLength={254}
          editable={!busy}
        />
        <PasswordField
          key={register ? 'register-password' : 'login-password'}
          label="Mật khẩu"
          placeholder={register ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu của bạn'}
          value={password}
          onChangeText={setPassword}
          autoComplete={register ? 'new-password' : 'current-password'}
          editable={!busy}
          returnKeyType={register ? 'next' : 'go'}
          onSubmitEditing={register ? undefined : () => void submit()}
        />
        {register && (
          <PasswordField
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChangeText={setConfirm}
            autoComplete="new-password"
            editable={!busy}
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
        )}
        <Notice message={error} />
        <Button
          title={register ? 'Tạo tài khoản' : 'Đăng nhập'}
          icon="arrow-forward"
          loading={busy}
          onPress={() => void submit()}
        />
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setRegister((value) => !value);
            setError('');
            setPassword('');
            setConfirm('');
          }}
          style={s.switch}
        >
          <Text style={shared.muted}>
            {register ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <Text style={shared.link}>{register ? 'Đăng nhập' : 'Đăng ký ngay'}</Text>
          </Text>
        </Pressable>
      </Card>
      <View style={s.foot}>
        <Icon name="shield-checkmark-outline" size={16} />
        <Text style={shared.muted}>Không gian tài chính riêng của bạn</Text>
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  hero: { backgroundColor: colors.primaryDark, borderRadius: 28, padding: 24, gap: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  badgeText: { color: '#D0E3D7', fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  heroTitle: {
    color: '#fff',
    fontSize: 29,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  heroDescription: { color: '#C5DACF', fontSize: 14, lineHeight: 23 },
  formHeading: { gap: 7, marginBottom: 6 },
  formTitle: { fontSize: 23, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  switch: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: 10 },
  foot: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
