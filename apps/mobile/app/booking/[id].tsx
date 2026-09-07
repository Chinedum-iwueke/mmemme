import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../../src/components/ui";
import {
  acceptQuote,
  demoConfirmPayment,
  getBooking,
  initializePayment,
  type BookingDetail,
} from "../../src/lib/bookings";
import { mobileEnvironment } from "../../src/lib/supabase";
import { BookingStatus, presentStatus } from "@mmemme/domain";

const money = (k: number) => `₦${Math.round(k / 100).toLocaleString("en-NG")}`;
export default function BookingScreen() {
  const { id, created } = useLocalSearchParams<{
    id: string;
    created?: string;
  }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const load = useCallback(async () => {
    try {
      setBooking(await getBooking(id));
      setError("");
    } catch {
      setError("We could not refresh this booking.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!["accepted_awaiting_payment"].includes(booking?.status ?? "")) return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [booking?.status, load]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => state === "active" && load());
    return () => listener.remove();
  }, [load]);
  const quote = booking?.quotes[0];
  const quoteExpired = quote ? new Date(quote.expires_at) <= new Date() : false;
  const accept = async () => {
    if (!quote || busy) return;
    setBusy(true);
    setError("");
    try {
      await acceptQuote(id, quote.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept this quote.");
    } finally {
      setBusy(false);
    }
  };
  const pay = async () => {
    if (!quote || busy) return;
    setBusy(true);
    setError("");
    try {
      const payment = await initializePayment(id, quote.id);
      await WebBrowser.openAuthSessionAsync(
        payment.authorizationUrl,
        Linking.createURL(`/booking/${id}`),
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout could not be opened.");
    } finally {
      setBusy(false);
    }
  };
  const demoPay = async () => {
    if (!quote || busy) return;
    setBusy(true);
    setError("");
    try {
      await demoConfirmPayment(id, quote.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo payment failed.");
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator color={colors.plum} />
          <Text>Loading booking…</Text>
        </View>
      </SafeAreaView>
    );
  if (!booking)
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text accessibilityRole="alert">{error || "Booking not found"}</Text>
        </View>
      </SafeAreaView>
    );
  const succeeded = booking.payments.find((p) => p.status === "succeeded");
  const bookingCopy = presentStatus("booking", booking.status);
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to bookings"
          onPress={() => router.replace("/bookings")}
          style={s.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        {created === "1" && (
          <View style={s.success}>
            <Ionicons name="checkmark-circle" size={23} color={colors.success} />
            <Text style={s.successText}>Your request was submitted once.</Text>
          </View>
        )}
        <Eyebrow>Booking with</Eyebrow>
        <Text style={s.title}>{booking.vendorName}</Text>
        <Text style={s.meta}>
          {booking.event_date} · {booking.guest_count} guests
        </Text>
        <View style={s.statusCard}>
          <Text style={s.statusLabel}>Current status</Text>
          <Text style={s.status}>{bookingCopy.label}</Text>
          <Text style={s.explain}>{bookingCopy.description}</Text>
        </View>
        {quote && (
          <View style={s.quote}>
            <View style={s.quoteHead}>
              <View>
                <Eyebrow>Quote revision {quote.revision}</Eyebrow>
                <Text style={s.quoteTitle}>{quote.package_name_snapshot}</Text>
              </View>
              <Text style={s.total}>{money(quote.total_amount_kobo)}</Text>
            </View>
            <Text style={s.deposit}>{money(quote.deposit_amount_kobo)} deposit due</Text>
            <Text style={s.expiry}>
              Expires {new Date(quote.expires_at).toLocaleString("en-NG")}
            </Text>
            <Section title="Included" values={quote.inclusions} />
            <Section title="Not included" values={quote.exclusions} />
            <Text style={s.sectionTitle}>Payment schedule</Text>
            <Text style={s.body}>{quote.payment_schedule}</Text>
            <Text style={s.sectionTitle}>Cancellation consequences</Text>
            <Text style={s.body}>{quote.cancellation_summary}</Text>
            <Text style={s.terms}>
              Terms version {quote.terms_version}. Acceptance is recorded with your account and
              timestamp.
            </Text>
            {booking.status === "quote_ready" && (
              <>
                {quoteExpired ? (
                  <View accessibilityRole="alert" style={s.expired}>
                    <Ionicons name="time-outline" size={21} color={colors.warning} />
                    <Text style={s.expiredText}>
                      This quote expired. MMEMME will issue a fresh quote before you can pay.
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: termsAccepted }}
                    onPress={() => setTermsAccepted((value) => !value)}
                    style={s.termsCheck}
                  >
                    <Ionicons
                      name={termsAccepted ? "checkbox" : "square-outline"}
                      size={25}
                      color={colors.plum}
                    />
                    <Text style={s.termsCheckText}>
                      I reviewed the price, inclusions, exclusions, payment schedule and
                      cancellation consequences.
                    </Text>
                  </Pressable>
                )}
                <PrimaryButton disabled={busy || quoteExpired || !termsAccepted} onPress={accept}>
                  {busy ? "Recording acceptance…" : "Accept quote and terms"}
                </PrimaryButton>
              </>
            )}
            {booking.status === "accepted_awaiting_payment" && (
              <>
                <PrimaryButton disabled={busy} onPress={pay}>
                  {busy
                    ? "Opening secure checkout…"
                    : `Pay ${money(quote.deposit_amount_kobo)} deposit`}
                </PrimaryButton>
                {mobileEnvironment.EXPO_PUBLIC_DEMO_MODE && (
                  <PrimaryButton
                    style={{ backgroundColor: colors.coral }}
                    disabled={busy}
                    onPress={demoPay}
                  >
                    Simulate successful local payment
                  </PrimaryButton>
                )}
              </>
            )}
          </View>
        )}
        {booking.status === "accepted_awaiting_payment" && (
          <View style={s.pending}>
            <ActivityIndicator color={colors.plum} />
            <View style={{ flex: 1 }}>
              <Text style={s.pendingTitle}>Payment confirmation is authoritative</Text>
              <Text style={s.body}>
                Returning from checkout does not confirm this booking. This screen refreshes until
                Paystack’s signed webhook is verified.
              </Text>
            </View>
          </View>
        )}
        {succeeded && (
          <View style={s.receipt}>
            <Ionicons name="receipt-outline" size={25} color={colors.success} />
            <View>
              <Text style={s.receiptTitle}>Deposit receipt</Text>
              <Text style={s.body}>
                {money(succeeded.amount_kobo)} · {succeeded.provider_reference}
              </Text>
              <Text style={s.body}>
                {succeeded.paid_at
                  ? new Date(succeeded.paid_at).toLocaleString("en-NG")
                  : "Payment verified"}
              </Text>
            </View>
          </View>
        )}
        <PrimaryButton
          style={{ marginTop: 16 }}
          onPress={() => router.push({ pathname: "/booking/manage/[id]", params: { id } })}
        >
          Support, cancellation and safety
        </PrimaryButton>
        <View style={s.timeline}>
          <Eyebrow>Booking timeline</Eyebrow>
          {booking.transitions.map((t, i) => (
            <View style={s.event} key={t.id}>
              <View style={s.line}>
                <View style={s.dot} />
                {i < booking.transitions.length - 1 && <View style={s.stem} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 20 }}>
                <Text style={s.eventTitle}>
                  {BookingStatus.safeParse(t.new_state).success
                    ? presentStatus("booking", BookingStatus.parse(t.new_state)).label
                    : "Booking updated"}
                </Text>
                <Text style={s.body}>{t.reason}</Text>
                <Text style={s.date}>{new Date(t.created_at).toLocaleString("en-NG")}</Text>
              </View>
            </View>
          ))}
        </View>
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function Section({ title, values }: { title: string; values: string[] }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{title}</Text>
      {values.length ? (
        values.map((v) => (
          <Text style={s.body} key={v}>
            • {v}
          </Text>
        ))
      ) : (
        <Text style={s.body}>None listed</Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 21, paddingBottom: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  back: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  success: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.successSurface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 18,
  },
  successText: { color: colors.success, fontWeight: "800" },
  title: { fontSize: 35, fontWeight: "900", color: colors.ink, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 5 },
  statusCard: {
    backgroundColor: colors.rose,
    borderRadius: 20,
    padding: 18,
    marginVertical: 20,
  },
  statusLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.plum,
    fontWeight: "900",
  },
  status: {
    fontSize: 21,
    fontWeight: "900",
    color: colors.ink,
    textTransform: "capitalize",
    marginTop: 6,
  },
  explain: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  quote: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 19,
    gap: 11,
  },
  quoteHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  quoteTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 4,
  },
  total: { fontSize: 20, fontWeight: "900", color: colors.plum },
  deposit: { fontSize: 17, fontWeight: "900", color: colors.ink },
  expiry: { color: colors.gold, fontWeight: "800" },
  expired: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.warningSurface,
    borderRadius: 14,
    padding: 12,
  },
  expiredText: { flex: 1, color: colors.warning, lineHeight: 20, fontWeight: "700" },
  termsCheck: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  termsCheckText: { flex: 1, color: colors.ink, lineHeight: 21 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 8,
  },
  body: { color: colors.muted, lineHeight: 20 },
  terms: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 17,
    marginVertical: 6,
  },
  pending: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colors.warningSurface,
    padding: 17,
    borderRadius: 18,
    marginTop: 15,
  },
  pendingTitle: { fontWeight: "900", color: colors.warning, marginBottom: 4 },
  receipt: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: colors.successSurface,
    padding: 17,
    borderRadius: 18,
    marginTop: 15,
  },
  receiptTitle: { fontWeight: "900", color: colors.success },
  timeline: { marginTop: 28 },
  event: { flexDirection: "row", gap: 12, marginTop: 14 },
  line: { width: 18, alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coral,
  },
  stem: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 3 },
  eventTitle: {
    fontWeight: "900",
    color: colors.ink,
    textTransform: "capitalize",
  },
  date: { fontSize: 11, color: colors.muted, marginTop: 4 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
});
