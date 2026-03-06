import { getWordCount } from "../export";

// Mock editor with minimal interface
function createMockEditor(text: string) {
  return {
    state: {
      doc: {
        textContent: text,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("getWordCount", () => {
  it("counts words correctly", () => {
    const editor = createMockEditor("Hello world this is a test");
    const result = getWordCount(editor);
    expect(result.words).toBe(6);
  });

  it("counts characters correctly", () => {
    const editor = createMockEditor("Hello");
    const result = getWordCount(editor);
    expect(result.characters).toBe(5);
  });

  it("handles empty text", () => {
    const editor = createMockEditor("");
    const result = getWordCount(editor);
    expect(result.words).toBe(0);
    expect(result.characters).toBe(0);
    expect(result.readingTime).toBe("1 min read");
  });

  it("calculates reading time", () => {
    // 400 words ≈ 2 min read at 200 wpm
    const words = Array(400).fill("word").join(" ");
    const editor = createMockEditor(words);
    const result = getWordCount(editor);
    expect(result.readingTime).toBe("2 min read");
  });

  it("handles multiple spaces", () => {
    const editor = createMockEditor("Hello   world");
    const result = getWordCount(editor);
    expect(result.words).toBe(2);
  });
});
