import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, Eyebrow, PrimaryButton } from "../../../src/components/ui";
import { CancellationStatus, DisputeStatus, RefundStatus, presentStatus } from "@mmemme/domain";
import { useAuth } from "../../../src/lib/auth";
import { getBooking, type BookingDetail } from "../../../src/lib/bookings";
import {
  cancellationPreview,
  confirmFulfillment,
  getBookingSafety,
  openDispute,
  requestCancellation,
  saveNotificationPreferences,
  sendSupport,
  submitReview,
  uploadDisputeEvidence,
} from "../../../src/lib/safety";

const money = (k: number) => `₦${Math.round(k / 100).toLocaleString("en-NG")}`;
const cancellationLabel = (value: string) =>
  CancellationStatus.safeParse(value).success
    ? presentStatus("cancellation", CancellationStatus.parse(value)).label
    : "Cancellation updated";
const refundLabel = (value: string) =>
  RefundStatus.safeParse(value).success
    ? presentStatus("refund", RefundStatus.parse(value)).label
    : "Refund updated";
const disputeLabel = (value: string) =>
  DisputeStatus.safeParse(value).success
    ? presentStatus("dispute", DisputeStatus.parse(value)).label
    : "Support case updated";
export default function ManageBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [safety, setSafety] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    reminders: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [b, s] = await Promise.all([getBooking(id), getBookingSafety(id)]);
      setBooking(b);
      setSafety(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load booking tools");
    }
  };
  useEffect(() => {
    load();
  }, [id]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action could not be completed");
    } finally {
      setBusy(false);
    }
  };
  if (!booking || !safety)
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <ActivityIndicator color={colors.plum} />
          <Text>{error || "Loading support tools…"}</Text>
        </View>
      </SafeAreaView>
    );
  const dispute = safety.disputes[0];
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={st.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Eyebrow>Booking care</Eyebrow>
        <Text style={st.title}>Support and safety</Text>
        <Card title="MMEMME support" icon="chatbubble-ellipses-outline">
          <Text style={st.muted}>
            Messages stay attached to this booking and are visible only to you and authorized
            operations staff.
          </Text>
          {safety.messages.map((m: any) => (
            <View key={m.id} style={[st.bubble, m.author_id === user?.id ? st.mine : st.theirs]}>
              <Text style={st.body}>{m.body}</Text>
              <Text style={st.date}>{new Date(m.created_at).toLocaleString("en-NG")}</Text>
            </View>
          ))}
          <TextInput
            accessibilityLabel="Message MMEMME support"
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="How can we help?"
            style={[st.input, st.textarea]}
          />
          <PrimaryButton
            disabled={busy || !message.trim()}
            onPress={() =>
              run(async () => {
                await sendSupport(id, user!.id, message);
                setMessage("");
              })
            }
          >
            Send message
          </PrimaryButton>
        </Card>
        <Card title="Notifications and reminders" icon="notifications-outline">
          {(
            [
              ["push", "Push notifications"],
              ["email", "Critical email fallback"],
              ["reminders", "Event reminders"],
            ] as const
          ).map(([key, label]) => (
            <View style={st.toggle} key={key}>
              <Text style={st.body}>{label}</Text>
              <Switch
                accessibilityLabel={label}
                value={prefs[key]}
                onValueChange={(v) => setPrefs({ ...prefs, [key]: v })}
                trackColor={{ true: colors.coral }}
              />
            </View>
          ))}
          <PrimaryButton
            disabled={busy}
            onPress={() => run(() => saveNotificationPreferences(user!.id, prefs))}
          >
            Save preferences
          </PrimaryButton>
        </Card>
        {["accepted_awaiting_payment", "confirmed", "service_due"].includes(booking.status) &&
          !safety.cancellation && (
            <Card title="Cancellation preview" icon="calculator-outline">
              <Text style={st.muted}>
                Preview the policy calculation before sending a request. Nothing changes until
                operations reviews it.
              </Text>
              {preview && (
                <View style={st.calculation}>
                  <Text style={st.body}>Paid: {money(preview.paidAmountKobo)}</Text>
                  <Text style={st.body}>
                    Estimated refund: {money(preview.refundableAmountKobo)} ({preview.refundPercent}
                    %)
                  </Text>
                  <Text style={st.body}>
                    Estimated retained amount: {money(preview.retainedAmountKobo)}
                  </Text>
                  <Text style={st.date}>
                    Policy {preview.policyVersion} · {preview.daysBeforeEvent} days before event
                  </Text>
                </View>
              )}
              <PrimaryButton
                disabled={busy}
                onPress={() => run(async () => setPreview(await cancellationPreview(id)))}
              >
                Calculate preview
              </PrimaryButton>
              <TextInput
                accessibilityLabel="Cancellation reason"
                multiline
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Tell us why you need to cancel"
                style={[st.input, st.textarea]}
              />
              <PrimaryButton
                disabled={busy || !preview || cancelReason.trim().length < 10}
                onPress={() => run(() => requestCancellation(id, cancelReason))}
              >
                Request cancellation
              </PrimaryButton>
            </Card>
          )}
        {safety.cancellation && (
          <Card title="Cancellation status" icon="document-text-outline">
            <Text style={st.state}>{cancellationLabel(safety.cancellation.status)}</Text>
            <Text style={st.body}>
              Estimated refund: {money(safety.cancellation.refundable_amount_kobo)}
            </Text>
            {safety.refunds[0] && (
              <Text style={st.body}>Refund: {refundLabel(safety.refunds[0].status)}</Text>
            )}
          </Card>
        )}
        {["confirmed", "service_due", "fulfilled", "disputed"].includes(booking.status) && (
          <Card title="Dispute and evidence" icon="shield-outline">
            {dispute ? (
              <>
                <Text style={st.state}>{disputeLabel(dispute.status)}</Text>
                <Text style={st.body}>{dispute.reason}</Text>
                <PrimaryButton
                  disabled={busy}
                  onPress={() => run(() => uploadDisputeEvidence(dispute.id, user!.id))}
                >
                  Attach evidence
                </PrimaryButton>
              </>
            ) : (
              <>
                <TextInput
                  accessibilityLabel="Dispute reason"
                  multiline
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  placeholder="Explain what happened and the resolution you need"
                  style={[st.input, st.textarea]}
                />
                <PrimaryButton
                  disabled={busy || disputeReason.trim().length < 20}
                  onPress={() => run(() => openDispute(id, disputeReason))}
                >
                  Open dispute
                </PrimaryButton>
              </>
            )}
          </Card>
        )}
        {booking.status === "service_due" && (
          <Card title="Confirm fulfillment" icon="checkmark-done-outline">
            <Text style={st.muted}>
              Confirm only after the vendor has delivered the booked service.
            </Text>
            <PrimaryButton disabled={busy} onPress={() => run(() => confirmFulfillment(id))}>
              The service was delivered
            </PrimaryButton>
          </Card>
        )}
        {booking.status === "completed" && !safety.review && (
          <Card title="Verified review" icon="star-outline">
            <View style={st.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${n} stars`}
                  key={n}
                  onPress={() => setRating(n)}
                >
                  <Ionicons
                    name={n <= rating ? "star" : "star-outline"}
                    size={30}
                    color={colors.gold}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              accessibilityLabel="Review"
              multiline
              value={review}
              onChangeText={setReview}
              placeholder="Describe the service you received"
              style={[st.input, st.textarea]}
            />
            <PrimaryButton
              disabled={busy || review.trim().length < 20}
              onPress={() =>
                run(() => {
                  if (!booking.vendor_id)
                    throw new Error("This vendor is no longer available for review.");
                  return submitReview(id, user!.id, booking.vendor_id, rating, review);
                })
              }
            >
              Submit verified review
            </PrimaryButton>
          </Card>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={st.error}>
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function Card({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <View style={st.card}>
      <View style={st.cardHead}>
        <Ionicons name={icon} size={22} color={colors.plum} />
        <Text style={st.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
const st = StyleSheet.create({
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
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    gap: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 9 },
  cardTitle: { fontSize: 19, fontWeight: "900", color: colors.ink },
  muted: { color: colors.muted, lineHeight: 20 },
  body: { color: colors.ink, lineHeight: 20 },
  date: { color: colors.muted, fontSize: 10, marginTop: 5 },
  bubble: { padding: 12, borderRadius: 15, maxWidth: "88%" },
  mine: { backgroundColor: colors.rose, alignSelf: "flex-end" },
  theirs: { backgroundColor: colors.rose, alignSelf: "flex-start" },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 13,
    color: colors.ink,
    backgroundColor: colors.ivory,
  },
  textarea: { minHeight: 95, textAlignVertical: "top" },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calculation: {
    backgroundColor: colors.rose,
    padding: 14,
    borderRadius: 15,
    gap: 4,
  },
  state: { fontWeight: "900", color: colors.plum, textTransform: "capitalize" },
  stars: { flexDirection: "row", gap: 7 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorSurface,
    padding: 12,
    borderRadius: 12,
  },
});
