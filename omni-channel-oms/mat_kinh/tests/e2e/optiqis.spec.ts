import { expect, test } from "@playwright/test";

test("public product journey works", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Thế giới rõ hơn khi đôi mắt được hiểu đúng/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Tìm tròng kính phù hợp/i }).click();
  await expect(page).toHaveURL(/\/san-pham/);
  await page.getByLabel("Nhu cầu thị giác").selectOption("screen");
  await page
    .getByRole("link", { name: /Tìm hiểu chi tiết/i })
    .first()
    .click();

  await expect(
    page.getByRole("heading", { name: /Digital Shield/i }),
  ).toBeVisible();
  await expect(page.getByLabel("So sanh truoc sau")).toBeVisible();
});

test("knowledge article shows governance and related CTA", async ({ page }) => {
  await page.goto("/kien-thuc/hoi-chung-cvs-anh-sang-xanh");

  await expect(page.getByText(/Medical governance/i)).toBeVisible();
  await expect(page.getByText(/Giải pháp liên quan/i)).toBeVisible();
  await expect(
    page.locator(".medical-prose").getByText(/khong thay the chan doan/i),
  ).toBeVisible();
});

test("admin editor opens SEO assistant", async ({ page }) => {
  await page.goto("/admin/articles");
  await page.getByRole("link", { name: /Hoi chung thi giac/i }).click();

  await expect(
    page.getByRole("heading", { name: /Chỉnh sửa bài viết/i }),
  ).toBeVisible();
  await expect(page.getByText(/OPTIQIS SEO Score/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /PENDING_MEDICAL_REVIEW/i }),
  ).toBeVisible();
});
