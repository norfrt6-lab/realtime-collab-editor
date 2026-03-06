import { TEMPLATES } from "../templates";

describe("TEMPLATES", () => {
  it("has at least 4 templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it("all templates have required fields", () => {
    for (const template of TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.icon).toBeDefined();
      expect(template.content).toBeDefined();
      expect(template.content.type).toBe("doc");
    }
  });

  it("blank template has empty content", () => {
    const blank = TEMPLATES.find((t) => t.id === "blank");
    expect(blank).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((blank!.content.content as any[]).length).toBe(1);
  });

  it("meeting notes template has headings", () => {
    const meeting = TEMPLATES.find((t) => t.id === "meeting-notes");
    expect(meeting).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headings = (meeting!.content.content as any[]).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (n: any) => n.type === "heading"
    );
    expect(headings.length).toBeGreaterThan(0);
  });

  it("project brief template has table", () => {
    const brief = TEMPLATES.find((t) => t.id === "project-brief");
    expect(brief).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tables = (brief!.content.content as any[]).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (n: any) => n.type === "table"
    );
    expect(tables.length).toBeGreaterThan(0);
  });

  it("technical spec template has code block", () => {
    const spec = TEMPLATES.find((t) => t.id === "technical-spec");
    expect(spec).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const codeBlocks = (spec!.content.content as any[]).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (n: any) => n.type === "codeBlock"
    );
    expect(codeBlocks.length).toBeGreaterThan(0);
  });

  it("all template IDs are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
