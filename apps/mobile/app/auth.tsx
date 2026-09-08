import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../src/components/ui";
import { useAuth } from "../src/lib/auth";
import { BrandLogo } from "../src/components/brand-logo";
import { supabase } from "../src/lib/supabase";

type Step = "phone" | "code" | "profile";
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
};

export default function AuthScreen() {
  const { next = "/", intent } = useLocalSearchParams<{ next?: string; intent?: string }>();
  const { user, profile, configured, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>(
    user && profile?.full_name === "MMEMME customer" ? "profile" : "phone",
  );
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return;
    const timer = setInterval(() => setWait((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [wait]);
  useEffect(() => {
    if (user && step === "phone")
      setStep(profile?.full_name === "MMEMME customer" ? "profile" : "phone");
  }, [user, profile]);

  const finish = () => router.replace(next as never);
  const sendCode = async () => {
    setBusy(true);
    setError("");
    const normalized = normalizePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError("We could not send a code. Check the number and try again shortly.");
      return;
    }
    setPhone(normalized);
    setWait(45);
    setStep("code");
  };
  const verify = async () => {
    setBusy(true);
    setError("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code.trim(),
      type: "sms",
    });
    setBusy(false);
    if (error || !data.user) {
      setError("That code is invalid or expired. Request a new one and try again.");
      return;
    }
    await refreshProfile();
    setStep("profile");
  };
  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), email: email.trim().toLowerCase() })
      .eq("id", user.id);
    if (!error && email.trim())
      await supabase.auth.updateUser({
        email: email.trim().toLowerCase(),
        data: { full_name: name.trim() },
      });
    setBusy(false);
    if (error) {
      setError("We could not save your profile. Please try again.");
      return;
    }
    await refreshProfile();
    finish();
  };

  if (!configured)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="construct-outline" size={34} color={colors.plum} />
          <Text style={styles.title}>Connect Supabase to sign in</Text>
          <Text style={styles.hint}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the mobile
            environment.
          </Text>
          <PrimaryButton onPress={() => router.back()}>Return to browsing</PrimaryButton>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close sign in"
            onPress={() => router.back()}
            style={styles.close}
          >
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <BrandLogo style={styles.mark} />
          {intent && <Text style={styles.intent}>Sign in to {intent}</Text>}
          {step === "phone" && (
            <>
              <Eyebrow>Welcome to MMEMME</Eyebrow>
              <Text style={styles.title}>Your bookings, held in one place.</Text>
              <Text style={styles.hint}>
                Enter a Nigerian mobile number. We’ll send a one-time code by SMS.
              </Text>
              <Text style={styles.label}>Mobile number</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.prefix}>+234</Text>
                <TextInput
                  accessibilityLabel="Nigerian mobile number"
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                  placeholder="801 234 5678"
                  placeholderTextColor={colors.placeholder}
                  style={styles.phoneInput}
                  value={phone.replace(/^\+234/, "")}
                />
              </View>
              <PrimaryButton
                disabled={busy || phone.replace(/\D/g, "").length < 10}
                onPress={sendCode}
              >
                {busy ? "Sending…" : "Send my code"}
              </PrimaryButton>
            </>
          )}
          {step === "code" && (
            <>
              <Eyebrow>Check your phone</Eyebrow>
              <Text style={styles.title}>Enter the six-digit code.</Text>
              <Text style={styles.hint}>
                We sent it to {phone}. The message may take a moment to arrive.
              </Text>
              <Text style={styles.label}>One-time code</Text>
              <TextInput
                accessibilityLabel="Six-digit one-time code"
                autoComplete="sms-otp"
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.placeholder}
                style={[styles.input, styles.code]}
                value={code}
              />
              <PrimaryButton disabled={busy || code.length !== 6} onPress={verify}>
                {busy ? "Checking…" : "Verify and continue"}
              </PrimaryButton>
              <Pressable
                accessibilityRole="button"
                disabled={wait > 0 || busy}
                onPress={sendCode}
                style={styles.resend}
              >
                <Text style={styles.resendText}>
                  {wait ? `Send again in ${wait}s` : "Send a new code"}
                </Text>
              </Pressable>
            </>
          )}
          {step === "profile" && (
            <>
              <Eyebrow>One last detail</Eyebrow>
              <Text style={styles.title}>Who are we helping celebrate?</Text>
              <Text style={styles.hint}>
                Your name personalizes support. Your email receives quotes and payment receipts.
              </Text>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                accessibilityLabel="Full name"
                autoCapitalize="words"
                onChangeText={setName}
                placeholder="Amaka Okafor"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                value={name}
              />
              <Text style={styles.label}>Receipt email</Text>
              <TextInput
                accessibilityLabel="Receipt email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="amaka@example.com"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                value={email}
              />
              <PrimaryButton
                disabled={busy || name.trim().length < 2 || !email.includes("@")}
                onPress={saveProfile}
              >
                {busy ? "Saving…" : "Continue"}
              </PrimaryButton>
            </>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          {busy && (
            <ActivityIndicator
              accessibilityLabel="Loading"
              color={colors.plum}
              style={{ marginTop: 16 }}
            />
          )}
          <Text style={styles.privacy}>
            We use your details only to manage your account and bookings.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  center: { flex: 1, padding: 24, justifyContent: "center", gap: 18 },
  close: {
    position: "absolute",
    right: 18,
    top: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 120,
    height: 58,
    marginBottom: 25,
  },
  intent: { color: colors.plum, fontWeight: "800", marginBottom: 10 },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 10,
  },
  hint: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 12, marginBottom: 23 },
  label: { color: colors.ink, fontWeight: "800", fontSize: 13, marginBottom: 7, marginTop: 8 },
  input: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 17,
    marginBottom: 14,
  },
  code: { textAlign: "center", fontSize: 26, letterSpacing: 9 },
  phoneRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  prefix: { fontSize: 17, fontWeight: "800", paddingLeft: 16, paddingRight: 8, color: colors.ink },
  phoneInput: { flex: 1, fontSize: 17, color: colors.ink, paddingRight: 16 },
  resend: { minHeight: 46, alignItems: "center", justifyContent: "center" },
  resendText: { color: colors.plum, fontWeight: "800" },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  privacy: { color: colors.muted, textAlign: "center", fontSize: 11, marginTop: 18 },
});
