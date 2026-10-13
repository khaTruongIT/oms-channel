/**
 * Single source of truth for design tokens.
 * Consumed by tailwind.config.ts and AntdConfigProvider.tsx.
 */
export const colors = {
  primary: {
    DEFAULT: "#0369A1",
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0369A1",
    700: "#075985",
    800: "#0C4A6E",
    900: "#082F49",
  },
  secondary: {
    DEFAULT: "#0F172A",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  success: { DEFAULT: "#10B981", light: "#ECFDF5", dark: "#047857" },
  danger: { DEFAULT: "#DC2626", light: "#FEF2F2", dark: "#B91C1C" },
  warning: { DEFAULT: "#D97706", light: "#FFFBEB", dark: "#B45309" },
  info: { DEFAULT: "#0284C7", light: "#F0F9FF", dark: "#075985" },
  heading: "#0F172A",
  body: "#475569",
  muted: "#64748B",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
} as const;

export const antdTokens = {
  colorPrimary: colors.primary.DEFAULT,
  colorSuccess: colors.success.DEFAULT,
  colorWarning: colors.warning.DEFAULT,
  colorError: colors.danger.DEFAULT,
  colorInfo: colors.info.DEFAULT,
  colorTextBase: colors.heading,
  colorBgLayout: colors.background,
  colorBorder: colors.border,
  borderRadius: 8,
  fontFamily: "inherit",
} as const;

/** Returns hue in degrees (0-360) for a #RRGGBB color. */
export function hexToHue(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    })
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/** WCAG contrast ratio between two #RRGGBB colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
