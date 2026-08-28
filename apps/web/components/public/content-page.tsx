import Link from "next/link";
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <main id="main">
      <header className="content-hero">
        <div className="shell narrow">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
          {action && (
            <Link className="button accent" href={action.href}>
              {action.label}
            </Link>
          )}
        </div>
      </header>
      <article className="shell prose">{children}</article>
    </main>
  );
}
export function LegalNotice({ version }: { version: string }) {
  const approved = process.env.NEXT_PUBLIC_LEGAL_CONTENT_STATUS === "approved";
  return (
    <div
      className={approved ? "legal-version" : "legal-draft"}
      role={approved ? undefined : "note"}
    >
      <strong>{approved ? "Policy version" : "Draft policy—not yet live terms"}</strong>
      <span>Version {version} · Last reviewed 28 August 2026</span>
      {!approved && (
        <p>This structured draft requires Nigerian counsel approval before production launch.</p>
      )}
    </div>
  );
}
