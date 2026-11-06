import type { ReactNode } from "react";

import { ConfigEditorSnapshotProvider } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import { SessionProvider } from "@/domains/session/data/store";
import { ShellPanes } from "@/domains/shell/modules/ShellPanes";
import { ShellTopBar } from "@/domains/shell/modules/ShellTopBar";
import { ShellLayout } from "@/domains/shell/ui/templates/ShellLayout";

import { SHELL_TEST_ID } from "./Shell.constants";
import type { ShellProps } from "./Shell.types";

/**
 * The shell: the whole playground once a sketch is loaded. It creates the store of the instance and lays out the project, the node in focus, the inspector and the problems panel, which read the store through the hooks of the session.
 * @param props Shell props.
 * @param props.initialSketch The sketch to start from.
 * @param props.capabilities What the user can change in the project.
 * @param props.onSketchChange Called with each new sketch after an edit.
 * @returns The shell, as large as its container.
 */
export function Shell({
  initialSketch,
  capabilities,
  onSketchChange,
}: Readonly<ShellProps>): ReactNode {
  return (
    <SessionProvider
      initialSketch={initialSketch}
      capabilities={capabilities}
      onSketchChange={onSketchChange}
    >
      <ConfigEditorSnapshotProvider>
        <ShellLayout
          topBar={<ShellTopBar />}
          regions={<ShellPanes />}
          testId={SHELL_TEST_ID}
        />
      </ConfigEditorSnapshotProvider>
    </SessionProvider>
  );
}
