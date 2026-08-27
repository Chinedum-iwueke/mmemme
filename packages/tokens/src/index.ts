export const brand = { deepGreen: "#294A41", lime: "#97C354" } as const;
export const color = {
  canvas: "#FBFCF8",
  surface: "#FFFFFF",
  text: { primary: "#15231F", secondary: "#53625C", inverse: "#FFFFFF" },
  border: { default: "#E8EEE9", strong: "#D2DDD5" },
  action: { primary: "#294A41", primaryText: "#FFFFFF", accent: "#97C354", accentText: "#15231F" },
  focus: "#97C354",
} as const;
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;
export const radius = { none: 0, sm: 6, md: 10, lg: 16, xl: 24, full: 999 } as const;
export const motion = {
  duration: { instant: 80, fast: 160, base: 240, slow: 360 },
  easing: {
    enter: "cubic-bezier(.16,1,.3,1)",
    exit: "cubic-bezier(.7,0,.84,0)",
    move: "cubic-bezier(.65,0,.35,1)",
  },
} as const;
