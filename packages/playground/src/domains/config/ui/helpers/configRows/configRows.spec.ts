import type {
  ElementTypeSummary,
  FileCategorySummary,
  RuleSummary,
  TextRange,
} from "@/domains/evaluation/helpers/engine";

import {
  getElementTypeRow,
  getFileCategoryRow,
  getRuleRow,
} from "./configRows";

const RANGE: TextRange = { from: 120, to: 170, line: 5, column: 7 };

const ELEMENT_TYPE: ElementTypeSummary = {
  index: 2,
  type: "helper",
  patterns: ["src/helpers/*"],
  files: 3,
  ignored: false,
  range: RANGE,
};

const FILE_CATEGORY: FileCategorySummary = {
  index: 1,
  category: "style",
  patterns: ["**/*.css", "**/*.scss"],
  files: 2,
  range: RANGE,
};

const RULE: RuleSummary = {
  name: "boundaries/dependencies",
  policies: 3,
  valid: true,
  range: RANGE,
};

describe("configRows", () => {
  describe("getElementTypeRow", () => {
    it("should name the row by the type, with its files and its patterns", () => {
      // Act
      const row = getElementTypeRow(ELEMENT_TYPE);

      // Assert
      expect(row).toEqual({
        key: "element-2",
        name: "helper",
        status: "3 files",
        detail: "src/helpers/*",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 file in the singular", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, files: 1 });

      // Assert
      expect(row.status).toBe("1 file");
    });

    it("should say 0 files when the descriptor matches none", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, files: 0 });

      // Assert
      expect(row.status).toBe("0 files");
    });

    it("should join the patterns with commas", () => {
      // Act
      const row = getElementTypeRow({
        ...ELEMENT_TYPE,
        patterns: ["src/helpers/*", "lib/helpers/*"],
      });

      // Assert
      expect(row.detail).toBe("src/helpers/*, lib/helpers/*");
    });

    it("should draw no tone for a descriptor that is not ignored", () => {
      // Act
      const row = getElementTypeRow(ELEMENT_TYPE);

      // Assert
      expect(row.nameTone).toBeUndefined();
      expect(row.statusTone).toBeUndefined();
    });

    it("should say that an ignored descriptor is, and where it is, instead of its files and its patterns", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, ignored: true });

      // Assert
      expect(row).toEqual({
        key: "element-2",
        name: "helper",
        nameTone: "warn",
        status: "ignored",
        statusTone: "warn",
        detail: "invalid descriptor, line 5",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should name a descriptor that has no type by its position", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, type: "#2" });

      // Assert
      expect(row.name).toBe("#2");
    });

    it("should open the config at the descriptor", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, ignored: true });

      // Assert
      expect(row.target).toEqual({ kind: "config", range: RANGE });
    });
  });

  describe("getFileCategoryRow", () => {
    it("should name the row by the category, with its files and its patterns", () => {
      // Act
      const row = getFileCategoryRow(FILE_CATEGORY);

      // Assert
      expect(row).toEqual({
        key: "category-1",
        name: "style",
        status: "2 files",
        detail: "**/*.css, **/*.scss",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 file in the singular", () => {
      // Act
      const row = getFileCategoryRow({ ...FILE_CATEGORY, files: 1 });

      // Assert
      expect(row.status).toBe("1 file");
    });

    it("should not key it as an element type of the same position", () => {
      // Act
      const category = getFileCategoryRow({ ...FILE_CATEGORY, index: 2 });
      const elementType = getElementTypeRow(ELEMENT_TYPE);

      // Assert
      expect(category.key).not.toBe(elementType.key);
    });
  });

  describe("getRuleRow", () => {
    it("should name the row by the rule, with its policies", () => {
      // Act
      const row = getRuleRow(RULE);

      // Assert
      expect(row).toEqual({
        key: "boundaries/dependencies",
        name: "boundaries/dependencies",
        status: "3 policies",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 policy in the singular", () => {
      // Act
      const row = getRuleRow({ ...RULE, policies: 1 });

      // Assert
      expect(row.status).toBe("1 policy");
    });

    it("should say 0 policies when the options have none", () => {
      // Act
      const row = getRuleRow({ ...RULE, policies: 0 });

      // Assert
      expect(row.status).toBe("0 policies");
    });

    it("should say that a rule whose options are invalid is not evaluated, and keep its policies", () => {
      // Act
      const row = getRuleRow({ ...RULE, valid: false });

      // Assert
      expect(row).toEqual({
        key: "boundaries/dependencies",
        name: "boundaries/dependencies",
        status: "not evaluated",
        statusTone: "bad",
        detail: "3 policies · invalid options",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should open the config at the rule", () => {
      // Act
      const row = getRuleRow(RULE);

      // Assert
      expect(row.target).toEqual({ kind: "config", range: RANGE });
    });
  });
});
