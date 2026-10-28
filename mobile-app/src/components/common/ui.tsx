import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { theme } from '@/theme';
import { monthLabel, shiftMonth } from '@/utils/format';
import { useMonth } from '@/contexts/MonthContext';

export const colors = theme.colors;
export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 22,
  color = colors.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Screen({
  children,
  scroll = true,
  bottomSafe = false,
}: PropsWithChildren<{ scroll?: boolean; bottomSafe?: boolean }>) {
  return (
    <SafeAreaView
      style={s.safe}
      edges={bottomSafe ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.content}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[s.content, s.flex]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={s.heading}>
      <View style={s.flex}>
        {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}
export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Section({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}
export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  icon,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  disabled?: boolean;
}) {
  const background =
    variant === 'secondary' ? colors.tint : variant === 'danger' ? colors.danger : colors.primary;
  const foreground = variant === 'secondary' ? colors.primary : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(loading || disabled), busy: !!loading }}
      disabled={loading || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: background,
          opacity: loading || disabled ? 0.55 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && <Icon name={icon} size={20} color={foreground} />}
          <Text style={[s.buttonLabel, { color: foreground }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  helper,
  icon,
  trailing,
  ...props
}: TextInputProps & { label: string; helper?: string; icon?: IconName; trailing?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View
        style={[
          s.inputFrame,
          focused && s.inputFocused,
          props.editable === false && { opacity: 0.65 },
        ]}
      >
        {icon && (
          <View style={s.inputIcon}>
            <Icon name={icon} size={20} color={focused ? colors.primary : colors.muted} />
          </View>
        )}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#85938B"
          selectionColor={colors.primary}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[
            s.input,
            props.multiline && { minHeight: 104, textAlignVertical: 'top' },
            props.style,
          ]}
        />
        {trailing}
      </View>
      {helper && <Text style={s.helper}>{helper}</Text>}
    </View>
  );
}
export function PasswordField(
  props: Omit<Parameters<typeof Field>[0], 'secureTextEntry' | 'trailing' | 'icon'>,
) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      icon="lock-closed-outline"
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${visible ? 'Ẩn' : 'Hiện'} ${props.label.toLowerCase()}`}
          accessibilityState={{ disabled: props.editable === false }}
          disabled={props.editable === false}
          onPress={() => setVisible((value) => !value)}
          style={({ pressed }) => [s.eye, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
        </Pressable>
      }
    />
  );
}
export function Chips<T extends string>({
  values,
  selected,
  onChange,
}: {
  values: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.chips}>
      {values.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected === item.value }}
          key={item.value}
          onPress={() => onChange(item.value)}
          style={({ pressed }) => [
            s.chip,
            selected === item.value && s.chipActive,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[s.chipText, selected === item.value && { color: '#fff' }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Notice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={s.notice}>
      <View style={[shared.row, { alignItems: 'flex-start', gap: 9 }]}>
        <Icon name="alert-circle-outline" color={colors.danger} size={20} />
        <Text style={[s.noticeText, { flex: 1 }]}>{message}</Text>
      </View>
      {onRetry && (
        <Pressable accessibilityRole="button" onPress={onRetry} style={s.retryButton}>
          <Icon name="refresh-outline" size={16} color={colors.danger} />
          <Text style={s.retry}>Thử lại</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Busy() {
  return (
    <View style={s.busy}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={s.helper}>Đang tải dữ liệu…</Text>
    </View>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name="leaf-outline" size={30} />
      </View>
      <Text style={[s.sectionTitle, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[s.subtitle, { textAlign: 'center' }]}>{description}</Text>
      {action}
    </Card>
  );
}
export function MonthPicker({ disabled = false }: { disabled?: boolean }) {
  const { month, setMonth } = useMonth();
  const previousDisabled = disabled || month === '2000-01';
  const nextDisabled = disabled || month === '2100-12';
  return (
    <View style={s.month}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tháng trước"
        accessibilityState={{ disabled: previousDisabled }}
        disabled={previousDisabled}
        onPress={() => setMonth(shiftMonth(month, -1))}
        style={({ pressed }) => [s.arrow, { opacity: previousDisabled ? 0.3 : pressed ? 0.5 : 1 }]}
      >
        <Icon name="chevron-back" size={18} />
      </Pressable>
      <View style={[shared.row, { gap: 8, flexShrink: 1 }]}>
        <Icon name="calendar-outline" size={17} />
        <Text style={[s.monthText, { flexShrink: 1 }]}>{monthLabel(month)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tháng sau"
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={() => setMonth(shiftMonth(month, 1))}
        style={({ pressed }) => [s.arrow, { opacity: nextDisabled ? 0.3 : pressed ? 0.5 : 1 }]}
      >
        <Icon name="chevron-forward" size={18} />
      </Pressable>
    </View>
  );
}
export function Confirm({
  visible,
  title,
  description,
  onCancel,
  onConfirm,
  busy,
  error,
}: {
  visible: boolean;
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={s.overlay}>
        <View accessibilityViewIsModal style={s.dialog}>
          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <View style={s.confirmIcon}>
              <Icon name="alert-circle-outline" color={colors.danger} size={28} />
            </View>
            <Text accessibilityRole="header" style={s.sectionTitle}>
              {title}
            </Text>
            {!!description && <Text style={s.subtitle}>{description}</Text>}
            <Notice message={error ?? ''} />
            <Button title="Xác nhận" variant="danger" loading={busy} onPress={onConfirm} />
            <Button title="Hủy" variant="secondary" disabled={busy} onPress={onCancel} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export const shared = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  text: { color: colors.text, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  bold: { color: colors.text, fontSize: 16, fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 20,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 4 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 23, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    boxShadow: '0 4px 20px rgba(24, 53, 43, 0.035)',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  button: {
    minHeight: 54,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonLabel: { fontWeight: '700', fontSize: 15 },
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  inputFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#fff',
    boxShadow: '0 0 0 3px rgba(22,101,72,0.08)',
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
    minHeight: 54,
    outlineWidth: 0,
  },
  eye: { width: 48, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  helper: { fontSize: 12, lineHeight: 19, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 11,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  notice: { padding: 14, borderRadius: 12, backgroundColor: colors.dangerTint, gap: 8 },
  noticeText: { color: '#9B3830', fontSize: 13, lineHeight: 21 },
  retry: { color: '#9B3830', fontWeight: '800' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
  },
  busy: { alignItems: 'center', padding: 32, gap: 16 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 14 },
  emptyIcon: { backgroundColor: colors.tint, padding: 18, borderRadius: 24 },
  month: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 3,
  },
  arrow: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 14, fontWeight: '700', color: colors.text },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12,32,22,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
  },
  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
