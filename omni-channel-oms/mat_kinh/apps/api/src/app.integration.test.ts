import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { Article, AuthResponse, Clinic, Product } from "@optiqis/shared";
import { AppModule } from "./app.module";
import { configureApp, setupSwagger } from "./app.setup";

describe("OPTIQIS API integration", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    setupSwagger(app);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns public products", async () => {
    const response = await fetch(`${baseUrl}/api/v1/products`);
    const body = (await response.json()) as Product[];

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((product) => product.slug === "digital-shield-pro")).toBe(
      true,
    );
  });

  it("rejects invalid query params and extra body fields", async () => {
    const invalidQuery = await fetch(
      `${baseUrl}/api/v1/articles?status=INVALID`,
    );
    const extraField = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@optiqis.vn",
        password: "optiqis2026",
        unexpected: "field",
      }),
    });

    expect(invalidQuery.status).toBe(400);
    expect(extraField.status).toBe(400);
  });

  it("protects admin article listing with demo bearer auth", async () => {
    const withoutAuth = await fetch(`${baseUrl}/api/v1/admin/articles`);
    const token = await getAdminToken(baseUrl);
    const withAuth = await fetch(`${baseUrl}/api/v1/admin/articles`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = (await withAuth.json()) as Article[];

    expect(withoutAuth.status).toBe(401);
    expect(withAuth.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("protects admin product listing and returns products for an authenticated CMS user", async () => {
    const withoutAuth = await fetch(`${baseUrl}/api/v1/admin/products`);
    const token = await getAdminToken(baseUrl);
    const withAuth = await fetch(`${baseUrl}/api/v1/admin/products`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = (await withAuth.json()) as Product[];

    expect(withoutAuth.status).toBe(401);
    expect(withAuth.status).toBe(200);
    expect(body.some((product) => product.slug === "digital-shield-pro")).toBe(true);
  });

  it("protects OMS status and reports disabled status when OMS is not enabled", async () => {
    const withoutAuth = await fetch(`${baseUrl}/api/v1/admin/oms/status`);
    const token = await getAdminToken(baseUrl);
    const withAuth = await fetch(`${baseUrl}/api/v1/admin/oms/status`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = (await withAuth.json()) as { state: string; enabled: boolean };

    expect(withoutAuth.status).toBe(401);
    expect(withAuth.status).toBe(200);
    expect(body.enabled).toBe(false);
    expect(body.state).toBe("disabled");
  });

  it("protects admin clinic CRUD with demo bearer auth", async () => {
    const withoutAuth = await fetch(`${baseUrl}/api/v1/admin/clinics`);
    const token = await getAdminToken(baseUrl);
    const createResponse = await fetch(`${baseUrl}/api/v1/admin/clinics`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "OPTIQIS Test Clinic",
        province: "TP. Hồ Chí Minh",
        district: "Quận 3",
        address: "123 Test Street",
        hotline: "1800 0000",
        hours: "08:00 - 18:00",
        lat: 10.78,
        lng: 106.69,
        services: ["Đo mắt", "Tư vấn kính"],
      }),
    });
    const created = (await createResponse.json()) as Clinic;
    const updateResponse = await fetch(`${baseUrl}/api/v1/admin/clinics/${created.id}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ district: "Quận 1" }),
    });
    const updated = (await updateResponse.json()) as Clinic;
    const deleteResponse = await fetch(`${baseUrl}/api/v1/admin/clinics/${created.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(withoutAuth.status).toBe(401);
    expect(createResponse.status).toBe(201);
    expect(created.name).toBe("OPTIQIS Test Clinic");
    expect(updateResponse.status).toBe(200);
    expect(updated.district).toBe("Quận 1");
    expect(deleteResponse.status).toBe(200);
  });

  it("captures public consultation leads and protects lead management", async () => {
    const createResponse = await fetch(`${baseUrl}/api/v1/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: "Nguyen Test",
        phone: "0901234567",
        email: "lead@example.com",
        province: "TP. Hồ Chí Minh",
        district: "Quận 1",
        productId: "product-digital-shield",
        productName: "OPTIQIS Digital Shield Pro",
        preferredTime: "Cuối tuần",
        note: "Tôi muốn tư vấn tròng kính chống ánh sáng xanh",
        source: "PRODUCT_DETAIL",
      }),
    });
    const created = (await createResponse.json()) as { id: string; status: string };
    const invalidResponse = await fetch(`${baseUrl}/api/v1/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: "A",
        phone: "abc",
        source: "PRODUCT_DETAIL",
      }),
    });
    const withoutAuth = await fetch(`${baseUrl}/api/v1/admin/leads`);
    const token = await getAdminToken(baseUrl);
    const listResponse = await fetch(`${baseUrl}/api/v1/admin/leads`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const leads = (await listResponse.json()) as Array<{ id: string; fullName: string; status: string }>;
    const updateResponse = await fetch(`${baseUrl}/api/v1/admin/leads/${created.id}/status`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    const updated = (await updateResponse.json()) as { id: string; status: string };

    expect(createResponse.status, JSON.stringify(created)).toBe(201);
    expect(created.id).toBeTruthy();
    expect(created.status).toBe("NEW");
    expect(invalidResponse.status).toBe(400);
    expect(withoutAuth.status).toBe(401);
    expect(listResponse.status).toBe(200);
    expect(leads.some((lead) => lead.id === created.id && lead.fullName === "Nguyen Test")).toBe(true);
    expect(updateResponse.status).toBe(200);
    expect(updated.status).toBe("CONTACTED");
  });

  it("rejects invalid article workflow transition through the API", async () => {
    const token = await getAdminToken(baseUrl);
    const response = await fetch(
      `${baseUrl}/api/v1/admin/articles/article-cvs-blue-light/status`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "SCHEDULED" }),
      },
    );

    expect(response.status).toBe(400);
  });

  it("publishes Swagger JSON with bearer security and documented paths", async () => {
    const response = await fetch(`${baseUrl}/docs-json`);
    const document = (await response.json()) as {
      paths?: Record<string, unknown>;
      components?: { securitySchemes?: Record<string, unknown> };
    };

    expect(response.status).toBe(200);
    expect(document.paths?.["/api/v1/products"]).toBeDefined();
    expect(document.paths?.["/api/v1/admin/articles"]).toBeDefined();
    expect(document.components?.securitySchemes?.["demo-bearer"]).toBeDefined();
  });
});

async function getAdminToken(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "admin@optiqis.vn",
      password: "optiqis2026",
    }),
  });
  const body = (await response.json()) as AuthResponse;

  return body.token;
}
