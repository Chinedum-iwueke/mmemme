import Image from "next/image";

export function AdminBrandLogo({ treatment = "lime" }: { treatment?: "green" | "lime" }) {
  return (
    <span className="admin-logo-lockup">
      <Image
        alt="MMEMME"
        className="admin-logo"
        height={58}
        priority
        src={`/brand/mmemme-stacked-${treatment}.png`}
        width={120}
      />
      <span>Operations</span>
    </span>
  );
}
