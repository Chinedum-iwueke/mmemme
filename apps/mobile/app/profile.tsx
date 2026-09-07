import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";
import { MobileShell } from "../src/components/mobile-shell";
import { useAuth } from "../src/lib/auth";

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
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
        <View style={styles.content}>
          <View style={styles.top}>
            <View style={{ width: 44 }} />
            <Text style={styles.logo}>mmemme</Text>
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
            style={{ marginTop: 10, backgroundColor: colors.coral }}
            onPress={() => router.push("/brief")}
          >
            Create or edit wedding brief
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
        </View>
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
  logo: { fontSize: 20, fontWeight: "900", color: colors.plum },
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
  signout: { minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 8 },
  signoutText: { color: colors.error, fontWeight: "800" },
});
