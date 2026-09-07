import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { router } from "expo-router";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "./auth";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function safeRoute(value: unknown) {
  if (typeof value !== "string") return "/bookings";
  const route = value.replace(/^mmemme:\/\//, "/");
  return /^\/(booking\/[^/?#]+|bookings|profile|shortlist)([/?#]|$)/.test(route)
    ? route
    : "/bookings";
}

export function AppLifecycle({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const routedResponse = useRef<string | null>(null);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const prepareUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // A failed update check must never block the booking experience.
      }
    };
    prepareUpdate();
    const listener = AppState.addEventListener(
      "change",
      (state) => state === "active" && prepareUpdate(),
    );
    return () => listener.remove();
  }, []);

  useEffect(() => {
    const route = (url: string) => {
      const parsed = Linking.parse(url);
      const path = safeRoute(`/${parsed.path ?? ""}`);
      router.navigate(
        (user
          ? path
          : { pathname: "/auth", params: { next: path, intent: "open this update" } }) as never,
      );
    };
    Linking.getInitialURL().then((url) => url && route(url));
    const listener = Linking.addEventListener("url", ({ url }) => route(url));
    return () => listener.remove();
  }, [user]);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response || response.notification.request.identifier === routedResponse.current) return;
      routedResponse.current = response.notification.request.identifier;
      const data = response.notification.request.content.data ?? {};
      const path = safeRoute(data.deep_link ?? data.path);
      router.navigate(
        (user
          ? path
          : {
              pathname: "/auth",
              params: { next: path, intent: "open this booking update" },
            }) as never,
      );
    };
    Notifications.getLastNotificationResponseAsync().then(open);
    const listener = Notifications.addNotificationResponseReceivedListener(open);
    return () => listener.remove();
  }, [user]);

  useEffect(() => {
    if (!user || Platform.OS === "web") return;
    const refresh = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.navigate({ pathname: "/auth", params: { next: "/bookings", intent: "continue" } });
        return;
      }
      const permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") return;
      const projectId =
        Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      await supabase
        .from("push_tokens")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("customer_id", user.id)
        .eq("platform", Platform.OS)
        .neq("token", token);
      await supabase.from("push_tokens").upsert(
        {
          customer_id: user.id,
          token,
          platform: Platform.OS,
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" },
      );
    };
    refresh();
    const listener = AppState.addEventListener(
      "change",
      (state) => state === "active" && refresh(),
    );
    return () => listener.remove();
  }, [user]);

  return children;
}
