import { describe, expect, test } from "bun:test";
import { err, ok } from "neverthrow";

describe("Neverthrow Result Type", () => {
  describe("ok", () => {
    test("should create success result", () => {
      const result = ok("test");
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe("test");
    });
  });

  describe("err", () => {
    test("should create error result", () => {
      const error = new Error("test error");
      const result = err(error);
      expect(result.isErr()).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe("map", () => {
    test("should transform success data", () => {
      const result = ok(5);
      const mapped = result.map((x) => x * 2);
      expect(mapped.isOk()).toBe(true);
      if (mapped.isOk()) {
        expect(mapped.value).toBe(10);
      }
    });

    test("should not transform error", () => {
      const error = new Error("test");
      const result = err(error);
      const mapped = result.map((x) => x * 2);
      expect(mapped.isErr()).toBe(true);
      if (mapped.isErr()) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe("mapErr", () => {
    test("should transform error", () => {
      const result = err("original error");
      const mapped = result.mapErr((err) => `mapped: ${err}`);
      expect(mapped.isErr()).toBe(true);
      if (mapped.isErr()) {
        expect(mapped.error).toBe("mapped: original error");
      }
    });

    test("should not transform success", () => {
      const result = ok("data");
      const mapped = result.mapErr((err) => `mapped: ${err}`);
      expect(mapped.isOk()).toBe(true);
      if (mapped.isOk()) {
        expect(mapped.value).toBe("data");
      }
    });
  });

  describe("andThen", () => {
    test("should chain successful operations", () => {
      const result = ok(5);
      const chained = result.andThen((x) => ok(x * 2));
      expect(chained.isOk()).toBe(true);
      if (chained.isOk()) {
        expect(chained.value).toBe(10);
      }
    });

    test("should chain failing operations", () => {
      const result = ok(5);
      const error = new Error("chain error");
      const chained = result.andThen(() => err(error));
      expect(chained.isErr()).toBe(true);
      if (chained.isErr()) {
        expect(chained.error).toBe(error);
      }
    });

    test("should not execute operation on error", () => {
      const error = new Error("original");
      const result = err(error);
      const chained = result.andThen((x) => ok(x * 2));
      expect(chained.isErr()).toBe(true);
      if (chained.isErr()) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe("unwrapOr", () => {
    test("should extract data from success", () => {
      const result = ok("test data");
      const data = result.unwrapOr("default");
      expect(data).toBe("test data");
    });

    test("should return default on error", () => {
      const error = new Error("test error");
      const result = err(error);
      const data = result.unwrapOr("default");
      expect(data).toBe("default");
    });
  });

  describe("match", () => {
    test("should handle success case", () => {
      const result = ok("test data");
      const matched = result.match(
        (value) => `Success: ${value}`,
        (error) => `Error: ${error}`,
      );
      expect(matched).toBe("Success: test data");
    });

    test("should handle error case", () => {
      const result = err("test error");
      const matched = result.match(
        (value) => `Success: ${value}`,
        (error) => `Error: ${error}`,
      );
      expect(matched).toBe("Error: test error");
    });
  });
});
