import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton, TrustBadge } from "../src/components/ui";
import { MobileShell } from "../src/components/mobile-shell";
import { BrandLogo } from "../src/components/brand-logo";
import { useAuth } from "../src/lib/auth";
import { isSupabaseConfigured } from "../src/lib/supabase";
import { listVendors, type Vendor } from "../src/lib/vendors";
import { listShortlist, toggleShortlist } from "../src/lib/shortlist";

const formatNaira = (kobo: number | null) =>
  kobo == null ? "Request pricing" : `From ₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
export default function HomeScreen() {
  const { brief } = useLocalSearchParams<{ brief?: string }>();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [category, setCategory] = useState<"venue" | "caterer" | undefined>();
  const [area, setArea] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const load = async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setVendors(
        await listVendors({
          category,
          area: area.trim() || undefined,
          guestCount: Number(guestCount) || undefined,
          maxPriceKobo: Number(maxPrice) ? Number(maxPrice) * 100 : undefined,
        }),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "We could not load vendors.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    load();
  }, [category]);
  useEffect(() => NetInfo.addEventListener((state) => setOffline(state.isConnected === false)), []);
  useEffect(() => {
    listShortlist(user?.id).then(setShortlist);
  }, [user?.id]);
  return (
    <MobileShell>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={vendors}
          keyExtractor={(item) => item.id}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.plum}
            />
          }
          ListHeaderComponent={
            <>
              <View style={styles.nav}>
                <BrandLogo style={styles.wordmark} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={user ? "Open account" : "Sign in"}
                  onPress={() =>
                    router.push(
                      user
                        ? "/profile"
                        : {
                            pathname: "/auth",
                            params: { next: "/profile", intent: "view your account" },
                          },
                    )
                  }
                  style={styles.account}
                >
                  <Ionicons
                    name={user ? "person" : "person-outline"}
                    size={23}
                    color={colors.ink}
                  />
                </Pressable>
              </View>
              {brief === "saved" && (
                <View style={styles.saved}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.savedText}>Your wedding brief is saved.</Text>
                </View>
              )}
              {offline && (
                <View style={styles.offline}>
                  <Ionicons name="cloud-offline-outline" size={19} color={colors.warning} />
                  <Text style={styles.offlineText}>
                    You’re offline. Showing the last loaded screen.
                  </Text>
                </View>
              )}
              <LinearGradient colors={[colors.rose, colors.ivory]} style={styles.hero}>
                <Eyebrow>Your wedding, held with care</Eyebrow>
                <Text style={styles.title}>Book the people who bring it all together.</Text>
                <Text style={styles.subtitle}>
                  Curated Lagos venues and caterers. Clear packages, confirmed dates and safer
                  deposits.
                </Text>
                <PrimaryButton
                  accessibilityLabel="Create your wedding brief"
                  onPress={() => router.push("/brief")}
                >
                  Create my wedding brief
                </PrimaryButton>
              </LinearGradient>
              <View style={styles.sectionTitle}>
                <View>
                  <Eyebrow>Handpicked in Lagos</Eyebrow>
                  <Text style={styles.heading}>A shorter, better list</Text>
                </View>
                <Text style={styles.count}>{vendors.length} found</Text>
              </View>
              <View style={styles.filters}>
                <View style={styles.chips}>
                  {([undefined, "venue", "caterer"] as const).map((item) => (
                    <Pressable
                      key={item ?? "all"}
                      accessibilityRole="button"
                      accessibilityState={{ selected: category === item }}
                      onPress={() => setCategory(item)}
                      style={[styles.chip, category === item && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                        {item ? `${item[0].toUpperCase()}${item.slice(1)}s` : "All"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.search}>
                  <Ionicons name="location-outline" size={20} color={colors.muted} />
                  <TextInput
                    accessibilityLabel="Filter by Lagos area"
                    onChangeText={setArea}
                    onSubmitEditing={() => load()}
                    placeholder="Filter by Lagos area"
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="search"
                    style={styles.searchInput}
                    value={area}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Apply area filter"
                    onPress={() => load()}
                  >
                    <Ionicons name="arrow-forward-circle" size={27} color={colors.plum} />
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open all discovery filters"
                  onPress={() => setFiltersOpen(true)}
                  style={styles.filterButton}
                >
                  <Ionicons name="options-outline" size={20} color={colors.plum} />
                  <Text style={styles.filterButtonText}>Guests and budget</Text>
                  {(guestCount || maxPrice) && <View style={styles.filterDot} />}
                </Pressable>
              </View>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.state}>
                <ActivityIndicator accessibilityLabel="Loading vendors" color={colors.plum} />
                <Text style={styles.stateText}>Finding verified vendors…</Text>
              </View>
            ) : error ? (
              <View style={styles.state}>
                <Ionicons name="alert-circle-outline" size={30} color={colors.coral} />
                <Text accessibilityRole="alert" style={styles.stateTitle}>
                  We could not load the marketplace.
                </Text>
                <Text style={styles.stateText}>{error}</Text>
                {isSupabaseConfigured && (
                  <PrimaryButton onPress={() => load()}>Try again</PrimaryButton>
                )}
              </View>
            ) : (
              <View style={styles.state}>
                <Ionicons name="search-outline" size={31} color={colors.plum} />
                <Text style={styles.stateTitle}>No exact matches yet.</Text>
                <Text style={styles.stateText}>
                  Try another area or category. We never pad results with unverified vendors.
                </Text>
                <PrimaryButton
                  onPress={() => {
                    setArea("");
                    setCategory(undefined);
                  }}
                >
                  Clear filters
                </PrimaryButton>
              </View>
            )
          }
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}, ${item.category}`}
              onPress={() => router.push({ pathname: "/vendor/[id]", params: { id: item.id } })}
              style={styles.card}
            >
              {item.heroUrl ? (
                <Image
                  accessibilityLabel={`${item.name} portfolio image`}
                  source={{ uri: item.heroUrl }}
                  style={styles.image}
                />
              ) : (
                <View
                  style={[
                    styles.image,
                    { backgroundColor: index % 2 ? colors.warningSurface : colors.rose },
                  ]}
                >
                  <Text style={styles.imageLetter}>{item.name.slice(0, 1)}</Text>
                </View>
              )}
              <View style={styles.category}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <View style={styles.cardBody}>
                <TrustBadge />
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.area}
                  {item.capacity_max ? ` · up to ${item.capacity_max} guests` : ""}
                </Text>
                <Text style={styles.price}>{formatNaira(item.price_from_kobo)}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${shortlist.includes(item.id) ? "Remove" : "Save"} ${item.name} ${shortlist.includes(item.id) ? "from" : "to"} shortlist`}
                accessibilityState={{ selected: shortlist.includes(item.id) }}
                hitSlop={8}
                onPress={async (event) => {
                  event.stopPropagation();
                  await toggleShortlist(item.id, user?.id);
                  setShortlist(await listShortlist(user?.id));
                }}
                style={styles.heart}
              >
                <Ionicons
                  name={shortlist.includes(item.id) ? "heart" : "heart-outline"}
                  size={23}
                  color={colors.plum}
                />
              </Pressable>
            </Pressable>
          )}
          ListFooterComponent={
            !loading && !error && vendors.length ? (
              <View style={styles.promise}>
                <Ionicons name="shield-checkmark-outline" size={28} color={colors.plum} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.promiseTitle}>Verified means something here.</Text>
                  <Text style={styles.promiseText}>
                    We show exactly what MMEMME checked, when it was checked and what verification
                    does not guarantee.
                  </Text>
                </View>
              </View>
            ) : null
          }
        />
        <Modal
          visible={filtersOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setFiltersOpen(false)}
        >
          <View style={styles.backdrop}>
            <View accessibilityViewIsModal style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text accessibilityRole="header" style={styles.sheetTitle}>
                Refine your search
              </Text>
              <Text style={styles.label}>Minimum capacity</Text>
              <TextInput
                accessibilityLabel="Minimum guest capacity"
                keyboardType="number-pad"
                value={guestCount}
                onChangeText={(value) => setGuestCount(value.replace(/\D/g, ""))}
                placeholder="For example, 250 guests"
                placeholderTextColor={colors.placeholder}
                style={styles.sheetInput}
              />
              <Text style={styles.label}>Maximum starting price (₦)</Text>
              <TextInput
                accessibilityLabel="Maximum starting price in naira"
                keyboardType="number-pad"
                value={maxPrice}
                onChangeText={(value) => setMaxPrice(value.replace(/\D/g, ""))}
                placeholder="For example, 5000000"
                placeholderTextColor={colors.placeholder}
                style={styles.sheetInput}
              />
              <PrimaryButton
                onPress={() => {
                  setFiltersOpen(false);
                  load();
                }}
              >
                Show matching vendors
              </PrimaryButton>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear guest and budget filters"
                onPress={() => {
                  setGuestCount("");
                  setMaxPrice("");
                }}
                style={styles.clear}
              >
                <Text style={styles.clearText}>Clear these filters</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </MobileShell>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 18, paddingBottom: 48 },
  nav: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordmark: { width: 122, height: 58 },
  account: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  saved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successSurface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  savedText: { color: colors.success, fontWeight: "800" },
  offline: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.warningSurface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  offlineText: { color: colors.warning, fontWeight: "700" },
  hero: { borderRadius: 30, padding: 24, gap: 16, overflow: "hidden" },
  title: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 41,
    letterSpacing: -1.4,
    fontWeight: "800",
  },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 34,
    marginBottom: 16,
  },
  heading: { fontSize: 27, color: colors.ink, fontWeight: "800", marginTop: 5 },
  count: { color: colors.muted, fontSize: 12 },
  filters: { gap: 12, marginBottom: 16 },
  filterButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
  },
  filterButtonText: { color: colors.plum, fontWeight: "800" },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    minHeight: 43,
    paddingHorizontal: 17,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  chipText: { color: colors.ink, fontWeight: "800" },
  chipTextActive: { color: colors.white },
  search: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 17,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  heart: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.94)",
  },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(21,35,31,.52)" },
  sheet: {
    backgroundColor: colors.white,
    padding: 24,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: { color: colors.ink, fontSize: 28, fontWeight: "900", marginBottom: 8 },
  label: { color: colors.ink, fontWeight: "800", marginTop: 6 },
  sheetInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.ivory,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 15,
  },
  clear: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { color: colors.plum, fontWeight: "800" },
  image: { height: 178, width: "100%", alignItems: "center", justifyContent: "center" },
  imageLetter: { color: "rgba(255,255,255,.72)", fontSize: 78, fontWeight: "900" },
  category: {
    position: "absolute",
    right: 12,
    top: 12,
    borderRadius: 999,
    backgroundColor: "rgba(50,21,39,.84)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryText: {
    color: colors.white,
    textTransform: "capitalize",
    fontWeight: "700",
    fontSize: 12,
  },
  cardBody: { padding: 17, gap: 8 },
  cardTitle: { color: colors.ink, fontSize: 23, fontWeight: "800" },
  meta: { color: colors.muted, lineHeight: 20 },
  price: { color: colors.plum, fontSize: 16, fontWeight: "900" },
  state: { padding: 30, alignItems: "center", gap: 13 },
  stateTitle: { fontSize: 19, fontWeight: "900", color: colors.ink, textAlign: "center" },
  stateText: { color: colors.muted, textAlign: "center", lineHeight: 20 },
  promise: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
    padding: 20,
    backgroundColor: colors.rose,
    borderRadius: 22,
  },
  promiseTitle: { color: colors.ink, fontWeight: "900", fontSize: 17, marginBottom: 5 },
  promiseText: { color: colors.muted, lineHeight: 20 },
});
