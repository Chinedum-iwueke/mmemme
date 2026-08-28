"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";
export function PaymentRecovery({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Checking the authoritative payment status…");
  useEffect(() => {
    let attempts = 0;
    const check = async () => {
      const { data } = await browserClient()
        .from("payments")
        .select("status")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.status === "succeeded") {
        setMessage("Payment verified. Your booking is confirmed.");
        router.refresh();
        return;
      }
      if (data?.status === "failed") {
        setMessage("The payment was not completed. You can safely try again from the booking.");
        return;
      }
      attempts++;
      if (attempts < 12) setTimeout(check, 2500);
      else
        setMessage(
          "We are still waiting for Paystack’s server confirmation. Your return to this page does not confirm payment; check again shortly.",
        );
    };
    check();
    return () => {
      attempts = 99;
    };
  }, [bookingId, router]);
  return (
    <div className="confirming-card" role="status">
      <span className="status-pulse" />
      <p>{message}</p>
    </div>
  );
}
