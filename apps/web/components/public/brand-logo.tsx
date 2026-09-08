import Image from "next/image";

export function BrandLogo({
  treatment = "green",
  className = "",
  priority = false,
}: {
  treatment?: "green" | "lime" | "white";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      alt="MMEMME"
      className={`brand-logo ${className}`.trim()}
      height={58}
      priority={priority}
      src={`/brand/mmemme-stacked-${treatment}.png`}
      width={120}
    />
  );
}
