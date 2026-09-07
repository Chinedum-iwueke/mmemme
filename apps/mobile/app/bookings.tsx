import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";
import { MobileShell } from "../src/components/mobile-shell";
import { useAuth } from "../src/lib/auth";
import { listBookings, type BookingListItem } from "../src/lib/bookings";
import { presentStatus } from "@mmemme/domain";

export default function BookingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    listBookings()
      .then(setItems)
      .catch(() => setError("We could not load your bookings."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace({
        pathname: "/auth",
        params: { next: "/bookings", intent: "view your bookings" },
      });
      return;
    }
    if (user) load();
  }, [user, authLoading]);
  return (
    <MobileShell>
      <SafeAreaView style={s.safe}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.plum} />
          }
          ListHeaderComponent={
            <View style={s.header}>
              <Eyebrow>Your wedding</Eyebrow>
              <Text style={s.title}>My bookings</Text>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.plum} />
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>{error || "No requests yet"}</Text>
                <Text style={s.muted}>
                  When you request a venue or caterer, its progress will appear here.
                </Text>
                <PrimaryButton onPress={() => router.replace("/")}>Browse vendors</PrimaryButton>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.vendorName} booking`}
              onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item.id } })}
              style={s.card}
            >
              <View style={s.icon}>
                <Ionicons
                  name={item.status === "confirmed" ? "checkmark" : "time-outline"}
                  size={22}
                  color={colors.plum}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.vendor}>{item.vendorName}</Text>
                <Text style={s.meta}>
                  {item.event_date} · {item.guest_count} guests
                </Text>
                <Text style={s.status}>{presentStatus("booking", item.status).label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color={colors.muted} />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </MobileShell>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 25 },
  back: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: { fontSize: 36, fontWeight: "900", color: colors.ink, marginTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.rose,
    alignItems: "center",
    justifyContent: "center",
  },
  vendor: { fontSize: 18, fontWeight: "900", color: colors.ink },
  meta: { color: colors.muted, marginTop: 3 },
  status: { color: colors.plum, fontWeight: "800", marginTop: 7, fontSize: 12 },
  empty: { gap: 14, paddingTop: 50, alignItems: "center" },
  emptyTitle: { fontSize: 21, fontWeight: "900", color: colors.ink },
  muted: { color: colors.muted, textAlign: "center", lineHeight: 20 },
});
