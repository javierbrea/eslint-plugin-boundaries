export { CONFIG_PATH } from "./sketch.constants";
export type {
  DependencyRef,
  EditResult,
  NormalizedPath,
  ParsedStatement,
  RenameResult,
  StatementToken,
  TextProblem,
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
export { isSameProject } from "./compare";
export { fromText, readTextProblems, toText } from "./textMode";
