import { Ionicons } from "@expo/vector-icons";
import { type PropsWithChildren, type ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageProps,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, semantic, space, target, type as typography } from "@mmemme/tokens";
export function SafeScreen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={s.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
export function KeyboardForm({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.flex}>
      {children}
    </KeyboardAvoidingView>
  );
}
type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  accessibilityLabel: string;
  style?: ViewStyle;
}>;
export function Button({
  children,
  onPress,
  disabled,
  busy = false,
  variant = "primary",
  accessibilityLabel,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        s[`button_${variant}`],
        pressed && s.pressed,
        (disabled || busy) && s.disabled,
        style,
      ]}
    >
      <Text style={[s.buttonLabel, s[`buttonLabel_${variant}`]]}>
        {busy ? "Please wait…" : children}
      </Text>
    </Pressable>
  );
}
export function TextLink({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={s.linkTarget}
    >
      <Text style={s.link}>{children}</Text>
    </Pressable>
  );
}
export function Input({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled: props.editable === false }}
        style={[s.input, error && s.inputError]}
        placeholderTextColor={semantic.textSecondary}
        {...props}
      />
      {(error || hint) && (
        <Text
          accessibilityLiveRegion={error ? "polite" : "none"}
          style={[s.help, error && s.error]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}
export function DateInput(props: Omit<React.ComponentProps<typeof Input>, "inputMode">) {
  return <Input inputMode="numeric" placeholder="DD / MM / YYYY" {...props} />;
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View accessibilityRole="radiogroup" style={s.options}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === option.value }}
            onPress={() => onChange(option.value)}
            style={[s.option, value === option.value && s.optionSelected]}
          >
            <Text style={s.optionText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Currency({ kobo, qualifier }: { kobo: number; qualifier?: string }) {
  return (
    <Text style={s.currency}>
      {qualifier && <Text style={s.currencyQualifier}>{qualifier} </Text>}₦
      {Math.round(kobo / 100).toLocaleString("en-NG")}
    </Text>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: PropsWithChildren<{ tone?: "neutral" | "trust" | "info" | "success" | "warning" | "error" }>) {
  return (
    <View style={[s.badge, s[`badge_${tone}`]]}>
      <Text style={[s.badgeText, s[`badgeText_${tone}`]]}>{children}</Text>
    </View>
  );
}
export function Card({
  children,
  accessibilityLabel,
  onPress,
}: {
  children: ReactNode;
  accessibilityLabel?: string;
  onPress?: () => void;
}) {
  const body = <View style={s.card}>{children}</View>;
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}
export function ProductImage(props: ImageProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      style={[s.image, props.style]}
      resizeMode="cover"
      {...props}
    />
  );
}
export function StepTrail({ items }: { items: string[] }) {
  return (
    <View accessibilityLabel={`Progress: ${items.join(", then ")}`} style={s.trail}>
      {items.map((item, index) => (
        <Text key={item} style={s.trailText}>
          {index ? " / " : ""}
          {item}
        </Text>
      ))}
    </View>
  );
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <View accessibilityLabel={`Page ${page} of ${pages}`} style={s.pagination}>
      <Button
        accessibilityLabel="Previous page"
        variant="secondary"
        disabled={page === 1}
        onPress={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <Text>
        Page {page} of {pages}
      </Text>
      <Button
        accessibilityLabel="Next page"
        variant="secondary"
        disabled={page === pages}
        onPress={() => onChange(page + 1)}
      >
        Next
      </Button>
    </View>
  );
}
export function Skeleton({ label = "Loading content" }: { label?: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} style={s.skeleton} />;
}
function State({
  title,
  children,
  tone = "neutral",
  action,
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "error";
  action?: ReactNode;
}) {
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "summary"}
      style={[s.state, tone === "error" && s.stateError]}
    >
      <Text style={s.stateTitle}>{title}</Text>
      <Text style={s.stateBody}>{children}</Text>
      {action}
    </View>
  );
}
export const EmptyState = (props: Omit<React.ComponentProps<typeof State>, "tone">) => (
  <State tone="neutral" {...props} />
);
export const ErrorState = (props: Omit<React.ComponentProps<typeof State>, "tone">) => (
  <State tone="error" {...props} />
);
export function FormError({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="alert" style={s.formError}>
      <Text style={s.errorTitle}>Check your details</Text>
      <Text style={s.error}>{children}</Text>
    </View>
  );
}
type Overlay = { visible: boolean; title: string; children: ReactNode; onClose: () => void };
export function Dialog({ visible, title, children, onClose }: Overlay) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View accessibilityViewIsModal accessibilityRole="alert" style={s.dialog}>
          <Text style={s.overlayTitle}>{title}</Text>
          {children}
          <Button accessibilityLabel="Close dialog" variant="secondary" onPress={onClose}>
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
}
export function Sheet({ visible, title, children, onClose }: Overlay) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[s.backdrop, s.sheetBackdrop]}>
        <View accessibilityViewIsModal style={s.sheet}>
          <Text style={s.overlayTitle}>{title}</Text>
          {children}
          <Button accessibilityLabel="Close sheet" variant="secondary" onPress={onClose}>
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
}
export function Toast({
  children,
  tone = "info",
}: PropsWithChildren<{ tone?: "info" | "success" | "error" }>) {
  return (
    <View
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      style={[s.toast, s[`toast_${tone}`]]}
    >
      <Text style={s.toastText}>{children}</Text>
    </View>
  );
}
export function IconLabel({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={s.iconLabel}>
      <Ionicons name={icon} size={20} color={semantic.textPrimary} />
      <Text>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: semantic.canvas },
  flex: { flex: 1 },
  content: { padding: space[5], paddingBottom: space[16], gap: space[5] },
  button: {
    minHeight: target.control,
    borderRadius: radius.md,
    paddingHorizontal: space[5],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  button_primary: { backgroundColor: semantic.actionPrimary, borderColor: semantic.actionPrimary },
  button_accent: { backgroundColor: semantic.actionAccent, borderColor: semantic.actionAccent },
  button_secondary: { backgroundColor: semantic.surface, borderColor: semantic.actionPrimary },
  button_ghost: { backgroundColor: "transparent", borderColor: "transparent" },
  button_danger: { backgroundColor: semantic.error, borderColor: semantic.error },
  buttonLabel: { fontSize: typography.size.label, fontWeight: "700" },
  buttonLabel_primary: { color: semantic.actionPrimaryText },
  buttonLabel_accent: { color: semantic.actionAccentText },
  buttonLabel_secondary: { color: semantic.actionPrimary },
  buttonLabel_ghost: { color: semantic.actionPrimary },
  buttonLabel_danger: { color: semantic.textInverse },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  linkTarget: { minHeight: target.minimum, justifyContent: "center" },
  link: { color: semantic.actionPrimary, textDecorationLine: "underline", fontWeight: "700" },
  field: { gap: space[2] },
  label: { color: semantic.textPrimary, fontSize: typography.size.label, fontWeight: "700" },
  input: {
    minHeight: target.large,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
    paddingHorizontal: space[4],
    fontSize: typography.size.body,
    color: semantic.textPrimary,
  },
  inputError: { borderColor: semantic.error },
  help: { color: semantic.textSecondary, fontSize: typography.size.caption },
  error: { color: semantic.error },
  errorTitle: { color: semantic.error, fontWeight: "700" },
  options: { gap: space[2] },
  option: {
    minHeight: target.minimum,
    borderWidth: 1,
    borderColor: semantic.borderDefault,
    borderRadius: radius.md,
    padding: space[3],
    justifyContent: "center",
  },
  optionSelected: { borderColor: semantic.actionPrimary, backgroundColor: semantic.trustSurface },
  optionText: { color: semantic.textPrimary, fontWeight: "600" },
  currency: {
    fontSize: typography.size.heading3,
    fontWeight: "700",
    color: semantic.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  currencyQualifier: { fontSize: typography.size.label, color: semantic.textSecondary },
  badge: {
    alignSelf: "flex-start",
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    backgroundColor: semantic.surfaceSubtle,
  },
  badgeText: {
    fontSize: typography.size.caption,
    fontWeight: "700",
    color: semantic.textSecondary,
  },
  badge_neutral: {},
  badge_trust: { backgroundColor: semantic.trustSurface },
  badge_info: { backgroundColor: semantic.infoSurface },
  badge_success: { backgroundColor: semantic.successSurface },
  badge_warning: { backgroundColor: semantic.warningSurface },
  badge_error: { backgroundColor: semantic.errorSurface },
  badgeText_neutral: {},
  badgeText_trust: { color: semantic.trustText },
  badgeText_info: { color: semantic.info },
  badgeText_success: { color: semantic.success },
  badgeText_warning: { color: semantic.warning },
  badgeText_error: { color: semantic.error },
  card: {
    padding: space[5],
    borderWidth: 1,
    borderColor: semantic.borderDefault,
    borderRadius: radius.lg,
    backgroundColor: semantic.surface,
    gap: space[2],
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: semantic.surfaceSubtle,
  },
  trail: { flexDirection: "row", flexWrap: "wrap" },
  trailText: { color: semantic.textSecondary, fontSize: typography.size.caption },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  skeleton: { height: 120, borderRadius: radius.lg, backgroundColor: semantic.surfaceSubtle },
  state: {
    padding: space[5],
    borderWidth: 1,
    borderColor: semantic.borderDefault,
    borderRadius: radius.lg,
    gap: space[2],
  },
  stateError: { borderColor: semantic.errorBorder, backgroundColor: semantic.errorSurface },
  stateTitle: {
    fontSize: typography.size.heading3,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  stateBody: { fontSize: typography.size.body, color: semantic.textSecondary, lineHeight: 24 },
  formError: {
    padding: space[4],
    borderWidth: 1,
    borderColor: semantic.errorBorder,
    borderRadius: radius.md,
    backgroundColor: semantic.errorSurface,
    gap: space[1],
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(21,35,31,.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: space[4],
  },
  dialog: {
    width: "100%",
    maxWidth: 560,
    borderRadius: radius.xl,
    padding: space[6],
    backgroundColor: semantic.surface,
    gap: space[4],
  },
  sheetBackdrop: { justifyContent: "flex-end" },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: radius.xl,
    padding: space[6],
    backgroundColor: semantic.surface,
    gap: space[4],
  },
  overlayTitle: {
    fontSize: typography.size.heading2,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  toast: { padding: space[4], borderRadius: radius.md, backgroundColor: semantic.infoSurface },
  toast_info: { backgroundColor: semantic.infoSurface },
  toast_success: { backgroundColor: semantic.successSurface },
  toast_error: { backgroundColor: semantic.errorSurface },
  toastText: { color: semantic.textPrimary, fontWeight: "600" },
  iconLabel: { flexDirection: "row", alignItems: "center", gap: space[2] },
});
