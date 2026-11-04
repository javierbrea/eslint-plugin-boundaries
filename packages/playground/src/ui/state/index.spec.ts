import {
  EVALUATION_DELAY,
  WorkbenchProvider,
  useAddNode,
  useCancelRename,
  useCapabilities,
  useChangeConfig,
  useClosedFolders,
  useConfig,
  useConfigEditorSnapshot,
  useConfigProblems,
  useEvaluation,
  useFocus,
  useOpen,
  usePickedFolder,
  useProblemCounts,
  useProblemList,
  useProblemSummary,
  useProblemTabs,
  useProblemsCollapsed,
  useReadText,
  useRemoveNode,
  useRenameNode,
  useRenaming,
  useReveal,
  useSelectItem,
  useSelectTab,
  useSetProblemsCollapsed,
  useSetTextDraft,
  useSetView,
  useSettleText,
  useShownTab,
  useStartRename,
  useTextDraft,
  useTextProblems,
  useToggleFolder,
  useTree,
  useView,
  useWorkbenchSelector,
  useWorkbenchStore,
} from "./index";

/**
 * Tells what each export of a group is, so that a missing one shows in the diff.
 * @param exported The exports.
 * @returns The type of each one.
 */
function typesOf(exported: readonly unknown[]): string[] {
  return exported.map((value) => typeof value);
}

/**
 * Builds what a group of functions must be.
 * @param exported The exports.
 * @returns A `function` for each one.
 */
function functionsLike(exported: readonly unknown[]): string[] {
  return exported.map(() => "function");
}

describe("state", () => {
  it("should export the provider", () => {
    // Assert
    expect(typeof WorkbenchProvider).toBe("function");
  });

  it("should export the delay of the evaluation of the config", () => {
    // Assert
    expect(EVALUATION_DELAY).toBe(150);
  });

  it("should export the hooks that read the store and its capabilities", () => {
    // Arrange
    const hooks = [
      useWorkbenchStore,
      useWorkbenchSelector,
      useCapabilities,
      useConfigEditorSnapshot,
    ];

    // Assert
    expect(typesOf(hooks)).toEqual(functionsLike(hooks));
  });

  it("should export the hooks of the slices of the state", () => {
    // Arrange
    const hooks = [
      useTree,
      useConfig,
      useEvaluation,
      useConfigProblems,
      useFocus,
      useView,
      useTextDraft,
      useReveal,
      useProblemsCollapsed,
      usePickedFolder,
      useClosedFolders,
      useRenaming,
    ];

    // Assert
    expect(typesOf(hooks)).toEqual(functionsLike(hooks));
  });

  it("should export the hooks derived from the state", () => {
    // Arrange
    const hooks = [
      useTextProblems,
      useProblemSummary,
      useProblemCounts,
      useProblemTabs,
      useShownTab,
      useProblemList,
    ];

    // Assert
    expect(typesOf(hooks)).toEqual(functionsLike(hooks));
  });

  it("should export the hooks of the commands", () => {
    // Arrange
    const hooks = [
      useOpen,
      useSelectItem,
      useToggleFolder,
      useChangeConfig,
      useAddNode,
      useStartRename,
      useRenameNode,
      useCancelRename,
      useRemoveNode,
      useSetView,
      useSetTextDraft,
      useReadText,
      useSettleText,
      useSelectTab,
      useSetProblemsCollapsed,
    ];

    // Assert
    expect(typesOf(hooks)).toEqual(functionsLike(hooks));
  });
});
