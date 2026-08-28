import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../../components/customer/auth-form";
export const metadata: Metadata = {
  title: "Customer sign in",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="auth-page" id="main">
      <Suspense fallback={<p>Preparing secure sign in…</p>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
