import type { SketchDependency, SketchSpecifier } from "@/contract";

/** The kind of a name of a statement: `default`, `named` or `namespace`. */
export type SpecifierKind = SketchSpecifier["kind"];

/** Whether a statement imports values or only types. */
export type ImportKind = SketchDependency["importKind"];

/** What a syntax lets the user pick, as the table of the syntaxes of the sketch says. */
export type SyntaxFacts = {
  /** The kinds of statement it offers, in the order the picker shows them. Empty when it offers none: it writes values only, and the picker hides the row. */
  readonly importKinds: readonly ImportKind[];
  /** The kinds of name it holds, in the order the picker offers them. Empty when it holds none, and the picker hides the row. */
  readonly specifierKinds: readonly SpecifierKind[];
};

/** A chip split in the two parts that the picker draws apart. */
export type ChipParts = {
  /** The kind of the name, such as `named`. */
  readonly kind: string;
  /** The name, followed by `as` and its alias when it has one. */
  readonly name: string;
};

/** An option of a group of radios: the value it stands for and the label the user reads. */
export type LabeledOption<Value extends string> = {
  /** What the option stands for. */
  readonly value: Value;
  /** What the user reads. */
  readonly label: string;
};
