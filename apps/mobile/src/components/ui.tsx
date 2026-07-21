import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

export const colors = {
  ink: "#321527", plum: "#6F214E", coral: "#D85E69", gold: "#B47B18",
  ivory: "#FFF9F3", white: "#FFFFFF", rose: "#F8E8EC", muted: "#725F69",
  border: "#E8D9DD", success: "#176B52",
};

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

type PrimaryButtonProps = Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle> };
export function PrimaryButton({ children, disabled, style, ...props }: PropsWithChildren<PrimaryButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled, style]}
      {...props}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

export function TrustBadge({ label = "MMEMME Verified" }: { label?: string }) {
  return (
    <View accessibilityLabel={`${label}. Tap vendor profile to see what was checked.`} style={styles.badge}>
      <Text style={styles.badgeMark}>✓</Text><Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.plum, fontSize: 12, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" },
  button: { minHeight: 54, borderRadius: 18, backgroundColor: colors.plum, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.84 }, disabled: { opacity: 0.45 },
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "#E6F4EE", paddingHorizontal: 10, paddingVertical: 6 },
  badgeMark: { color: colors.success, fontWeight: "900" },
  badgeText: { color: colors.success, fontSize: 12, fontWeight: "800" },
});
