import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";
import { BrandLogo } from "../src/components/brand-logo";
import { useAuth } from "../src/lib/auth";
import {
  DraftBrief,
  emptyBrief,
  persistBrief,
  readAccountDraft,
  readDraftBrief,
  writeDraftBrief,
  syncAccountDraft,
} from "../src/lib/brief-store";

const steps = [
  {
    key: "date",
    eyebrow: "1 of 5 · The date",
    title: "When are you celebrating?",
    hint: "Use YYYY-MM-DD. We always confirm dates with vendors before payment.",
    placeholder: "2027-02-06",
  },
  {
    key: "area",
    eyebrow: "2 of 5 · The place",
    title: "Which part of Lagos?",
    hint: "An area is enough for now.",
    placeholder: "Lekki, Ikeja, Victoria Island…",
  },
  {
    key: "guests",
    eyebrow: "3 of 5 · The people",
    title: "How many guests are you planning for?",
    hint: "A best estimate helps us remove options that will not fit.",
    placeholder: "250",
  },
] as const;

export default function BriefScreen() {
  const { save } = useLocalSearchParams<{ save?: string }>();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<DraftBrief>(emptyBrief);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = steps[step];
  const value = current ? brief[current.key] : "";
  const valid = useMemo(() => {
    if (step < 3) return value.trim().length > 0;
    if (step === 3)
      return (
        Number(brief.budgetMin) >= 0 &&
        Number(brief.budgetMax) >= Number(brief.budgetMin) &&
        Number(brief.budgetMax) > 0
      );
    return brief.priorities.length > 0;
  }, [step, value, brief]);

  useEffect(() => {
    Promise.all([readDraftBrief(), user ? readAccountDraft() : Promise.resolve(null)]).then(
      ([draft, account]) => {
        if (draft && account && JSON.stringify(draft) !== JSON.stringify(account.brief))
          Alert.alert("Brief changed on another device", "Choose which version to continue.", [
            { text: "Use this device", onPress: () => setBrief(draft) },
            {
              text: "Use account version",
              onPress: () => {
                setBrief(account.brief);
                writeDraftBrief(account.brief);
              },
            },
          ]);
        else if (account) setBrief(account.brief);
        else if (draft) setBrief(draft);
        setLoading(false);
      },
    );
  }, [user]);
  useEffect(() => {
    if (!loading) writeDraftBrief(brief);
  }, [brief, loading]);
  useEffect(() => {
    if (save === "1" && user && !loading) finish();
  }, [save, user, loading]);

  const finish = async () => {
    await writeDraftBrief(brief);
    if (!user) {
      router.push({
        pathname: "/auth",
        params: { next: "/brief?save=1", intent: "save your wedding brief" },
      });
      return;
    }
    setSaving(true);
    setError("");
    try {
      await persistBrief(user.id, brief);
      const account = await readAccountDraft();
      await syncAccountDraft(brief, account?.revision ?? 1);
      router.replace({ pathname: "/", params: { brief: "saved" } });
    } catch {
      setError(
        "We saved your draft on this device, but could not sync it. Check your connection and try again.",
      );
      setSaving(false);
    }
  };
  const continueFlow = () => (step < 4 ? setStep((value) => value + 1) : finish());

  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.plum} />
          <Text style={styles.hint}>Restoring your brief…</Text>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={12}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.top}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (step ? setStep(step - 1) : router.back())}
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </Pressable>
            <BrandLogo style={styles.logo} />
            <Text style={styles.skip}>Brief</Text>
          </View>
          <View accessibilityLabel={`Step ${step + 1} of 5`} style={styles.progress}>
            <View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} />
          </View>
          {step < 3 && current && (
            <>
              <Eyebrow>{current.eyebrow}</Eyebrow>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.hint}>{current.hint}</Text>
              <TextInput
                accessibilityLabel={current.title}
                autoFocus
                keyboardType={current.key === "guests" ? "number-pad" : "default"}
                onChangeText={(text) => setBrief({ ...brief, [current.key]: text })}
                placeholder={current.placeholder}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                value={value}
              />
            </>
          )}
          {step === 3 && (
            <>
              <Eyebrow>4 of 5 · The budget</Eyebrow>
              <Text style={styles.title}>What feels comfortable?</Text>
              <Text style={styles.hint}>
                Enter a total range in naira. We use it to show relevant options, never to inflate a
                quote.
              </Text>
              <View style={styles.budgetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Minimum ₦</Text>
                  <TextInput
                    accessibilityLabel="Minimum budget in naira"
                    keyboardType="number-pad"
                    onChangeText={(text) =>
                      setBrief({ ...brief, budgetMin: text.replace(/\D/g, "") })
                    }
                    placeholder="1000000"
                    placeholderTextColor={colors.placeholder}
                    style={styles.input}
                    value={brief.budgetMin}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Maximum ₦</Text>
                  <TextInput
                    accessibilityLabel="Maximum budget in naira"
                    keyboardType="number-pad"
                    onChangeText={(text) =>
                      setBrief({ ...brief, budgetMax: text.replace(/\D/g, "") })
                    }
                    placeholder="5000000"
                    placeholderTextColor={colors.placeholder}
                    style={styles.input}
                    value={brief.budgetMax}
                  />
                </View>
              </View>
            </>
          )}
          {step === 4 && (
            <>
              <Eyebrow>5 of 5 · The priority</Eyebrow>
              <Text style={styles.title}>What should we find first?</Text>
              <Text style={styles.hint}>Choose one or both. Each becomes its own booking.</Text>
              {(
                [
                  [
                    "venue",
                    "A place that feels right",
                    "Capacity, location, facilities and date hold",
                  ],
                  [
                    "caterer",
                    "Food people remember",
                    "Menu, service style, guest count and tasting",
                  ],
                ] as const
              ).map(([key, title, note]) => {
                const selected = brief.priorities.includes(key);
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() =>
                      setBrief({
                        ...brief,
                        priorities: selected
                          ? brief.priorities.filter((value) => value !== key)
                          : [...brief.priorities, key],
                      })
                    }
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <View style={[styles.check, selected && styles.checkSelected]}>
                      {selected && <Ionicons name="checkmark" color={colors.white} size={18} />}
                    </View>
                    <View>
                      <Text style={styles.optionTitle}>{title}</Text>
                      <Text style={styles.optionNote}>{note}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
          <View style={{ flex: 1, minHeight: 70 }} />
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <PrimaryButton
            disabled={!valid || saving}
            accessibilityLabel={step === 4 ? "Save brief and see matching vendors" : "Continue"}
            onPress={continueFlow}
          >
            {saving ? "Saving…" : step === 4 ? "Save and see my matches" : "Continue"}
          </PrimaryButton>
          <Text style={styles.privacy}>
            Your draft is saved on this device. Sign in is required only to sync it.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { flexGrow: 1, padding: 22 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  top: { height: 62, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: { width: 104, height: 50 },
  skip: { width: 44, color: colors.muted, fontSize: 12 },
  progress: {
    height: 5,
    borderRadius: 4,
    backgroundColor: colors.rose,
    marginBottom: 42,
    overflow: "hidden",
  },
  progressFill: { height: 5, backgroundColor: colors.coral },
  title: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 41,
    letterSpacing: -1,
    fontWeight: "800",
    marginTop: 12,
  },
  hint: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 28 },
  label: { color: colors.ink, fontWeight: "800", fontSize: 12, marginBottom: 7 },
  input: {
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.plum,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 18,
    color: colors.ink,
    fontSize: 17,
  },
  budgetRow: { flexDirection: "row", gap: 12 },
  option: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  optionSelected: { borderWidth: 2, borderColor: colors.plum, backgroundColor: colors.rose },
  check: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: { backgroundColor: colors.plum },
  optionTitle: { color: colors.ink, fontWeight: "800", fontSize: 17 },
  optionNote: { color: colors.muted, marginTop: 4, maxWidth: 270 },
  privacy: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 12 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
});
