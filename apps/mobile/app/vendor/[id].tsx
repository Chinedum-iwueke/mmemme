import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, Eyebrow, PrimaryButton, TrustBadge } from "../../src/components/ui";
import { demoVendors } from "../../src/data/vendors";

export default function VendorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendor = demoVendors.find((item) => item.id === id) ?? demoVendors[0];
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={[styles.hero, { backgroundColor: vendor.tone }]}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.letter}>{vendor.name.slice(0, 1)}</Text></View>
    <View style={styles.body}><TrustBadge /><Text style={styles.title}>{vendor.name}</Text><Text style={styles.meta}>{vendor.area} · {vendor.detail}</Text><Text style={styles.price}>{vendor.price}</Text>
      <View style={styles.rule} />
      <Eyebrow>What MMEMME checked</Eyebrow>
      {['Identity and contact', 'Bank account name', 'Business authority', 'Portfolio and references', 'Physical operating site'].map((item) => <View key={item} style={styles.checkRow}><Ionicons name="checkmark-circle" size={20} color={colors.success} /><Text style={styles.checkText}>{item}</Text></View>)}
      <Text style={styles.verified}>Last checked {vendor.verifiedOn}. Verification is not a guarantee of service quality or fulfillment.</Text>
      <View style={styles.package}><Eyebrow>Signature package</Eyebrow><Text style={styles.packageTitle}>{vendor.category === 'venue' ? 'Full-day wedding hire' : 'Classic Nigerian celebration menu'}</Text><Text style={styles.packageText}>Your final price, confirmed availability, deposit schedule and cancellation amount appear in a quote before you pay.</Text></View>
      <View style={styles.notice}><Ionicons name="time-outline" size={22} color={colors.gold} /><Text style={styles.noticeText}>Availability is vendor-confirmed. MMEMME checks your date before issuing a payment-ready quote.</Text></View>
      <PrimaryButton accessibilityLabel={`Request ${vendor.name}`} onPress={() => {}}>Request this {vendor.category}</PrimaryButton>
    </View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory }, content: { paddingBottom: 42 }, hero: { height: 260, alignItems: 'center', justifyContent: 'center' }, back: { position: 'absolute', left: 18, top: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.9)', alignItems: 'center', justifyContent: 'center' }, letter: { color: 'rgba(255,255,255,.75)', fontSize: 110, fontWeight: '900' },
  body: { marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.ivory, padding: 22, gap: 10 }, title: { color: colors.ink, fontSize: 34, fontWeight: '900', letterSpacing: -1 }, meta: { color: colors.muted, fontSize: 15 }, price: { color: colors.plum, fontWeight: '900', fontSize: 19 }, rule: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }, checkText: { color: colors.ink, fontWeight: '600' }, verified: { color: colors.muted, lineHeight: 19, fontSize: 12, marginTop: 6 },
  package: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, gap: 8, marginTop: 14 }, packageTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' }, packageText: { color: colors.muted, lineHeight: 21 },
  notice: { flexDirection: 'row', gap: 12, backgroundColor: '#FFF2D5', padding: 16, borderRadius: 18, marginVertical: 8 }, noticeText: { color: '#68470D', flex: 1, lineHeight: 20, fontWeight: '600' },
});
