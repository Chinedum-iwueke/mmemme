import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const KEY = "mmemme.shortlist.v1";

export async function readDeviceShortlist() {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export async function listShortlist(userId?: string) {
  const local = await readDeviceShortlist();
  if (!userId) return local;
  const { data, error } = await supabase
    .from("shortlist_items")
    .select("vendor_id")
    .eq("customer_id", userId);
  if (error) return local;
  const merged = [...new Set([...local, ...(data ?? []).map((item) => item.vendor_id)])];
  await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  if (merged.length)
    await supabase.from("shortlist_items").upsert(
      merged.map((vendorId) => ({ customer_id: userId, vendor_id: vendorId })),
      { onConflict: "customer_id,vendor_id" },
    );
  return merged;
}

export async function toggleShortlist(vendorId: string, userId?: string) {
  const current = await listShortlist(userId);
  const saved = current.includes(vendorId);
  const next = saved ? current.filter((id) => id !== vendorId) : [...current, vendorId];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  if (userId) {
    if (saved)
      await supabase
        .from("shortlist_items")
        .delete()
        .eq("customer_id", userId)
        .eq("vendor_id", vendorId);
    else
      await supabase.from("shortlist_items").upsert({ customer_id: userId, vendor_id: vendorId });
  }
  return !saved;
}
