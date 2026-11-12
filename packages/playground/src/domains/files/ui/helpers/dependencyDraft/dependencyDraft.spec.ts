import type { SketchDependency } from "@/contract";

import {
  changeSyntax,
  createDraft,
  getPreviewTokens,
  toDependency,
} from "./dependencyDraft";
import type { DependencyDraft } from "./dependencyDraft.types";

const FROM = "src/modules/checkout/index.js";

/** The draft of the mockup: `import format, { round } from "../../helpers/format/index.js";`. */
const MOCKUP_DRAFT: DependencyDraft = {
  targetKind: "node",
  file: "src/helpers/format/index.js",
  module: "",
  syntax: "import",
  importKind: "value",
  specifiers: [
    { kind: "default", name: "format" },
    { kind: "named", name: "round" },
  ],
};

describe("dependencyDraft", () => {
  describe("createDraft", () => {
    it("should start empty: values imported by `import` from a file that is not picked yet", () => {
      // Act
      const draft = createDraft();

      // Assert
      expect(draft).toEqual({
        targetKind: "node",
        file: null,
        module: "",
        syntax: "import",
        importKind: "value",
        specifiers: [],
      });
    });

    it("should start from the file and the names of the dependency being edited", () => {
      // Arrange
      const initial: SketchDependency = {
        from: FROM,
        target: { kind: "node", path: "src/helpers/format/index.js" },
        syntax: "export-from",
        importKind: "type",
        specifiers: [{ kind: "named", name: "round", alias: "r" }],
      };

      // Act
      const draft = createDraft(initial);

      // Assert
      expect(draft).toEqual({
        targetKind: "node",
        file: "src/helpers/format/index.js",
        module: "",
        syntax: "export-from",
        importKind: "type",
        specifiers: [{ kind: "named", name: "round", alias: "r" }],
      });
    });

    it("should start from the module of an external dependency, with no file", () => {
      // Arrange
      const initial: SketchDependency = {
        from: FROM,
        target: { kind: "external", name: "react" },
        syntax: "require",
        importKind: "value",
        specifiers: [],
      };

      // Act
      const draft = createDraft(initial);

      // Assert
      expect(draft).toMatchObject({
        targetKind: "external",
        file: null,
        module: "react",
        syntax: "require",
      });
    });
  });

  describe("changeSyntax", () => {
    it("should keep every name and the kind when the new syntax holds them", () => {
      // Arrange
      const draft = { ...MOCKUP_DRAFT, importKind: "type" } as const;

      // Act
      const changed = changeSyntax(draft, "import");

      // Assert
      expect(changed).toEqual(draft);
    });

    it("should drop the default name when the new syntax holds none, and keep the others", () => {
      // Act
      const changed = changeSyntax(MOCKUP_DRAFT, "export-from");

      // Assert
      expect(changed.syntax).toBe("export-from");
      expect(changed.specifiers).toEqual([{ kind: "named", name: "round" }]);
    });

    it("should keep the kind of statement when the new syntax offers kinds", () => {
      // Arrange
      const draft = { ...MOCKUP_DRAFT, importKind: "type" } as const;

      // Act
      const changed = changeSyntax(draft, "export-from");

      // Assert
      expect(changed.importKind).toBe("type");
    });

    it.each(["require", "dynamic-import"] as const)(
      "should drop every name and set the kind to value when the new syntax is %s",
      (syntax) => {
        // Arrange
        const draft = { ...MOCKUP_DRAFT, importKind: "type" } as const;

        // Act
        const changed = changeSyntax(draft, syntax);

        // Assert
        expect(changed.specifiers).toEqual([]);
        expect(changed.importKind).toBe("value");
      }
    );

    it("should keep the target of both kinds", () => {
      // Arrange
      const draft = { ...MOCKUP_DRAFT, module: "react" };

      // Act
      const changed = changeSyntax(draft, "require");

      // Assert
      expect(changed.file).toBe("src/helpers/format/index.js");
      expect(changed.module).toBe("react");
      expect(changed.targetKind).toBe("node");
    });
  });

  describe("toDependency", () => {
    it("should say the dependency to the file that is picked", () => {
      // Act
      const dependency = toDependency(MOCKUP_DRAFT, FROM);

      // Assert
      expect(dependency).toEqual({
        from: FROM,
        target: { kind: "node", path: "src/helpers/format/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: MOCKUP_DRAFT.specifiers,
      });
    });

    it("should say the dependency to the module that is typed, without the spaces around it", () => {
      // Arrange
      const draft: DependencyDraft = {
        ...MOCKUP_DRAFT,
        targetKind: "external",
        module: "  react ",
      };

      // Act
      const dependency = toDependency(draft, FROM);

      // Assert
      expect(dependency?.target).toEqual({ kind: "external", name: "react" });
    });

    it("should not use the module while the target is a file, nor the file while it is a module", () => {
      // Arrange
      const asFile = { ...MOCKUP_DRAFT, module: "react" };
      const asModule: DependencyDraft = {
        ...MOCKUP_DRAFT,
        targetKind: "external",
        module: "react",
      };

      // Act
      const fileTarget = toDependency(asFile, FROM)?.target;
      const moduleTarget = toDependency(asModule, FROM)?.target;

      // Assert
      expect(fileTarget).toEqual({
        kind: "node",
        path: "src/helpers/format/index.js",
      });
      expect(moduleTarget).toEqual({ kind: "external", name: "react" });
    });

    it("should say none while no file is picked", () => {
      // Act
      const dependency = toDependency({ ...MOCKUP_DRAFT, file: null }, FROM);

      // Assert
      expect(dependency).toBeUndefined();
    });

    it.each(["", "   "])(
      "should say none while the module is %j",
      (moduleName) => {
        // Arrange
        const draft: DependencyDraft = {
          ...MOCKUP_DRAFT,
          targetKind: "external",
          module: moduleName,
        };

        // Act
        const dependency = toDependency(draft, FROM);

        // Assert
        expect(dependency).toBeUndefined();
      }
    );
  });

  describe("getPreviewTokens", () => {
    it("should write the statement of the mockup, with the source from the folder of the file", () => {
      // Act
      const tokens = getPreviewTokens(MOCKUP_DRAFT, FROM);

      // Assert
      expect(tokens).toEqual([
        { kind: "keyword", text: "import" },
        { kind: "text", text: " format, { round } " },
        { kind: "keyword", text: "from" },
        { kind: "text", text: " " },
        { kind: "source", text: '"../../helpers/format/index.js"' },
        { kind: "text", text: ";" },
      ]);
    });

    it("should write the source in full, with its extension and its index", () => {
      // Arrange
      const from = "src/modules/checkout/index.ts";
      const files = ["src/helpers/format/index.ts", "src/helpers/types.d.ts"];

      // Act
      const sources = files.map((file) =>
        getPreviewTokens({ ...MOCKUP_DRAFT, file }, from).at(-2)
      );

      // Assert
      expect(sources).toEqual([
        { kind: "source", text: '"../../helpers/format/index.ts"' },
        { kind: "source", text: '"../../helpers/types.d.ts"' },
      ]);
    });

    it("should write the name of an external module as it is", () => {
      // Arrange
      const draft: DependencyDraft = {
        ...MOCKUP_DRAFT,
        targetKind: "external",
        module: "react",
        specifiers: [{ kind: "default", name: "React" }],
      };

      // Act
      const tokens = getPreviewTokens(draft, FROM);

      // Assert
      expect(tokens.at(-2)).toEqual({ kind: "source", text: '"react"' });
    });

    it("should read the source as … while there is no target yet", () => {
      // Act
      const tokens = getPreviewTokens({ ...MOCKUP_DRAFT, file: null }, FROM);

      // Assert
      expect(tokens.at(-2)).toEqual({ kind: "source", text: '"…"' });
    });

    it("should write the other syntaxes with their own statement", () => {
      // Arrange
      const draft: DependencyDraft = {
        ...MOCKUP_DRAFT,
        syntax: "dynamic-import",
        specifiers: [],
      };

      // Act
      const text = getPreviewTokens(draft, FROM)
        .map((token) => token.text)
        .join("");

      // Assert
      expect(text).toBe('import("../../helpers/format/index.js");');
    });
  });
});
