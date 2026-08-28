import values from "./tokens.json";
export const tokens = values;
export const brand = values.brand;
export const neutral = values.neutral;
export const semantic = values.semantic;
export const space = values.space;
export const radius = values.radius;
export const type = values.type;
export const elevation = values.elevation;
export const motion = values.motion;
export const breakpoint = values.breakpoint;
export const target = values.target;
export const zIndex = values.zIndex;
export const color = {
  canvas: semantic.canvas,
  surface: semantic.surface,
  text: {
    primary: semantic.textPrimary,
    secondary: semantic.textSecondary,
    inverse: semantic.textInverse,
  },
  border: { default: semantic.borderDefault, strong: semantic.borderStrong },
  action: {
    primary: semantic.actionPrimary,
    primaryText: semantic.actionPrimaryText,
    accent: semantic.actionAccent,
    accentText: semantic.actionAccentText,
  },
  focus: semantic.focusRing,
} as const;
