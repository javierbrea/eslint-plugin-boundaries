import { DiagnosticsBuilder } from "./Diagnostics";
import { DIAGNOSTIC_LEVELS_MAP } from "./Diagnostics.types";

describe("Diagnostics", () => {
  let builder: DiagnosticsBuilder;

  beforeEach(() => {
    builder = new DiagnosticsBuilder();
  });

  describe("add", () => {
    it("adds a diagnostic with its level, title, detail and paths", () => {
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title", "Detail", [["a", 1]]);

      expect(builder.build()).toEqual([
        {
          level: "warning",
          title: "Title",
          detail: "Detail",
          paths: [["a", 1]],
        },
      ]);
    });

    it("leaves out the detail when it is undefined, and the paths when there are none", () => {
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title");

      expect(builder.build()).toEqual([
        { level: "warning", title: "Title", paths: [] },
      ]);
      expect(builder.build()[0]).not.toHaveProperty("detail");
    });

    it("keeps the diagnostics in the order they are added", () => {
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "First");
      builder.add(DIAGNOSTIC_LEVELS_MAP.ERROR, "Second");

      expect(builder.build().map(({ title }) => title)).toEqual([
        "First",
        "Second",
      ]);
    });

    it("keeps a diagnostic with the title and detail of a previous one once, adding its paths to the first", () => {
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title", "Detail", [["a"]]);
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Other");
      builder.add(DIAGNOSTIC_LEVELS_MAP.DEPRECATION, "Title", "Detail", [
        ["b"],
      ]);

      expect(builder.build()).toEqual([
        {
          level: "warning",
          title: "Title",
          detail: "Detail",
          paths: [["a"], ["b"]],
        },
        { level: "warning", title: "Other", paths: [] },
      ]);
    });

    it("keeps diagnostics with the same title and different details apart", () => {
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title", "Detail A");
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title", "Detail B");

      expect(builder.build()).toHaveLength(2);
    });

    it("keeps each path once", () => {
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title", undefined, [
        ["a", 1],
        ["a", 1],
        ["a", 2],
      ]);
      builder.add(DIAGNOSTIC_LEVELS_MAP.WARNING, "Title", undefined, [
        ["a", 1],
        ["a"],
      ]);

      expect(builder.build()[0].paths).toEqual([["a", 1], ["a", 2], ["a"]]);
    });
  });

  describe("error", () => {
    it("adds an error diagnostic", () => {
      builder.error("Title", "Detail", [["a"]]);

      expect(builder.build()[0].level).toBe("error");
    });
  });

  describe("warning", () => {
    it("adds a warning diagnostic", () => {
      builder.warning("Title");

      expect(builder.build()[0].level).toBe("warning");
    });
  });

  describe("deprecation", () => {
    it("adds a deprecation diagnostic", () => {
      builder.deprecation("Title");

      expect(builder.build()[0].level).toBe("deprecation");
    });
  });

  describe("addAll", () => {
    it("adds diagnostics found in a part of the input, prefixing their paths", () => {
      builder.addAll(
        [
          { level: "warning", title: "Title", detail: "Detail", paths: [[1]] },
          { level: "error", title: "Whole", paths: [[]] },
        ],
        ["rules", "boundaries/dependencies"]
      );

      expect(builder.build()).toEqual([
        {
          level: "warning",
          title: "Title",
          detail: "Detail",
          paths: [["rules", "boundaries/dependencies", 1]],
        },
        {
          level: "error",
          title: "Whole",
          paths: [["rules", "boundaries/dependencies"]],
        },
      ]);
    });

    it("adds diagnostics without a prefix", () => {
      builder.addAll([{ level: "warning", title: "Title", paths: [["a"]] }]);

      expect(builder.build()[0].paths).toEqual([["a"]]);
    });
  });

  describe("build", () => {
    it("returns copies that later additions do not change", () => {
      builder.warning("Title", undefined, [["a"]]);
      const first = builder.build();

      builder.warning("Title", undefined, [["b"]]);

      expect(first[0].paths).toEqual([["a"]]);
      expect(builder.build()[0].paths).toEqual([["a"], ["b"]]);
    });
  });
});
