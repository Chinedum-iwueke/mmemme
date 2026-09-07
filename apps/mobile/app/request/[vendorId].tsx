import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { Ionicons } from "@expo/vector-icons";
import { colors, Eyebrow, PrimaryButton } from "../../src/components/ui";
import { latestBrief, submitRequest } from "../../src/lib/bookings";
import { getVendor, type Vendor } from "../../src/lib/vendors";

export default function RequestScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const submitting = useRef(false);
  const [clientRequestId, setClientRequestId] = useState("");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [brief, setBrief] = useState<{
    id: string;
    wedding_date: string;
    guest_count: number;
    area: string;
  } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [guests, setGuests] = useState("");
  const [requirements, setRequirements] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getVendor(vendorId), latestBrief()])
      .then(([v, b]) => {
        setVendor(v);
        setBrief(b);
        setGuests(String(b?.guest_count ?? ""));
        setPackageId(v?.packages[0]?.id ?? null);
        const key = `mmemme.request.${vendorId}.${b?.id ?? "brief"}`;
        AsyncStorage.getItem(key).then(async (saved) => {
          const value = saved ?? Crypto.randomUUID();
          if (!saved) await AsyncStorage.setItem(key, value);
          setClientRequestId(value);
        });
      })
      .catch(() => setError("We could not prepare this request."))
      .finally(() => setBusy(false));
  }, [vendorId]);
  const submit = async () => {
    if (!brief || busy || submitting.current || !clientRequestId) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const booking = await submitRequest({
        vendorId,
        packageId,
        briefId: brief.id,
        requirements,
        guestCount: Number(guests),
        clientRequestId,
      });
      router.replace({
        pathname: "/booking/[id]",
        params: { id: booking.id, created: "1" },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not submit your request.");
      setBusy(false);
      submitting.current = false;
    }
  };
  if (busy && !vendor)
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.state}>
          <ActivityIndicator color={colors.plum} />
          <Text>Preparing your request…</Text>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.safe} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={s.back}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <Eyebrow>Booking request</Eyebrow>
          <Text style={s.title}>{vendor?.name ?? "Request a vendor"}</Text>
          {!brief ? (
            <View style={s.notice}>
              <Text style={s.noticeTitle}>Create your wedding brief first</Text>
              <Text style={s.muted}>
                Your date and guest plan are needed before operations can confirm availability.
              </Text>
              <PrimaryButton onPress={() => router.replace("/brief")}>
                Create wedding brief
              </PrimaryButton>
            </View>
          ) : (
            <>
              <View style={s.summary}>
                <Text style={s.summaryTitle}>{brief.wedding_date}</Text>
                <Text style={s.muted}>
                  {brief.area} · {brief.guest_count} planned guests
                </Text>
              </View>
              <Text style={s.label}>Package</Text>
              {vendor?.packages.map((p) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: packageId === p.id }}
                  onPress={() => setPackageId(p.id)}
                  key={p.id}
                  style={[s.option, packageId === p.id && s.selected]}
                >
                  <Text style={s.optionTitle}>{p.name}</Text>
                  <Text style={s.muted}>{p.description}</Text>
                </Pressable>
              ))}
              <Text style={s.label}>Expected guest count</Text>
              <TextInput
                accessibilityLabel="Expected guest count"
                value={guests}
                onChangeText={(v) => setGuests(v.replace(/\D/g, ""))}
                keyboardType="number-pad"
                style={s.input}
              />
              <Text style={s.label}>Requirements and questions</Text>
              <TextInput
                accessibilityLabel="Requirements and questions"
                multiline
                value={requirements}
                onChangeText={setRequirements}
                placeholder="Tell us about service style, dietary needs, access times or must-haves…"
                placeholderTextColor={colors.placeholder}
                style={[s.input, s.textarea]}
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ack }}
                onPress={() => setAck(!ack)}
                style={s.ack}
              >
                <Ionicons
                  name={ack ? "checkbox" : "square-outline"}
                  size={25}
                  color={colors.plum}
                />
                <Text style={s.ackText}>
                  I understand this is a request. The vendor’s availability is not confirmed until
                  MMEMME issues a quote.
                </Text>
              </Pressable>
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
              <PrimaryButton
                disabled={
                  busy ||
                  !clientRequestId ||
                  !ack ||
                  requirements.trim().length < 20 ||
                  Number(guests) < 10
                }
                onPress={submit}
              >
                {busy ? "Submitting once…" : "Submit booking request"}
              </PrimaryButton>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 22, paddingBottom: 44 },
  state: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  back: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 10,
    marginBottom: 20,
  },
  summary: {
    backgroundColor: colors.rose,
    borderRadius: 18,
    padding: 17,
    marginBottom: 22,
  },
  summaryTitle: { fontSize: 18, fontWeight: "900", color: colors.ink },
  muted: { color: colors.muted, lineHeight: 20, marginTop: 4 },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 17,
    marginBottom: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 15,
    marginBottom: 9,
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.plum,
    backgroundColor: colors.rose,
  },
  optionTitle: { fontWeight: "900", color: colors.ink },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 15,
    fontSize: 16,
    color: colors.ink,
  },
  textarea: { minHeight: 130, textAlignVertical: "top" },
  ack: {
    flexDirection: "row",
    gap: 11,
    marginVertical: 20,
    alignItems: "flex-start",
  },
  ackText: { flex: 1, color: colors.ink, lineHeight: 20 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  notice: {
    gap: 15,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
  },
  noticeTitle: { fontSize: 20, fontWeight: "900", color: colors.ink },
});
