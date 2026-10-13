import { describe, it, expect } from "vitest";
import { colors, antdTokens, hexToHue, contrastRatio } from "./design-tokens";

describe("design-tokens", () => {
  it("uses the unified brand palette", () => {
    expect(colors.primary.DEFAULT).toBe("#0369A1");
    expect(colors.secondary.DEFAULT).toBe("#0F172A");
    expect(colors.success.DEFAULT).toBe("#10B981");
    expect(colors.background).toBe("#F8FAFC");
  });

  it("keeps antd colorPrimary in sync with tailwind primary", () => {
    expect(antdTokens.colorPrimary).toBe(colors.primary.DEFAULT);
    expect(antdTokens.colorSuccess).toBe(colors.success.DEFAULT);
    expect(antdTokens.colorError).toBe(colors.danger.DEFAULT);
    expect(antdTokens.colorWarning).toBe(colors.warning.DEFAULT);
  });

  it("contains no purple/violet/pink hues in primary scale", () => {
    for (const hex of Object.values(colors.primary)) {
      const hue = hexToHue(hex);
      expect(hue >= 255 && hue <= 340).toBe(false);
    }
  });

  it.each(["success", "warning", "danger", "info"] as const)(
    "badge %s text/background contrast >= 4.5:1",
    (variant) => {
      const { light, dark } = colors[variant];
      expect(contrastRatio(dark, light)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("default badge contrast >= 4.5:1", () => {
    expect(
      contrastRatio(colors.secondary[700], colors.secondary[100]),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
