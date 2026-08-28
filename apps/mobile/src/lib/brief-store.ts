import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export type DraftBrief = {
  date: string;
  area: string;
  guests: string;
  budgetMin: string;
  budgetMax: string;
  priorities: Array<"venue" | "caterer">;
};
const KEY = "mmemme:wedding-brief:draft:v1";
const DEVICE_KEY = "mmemme:device:v1";
export const emptyBrief: DraftBrief = {
  date: "",
  area: "",
  guests: "",
  budgetMin: "",
  budgetMax: "",
  priorities: [],
};
export const readDraftBrief = async () =>
  JSON.parse((await AsyncStorage.getItem(KEY)) ?? "null") as DraftBrief | null;
export const writeDraftBrief = async (brief: DraftBrief) =>
  AsyncStorage.setItem(KEY, JSON.stringify(brief));
export async function readAccountDraft() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/customer_drafts?select=brief,revision,source_device_id,updated_at`,
    {
      headers: {
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );
  if (!response.ok) return null;
  return (
    (
      (await response.json()) as Array<{
        brief: DraftBrief;
        revision: number;
        source_device_id: string;
        updated_at: string;
      }>
    )[0] ?? null
  );
}
export async function syncAccountDraft(brief: DraftBrief, expectedRevision = 1) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  let deviceId = await AsyncStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_KEY, deviceId);
  }
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/save_customer_draft`,
    {
      method: "POST",
      headers: {
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_brief: brief,
        p_expected_revision: expectedRevision,
        p_source_device_id: deviceId,
      }),
    },
  );
  if (!response.ok)
    throw new Error((await response.json().catch(() => null))?.message ?? "draft sync failed");
  return (await response.json()) as { brief: DraftBrief; revision: number };
}

export async function persistBrief(userId: string, brief: DraftBrief) {
  const row = {
    customer_id: userId,
    wedding_date: brief.date,
    area: brief.area.trim(),
    guest_count: Number(brief.guests),
    budget_min_kobo: Number(brief.budgetMin) * 100,
    budget_max_kobo: Number(brief.budgetMax) * 100,
    priorities: brief.priorities,
  };
  const { data: existing } = await supabase
    .from("wedding_briefs")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const query = existing
    ? supabase.from("wedding_briefs").update(row).eq("id", existing.id)
    : supabase.from("wedding_briefs").insert(row);
  const { data, error } = await query.select("id").single();
  if (error) throw error;
  return data.id as string;
}
