import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandLogo } from "../src/components/brand-logo";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";
import { useAuth } from "../src/lib/auth";
import { openVendorWeb } from "../src/lib/vendor-web";

const checks = [
  [
    "business-outline",
    "Business and contact details",
    "We confirm who operates the venue or catering business.",
  ],
  [
    "document-text-outline",
    "Private supporting evidence",
    "Submit operating authority, portfolio ownership and references securely.",
  ],
  [
    "location-outline",
    "Physical operating-site review",
    "MMEMME records the inspection and what was checked.",
  ],
] as const;

export default function ForVendorsScreen() {
  const { vendorMembership } = useAuth();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const destination = vendorMembership ? "/vendor/workspace" : "/vendor/apply";

  const open = async () => {
    setOpening(true);
    setError("");
    try {
      await openVendorWeb(destination);
    } catch {
      setError("We could not open the vendor workspace. Check your connection and try again.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <BrandLogo style={styles.logo} />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="storefront-outline" size={29} color={colors.plum} />
          </View>
          <Eyebrow>For Lagos venues and caterers</Eyebrow>
          <Text style={styles.title}>Build a listing couples can trust.</Text>
          <Text style={styles.intro}>
            Create your business workspace, submit credentials privately and follow every review
            step without chasing scattered messages.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How verification works</Text>
        <View style={styles.checks}>
          {checks.map(([icon, title, description], index) => (
            <View key={title} style={styles.checkRow}>
              <View style={styles.step}>
                <Text style={styles.stepText}>{index + 1}</Text>
              </View>
              <Ionicons name={icon} size={23} color={colors.plum} />
              <View style={styles.checkCopy}>
                <Text style={styles.checkTitle}>{title}</Text>
                <Text style={styles.checkText}>{description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.promise}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
          <Text style={styles.promiseText}>
            Verification records checks completed by MMEMME. It is not a guarantee of service
            quality or fulfillment. MMEMME controls approval and publication.
          </Text>
        </View>

        <PrimaryButton
          accessibilityLabel={`${vendorMembership ? "Open your vendor workspace" : "Start your vendor application"} in secure browser`}
          disabled={opening}
          onPress={open}
        >
          {opening
            ? "Opening secure workspace…"
            : vendorMembership
              ? "Open vendor workspace"
              : "Start vendor application"}
        </PrimaryButton>
        {opening && <ActivityIndicator color={colors.plum} style={styles.activity} />}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        <Text style={styles.browserNote}>
          The application opens in your browser so documents, email verification and account
          recovery remain in one secure workspace.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 22, paddingBottom: 40 },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  logo: { width: 104, height: 50 },
  headerSpacer: { width: 44 },
  hero: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.rose,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    marginBottom: 20,
  },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: "900", marginTop: 9 },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 30,
    marginBottom: 13,
  },
  checks: { gap: 10 },
  checkRow: {
    minHeight: 104,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  checkCopy: { flex: 1 },
  checkTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  checkText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  promise: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.successSurface,
    marginVertical: 22,
  },
  promiseText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
  activity: { marginTop: 12 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  browserNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 13,
  },
});
