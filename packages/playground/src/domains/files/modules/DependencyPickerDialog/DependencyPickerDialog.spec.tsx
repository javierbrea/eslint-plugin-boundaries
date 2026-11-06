import { act } from "@testing-library/react";

import type { Sketch, SketchDependency } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { getFileDependencies } from "@/domains/project/helpers/sketch";
import { renderInSession } from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { DependencyPickerDialog } from "./DependencyPickerDialog";
import { DependencyPickerDialogPom } from "./DependencyPickerDialog.pom";
import type { DependencyPickerDialogProps } from "./DependencyPickerDialog.types";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const CHECKOUT = "src/modules/checkout/index.js";

const FORMAT = "src/helpers/format/index.js";

/** What {@link renderDialog} returns: the render of the session, the spy of the dialog and its page object. */
type DialogRender = SessionRender & {
  readonly picker: DependencyPickerDialogPom;
  readonly onClose: jest.Mock<void, []>;
};

/**
 * Renders the dialog in a session.
 * @param props What differs from an open dialog that adds a dependency to the checkout file.
 * @param sketch The sketch of the session, the quick start by default.
 * @returns The render, the store, the spy of the dialog and its page object.
 */
function renderDialog(
  props: Partial<DependencyPickerDialogProps> = {},
  sketch: Sketch = QUICK_START
): DialogRender {
  const onClose = jest.fn();

  return {
    ...renderInSession(
      <ThemeRoot>
        <DependencyPickerDialog
          open
          from={CHECKOUT}
          index={undefined}
          onClose={onClose}
          {...props}
        />
      </ThemeRoot>,
      { sketch }
    ),
    picker: new DependencyPickerDialogPom({ portal: true }),
    onClose,
  };
}

/**
 * Gets the dependencies of the checkout file in the store.
 * @param session The render of the session.
 * @param session.store
 * @returns The dependencies, in order.
 */
function getCheckoutDependencies({
  store,
}: DialogRender): readonly SketchDependency[] {
  return getFileDependencies(store.getState().sketch, CHECKOUT);
}

describe("DependencyPickerDialog", () => {
  describe("while it is closed", () => {
    it("should draw nothing", () => {
      // Act
      const { picker } = renderDialog({ open: false });

      // Assert
      expect(picker.isRendered).toBe(false);
    });
  });

  describe("adding", () => {
    it("should offer to add a dependency to the file", () => {
      // Act
      const { picker } = renderDialog();

      // Assert
      expect(picker.title).toBe("Add a dependency");
      expect(picker.fromText).toBe(`to ${CHECKOUT}`);
    });

    it("should offer the other files of the sketch, each with the element the engine found for it", () => {
      // Arrange
      const { picker } = renderDialog();

      // Act
      picker.file.open();

      // Assert
      expect(picker.file.listedFiles).toEqual([
        {
          path: "src/components/atoms/Button/Button.css",
          element: "component",
        },
        {
          path: "src/components/atoms/Button/Button.spec.js",
          element: "component",
        },
        { path: "src/components/atoms/Button/index.js", element: "component" },
        { path: FORMAT, element: "helper" },
        { path: "src/index.js", element: "no element" },
      ]);
    });

    it("should offer the files of the sketch as they are when it opens", () => {
      // Arrange
      const { picker, store } = renderDialog();
      act(() => store.addNode("file"));

      // Act
      picker.file.open();

      // Assert
      expect(picker.file.listedFiles.map(({ path }) => path)).toContain(
        "new-file.js"
      );
    });

    it("should preview the source as the resolvers of the config find the file back", () => {
      // Arrange
      const from = "src/modules/checkout/index.ts";
      const file = "src/helpers/format/index.ts";
      const tree: Sketch["tree"] = [
        { path: from, kind: "file" },
        { path: file, kind: "file" },
      ];
      const typescript = renderDialog(
        { from },
        {
          config:
            '{ settings: { "import/resolver": "typescript" }, rules: {} }',
          tree,
          dependencies: [],
        }
      );
      typescript.picker.file.open();
      typescript.picker.file.choose(file);
      const withTypescript = typescript.picker.preview.text;
      typescript.unmount();

      // Act
      const node = renderDialog(
        { from },
        { config: "{ settings: {}, rules: {} }", tree, dependencies: [] }
      );
      node.picker.file.open();
      node.picker.file.choose(file);

      // Assert
      expect(withTypescript).toBe('import "../../helpers/format";');
      expect(node.picker.preview.text).toBe(
        'import "../../helpers/format/index.ts";'
      );
    });

    it("should add the dependency it is given to the end of the file, and close", () => {
      // Arrange
      const session = renderDialog();
      const { picker, onClose } = session;
      picker.file.open();
      picker.file.choose(FORMAT);
      picker.names.openEditor();
      picker.names.chooseKind("default");
      picker.names.typeName("format");
      picker.names.confirm();

      // Act
      picker.confirm();

      // Assert
      expect(getCheckoutDependencies(session)).toHaveLength(5);
      expect(getCheckoutDependencies(session)[4]).toEqual({
        from: CHECKOUT,
        target: { kind: "node", path: FORMAT },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "format" }],
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should put the dependency it adds in focus", () => {
      // Arrange
      const { picker, store } = renderDialog();
      picker.target.select("An external module");
      picker.typeModule("lodash");

      // Act
      picker.confirm();

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: CHECKOUT,
        index: 4,
      });
    });

    it("should change nothing and close when the user gives up", () => {
      // Arrange
      const session = renderDialog();
      const { picker, onClose, store } = session;
      const sketch = store.getState().sketch;
      picker.target.select("An external module");
      picker.typeModule("lodash");

      // Act
      picker.cancel();

      // Assert
      expect(store.getState().sketch).toBe(sketch);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("editing", () => {
    it("should offer to edit the dependency, with what it has", () => {
      // Act
      const { picker } = renderDialog({ index: 1 });

      // Assert
      expect(picker.title).toBe("Edit a dependency");
      expect(picker.file.value).toBe(FORMAT);
      expect(picker.names.chipTexts).toEqual(["named format"]);
    });

    it("should replace the dependency in its position when the user saves, and close", () => {
      // Arrange
      const session = renderDialog({ index: 1 });
      const { picker, onClose } = session;
      const before = getCheckoutDependencies(session);
      picker.target.select("An external module");
      picker.typeModule("lodash");

      // Act
      picker.confirm();

      // Assert
      const [first, second, third] = getCheckoutDependencies(session);

      expect(second).toEqual({
        from: CHECKOUT,
        target: { kind: "external", name: "lodash" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "format" }],
      });
      expect(getCheckoutDependencies(session)).toHaveLength(before.length);
      expect(first).toBe(before[0]);
      expect(third).toBe(before[2]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should start from an empty draft when there is no dependency at the position", () => {
      // Act
      const { picker } = renderDialog({ index: 9 });

      // Assert
      expect(picker.title).toBe("Add a dependency");
      expect(picker.file.value).toBe("");
    });
  });
});
