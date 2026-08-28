import { readFileSync } from "node:fs";
const source = readFileSync("apps/mobile/src/components/production-ui.tsx", "utf8");
const gallery = readFileSync("apps/mobile/app/component-gallery.tsx", "utf8");
const components = [
  "SafeScreen",
  "KeyboardForm",
  "Button",
  "TextLink",
  "Input",
  "DateInput",
  "Select",
  "Currency",
  "Badge",
  "Card",
  "ProductImage",
  "StepTrail",
  "Pagination",
  "Skeleton",
  "EmptyState",
  "ErrorState",
  "FormError",
  "Dialog",
  "Sheet",
  "Toast",
];
for (const name of components)
  if (!source.includes(`function ${name}`) && !new RegExp(`const\\s+${name}\\s*=`).test(source)) {
    console.error(`Missing native component: ${name}`);
    process.exit(1);
  }
for (const contract of [
  "SafeAreaView",
  "KeyboardAvoidingView",
  "accessibilityLabel",
  "accessibilityRole",
  "accessibilityLiveRegion",
  "target.control",
  "target.minimum",
])
  if (!source.includes(contract)) {
    console.error(`Native accessibility contract missing: ${contract}`);
    process.exit(1);
  }
if (
  !gallery.includes("useWindowDimensions") ||
  !/increase device text size to 200%/i.test(gallery)
) {
  console.error("Native gallery lacks small viewport or font scaling guidance");
  process.exit(1);
}
console.log(`${components.length} native primitives and accessibility contracts passed.`);
