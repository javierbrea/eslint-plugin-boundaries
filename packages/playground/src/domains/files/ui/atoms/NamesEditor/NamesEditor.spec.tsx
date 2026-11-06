import { render } from "@testing-library/react";

import type { SketchSpecifier } from "@/contract";

import { NamesEditor } from "./NamesEditor";
import { NamesEditorPom } from "./NamesEditor.pom";
import type { NamesEditorProps } from "./NamesEditor.types";

const SPECIFIERS: readonly SketchSpecifier[] = [
  { kind: "default", name: "format" },
  { kind: "named", name: "round" },
  { kind: "named", name: "floor", alias: "f" },
  { kind: "namespace", name: "ns" },
];

/** What a spec gets from the editor it renders. */
type Page = {
  /** The page object of the editor. */
  editor: NamesEditorPom;
  /** The props of the editor, with the spies of its handlers. */
  props: NamesEditorProps;
  /** The spy of the key presses that reach the element around the editor, which is the dialog. */
  onKeyDown: jest.Mock<void, []>;
  /** Renders the editor again with other props. */
  update: (changes: Partial<NamesEditorProps>) => void;
};

/**
 * Renders the editor inside an element that records the key presses that reach it, as the dialog of the picker does.
 * @param changes What differs from the editor of an `import`: the four names of every kind, and the three kinds of name.
 * @returns The page object of the editor, its props, the spy of the key presses and the function that updates it.
 */
function renderEditor(changes: Partial<NamesEditorProps> = {}): Page {
  const onKeyDown = jest.fn<void, []>();
  const props: NamesEditorProps = {
    specifiers: SPECIFIERS,
    kinds: ["default", "named", "namespace"],
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    ...changes,
  };
  const { rerender } = render(
    <div onKeyDown={onKeyDown}>
      <NamesEditor {...props} />
    </div>
  );

  return {
    editor: new NamesEditorPom(),
    props,
    onKeyDown,
    update: (next) =>
      rerender(
        <div onKeyDown={onKeyDown}>
          <NamesEditor {...props} {...next} />
        </div>
      ),
  };
}

