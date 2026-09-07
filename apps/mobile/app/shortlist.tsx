import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { MobileShell } from "../src/components/mobile-shell";
import { colors, Eyebrow, PrimaryButton, TrustBadge } from "../src/components/ui";
import { useAuth } from "../src/lib/auth";
import { listShortlist, toggleShortlist } from "../src/lib/shortlist";
import { listVendors, type Vendor } from "../src/lib/vendors";

export default function ShortlistScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [ids, vendors] = await Promise.all([listShortlist(user?.id), listVendors()]);
    setItems(vendors.filter((vendor) => ids.includes(vendor.id)));
    setLoading(false);
  }, [user?.id]);
  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <MobileShell>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Eyebrow>Your wedding plan</Eyebrow>
            <Text accessibilityRole="header" style={styles.title}>
              Shortlist
            </Text>
            <Text style={styles.intro}>
              Keep promising venues and caterers together, then add your brief when you are ready.
            </Text>
            <PrimaryButton onPress={() => router.push("/brief")}>
              Create or edit my brief
            </PrimaryButton>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator accessibilityLabel="Loading shortlist" color={colors.plum} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={34} color={colors.plum} />
              <Text style={styles.emptyTitle}>Your shortlist is ready for a first favourite.</Text>
              <Text style={styles.intro}>
                Save vendors while browsing. Your choices sync after sign-in.
              </Text>
              <PrimaryButton onPress={() => router.navigate("/")}>Discover vendors</PrimaryButton>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name}`}
            onPress={() => router.push({ pathname: "/vendor/[id]", params: { id: item.id } })}
            style={styles.card}
          >
            <View style={styles.cardBody}>
              <TrustBadge />
              <Text style={styles.vendor}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.area} · {item.category}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name} from shortlist`}
              hitSlop={10}
              onPress={async (event) => {
                event.stopPropagation();
                await toggleShortlist(item.id, user?.id);
                await load();
              }}
              style={styles.remove}
            >
              <Ionicons name="heart" size={23} color={colors.plum} />
            </Pressable>
          </Pressable>
        )}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36, flexGrow: 1 },
  header: { gap: 10, marginBottom: 24 },
  title: { fontSize: 36, lineHeight: 41, fontWeight: "900", color: colors.ink },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  empty: {
    alignItems: "center",
    gap: 14,
    padding: 25,
    backgroundColor: colors.white,
    borderRadius: 22,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
  },
  cardBody: { flex: 1, gap: 6 },
  vendor: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  meta: { color: colors.muted, textTransform: "capitalize" },
  remove: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.rose,
  },
});
