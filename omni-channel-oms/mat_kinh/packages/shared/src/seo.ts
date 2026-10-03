import type { SeoInput, SeoResult } from "./types";

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function scoreSeo(input: SeoInput): SeoResult {
  const checks = [
    {
      label: "H1 nen nam trong khoang 30-70 ky tu",
      passed: inRange(input.title.trim().length, 30, 70),
    },
    {
      label: "Meta title nen nam trong khoang 30-70 ky tu",
      passed: inRange(input.seoTitle.trim().length, 30, 70),
    },
    {
      label: "Meta description nen nam trong khoang 140-160 ky tu",
      passed: inRange(input.seoDescription.trim().length, 140, 160),
    },
    {
      label: "Slug than thien SEO",
      passed: Boolean(input.slug && /^[a-z0-9-]+$/.test(input.slug)),
    },
    {
      label: "Co chuyen muc y khoa",
      passed: Boolean(input.category),
    },
    {
      label: "Co san pham lien quan de dan CTA theo ngu canh",
      passed: Boolean(input.relatedProductIds?.length),
    },
  ];
  const passed = checks.filter((check) => check.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const warnings = checks
    .filter((check) => !check.passed)
    .map((check) => check.label);

  return { score, warnings, checks };
}
