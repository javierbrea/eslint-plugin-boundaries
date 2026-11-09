export { CONFIG_PATH, SYNTAX_FACTS } from "./sketch.constants";
export type {
  DependencyRef,
  EditResult,
  ImportKind,
  NormalizedPath,
  ParsedStatement,
  RenameResult,
  SketchReadResult,
  SpecifierKind,
  StatementToken,
  SyntaxFacts,
  TextDependencyLine,
  TextProblem,
  TextReadOptions,
  TextResult,
  TreeItem,
} from "./sketch.types";
export {
  getName,
  getParentPath,
  getPathError,
  isSameOrInside,
  movePath,
  normalizePath,
} from "./paths";
export { buildTree, countFilesUnder, getFiles, hasNode } from "./tree";
export {
  addNode,
  getUniquePath,
  removeNode,
  renameInFolder,
  renameNode,
  setConfig,
} from "./edit";
export {
  addDependency,
  getDependency,
  getDependencyError,
  getFileDependencies,
  getSyntaxFacts,
  removeDependency,
  replaceDependency,
} from "./dependencies";
export {
  getDependencySource,
  parseStatement,
  resolveSource,
  toStatement,
  toStatementTokens,
} from "./statements";
export {
  findSameSketch,
  isSameDependency,
  isSameProject,
  isSameSketch,
} from "./compare";
export { readSketch } from "./read";
export {
  fromText,
  getDependencyAtLine,
  getDependencyLine,
  readTextProblems,
  toText,
} from "./textMode";
export { moveTextLine } from "./textLines";
