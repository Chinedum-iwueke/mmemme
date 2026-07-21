import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, Eyebrow, PrimaryButton, TrustBadge } from "../src/components/ui";
import { demoVendors } from "../src/data/vendors";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={demoVendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>
          <View style={styles.nav}><Text style={styles.wordmark}>mmemme</Text><Pressable accessibilityRole="button" accessibilityLabel="Open saved vendors"><Ionicons name="heart-outline" size={25} color={colors.ink} /></Pressable></View>
          <LinearGradient colors={["#F9E4E7", "#FFF4E6"]} style={styles.hero}>
            <Eyebrow>Your wedding, held with care</Eyebrow>
            <Text style={styles.title}>Book the people who bring it all together.</Text>
            <Text style={styles.subtitle}>Curated Lagos venues and caterers. Clear packages, confirmed dates and safer deposits.</Text>
            <PrimaryButton accessibilityLabel="Create your wedding brief" onPress={() => router.push("/brief")}>Create my wedding brief</PrimaryButton>
            <Pressable accessibilityRole="button" accessibilityLabel="Skip brief and browse all vendors" style={styles.browse}><Text style={styles.browseText}>Skip and browse all</Text><Ionicons name="arrow-forward" size={17} color={colors.plum} /></Pressable>
          </LinearGradient>
          <View style={styles.sectionTitle}><View><Eyebrow>Handpicked in Lagos</Eyebrow><Text style={styles.heading}>A shorter, better list</Text></View><Text style={styles.count}>25 beta spots</Text></View>
        </>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.name}, ${item.category}`} onPress={() => router.push({ pathname: "/vendor/[id]", params: { id: item.id } })} style={styles.card}>
            <View style={[styles.image, { backgroundColor: item.tone }]}><Text style={styles.imageLetter}>{item.name.slice(0, 1)}</Text><View style={styles.category}><Text style={styles.categoryText}>{item.category}</Text></View></View>
            <View style={styles.cardBody}><TrustBadge /><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.meta}>{item.area} · {item.detail}</Text><Text style={styles.price}>{item.price}</Text></View>
          </Pressable>
        )}
        ListFooterComponent={<View style={styles.promise}><Ionicons name="shield-checkmark-outline" size={28} color={colors.plum} /><View style={{ flex: 1 }}><Text style={styles.promiseTitle}>Verified means something here.</Text><Text style={styles.promiseText}>We show exactly what MMEMME checked, when it was checked and what verification does not guarantee.</Text></View></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory }, content: { padding: 18, paddingBottom: 48 },
  nav: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, wordmark: { color: colors.plum, fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  hero: { borderRadius: 30, padding: 24, gap: 16, overflow: "hidden" }, title: { color: colors.ink, fontSize: 38, lineHeight: 41, letterSpacing: -1.4, fontWeight: "800" }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  browse: { minHeight: 44, flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" }, browseText: { color: colors.plum, fontWeight: "800" },
  sectionTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 34, marginBottom: 16 }, heading: { fontSize: 27, color: colors.ink, fontWeight: "800", marginTop: 5 }, count: { color: colors.muted, fontSize: 12 },
  card: { backgroundColor: colors.white, borderRadius: 24, marginBottom: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }, image: { height: 178, alignItems: "center", justifyContent: "center" }, imageLetter: { color: "rgba(255,255,255,.72)", fontSize: 78, fontWeight: "900" }, category: { position: "absolute", right: 12, top: 12, borderRadius: 999, backgroundColor: "rgba(50,21,39,.84)", paddingHorizontal: 12, paddingVertical: 7 }, categoryText: { color: colors.white, textTransform: "capitalize", fontWeight: "700", fontSize: 12 },
  cardBody: { padding: 17, gap: 8 }, cardTitle: { color: colors.ink, fontSize: 23, fontWeight: "800" }, meta: { color: colors.muted, lineHeight: 20 }, price: { color: colors.plum, fontSize: 16, fontWeight: "900" },
  promise: { flexDirection: "row", gap: 14, marginTop: 10, padding: 20, backgroundColor: colors.rose, borderRadius: 22 }, promiseTitle: { color: colors.ink, fontWeight: "900", fontSize: 17, marginBottom: 5 }, promiseText: { color: colors.muted, lineHeight: 20 },
});
