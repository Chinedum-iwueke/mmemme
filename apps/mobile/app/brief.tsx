import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";

type Brief = { date: string; area: string; guests: string; budget: string; priorities: string[] };
const steps = [
  { key: "date", eyebrow: "1 of 5 · The date", title: "When are you celebrating?", hint: "Use YYYY-MM-DD. We always confirm dates with vendors before payment.", placeholder: "2027-02-06" },
  { key: "area", eyebrow: "2 of 5 · The place", title: "Which part of Lagos?", hint: "An area is enough for now.", placeholder: "Lekki, Ikeja, Victoria Island…" },
  { key: "guests", eyebrow: "3 of 5 · The people", title: "How many guests are you planning for?", hint: "A best estimate helps us remove options that will not fit.", placeholder: "250" },
  { key: "budget", eyebrow: "4 of 5 · The budget", title: "What feels comfortable for venue and catering?", hint: "We use this to show relevant options, never to inflate a quote.", placeholder: "₦3m – ₦6m" },
];

export default function BriefScreen() {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Brief>({ date: "", area: "", guests: "", budget: "", priorities: [] });
  const current = steps[step];
  const value = current ? brief[current.key as keyof Brief] as string : "";
  const valid = useMemo(() => current ? value.trim().length > 0 : brief.priorities.length > 0, [current, value, brief.priorities]);

  function continueFlow() {
    if (step < 4) setStep((value) => value + 1);
    else router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => step ? setStep(step - 1) : router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.logo}>mmemme</Text><Text style={styles.skip}>Brief</Text></View>
          <View accessibilityLabel={`Step ${step + 1} of 5`} style={styles.progress}><View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} /></View>
          {current ? <>
            <Eyebrow>{current.eyebrow}</Eyebrow><Text style={styles.title}>{current.title}</Text><Text style={styles.hint}>{current.hint}</Text>
            <TextInput
              accessibilityLabel={current.title}
              autoFocus
              keyboardType={current.key === "guests" ? "number-pad" : "default"}
              onChangeText={(text) => setBrief({ ...brief, [current.key]: text })}
              placeholder={current.placeholder}
              placeholderTextColor="#9B8991"
              style={styles.input}
              value={value}
            />
          </> : <>
            <Eyebrow>5 of 5 · The priority</Eyebrow><Text style={styles.title}>What should we find first?</Text><Text style={styles.hint}>Choose one or both. Each becomes its own booking.</Text>
            {[["venue", "A place that feels right", "Capacity, location, facilities and date hold"], ["caterer", "Food people remember", "Menu, service style, guest count and tasting"]].map(([key, title, note]) => {
              const selected = brief.priorities.includes(key);
              return <Pressable key={key} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => setBrief({ ...brief, priorities: selected ? brief.priorities.filter((value) => value !== key) : [...brief.priorities, key] })} style={[styles.option, selected && styles.optionSelected]}><View style={[styles.check, selected && styles.checkSelected]}>{selected && <Ionicons name="checkmark" color={colors.white} size={18} />}</View><View><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionNote}>{note}</Text></View></Pressable>;
            })}
          </>}
          <View style={{ flex: 1, minHeight: 90 }} />
          <PrimaryButton disabled={!valid} accessibilityLabel={step === 4 ? "See matching vendors" : "Continue"} onPress={continueFlow}>{step === 4 ? "See my matches" : "Continue"}</PrimaryButton>
          <Text style={styles.privacy}>Your brief stays private and can be edited later.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory }, content: { flexGrow: 1, padding: 22 }, top: { height: 62, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: colors.border }, logo: { color: colors.plum, fontWeight: "900", fontSize: 20 }, skip: { width: 44, color: colors.muted, fontSize: 12 },
  progress: { height: 5, borderRadius: 4, backgroundColor: colors.rose, marginBottom: 42, overflow: "hidden" }, progressFill: { height: 5, backgroundColor: colors.coral },
  title: { color: colors.ink, fontSize: 36, lineHeight: 41, letterSpacing: -1, fontWeight: "800", marginTop: 12 }, hint: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 28 },
  input: { minHeight: 64, borderWidth: 1.5, borderColor: colors.plum, backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 18, color: colors.ink, fontSize: 18 },
  option: { flexDirection: "row", gap: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, marginBottom: 12, backgroundColor: colors.white }, optionSelected: { borderWidth: 2, borderColor: colors.plum, backgroundColor: colors.rose },
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, checkSelected: { backgroundColor: colors.plum }, optionTitle: { color: colors.ink, fontWeight: "800", fontSize: 17 }, optionNote: { color: colors.muted, marginTop: 4, maxWidth: 270 },
  privacy: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 12 },
});
