import { render } from "@testing-library/react";

import type { Sketch, SketchDependency } from "@/contract";
import type { FileDescription } from "@/domains/evaluation/helpers/engine";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { DependencyPicker } from "./DependencyPicker";
import { DependencyPickerPom } from "./DependencyPicker.pom";
import type { DependencyPickerProps } from "./DependencyPicker.types";

const FROM = "src/modules/checkout/index.js";
const BUTTON = "src/components/atoms/Button/index.js";
const FORMAT = "src/helpers/format/index.js";
const INDEX = "src/index.js";

const TREE: Sketch["tree"] = [
  { path: INDEX, kind: "file" },
  { path: FROM, kind: "file" },
  { path: FORMAT, kind: "file" },
  { path: BUTTON, kind: "file" },
];

/**
 * Describes a file by the types of its element.
 * @param types The types of its element, or `null` when no element descriptor matches it.
 * @returns The description.
 */
function describeWithTypes(types: readonly string[] | null): FileDescription {
  return {
    element: { types, path: null, captured: null },
    file: { categories: null },
    module: { origin: "local" },
  };
}

const DESCRIPTIONS: ReadonlyMap<string, FileDescription> = new Map([
  [BUTTON, describeWithTypes(["component"])],
  [FORMAT, describeWithTypes(["helper"])],
  [FROM, describeWithTypes(["module"])],
  [INDEX, describeWithTypes(null)],
]);

/** The dependency of the mockup, in the form that the sketch holds it: `import format, { round } from "../../helpers/format";`. */
const MOCKUP_DEPENDENCY: SketchDependency = {
  from: FROM,
  target: { kind: "node", path: FORMAT },
  syntax: "import",
  importKind: "value",
  specifiers: [
    { kind: "default", name: "format" },
    { kind: "named", name: "round" },
  ],
};

/** What a spec gets from the picker it renders. */
type Page = {
  /** The page object of the picker. */
  picker: DependencyPickerPom;
  /** The props of the picker, with the spies of its handlers. */
  props: DependencyPickerProps;
  /** Renders the picker again with other props. */
  update: (changes: Partial<DependencyPickerProps>) => void;
};

/**
 * Renders the picker inside the root element of the playground, where its theme applies.
 * @param changes What differs from an open picker that adds a dependency to `src/modules/checkout/index.js` in the sketch of the quick start.
 * @returns The page object of the picker, its props and the function that updates it.
 */
function renderPicker(changes: Partial<DependencyPickerProps> = {}): Page {
  const props: DependencyPickerProps = {
    open: true,
    from: FROM,
    tree: TREE,
    descriptions: DESCRIPTIONS,
    onCancel: jest.fn(),
    onSubmit: jest.fn(),
    ...changes,
  };
  const { rerender } = render(
    <ThemeRoot>
      <DependencyPicker {...props} />
    </ThemeRoot>
  );

  return {
    picker: new DependencyPickerPom(),
    props,
    update: (next) =>
      rerender(
        <ThemeRoot>
          <DependencyPicker {...props} {...next} />
        </ThemeRoot>
      ),
  };
}

/**
 * Picks a file in the field of the target.
 * @param picker The page object of the picker.
 * @param path The path of the file.
 */
function pickFile(picker: DependencyPickerPom, path: string): void {
  picker.file.open();
  picker.file.choose(path);
}

/**
 * Adds a name to the statement with the editor of the names.
 * @param picker The page object of the picker.
 * @param kind The kind of the name, such as `named`.
 * @param specifierName The name.
 * @param alias The alias of the name, which only a named name has.
 */
function addName(
  picker: DependencyPickerPom,
  kind: string,
  specifierName: string,
  alias?: string
): void {
  picker.names.openEditor();
  picker.names.chooseKind(kind);
  picker.names.typeName(specifierName);
  if (alias !== undefined) {
    picker.names.typeAlias(alias);
  }
  picker.names.confirm();
}

/**
 * Makes the draft of the mockup: the helper as the target, `format` as the default name and `round` as a named one.
 * @param picker The page object of the picker.
 */
function fillMockupDraft(picker: DependencyPickerPom): void {
  pickFile(picker, FORMAT);
  addName(picker, "default", "format");
  addName(picker, "named", "round");
}

