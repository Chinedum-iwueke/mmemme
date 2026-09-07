import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, semantic, space, target } from "@mmemme/tokens";

const destinations = [
  { label: "Discover", icon: "search-outline" as const, active: "search" as const, href: "/" },
  { label: "Plan", icon: "heart-outline" as const, active: "heart" as const, href: "/shortlist" },
  {
    label: "Bookings",
    icon: "calendar-outline" as const,
    active: "calendar" as const,
    href: "/bookings",
  },
  {
    label: "Profile",
    icon: "person-outline" as const,
    active: "person" as const,
    href: "/profile",
  },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => NetInfo.addEventListener((state) => setOffline(state.isConnected === false)), []);

  return (
    <View style={styles.shell}>
      {offline && (
        <View accessibilityRole="alert" style={styles.offline}>
          <Ionicons name="cloud-offline-outline" size={18} color={semantic.warning} />
          <Text style={styles.offlineText}>Offline — saved information remains available.</Text>
        </View>
      )}
      <View style={styles.body}>{children}</View>
      <View
        accessibilityRole="tablist"
        style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, space[2]) }]}
      >
        {destinations.map((item) => {
          const selected = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Pressable
              key={item.href}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              hitSlop={4}
              onPress={() => router.navigate(item.href as never)}
              style={({ pressed }) => [styles.destination, pressed && styles.pressed]}
            >
              <Ionicons
                name={selected ? item.active : item.icon}
                size={23}
                color={selected ? semantic.actionPrimary : semantic.textSecondary}
              />
              <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
              {selected && <View style={styles.indicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: semantic.canvas },
  body: { flex: 1 },
  offline: {
    minHeight: target.minimum,
    paddingHorizontal: space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    backgroundColor: semantic.warningSurface,
  },
  offlineText: { color: semantic.warning, fontWeight: "700", flexShrink: 1 },
  navigation: {
    minHeight: 66,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: semantic.borderDefault,
    backgroundColor: semantic.surface,
    paddingTop: space[2],
  },
  destination: {
    minHeight: target.minimum,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.72 },
  label: { color: semantic.textSecondary, fontSize: 11, fontWeight: "700" },
  labelSelected: { color: semantic.actionPrimary },
  indicator: {
    position: "absolute",
    top: -8,
    width: 28,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: semantic.actionAccent,
  },
});
