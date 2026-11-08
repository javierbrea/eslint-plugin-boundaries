import { useSessionSelector } from "@/domains/session/data/store";

/**
 * Reads which dependency of a file is in focus.
 * @param path The path of the file.
 * @returns The position of the dependency among the ones of the file, or `undefined` when no dependency of the file is in focus. A number, so that the pane renders again only when the line in focus changes.
 */
export function useSelectedDependency(path: string): number | undefined {
  return useSessionSelector((state) =>
    state.focus.kind === "dependency" && state.focus.path === path
      ? state.focus.index
      : undefined
  );
}
