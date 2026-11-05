import { memo } from "react";
import type { ReactNode } from "react";

import { useProblemCounts } from "@/domains/problems/modules/hooks/useProblemCounts";
import { ProjectText } from "@/domains/project/modules/ProjectText";
import { DeleteFolderDialog } from "@/domains/project/ui/molecules/DeleteFolderDialog";
import { ProjectFoot } from "@/domains/project/ui/molecules/ProjectFoot";
import { ProjectTree } from "@/domains/project/ui/organisms/ProjectTree";
import { ProjectPaneLayout } from "@/domains/project/ui/templates/ProjectPaneLayout";
import {
  useCapabilities,
  useSetView,
  useTree,
  useView,
} from "@/domains/session/data/store";

import { useProjectTree } from "./useProjectTree";

/**
 * The left pane: the sketch as a tree with `eslint.config.js` pinned first, or as text, and a foot to add files and folders and to switch between the two. Both views edit the sketch of the store through its transitions.
 * @returns The pane, as tall as its container.
 */
function ProjectPaneContent(): ReactNode {
  const view = useView();
  const nodes = useTree();
  const counts = useProblemCounts();
  const { editTree } = useCapabilities();
  const setView = useSetView();
  const tree = useProjectTree();
  const { path, files } = tree.deleteRequest;

  return (
    <>
      <ProjectPaneLayout
        view={view}
        foot={
          <ProjectFoot
            view={view}
            editable={editTree}
            onAdd={tree.add}
            onViewChange={setView}
          />
        }
      >
        {view === "tree" ? (
          <ProjectTree
            tree={nodes}
            counts={counts}
            editable={editTree}
            selectedId={tree.selectedId}
            collapsed={tree.collapsed}
            renaming={tree.renaming}
            focusRequest={tree.focusRequest}
            onFocusDone={tree.focusDone}
            onSelect={tree.select}
            onToggle={tree.toggle}
            onRename={tree.startRename}
            onRenameCommit={tree.commitRename}
            onRenameCancel={tree.cancelRename}
            onDelete={tree.requestDelete}
          />
        ) : (
          <ProjectText />
        )}
      </ProjectPaneLayout>
      <DeleteFolderDialog
        isOpen={tree.isDeleteOpen}
        path={path}
        files={files}
        onCancel={tree.cancelDelete}
        onConfirm={tree.confirmDelete}
        onExited={tree.deleteExited}
      />
    </>
  );
}

/** The project pane. It reads the store, so it renders again only when what it shows changes. */
export const ProjectPane = memo(ProjectPaneContent);