describe("NamesEditor", () => {
  describe("chips", () => {
    it("should draw a chip for each name, in order, with its kind and its alias", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      const { chipTexts } = editor;

      // Assert
      expect(chipTexts).toEqual([
        "default format",
        "named round",
        "named floor as f",
        "namespace ns",
      ]);
    });

    it("should draw no chip for a statement with no names", () => {
      // Arrange
      const { editor } = renderEditor({ specifiers: [] });

      // Act
      const { chipTexts, buttonNames } = editor;

      // Assert
      expect(chipTexts).toEqual([]);
      expect(buttonNames).toEqual(["Add a name"]);
    });

    it("should give each chip a button that says which name it removes", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      const { removeButtonNames } = editor;

      // Assert
      expect(removeButtonNames).toEqual([
        "Remove default format",
        "Remove named round",
        "Remove named floor as f",
        "Remove namespace ns",
      ]);
    });

    it("should ask to remove the name whose button is pressed, by its position", () => {
      // Arrange
      const { editor, props } = renderEditor();

      // Act
      editor.remove("named floor as f");

      // Assert
      expect(props.onRemove).toHaveBeenCalledTimes(1);
      expect(props.onRemove).toHaveBeenCalledWith(2);
    });

    it("should give the focus to the chip that adds a name, since the button that was pressed goes away", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      editor.remove("default format");

      // Assert
      expect(editor.isAddChipFocused).toBe(true);
    });

    it("should keep the editor open when a name is removed while it is open", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();

      // Act
      editor.remove("named round");

      // Assert
      expect(props.onRemove).toHaveBeenCalledWith(1);
      expect(editor.isEditorOpen).toBe(true);
    });
  });

  describe("the chip that adds a name", () => {
    it("should read Name and be named as the control that adds a name", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      const { addChipText, buttonNames } = editor;

      // Assert
      expect(addChipText).toBe("Name");
      expect(buttonNames.at(-1)).toBe("Add a name");
    });

    it("should open the editor in its place", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      editor.openEditor();

      // Assert
      expect(editor.isEditorOpen).toBe(true);
      expect(editor.hasAddChip).toBe(false);
    });
  });

  describe("the editor", () => {
    it("should offer the kinds that the syntax holds, with the first one picked and the focus in the field of the name", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      editor.openEditor();

      // Assert
      expect(editor.kinds).toEqual(["default", "named", "namespace"]);
      expect(editor.selectedKind).toBe("default");
      expect(editor.isNameFocused).toBe(true);
    });

    it("should offer only the kinds that the syntax holds", () => {
      // Arrange
      const { editor } = renderEditor({ kinds: ["named", "namespace"] });

      // Act
      editor.openEditor();

      // Assert
      expect(editor.kinds).toEqual(["named", "namespace"]);
      expect(editor.selectedKind).toBe("named");
    });

    it("should name every control", () => {
      // Arrange
      const { editor } = renderEditor({ specifiers: [] });

      // Act
      editor.openEditor();

      // Assert
      expect(editor.buttonNames).toEqual([
        "default",
        "named",
        "namespace",
        "Add name",
        "Cancel name",
      ]);
    });

    it("should start empty, with the button that adds the name disabled", () => {
      // Arrange
      const { editor } = renderEditor();

      // Act
      editor.openEditor();

      // Assert
      expect(editor.nameValue).toBe("");
      expect(editor.isConfirmEnabled).toBe(false);
    });

    it("should enable the button once there is a name, and not for one made of spaces", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();

      // Act
      editor.typeName("   ");
      const withSpaces = editor.isConfirmEnabled;
      editor.typeName("format");
      const withName = editor.isConfirmEnabled;

      // Assert
      expect(withSpaces).toBe(false);
      expect(withName).toBe(true);
    });

    it("should hold what the user types", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();

      // Act
      editor.typeName("format");

      // Assert
      expect(editor.nameValue).toBe("format");
    });

    it("should have the field of the alias only for a named name", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();

      // Act
      const withDefault = editor.hasAliasField;
      editor.chooseKind("named");
      const withNamed = editor.hasAliasField;
      editor.chooseKind("namespace");
      const withNamespace = editor.hasAliasField;

      // Assert
      expect(withDefault).toBe(false);
      expect(withNamed).toBe(true);
      expect(withNamespace).toBe(false);
    });

    it("should pick the kind that is pressed", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();

      // Act
      editor.chooseKind("namespace");

      // Assert
      expect(editor.selectedKind).toBe("namespace");
    });

    it("should keep the kind when the one that is picked is pressed again", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();
      editor.chooseKind("named");

      // Act
      editor.chooseKind("named");

      // Assert
      expect(editor.selectedKind).toBe("named");
    });

    it("should pick the first kind of the new syntax when the kind that was picked is no longer held", () => {
      // Arrange
      const { editor, update } = renderEditor();
      editor.openEditor();
      editor.typeName("format");

      // Act
      update({ kinds: ["named", "namespace"] });

      // Assert
      expect(editor.kinds).toEqual(["named", "namespace"]);
      expect(editor.selectedKind).toBe("named");
      expect(editor.nameValue).toBe("format");
    });

    it("should keep the kind that was picked when the new syntax holds it", () => {
      // Arrange
      const { editor, update } = renderEditor();
      editor.openEditor();
      editor.chooseKind("namespace");

      // Act
      update({ kinds: ["named", "namespace"] });

      // Assert
      expect(editor.selectedKind).toBe("namespace");
    });

    it("should start empty again the next time it opens", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeName("round");
      editor.typeAlias("r");
      editor.cancel();

      // Act
      editor.openEditor();

      // Assert
      expect(editor.selectedKind).toBe("default");
      expect(editor.nameValue).toBe("");

      editor.chooseKind("named");

      expect(editor.aliasValue).toBe("");
    });
  });

  describe("adding a name", () => {
    it("should add a default name with Enter, and close the editor", () => {
      // Arrange
      const { editor, props } = renderEditor({ specifiers: [] });
      editor.openEditor();
      editor.typeName("format");

      // Act
      editor.pressNameKey("Enter");

      // Assert
      expect(props.onAdd).toHaveBeenCalledTimes(1);
      expect(props.onAdd).toHaveBeenCalledWith({
        kind: "default",
        name: "format",
      });
      expect(editor.isEditorOpen).toBe(false);
    });

    it("should add a named name with its alias with the confirm button", () => {
      // Arrange
      const { editor, props } = renderEditor({ specifiers: [] });
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeName("round");
      editor.typeAlias("r");

      // Act
      editor.confirm();

      // Assert
      expect(props.onAdd).toHaveBeenCalledTimes(1);
      expect(props.onAdd).toHaveBeenCalledWith({
        kind: "named",
        name: "round",
        alias: "r",
      });
      expect(editor.isEditorOpen).toBe(false);
    });

    it("should add the name with Enter in the field of the alias too", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeName("round");
      editor.typeAlias("r");

      // Act
      editor.pressAliasKey("Enter");

      // Assert
      expect(props.onAdd).toHaveBeenCalledWith({
        kind: "named",
        name: "round",
        alias: "r",
      });
    });

    it("should add a namespace name", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.chooseKind("namespace");
      editor.typeName("ns");

      // Act
      editor.confirm();

      // Assert
      expect(props.onAdd).toHaveBeenCalledWith({
        kind: "namespace",
        name: "ns",
      });
    });

    it("should leave the alias out when a named name has none, and when it is made of spaces", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeName("round");
      editor.confirm();
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeName("floor");
      editor.typeAlias("   ");

      // Act
      editor.confirm();

      // Assert
      expect(props.onAdd).toHaveBeenNthCalledWith(1, {
        kind: "named",
        name: "round",
      });
      expect(jest.mocked(props.onAdd).mock.calls[0][0]).not.toHaveProperty(
        "alias"
      );
      expect(jest.mocked(props.onAdd).mock.calls[1][0]).not.toHaveProperty(
        "alias"
      );
    });

    it("should write the name and the alias without the spaces around them", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeName("  round ");
      editor.typeAlias(" r  ");

      // Act
      editor.confirm();

      // Assert
      expect(props.onAdd).toHaveBeenCalledWith({
        kind: "named",
        name: "round",
        alias: "r",
      });
    });

    it("should not give an alias to a kind that cannot have one, even if one was written before the kind changed", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.chooseKind("named");
      editor.typeAlias("r");
      editor.chooseKind("namespace");
      editor.typeName("ns");

      // Act
      editor.confirm();

      // Assert
      expect(jest.mocked(props.onAdd).mock.calls[0][0]).not.toHaveProperty(
        "alias"
      );
    });

    it("should not add a name while the field of the name is empty", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.typeName("   ");

      // Act
      editor.pressNameKey("Enter");

      // Assert
      expect(props.onAdd).not.toHaveBeenCalled();
      expect(editor.isEditorOpen).toBe(true);
    });

    it("should give the focus to the chip that adds a name when the name is added", () => {
      // Arrange
      const { editor } = renderEditor();
      editor.openEditor();
      editor.typeName("format");

      // Act
      editor.confirm();

      // Assert
      expect(editor.isAddChipFocused).toBe(true);
    });

    it("should do nothing with the other keys", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.typeName("format");

      // Act
      editor.pressNameKey("a");

      // Assert
      expect(props.onAdd).not.toHaveBeenCalled();
      expect(editor.isEditorOpen).toBe(true);
    });

    it("should not add the name when Enter is pressed on a button of the kinds", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.typeName("format");

      // Act
      editor.pressKindKey("named", "Enter");

      // Assert
      expect(props.onAdd).not.toHaveBeenCalled();
      expect(editor.isEditorOpen).toBe(true);
    });
  });

  describe("closing the editor", () => {
    it("should close without adding when the cancel button is pressed, and give the focus to the chip that adds a name", () => {
      // Arrange
      const { editor, props } = renderEditor();
      editor.openEditor();
      editor.typeName("format");

      // Act
      editor.cancel();

      // Assert
      expect(editor.isEditorOpen).toBe(false);
      expect(editor.isAddChipFocused).toBe(true);
      expect(props.onAdd).not.toHaveBeenCalled();
    });

    it.each([
      [
        "the field of the name",
        (editor: NamesEditorPom) => editor.pressNameKey("Escape"),
      ],
      [
        "the field of the alias",
        (editor: NamesEditorPom) => {
          editor.chooseKind("named");
          editor.pressAliasKey("Escape");
        },
      ],
      [
        "a button of the kinds",
        (editor: NamesEditorPom) => editor.pressKindKey("named", "Escape"),
      ],
    ])(
      "should close without adding when Escape is pressed in %s, and keep it from reaching the dialog",
      (_where, press) => {
        // Arrange
        const { editor, props, onKeyDown } = renderEditor();
        editor.openEditor();
        editor.typeName("format");

        // Act
        press(editor);

        // Assert
        expect(editor.isEditorOpen).toBe(false);
        expect(editor.isAddChipFocused).toBe(true);
        expect(props.onAdd).not.toHaveBeenCalled();
        expect(onKeyDown).not.toHaveBeenCalled();
      }
    );

    it("should let the other keys reach the dialog", () => {
      // Arrange
      const { editor, onKeyDown } = renderEditor();
      editor.openEditor();

      // Act
      editor.pressNameKey("a");

      // Assert
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });
});
