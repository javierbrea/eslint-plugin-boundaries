import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import type { Sketch } from "../contract";

/**
 * Counts the files of a sketch.
 * @param sketch The sketch.
 * @returns The number of files.
 */
function countFiles(sketch: Sketch): number {
  return sketch.tree.filter((node) => node.kind === "file").length;
}

/** Props of {@link Placeholder}. */
type PlaceholderProps = {
  /** The sketch, or `undefined` while it loads. */
  sketch: Sketch | undefined;
};

/**
 * Stands in for the panes of the playground: a heading, the number of files of the sketch, and a button that opens a dialog, so that the theme and the overlays can be checked in every host.
 * @param props Placeholder props.
 * @param props.sketch The sketch, or `undefined` while it loads.
 * @returns The placeholder.
 */
export function Placeholder({ sketch }: Readonly<PlaceholderProps>): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <Stack spacing={2} sx={{ alignItems: "flex-start", p: 3 }}>
      <Typography variant="h5" component="h2">
        Sketch
      </Typography>
      <Typography color="textSecondary">
        {sketch
          ? `${countFiles(sketch)} files in the sketch.`
          : "Loading the sketch…"}
      </Typography>
      <Button variant="contained" onClick={() => setIsOpen(true)}>
        About the playground
      </Button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>About the playground</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The project tree, the editor of the config and the problems panel
            come next.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
