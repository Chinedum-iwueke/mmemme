import { PropsWithChildren } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { semantic, radius, space, target } from "@mmemme/tokens";

export const colors = {
  ink: semantic.textPrimary,
  plum: semantic.actionPrimary,
  coral: semantic.actionAccent,
  gold: semantic.warning,
  ivory: semantic.canvas,
  white: semantic.surface,
  rose: semantic.surfaceSubtle,
  muted: semantic.textSecondary,
  border: semantic.borderDefault,
  success: semantic.success,
  successSurface: semantic.successSurface,
  warning: semantic.warning,
  warningSurface: semantic.warningSurface,
  error: semantic.error,
  errorSurface: semantic.errorSurface,
  infoSurface: semantic.infoSurface,
  placeholder: semantic.textSecondary,
};

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

type PrimaryButtonProps = Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle> };
export function PrimaryButton({
  children,
  disabled,
  style,
  ...props
}: PropsWithChildren<PrimaryButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

export function TrustBadge({ label = "MMEMME Verified" }: { label?: string }) {
  return (
    <View
      accessibilityLabel={`${label}. Tap vendor profile to see what was checked.`}
      style={styles.badge}
    >
      <Text style={styles.badgeMark}>✓</Text>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.plum,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  button: {
    minHeight: target.control,
    borderRadius: radius.md,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[5],
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.45 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.sm,
    backgroundColor: semantic.trustSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeMark: { color: colors.success, fontWeight: "900" },
  badgeText: { color: colors.success, fontSize: 12, fontWeight: "800" },
});
