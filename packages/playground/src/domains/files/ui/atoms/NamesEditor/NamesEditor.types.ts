import type { SketchSpecifier } from "@/contract";
import type { SpecifierKind } from "@/domains/project/helpers/sketch";

/** Props of {@link NamesEditor}. */
export type NamesEditorProps = {
  /** The names of the statement, in order. Each one is a chip with a button that removes it */
  readonly specifiers: readonly SketchSpecifier[];
  /** The kinds of name that the syntax holds, in the order the editor offers them. At least one: a syntax that holds none has no names to edit */
  readonly kinds: readonly SpecifierKind[];
  /** Called with the name that the user adds. A name has an alias only when it is a named one and the user wrote one */
  readonly onAdd: (specifier: SketchSpecifier) => void;
  /** Called with the position of the name that the user removes */
  readonly onRemove: (index: number) => void;
  /** Called with the name that the editor would add, as it would add it, each time the user changes it: `undefined` while the editor is closed or its name is empty, and when the editor goes away. The kind is the one the editor shows, which is the first one that the syntax holds when the picked one is no longer held. A name that is typed and not confirmed is not in `specifiers`, so the picker that counts it as part of the statement needs this */
  readonly onPendingChange: (specifier: SketchSpecifier | undefined) => void;
};