describe("DependencyPicker", () => {
  describe("title", () => {
    it("should offer to add a dependency, and say which file it belongs to", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { title, fromText } = picker;

      // Assert
      expect(title).toBe("Add a dependency");
      expect(fromText).toBe("to src/modules/checkout/index.js");
    });

    it("should be named by its title", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const isNamedDialog = picker.isDialogNamed("Add a dependency");

      // Assert
      expect(isNamedDialog).toBe(true);
    });

    it("should offer to edit a dependency when it has one", () => {
      // Arrange
      const { picker } = renderPicker({ initial: MOCKUP_DEPENDENCY });

      // Act
      const { title } = picker;

      // Assert
      expect(title).toBe("Edit a dependency");
    });
  });

  describe("layout", () => {
    it("should be 620 px wide, border included", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { width, boxSizing } = picker;

      // Assert
      expect(width).toBe("620px");
      expect(boxSizing).toBe("border-box");
    });
  });

  describe("open", () => {
    it("should draw nothing while it is closed", () => {
      // Arrange
      const { picker } = renderPicker({ open: false });

      // Act
      const { isRendered } = picker;

      // Assert
      expect(isRendered).toBe(false);
    });

    it("should draw the dialog when it opens", () => {
      // Arrange
      const { picker, update } = renderPicker({ open: false });

      // Act
      update({ open: true });

      // Assert
      expect(picker.isRendered).toBe(true);
    });

    it("should start with the focus on the first radio of the target", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { isFirstFocused } = picker.target;

      // Assert
      expect(isFirstFocused).toBe(true);
    });
  });

  describe("target", () => {
    it("should offer a file of the sketch or an external module, with the file checked", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { labels, checked } = picker.target;

      // Assert
      expect(labels).toEqual(["A file of the sketch", "An external module"]);
      expect(checked).toBe("A file of the sketch");
      expect(picker.hasFileField).toBe(true);
      expect(picker.hasModuleField).toBe(false);
    });

    it("should offer the files of the tree other than the open one, in the order of the tree, each with its element", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      picker.file.open();

      // Assert
      expect(picker.file.listedFiles).toEqual([
        { path: BUTTON, element: "component" },
        { path: FORMAT, element: "helper" },
        { path: INDEX, element: "no element" },
      ]);
    });

    it("should say no element for a file that has no description", () => {
      // Arrange
      const { picker } = renderPicker({ descriptions: new Map() });

      // Act
      picker.file.open();

      // Assert
      expect(picker.file.listedFiles.map(({ element }) => element)).toEqual([
        "no element",
        "no element",
        "no element",
      ]);
    });

    it("should join the types of an element that has several", () => {
      // Arrange
      const { picker } = renderPicker({
        descriptions: new Map([
          [BUTTON, describeWithTypes(["atom", "component"])],
        ]),
      });

      // Act
      picker.file.open();

      // Assert
      expect(picker.file.listedFiles[0]).toEqual({
        path: BUTTON,
        element: "atom, component",
      });
    });

    it("should filter the files by what is typed in the path", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.file.open();

      // Act
      picker.file.type("helpers");

      // Assert
      expect(picker.file.listedFiles).toEqual([
        { path: FORMAT, element: "helper" },
      ]);
      expect(picker.file.noOptionsText).toBeNull();
    });

    it("should say that no file matches when nothing does", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.file.open();

      // Act
      picker.file.type("zzz");

      // Assert
      expect(picker.file.listedFiles).toEqual([]);
      expect(picker.file.noOptionsText).toBe("No file matches");
    });

    it("should hold the file that is picked, and close the list", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      pickFile(picker, FORMAT);

      // Assert
      expect(picker.file.value).toBe(FORMAT);
      expect(picker.file.isOpen).toBe(false);
    });

    it("should ask for a module instead of a file when the target is an external module", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      picker.target.select("An external module");

      // Assert
      expect(picker.target.checked).toBe("An external module");
      expect(picker.hasModuleField).toBe(true);
      expect(picker.hasFileField).toBe(false);
    });

    it("should keep the file and the module that each kind of target had", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      picker.target.select("An external module");
      picker.typeModule("react");

      // Act
      picker.target.select("A file of the sketch");
      const file = picker.file.value;
      picker.target.select("An external module");
      const moduleName = picker.moduleValue;

      // Assert
      expect(file).toBe(FORMAT);
      expect(moduleName).toBe("react");
    });
  });

  describe("syntax", () => {
    it("should offer the four syntaxes, with import checked", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { labels, checked } = picker.syntax;

      // Assert
      expect(labels).toEqual([
        "import",
        "export … from",
        "require()",
        "import()",
      ]);
      expect(checked).toBe("import");
    });

    it.each([
      ["import", ["Target", "Syntax", "Kind", "Imported", "Preview"]],
      ["export … from", ["Target", "Syntax", "Kind", "Imported", "Preview"]],
      ["require()", ["Target", "Syntax", "Preview"]],
      ["import()", ["Target", "Syntax", "Preview"]],
    ])("should draw the rows %# of %s", (syntax, rows) => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      picker.syntax.select(syntax);

      // Assert
      expect(picker.rowLabels).toEqual(rows);
    });

    it("should offer the kinds of statement, with value checked", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { labels, checked } = picker.kind;

      // Assert
      expect(labels).toEqual(["value", "type"]);
      expect(checked).toBe("value");
    });

    it("should offer a default, a named and a namespace name to an import", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      picker.names.openEditor();

      // Assert
      expect(picker.names.kinds).toEqual(["default", "named", "namespace"]);
    });

    it("should offer a named and a namespace name, but no default one, to an export from", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.syntax.select("export … from");

      // Act
      picker.names.openEditor();

      // Assert
      expect(picker.names.kinds).toEqual(["named", "namespace"]);
    });

    it("should keep the names that the new syntax holds and drop the others", () => {
      // Arrange
      const { picker } = renderPicker();
      addName(picker, "default", "format");
      addName(picker, "named", "round", "r");

      // Act
      picker.syntax.select("export … from");

      // Assert
      expect(picker.names.chipTexts).toEqual(["named round as r"]);
    });

    it("should drop every name when the new syntax holds none", () => {
      // Arrange
      const { picker } = renderPicker();
      fillMockupDraft(picker);

      // Act
      picker.syntax.select("require()");
      picker.syntax.select("import");

      // Assert
      expect(picker.names.chipTexts).toEqual([]);
    });

    it("should set the kind to value when the new syntax offers none", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.kind.select("type");

      // Act
      picker.syntax.select("import()");
      picker.syntax.select("import");

      // Assert
      expect(picker.kind.checked).toBe("value");
    });

    it("should keep the kind when the new syntax offers it", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.kind.select("type");

      // Act
      picker.syntax.select("export … from");

      // Assert
      expect(picker.kind.checked).toBe("type");
    });
  });

  describe("names", () => {
    it("should add a chip for each name, with its alias", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      addName(picker, "default", "format");
      addName(picker, "named", "round", "r");

      // Assert
      expect(picker.names.chipTexts).toEqual([
        "default format",
        "named round as r",
      ]);
    });

    it("should remove the name whose chip is removed, and no other", () => {
      // Arrange
      const { picker } = renderPicker();
      fillMockupDraft(picker);

      // Act
      picker.names.remove("default format");

      // Assert
      expect(picker.names.chipTexts).toEqual(["named round"]);
    });

    it("should hold a namespace name of an export from", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.syntax.select("export … from");

      // Act
      addName(picker, "namespace", "ns");

      // Assert
      expect(picker.names.chipTexts).toEqual(["namespace ns"]);
    });

    it("should start with the names of the dependency being edited", () => {
      // Arrange
      const { picker } = renderPicker({ initial: MOCKUP_DEPENDENCY });

      // Act
      const { chipTexts } = picker.names;

      // Assert
      expect(chipTexts).toEqual(["default format", "named round"]);
    });
  });

  describe("preview", () => {
    it("should write the statement of the mockup, with the source from the folder of the file", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      fillMockupDraft(picker);

      // Assert
      expect(picker.preview.text).toBe(
        'import format, { round } from "../../helpers/format";'
      );
    });

    it("should color the keywords and the source, and leave the rest in the color of the code", () => {
      // Arrange
      const { picker } = renderPicker();
      fillMockupDraft(picker);

      // Act
      const { parts } = picker.preview;

      // Assert
      expect(parts).toEqual([
        { text: "import", color: "var(--jsb-code-keyword)" },
        { text: " format, { round } ", color: "var(--jsb-code-fg)" },
        { text: "from", color: "var(--jsb-code-keyword)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: '"../../helpers/format"', color: "var(--jsb-code-string)" },
        { text: ";", color: "var(--jsb-code-fg)" },
      ]);
    });

    it("should be drawn on the code surface, in the color of its text", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { previewBackground, previewColor } = picker;

      // Assert
      expect(previewBackground).toBe("var(--jsb-code)");
      expect(previewColor).toBe("var(--jsb-code-fg)");
    });

    it("should be as tall as its font for a statement of one line, with no line height of its own", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { previewLineHeight } = picker;

      // Assert
      expect(previewLineHeight).toBe("normal");
    });

    it("should read the source as … while there is no target yet", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { text } = picker.preview;

      // Assert
      expect(text).toBe('import "…";');
    });

    it("should write the name of an external module as it is", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.target.select("An external module");
      addName(picker, "default", "React");

      // Act
      picker.typeModule("react");

      // Assert
      expect(picker.preview.text).toBe('import React from "react";');
    });

    it.each([
      ["export … from", 'export * from "../../helpers/format";'],
      ["require()", 'require("../../helpers/format");'],
      ["import()", 'import("../../helpers/format");'],
    ])("should write the statement of %s", (syntax, statement) => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);

      // Act
      picker.syntax.select(syntax);

      // Assert
      expect(picker.preview.text).toBe(statement);
    });

    it("should write a type statement when the kind is type", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      addName(picker, "named", "Rounding");

      // Act
      picker.kind.select("type");

      // Assert
      expect(picker.preview.text).toBe(
        'import type { Rounding } from "../../helpers/format";'
      );
    });
  });

  describe("refusal", () => {
    it("should say nothing about a draft that the sketch can hold", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      fillMockupDraft(picker);

      // Assert
      expect(picker.refusal).toBeNull();
    });

    it("should say nothing while there is no target, even though the draft would be refused", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      picker.kind.select("type");

      // Assert
      expect(picker.refusal).toBeNull();
    });

    it("should say why the draft is refused, below the preview, and not let it be added", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);

      // Act
      picker.kind.select("type");

      // Assert
      expect(picker.refusal).toBe("A type import needs at least one name.");
      expect(picker.isConfirmEnabled).toBe(false);
    });

    it("should say it in the color of the errors", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      picker.kind.select("type");

      // Act
      const { refusalColor } = picker;

      // Assert
      expect(refusalColor).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
    });

    it("should let a sentence that does not fit wrap, never cut it with an ellipsis", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      picker.kind.select("type");

      // Act
      const { refusalWhiteSpace, refusalTextOverflow } = picker;

      // Assert
      expect(refusalWhiteSpace).not.toBe("nowrap");
      expect(refusalTextOverflow).not.toBe("ellipsis");
    });

    it("should stop saying it once the draft is fixed", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      picker.kind.select("type");

      // Act
      addName(picker, "named", "Rounding");

      // Assert
      expect(picker.refusal).toBeNull();
      expect(picker.isConfirmEnabled).toBe(true);
    });

    it("should refuse names that the syntax cannot write together", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      picker.syntax.select("export … from");
      addName(picker, "named", "round");

      // Act
      addName(picker, "namespace", "ns");

      // Assert
      expect(picker.refusal).toBe(
        "`export … from` cannot hold a namespace and named names together."
      );
    });

    it("should refuse a type import of a default name together with named names", () => {
      // Arrange
      const { picker } = renderPicker();
      pickFile(picker, FORMAT);
      picker.kind.select("type");
      addName(picker, "default", "Rounding");

      // Act
      addName(picker, "named", "Options");

      // Assert
      expect(picker.refusal).toBe(
        "A type import cannot hold a default name together with named names or a namespace."
      );
      expect(picker.isConfirmEnabled).toBe(false);
    });

    it("should refuse a module that is not a module name", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.target.select("An external module");

      // Act
      picker.typeModule("./format");

      // Assert
      expect(picker.refusal).toBe(
        '"./format" is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.'
      );
      expect(picker.isConfirmEnabled).toBe(false);
    });
  });

  describe("confirm", () => {
    it("should offer to add, with the button disabled while there is no target", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      const { footerButtonTexts, isConfirmEnabled } = picker;

      // Assert
      expect(footerButtonTexts).toEqual(["Cancel", "Add"]);
      expect(isConfirmEnabled).toBe(false);
    });

    it("should enable the button once a file is picked", () => {
      // Arrange
      const { picker } = renderPicker();

      // Act
      pickFile(picker, FORMAT);

      // Assert
      expect(picker.isConfirmEnabled).toBe(true);
    });

    it("should enable the button once a module is named, and not while its name is made of spaces", () => {
      // Arrange
      const { picker } = renderPicker();
      picker.target.select("An external module");

      // Act
      picker.typeModule("   ");
      const withSpaces = picker.isConfirmEnabled;
      picker.typeModule("react");
      const withName = picker.isConfirmEnabled;

      // Assert
      expect(withSpaces).toBe(false);
      expect(withName).toBe(true);
    });

    it("should submit the dependency of a file with the names of the draft", () => {
      // Arrange
      const { picker, props } = renderPicker();
      fillMockupDraft(picker);

      // Act
      picker.confirm();

      // Assert
      expect(props.onSubmit).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).toHaveBeenCalledWith(MOCKUP_DEPENDENCY);
      expect(props.onCancel).not.toHaveBeenCalled();
    });

    it("should submit a dependency with no names as it is, as a side-effect import", () => {
      // Arrange
      const { picker, props } = renderPicker();
      pickFile(picker, BUTTON);

      // Act
      picker.confirm();

      // Assert
      expect(props.onSubmit).toHaveBeenCalledWith({
        from: FROM,
        target: { kind: "node", path: BUTTON },
        syntax: "import",
        importKind: "value",
        specifiers: [],
      });
    });

    it("should submit the dependency of an external module", () => {
      // Arrange
      const { picker, props } = renderPicker();
      picker.target.select("An external module");
      picker.typeModule(" react ");
      picker.syntax.select("require()");

      // Act
      picker.confirm();

      // Assert
      expect(props.onSubmit).toHaveBeenCalledWith({
        from: FROM,
        target: { kind: "external", name: "react" },
        syntax: "require",
        importKind: "value",
        specifiers: [],
      });
    });

    it("should submit the kind of the statement and the syntax", () => {
      // Arrange
      const { picker, props } = renderPicker();
      pickFile(picker, FORMAT);
      picker.syntax.select("export … from");
      addName(picker, "named", "Rounding");
      picker.kind.select("type");

      // Act
      picker.confirm();

      // Assert
      expect(props.onSubmit).toHaveBeenCalledWith({
        from: FROM,
        target: { kind: "node", path: FORMAT },
        syntax: "export-from",
        importKind: "type",
        specifiers: [{ kind: "named", name: "Rounding" }],
      });
    });

    it("should not submit a draft that is refused", () => {
      // Arrange
      const { picker, props } = renderPicker();
      pickFile(picker, FORMAT);
      picker.kind.select("type");

      // Act
      picker.confirm();

      // Assert
      expect(props.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("editing", () => {
    it("should start from the target, the syntax, the kind and the names of the dependency", () => {
      // Arrange
      const initial: SketchDependency = {
        from: FROM,
        target: { kind: "node", path: BUTTON },
        syntax: "export-from",
        importKind: "type",
        specifiers: [{ kind: "named", name: "Props", alias: "ButtonProps" }],
      };

      // Act
      const { picker } = renderPicker({ initial });

      // Assert
      expect(picker.target.checked).toBe("A file of the sketch");
      expect(picker.file.value).toBe(BUTTON);
      expect(picker.syntax.checked).toBe("export … from");
      expect(picker.kind.checked).toBe("type");
      expect(picker.names.chipTexts).toEqual(["named Props as ButtonProps"]);
    });

    it("should preview the statement of the dependency", () => {
      // Arrange
      const initial: SketchDependency = {
        from: FROM,
        target: { kind: "node", path: BUTTON },
        syntax: "export-from",
        importKind: "type",
        specifiers: [{ kind: "named", name: "Props", alias: "ButtonProps" }],
      };

      // Act
      const { picker } = renderPicker({ initial });

      // Assert
      expect(picker.preview.text).toBe(
        'export type { Props as ButtonProps } from "../../components/atoms/Button";'
      );
    });

    it("should start from the module of an external dependency", () => {
      // Arrange
      const initial: SketchDependency = {
        from: FROM,
        target: { kind: "external", name: "react" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "React" }],
      };

      // Act
      const { picker } = renderPicker({ initial });

      // Assert
      expect(picker.target.checked).toBe("An external module");
      expect(picker.moduleValue).toBe("react");
    });

    it("should offer to save, with the button enabled", () => {
      // Arrange
      const { picker } = renderPicker({ initial: MOCKUP_DEPENDENCY });

      // Act
      const { footerButtonTexts, isConfirmEnabled } = picker;

      // Assert
      expect(footerButtonTexts).toEqual(["Cancel", "Save"]);
      expect(isConfirmEnabled).toBe(true);
    });

    it("should submit the dependency with what the user changed", () => {
      // Arrange
      const { picker, props } = renderPicker({ initial: MOCKUP_DEPENDENCY });
      picker.names.remove("named round");
      addName(picker, "named", "floor", "f");

      // Act
      picker.confirm();

      // Assert
      expect(props.onSubmit).toHaveBeenCalledWith({
        ...MOCKUP_DEPENDENCY,
        specifiers: [
          { kind: "default", name: "format" },
          { kind: "named", name: "floor", alias: "f" },
        ],
      });
    });
  });

  describe("giving up", () => {
    it("should call onCancel when Cancel is pressed", () => {
      // Arrange
      const { picker, props } = renderPicker();
      fillMockupDraft(picker);

      // Act
      picker.cancel();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it("should call onCancel when Escape is pressed", () => {
      // Arrange
      const { picker, props } = renderPicker();

      // Act
      picker.pressEscape();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it("should call onCancel when the backdrop is clicked", () => {
      // Arrange
      const { picker, props } = renderPicker();

      // Act
      picker.clickBackdrop();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it("should close the list of files first when Escape is pressed while it is open", () => {
      // Arrange
      const { picker, props } = renderPicker();
      picker.file.open();

      // Act
      picker.file.pressKey("Escape");

      // Assert
      expect(picker.file.isOpen).toBe(false);
      expect(props.onCancel).not.toHaveBeenCalled();
    });

    it("should not give up when Escape closes the editor of a name", () => {
      // Arrange
      const { picker, props } = renderPicker();
      picker.names.openEditor();

      // Act
      picker.names.pressNameKey("Escape");

      // Assert
      expect(picker.names.isEditorOpen).toBe(false);
      expect(props.onCancel).not.toHaveBeenCalled();
    });
  });

  describe("when it opens again", () => {
    it("should start empty, whatever the user did before it closed", () => {
      // Arrange
      const { picker, update } = renderPicker();
      fillMockupDraft(picker);
      picker.syntax.select("export … from");
      update({ open: false });

      // Act
      update({ open: true });

      // Assert
      expect(picker.file.value).toBe("");
      expect(picker.syntax.checked).toBe("import");
      expect(picker.names.chipTexts).toEqual([]);
      expect(picker.refusal).toBeNull();
    });

    it("should start from the dependency it is given", () => {
      // Arrange
      const { picker, update } = renderPicker();
      pickFile(picker, BUTTON);
      update({ open: false });

      // Act
      update({ open: true, initial: MOCKUP_DEPENDENCY });

      // Assert
      expect(picker.title).toBe("Edit a dependency");
      expect(picker.file.value).toBe(FORMAT);
      expect(picker.names.chipTexts).toEqual(["default format", "named round"]);
    });

    it("should keep what the user did while it stays open, whatever the props that change", () => {
      // Arrange
      const { picker, update } = renderPicker();
      fillMockupDraft(picker);

      // Act
      update({ descriptions: new Map() });

      // Assert
      expect(picker.preview.text).toBe(
        'import format, { round } from "../../helpers/format";'
      );
    });
  });
});
