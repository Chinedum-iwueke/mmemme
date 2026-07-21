import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export type DraftBrief = {
  date: string; area: string; guests: string; budgetMin: string; budgetMax: string;
  priorities: Array<"venue" | "caterer">;
};
const KEY = "mmemme:wedding-brief:draft:v1";
export const emptyBrief: DraftBrief = { date: "", area: "", guests: "", budgetMin: "", budgetMax: "", priorities: [] };
export const readDraftBrief = async () => JSON.parse(await AsyncStorage.getItem(KEY) ?? "null") as DraftBrief | null;
export const writeDraftBrief = async (brief: DraftBrief) => AsyncStorage.setItem(KEY, JSON.stringify(brief));

export async function persistBrief(userId: string, brief: DraftBrief) {
  const row = {
    customer_id: userId, wedding_date: brief.date, area: brief.area.trim(),
    guest_count: Number(brief.guests), budget_min_kobo: Number(brief.budgetMin) * 100,
    budget_max_kobo: Number(brief.budgetMax) * 100, priorities: brief.priorities,
  };
  const { data, error } = await supabase.from("wedding_briefs").insert(row).select("id").single();
  if (error) throw error;
  return data.id as string;
}
