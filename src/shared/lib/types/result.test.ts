import { describe, expect, test } from "bun:test";
import { failure, flatMap, map, mapError, success, unwrap, unwrapOr } from "./result";

describe("Result Type", () => {
  describe("success", () => {
    test("should create success result", () => {
      const result = success("test");
      expect(result.success).toBe(true);
      expect(result.data).toBe("test");
    });
  });

  describe("failure", () => {
    test("should create failure result", () => {
      const error = new Error("test error");
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe("map", () => {
    test("should transform success data", () => {
      const result = success(5);
      const mapped = map(result, (x: any) => x * 2);
      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(10);
      }
    });

    test("should not transform failure", () => {
      const error = new Error("test");
      const result = failure(error);
      const mapped = map(result, (x: any) => x * 2);
      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe("mapError", () => {
    test("should transform failure error", () => {
      const result = failure("original error");
      const mapped = mapError(result, (err) => `mapped: ${err}`);
      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe("mapped: original error");
      }
    });

    test("should not transform success", () => {
      const result = success("data");
      const mapped = mapError(result, (err) => `mapped: ${err}`);
      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe("data");
      }
    });
  });

  describe("flatMap", () => {
    test("should chain successful operations", () => {
      const result = success(5);
      const chained = flatMap(result, (x: any) => success(x * 2));
      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.data).toBe(10);
      }
    });

    test("should chain failing operations", () => {
      const result = success(5);
      const error = new Error("chain error");
      const chained = flatMap(result, () => failure(error));
      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe(error);
      }
    });

    test("should not execute operation on failure", () => {
      const error = new Error("original");
      const result = failure(error);
      const chained = flatMap(result, (x: any) => success(x * 2));
      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe("unwrap", () => {
    test("should extract data from success", () => {
      const result = success("test data");
      const data = unwrap(result);
      expect(data).toBe("test data");
    });

    test("should throw error on failure", () => {
      const error = new Error("test error");
      const result = failure(error);
      expect(() => unwrap(result)).toThrow("test error");
    });
  });

  describe("unwrapOr", () => {
    test("should extract data from success", () => {
      const result = success("test data");
      const data = unwrapOr(result, "default");
      expect(data).toBe("test data");
    });

    test("should return default on failure", () => {
      const error = new Error("test error");
      const result = failure(error);
      const data = unwrapOr(result, "default");
      expect(data).toBe("default");
    });
  });
});
