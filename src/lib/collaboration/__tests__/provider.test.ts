import { getUserColor } from "../provider";

describe("getUserColor", () => {
  it("returns a valid hex color", () => {
    const color = getUserColor("user-123");
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns deterministic colors for the same input", () => {
    const color1 = getUserColor("user-abc");
    const color2 = getUserColor("user-abc");
    expect(color1).toBe(color2);
  });

  it("returns different colors for different inputs", () => {
    const color1 = getUserColor("user-a");
    const color2 = getUserColor("user-b");
    // Not guaranteed but statistically likely for these inputs
    expect(color1).not.toBe(color2);
  });

  it("handles empty string", () => {
    const color = getUserColor("");
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
