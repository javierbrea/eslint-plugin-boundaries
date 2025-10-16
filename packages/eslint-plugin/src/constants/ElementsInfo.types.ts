import type { CapturedValues } from "./Options.types";

export type PathCapturedValues = string[];

export type ElementInfo = {
  elementPath: string;
  type: string | null;
  parents: Pick<
    ElementInfo,
    "elementPath" | "type" | "capture" | "capturedValues"
  >[];
  capture: string[] | null;
  capturedValues: CapturedValues;
  internalPath: string | null;
};

export type ImportInfo = {
  source: string;
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
