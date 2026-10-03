import { describe, expect, it } from "vitest";
import { getUniqueValues } from "./format";

describe("format helpers", () => {
  it("returns sorted unique values", () => {
    const result = getUniqueValues(
      [{ province: "Ha Noi" }, { province: "Da Nang" }, { province: "Ha Noi" }],
      (item) => item.province,
    );

    expect(result).toEqual(["Da Nang", "Ha Noi"]);
  });
});
