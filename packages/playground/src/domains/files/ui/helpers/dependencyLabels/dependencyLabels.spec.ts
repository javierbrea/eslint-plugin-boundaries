import type { FileDescription } from "@/domains/evaluation/helpers/engine";

import {
  getChipLabel,
  getChipParts,
  getFileOptionLabel,
} from "./dependencyLabels";
import {
  IMPORT_KIND_OPTIONS,
  SPECIFIER_KIND_LABELS,
  SYNTAX_OPTIONS,
} from "./dependencyLabels.constants";

/**
 * Describes a file by the types of its element.
 * @param types The types of the element of the file, or `null` when no element descriptor matches it.
 * @returns The description.
 */
function describeWithTypes(types: readonly string[] | null): FileDescription {
  return {
    element: { types, path: null, captured: null },
    file: { categories: null },
    module: { origin: "local" },
  };
}

describe("dependencyLabels", () => {
  describe("syntax options", () => {
    it("should label the four syntaxes as the statements write them, in the order the picker offers them", () => {
      // Act
      const labels = SYNTAX_OPTIONS.map(({ label }) => label);
      const values = SYNTAX_OPTIONS.map(({ value }) => value);

      // Assert
      expect(labels).toEqual([
        "import",
        "export … from",
        "require()",
        "import()",
      ]);
      expect(values).toEqual([
        "import",
        "export-from",
        "require",
        "dynamic-import",
      ]);
    });
  });

  describe("kind options", () => {
    it("should offer value before type", () => {
      // Act
      const options = IMPORT_KIND_OPTIONS.map(({ value, label }) => [
        value,
        label,
      ]);

      // Assert
      expect(options).toEqual([
        ["value", "value"],
        ["type", "type"],
      ]);
    });
  });

  describe("specifier kind labels", () => {
    it("should name the three kinds of name", () => {
      // Act
      const labels = SPECIFIER_KIND_LABELS;

      // Assert
      expect(labels).toEqual({
        default: "default",
        named: "named",
        namespace: "namespace",
      });
    });
  });

  describe("getFileOptionLabel", () => {
    it("should write the type of the element of the file", () => {
      // Act
      const label = getFileOptionLabel(describeWithTypes(["helper"]));

      // Assert
      expect(label).toBe("helper");
    });

    it("should join the types of an element that has several with a comma and a space", () => {
      // Act
      const label = getFileOptionLabel(
        describeWithTypes(["component", "atom"])
      );

      // Assert
      expect(label).toBe("component, atom");
    });

    it("should say no element when no element descriptor matches the file", () => {
      // Act
      const label = getFileOptionLabel(describeWithTypes(null));

      // Assert
      expect(label).toBe("no element");
    });

    it("should say no element for an element with no types", () => {
      // Act
      const label = getFileOptionLabel(describeWithTypes([]));

      // Assert
      expect(label).toBe("no element");
    });

    it("should say no element for a file that the engine did not describe", () => {
      // Act
      const label = getFileOptionLabel(undefined);

      // Assert
      expect(label).toBe("no element");
    });
  });

  describe("getChipLabel", () => {
    it.each([
      [{ kind: "default", name: "format" }, "default format"],
      [{ kind: "named", name: "round" }, "named round"],
      [{ kind: "named", name: "round", alias: "r" }, "named round as r"],
      [{ kind: "namespace", name: "ns" }, "namespace ns"],
    ] as const)("should write %j as %s", (specifier, expected) => {
      // Act
      const label = getChipLabel(specifier);

      // Assert
      expect(label).toBe(expected);
    });
  });

  describe("getChipParts", () => {
    it("should keep the kind apart from the name", () => {
      // Act
      const parts = getChipParts({ kind: "named", name: "round" });

      // Assert
      expect(parts).toEqual({ kind: "named", name: "round" });
    });

    it("should put the alias after as in the name", () => {
      // Act
      const parts = getChipParts({ kind: "named", name: "round", alias: "r" });

      // Assert
      expect(parts).toEqual({ kind: "named", name: "round as r" });
    });
  });
});
