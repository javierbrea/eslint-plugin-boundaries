import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { styled } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { memo, useId } from "react";
import type { ReactNode } from "react";

import { PaneHead, formatCount } from "../common";
import { Icon } from "../icons";
import {
  useCapabilities,
  useProblemCounts,
  useSetView,
  useTree,
  useView,
} from "../state";
import type { ProjectView } from "../state";

import { ProjectTree } from "./ProjectTree";
import { TextMode } from "./TextMode";
import { useProjectTree } from "./useProjectTree";

const Pane = styled("section")({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) 44px",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

const Foot = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 8px",
  borderTop: "1px solid var(--jsb-line)",
});

const Spacer = styled("span")({ flex: 1 });

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
  const dialogTitleId = useId();
  const { path, files } = tree.deleteRequest;

  return (
    <Pane aria-label="Project">
      <PaneHead
        label="Project"
        hint={view === "text" ? "One path per line" : undefined}
      />
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
        <TextMode />
      )}
      <Foot>
        {editTree ? (
          <>
            <Button
              size="small"
              startIcon={<Icon name="plus" />}
              aria-label="Add file"
              onClick={() => tree.add("file")}
            >
              File
            </Button>
            <Button
              size="small"
              startIcon={<Icon name="plus" />}
              aria-label="Add folder"
              onClick={() => tree.add("folder")}
            >
              Folder
            </Button>
          </>
        ) : null}
        <Spacer />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          aria-label="Project view"
          onChange={(_event, next: ProjectView | null) => {
            // The selected button reports `null` when it is pressed again
            if (next !== null) {
              setView(next);
            }
          }}
        >
          <ToggleButton value="tree">Tree</ToggleButton>
          <ToggleButton value="text">Text</ToggleButton>
        </ToggleButtonGroup>
      </Foot>
      <Dialog
        open={tree.isDeleteOpen}
        onClose={tree.cancelDelete}
        aria-labelledby={dialogTitleId}
        // The dialog keeps the focus while it fades out, so the tree can take it back only when it is gone
        slotProps={{ transition: { onExited: tree.deleteExited } }}
      >
        <DialogTitle id={dialogTitleId}>
          {`Delete ${path}/ and its ${formatCount(files, "file", "files")}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The dependencies of these files, and the ones that point to them, go
            with them.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={tree.cancelDelete}>
            Cancel
          </Button>
          <Button variant="contained" onClick={tree.confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Pane>
  );
}

/** The project pane. It reads the store, so it renders again only when what it shows changes. */
export const ProjectPane = memo(ProjectPaneContent);
