import type { Rule } from "eslint";

export type PathCapturedValues = string[];

export type ElementInfo = {
  elementPath: string;
  type: string | null;
  parents: ElementInfo[];
  capture: string | null;
  capturedValues: PathCapturedValues;
  internalPath: string | null;
};

export type ImportInfo = {
  source: string;
  context: Rule.RuleContext;
  path: string;
  isIgnored: boolean;
  isLocal: boolean;
  isBuiltIn: boolean;
  isExternal: boolean;
  baseModule: string | null;
  specifiers?: string[];
} & ElementInfo;

export type FileInfo = ElementInfo & {
  path: string;
  isIgnored: boolean;
};
