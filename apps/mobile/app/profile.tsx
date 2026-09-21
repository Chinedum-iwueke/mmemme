import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";
import { MobileShell } from "../src/components/mobile-shell";
import { BrandLogo } from "../src/components/brand-logo";
import { useAuth } from "../src/lib/auth";
import { openVendorWeb } from "../src/lib/vendor-web";

export default function ProfileScreen() {
  const { user, profile, vendorMembership, signOut } = useAuth();
  if (!user) {
    router.replace({
      pathname: "/auth",
      params: { next: "/profile", intent: "view your account" },
    });
    return null;
  }
  return (
    <MobileShell>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.top}>
            <View style={{ width: 44 }} />
            <BrandLogo style={styles.logo} />
            <View style={{ width: 44 }} />
          </View>
          <Eyebrow>Your account</Eyebrow>
          <Text style={styles.title}>{profile?.full_name ?? "MMEMME customer"}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="call-outline" size={21} color={colors.plum} />
              <View>
                <Text style={styles.label}>Mobile</Text>
                <Text style={styles.value}>{user.phone}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={21} color={colors.plum} />
              <View>
                <Text style={styles.label}>Receipt email</Text>
                <Text style={styles.value}>{profile?.email ?? "Not set"}</Text>
              </View>
            </View>
          </View>
          <PrimaryButton onPress={() => router.push("/bookings")}>View my bookings</PrimaryButton>
          <PrimaryButton
            style={{ marginTop: 10 }}
            onPress={() => openVendorWeb("/account/verification")}
          >
            Verify my identity
          </PrimaryButton>
          <PrimaryButton
            style={{ marginTop: 10, backgroundColor: colors.coral }}
            onPress={() => router.push("/brief")}
          >
            Create or edit wedding brief
          </PrimaryButton>
          <View style={styles.vendorCard}>
            <Ionicons name="storefront-outline" size={25} color={colors.plum} />
            <View style={styles.vendorCopy}>
              <Text style={styles.vendorTitle}>
                {vendorMembership ? "Your vendor workspace" : "Grow your wedding business"}
              </Text>
              <Text style={styles.vendorText}>
                {vendorMembership
                  ? `Signed in as a vendor ${vendorMembership.role}. Continue your verification or manage your listing.`
                  : "Venues and caterers can apply, submit private credentials and track verification."}
              </Text>
            </View>
          </View>
          <PrimaryButton
            accessibilityLabel={
              vendorMembership
                ? "Open vendor workspace in browser"
                : "List your business with MMEMME"
            }
            onPress={() =>
              vendorMembership
                ? openVendorWeb("/vendor/workspace")
                : router.push("/for-vendors" as never)
            }
            style={styles.vendorButton}
          >
            {vendorMembership ? "Open vendor workspace" : "List your business"}
          </PrimaryButton>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await signOut();
              router.replace("/");
            }}
            style={styles.signout}
          >
            <Text style={styles.signoutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </MobileShell>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 22 },
  top: {
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 104, height: 50 },
  title: { fontSize: 34, fontWeight: "900", color: colors.ink, marginTop: 8, marginBottom: 22 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  row: { flexDirection: "row", gap: 13, alignItems: "center", paddingVertical: 12 },
  label: { fontSize: 12, color: colors.muted, fontWeight: "700" },
  value: { fontSize: 16, color: colors.ink, fontWeight: "700", marginTop: 3 },
  vendorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    marginTop: 22,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.rose,
  },
  vendorCopy: { flex: 1 },
  vendorTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  vendorText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  vendorButton: { marginTop: 10 },
  signout: { minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 8 },
  signoutText: { color: colors.error, fontWeight: "800" },
});
