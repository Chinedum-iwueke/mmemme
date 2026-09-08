export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("PUBLIC_WEB_URL") ?? "https://mmemme.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};
