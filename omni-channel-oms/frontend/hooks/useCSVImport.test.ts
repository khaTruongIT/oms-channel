import { describe, it, expect } from "vitest";
import { parseCSVString, validateCSVData } from "./useCSVImport";

describe("useCSVImport parsing and validation", () => {
  it("should strip BOM and parse Vietnamese UTF-8 headers and rows correctly", () => {
    const rawCSV = "\uFEFFsku,name,price\nSKU-VN-01,Áo thun cotton thoáng mát,150000\nSKU-VN-02,Quần tây công sở cao cấp,280000";
    const result = parseCSVString(rawCSV);

    expect(result.headers).toEqual(["sku", "name", "price"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].sku).toBe("SKU-VN-01");
    expect(result.rows[0].name).toBe("Áo thun cotton thoáng mát");
    expect(result.rows[0].price).toBe("150000");
  });

  it("should skip empty rows and trim whitespace from fields", () => {
    const rawCSV = "sku,name,price\n  SKU-01  ,  Sản phẩm 1  , 50000 \n\n   \nSKU-02,Sản phẩm 2,60000\n";
    const result = parseCSVString(rawCSV);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].sku).toBe("SKU-01");
    expect(result.rows[0].name).toBe("Sản phẩm 1");
    expect(result.rows[0].price).toBe("50000");
  });

  it("should identify duplicate SKUs in CSV content", () => {
    const rawCSV = "sku,name,price\nSKU-DUP,Sản phẩm A,100\nSKU-DUP,Sản phẩm B,200\nSKU-UNIQUE,Sản phẩm C,300";
    const result = parseCSVString(rawCSV);

    expect(result.duplicateSkus).toEqual(["SKU-DUP"]);
  });

  it("should validate required fields and report missing columns", () => {
    const csvData = {
      headers: ["sku", "description"],
      rows: [{ sku: "SKU-1", description: "Desc" }],
      duplicateSkus: [],
    };

    const validation = validateCSVData(csvData, ["sku", "name", "price"]);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("Thiếu cột bắt buộc: name");
    expect(validation.errors).toContain("Thiếu cột bắt buộc: price");
  });

  it("should report warning or error if duplicate SKUs exist", () => {
    const csvData = {
      headers: ["sku", "name", "price"],
      rows: [
        { sku: "SKU-1", name: "A", price: "10" },
        { sku: "SKU-1", name: "B", price: "20" },
      ],
      duplicateSkus: ["SKU-1"],
    };

    const validation = validateCSVData(csvData, ["sku", "name", "price"]);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("SKU bị trùng lặp"))).toBe(true);
  });
});
