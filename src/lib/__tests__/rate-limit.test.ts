import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  it("allows first request", () => {
    const result = rateLimit("test-user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("decrements remaining count", () => {
    const id = "test-user-2";
    const r1 = rateLimit(id);
    const r2 = rateLimit(id);
    expect(r2.remaining).toBe(r1.remaining - 1);
  });

  it("blocks after exceeding limit", () => {
    const id = "test-user-flood";
    for (let i = 0; i < 100; i++) {
      rateLimit(id);
    }
    const result = rateLimit(id);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns resetAt timestamp in the future", () => {
    const result = rateLimit("test-user-3");
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("uses separate counters per identifier", () => {
    const r1 = rateLimit("user-a-isolated");
    const r2 = rateLimit("user-b-isolated");
    expect(r1.remaining).toBe(99);
    expect(r2.remaining).toBe(99);
  });
});
