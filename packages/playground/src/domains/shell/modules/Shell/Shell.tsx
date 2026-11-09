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
 * @param props.quickStartUrl The URL of the Quick start guide, which the help links to.
 * @param props.onReset Called with the sketch on screen when the user asks to reset it.
 * @param props.onSelectExample Called with the example and the sketch on screen when the user picks an example.
 * @param props.makeLink Makes the link that Share copies, if the host can.
 * @param props.initialFocus The control of the top bar that takes the keyboard focus when the shell is first rendered, if any.
 * @returns The shell, as large as its container.
 */
export function Shell({
  initialSketch,
  capabilities,
  onSketchChange,
  quickStartUrl,
  onReset,
  onSelectExample,
  makeLink,
  initialFocus,
}: Readonly<ShellProps>): ReactNode {
  return (
    <SessionProvider
      initialSketch={initialSketch}
      capabilities={capabilities}
      onSketchChange={onSketchChange}
    >
      <ConfigEditorSnapshotProvider>
        <ShellLayout
          topBar={
            <ShellTopBar
              quickStartUrl={quickStartUrl}
              onReset={onReset}
              onSelectExample={onSelectExample}
              makeLink={makeLink}
              initialFocus={initialFocus}
            />
          }
          regions={<ShellPanes />}
          testId={SHELL_TEST_ID}
        />
      </ConfigEditorSnapshotProvider>
    </SessionProvider>
  );
}
