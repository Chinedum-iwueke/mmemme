import { readFileSync, writeFileSync } from "node:fs";
const tokens = JSON.parse(readFileSync(new URL("../src/tokens.json", import.meta.url), "utf8"));
const kebab = (value) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const lines = [];
const format = (value, path) => {
  if (typeof value !== "number") return value;
  if (path.includes("weight") || path.includes("zIndex")) return String(value);
  if (path.includes("duration")) return `${value}ms`;
  return `${value}px`;
};
const walk = (object, path = []) =>
  Object.entries(object).forEach(([key, value]) =>
    typeof value === "object"
      ? walk(value, [...path, key])
      : lines.push(`  --mm-${[...path, key].map(kebab).join("-")}: ${format(value, path)};`),
  );
walk(tokens);
writeFileSync(
  new URL("../src/tokens.css", import.meta.url),
  `/* Generated from tokens.json. Do not edit. */\n:root {\n${lines.join("\n")}\n}\n`,
);
