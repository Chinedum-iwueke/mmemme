import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton, TrustBadge } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth";
import { getVendor, type Vendor } from "../../src/lib/vendors";

const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
export default function VendorDetail() {
  const { id, request } = useLocalSearchParams<{ id: string; request?: string }>();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getVendor(id)
      .then((data) => {
        if (!data) setError("This vendor is unavailable or no longer published.");
        setVendor(data);
      })
      .catch(() => setError("We could not load this vendor. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    if (request === "1" && user && vendor)
      router.replace({ pathname: "/request/[vendorId]", params: { vendorId: id } });
  }, [request, user, vendor, id]);
  const beginRequest = () => {
    if (!user) {
      router.push({
        pathname: "/auth",
        params: {
          next: `/vendor/${id}?request=1`,
          intent: `request ${vendor?.name ?? "this vendor"}`,
        },
      });
      return;
    }
    router.push({ pathname: "/request/[vendorId]", params: { vendorId: id } });
  };
  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.state}>
          <ActivityIndicator color={colors.plum} />
          <Text>Loading verified details…</Text>
        </View>
      </SafeAreaView>
    );
  if (error || !vendor)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.coral} />
          <Text accessibilityRole="alert" style={styles.errorTitle}>
            {error}
          </Text>
          <PrimaryButton onPress={() => router.back()}>Return to vendors</PrimaryButton>
        </View>
      </SafeAreaView>
    );
  const checked = vendor.verification
    ? ([
        vendor.verification.identity_checked && "Identity",
        vendor.verification.contact_checked && "Contact",
        vendor.verification.bank_name_checked && "Bank account name",
        vendor.verification.authority_checked && "Business authority",
        vendor.verification.portfolio_checked && "Portfolio",
        vendor.verification.references_checked && "References",
        vendor.verification.physical_site_checked && "Physical operating site",
      ].filter(Boolean) as string[])
    : [];
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {vendor.heroUrl ? (
          <Image
            accessibilityLabel={`${vendor.name} portfolio image`}
            source={{ uri: vendor.heroUrl }}
            style={styles.hero}
          />
        ) : (
          <View style={[styles.hero, { backgroundColor: colors.rose }]}>
            <Text style={styles.letter}>{vendor.name.slice(0, 1)}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.body}>
          <TrustBadge />
          <Text style={styles.title}>{vendor.name}</Text>
          <Text style={styles.meta}>
            {vendor.area}
            {vendor.capacity_max ? ` · up to ${vendor.capacity_max} guests` : ""}
          </Text>
          <Text style={styles.description}>{vendor.description}</Text>
          <Text style={styles.price}>
            {vendor.price_from_kobo ? `From ${naira(vendor.price_from_kobo)}` : "Request pricing"}
          </Text>
          <View style={styles.rule} />
          <Eyebrow>What MMEMME checked</Eyebrow>
          {checked.map((item) => (
            <View key={item} style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
          <Text style={styles.verified}>
            {vendor.verification?.public_note}{" "}
            {vendor.verification?.checked_at
              ? `Checked ${new Date(vendor.verification.checked_at).toLocaleDateString("en-NG")}.`
              : ""}{" "}
            Verification is not a guarantee of service quality or fulfillment.
          </Text>
          {vendor.packages.map((item) => (
            <View key={item.id} style={styles.package}>
              <Eyebrow>Package</Eyebrow>
              <View style={styles.packageHead}>
                <Text style={styles.packageTitle}>{item.name}</Text>
                <Text style={styles.packagePrice}>From {naira(item.price_from_kobo)}</Text>
              </View>
              <Text style={styles.packageText}>{item.description}</Text>
              {item.inclusions.map((inclusion) => (
                <Text key={inclusion} style={styles.inclusion}>
                  • {inclusion}
                </Text>
              ))}
            </View>
          ))}
          <View style={styles.notice}>
            <Ionicons name="time-outline" size={22} color={colors.gold} />
            <Text style={styles.noticeText}>
              Availability is vendor-confirmed. MMEMME checks your date before issuing a
              payment-ready quote.
            </Text>
          </View>
          <PrimaryButton accessibilityLabel={`Request ${vendor.name}`} onPress={beginRequest}>
            Request this {vendor.category}
          </PrimaryButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { paddingBottom: 42 },
  state: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center", gap: 15 },
  errorTitle: { fontSize: 19, color: colors.ink, fontWeight: "900", textAlign: "center" },
  hero: { height: 260, width: "100%", alignItems: "center", justifyContent: "center" },
  back: {
    position: "absolute",
    left: 18,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { color: "rgba(255,255,255,.75)", fontSize: 110, fontWeight: "900" },
  body: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.ivory,
    padding: 22,
    gap: 10,
  },
  title: { color: colors.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1 },
  meta: { color: colors.muted, fontSize: 15 },
  description: { color: colors.ink, lineHeight: 21 },
  price: { color: colors.plum, fontWeight: "900", fontSize: 19 },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  checkText: { color: colors.ink, fontWeight: "600" },
  verified: { color: colors.muted, lineHeight: 19, fontSize: 12, marginTop: 6 },
  package: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 18,
    gap: 8,
    marginTop: 14,
  },
  packageHead: { gap: 3 },
  packageTitle: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  packagePrice: { color: colors.plum, fontWeight: "800" },
  packageText: { color: colors.muted, lineHeight: 21 },
  inclusion: { color: colors.ink },
  notice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.warningSurface,
    padding: 16,
    borderRadius: 18,
    marginVertical: 8,
  },
  noticeText: { color: colors.warning, flex: 1, lineHeight: 20, fontWeight: "600" },
});
