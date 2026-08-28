import { describe, expect, it } from "vitest";
import { brand, semantic, target } from "../src/index";
const luminance = (hex: string) => {
  const c = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
describe("production tokens", () => {
  it("keeps approved brand colors", () =>
    expect(brand).toMatchObject({ deepGreen: "#294A41", lime: "#97C354" }));
  it("passes core contrast pairs", () => {
    expect(contrast(semantic.actionPrimaryText, semantic.actionPrimary)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast(semantic.actionAccentText, semantic.actionAccent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(semantic.textSecondary, semantic.canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it("enforces 44 point targets", () => expect(target.minimum).toBeGreaterThanOrEqual(44));
});
