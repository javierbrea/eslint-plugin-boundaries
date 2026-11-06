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
};
