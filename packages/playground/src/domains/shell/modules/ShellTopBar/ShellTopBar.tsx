import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

import { EXAMPLES } from "@/domains/examples/data/examples";
import type { Example } from "@/domains/examples/data/examples";
import { useCurrentExample } from "@/domains/examples/modules/hooks/useCurrentExample";
import { ExamplePicker } from "@/domains/examples/ui/atoms/ExamplePicker";
import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";
import {
  useCapabilities,
  useSessionSelector,
  useSessionStore,
} from "@/domains/session/data/store";
import { useShareLink } from "@/domains/share/modules/hooks/useShareLink";
import { HelpDialog } from "@/domains/shell/ui/atoms/HelpDialog";
import { TopBarActions } from "@/domains/shell/ui/molecules/TopBarActions";
import { TopBar } from "@/domains/shell/ui/templates/TopBar";
import { getCountTone } from "@/ui-kit/helpers/tone";

import { SHELL_TOP_BAR_TEST_ID } from "./ShellTopBar.constants";
import type { ShellTopBarProps } from "./ShellTopBar.types";

/**
 * The top bar of the instance: the numbers of the store (how many files and dependencies the sketch has and how many problems), the picker of examples, and Help, Reset and Share. It hands the host the sketch on screen when the user asks to reset or to open an example, and the help is the only thing it keeps, which is whether its dialog is open.
 * @param props ShellTopBar props.
 * @param props.quickStartUrl The URL of the Quick start guide, if the host has one.
 * @param props.onReset Called with the sketch on screen when the user asks to reset it.
 * @param props.onSelectExample Called with the example and the sketch on screen when the user picks an example.
 * @param props.makeLink Makes the link that Share copies, if the host can.
 * @returns The bar.
 */
export function ShellTopBar({
  quickStartUrl,
  onReset,
  onSelectExample,
  makeLink,
}: Readonly<ShellTopBarProps>): ReactNode {
  const store = useSessionStore();
  const files = useSessionSelector((state) => state.evaluation.files.size);
  const dependencies = useSessionSelector(
    (state) => state.evaluation.sketch.dependencies.length
  );
  const { total, hasErrors, configHasErrors } = useProblemSummary();
  const { editTree, editDependencies, editConfig } = useCapabilities();
  const currentExample = useCurrentExample();
  const { share, outcome } = useShareLink(makeLink);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  // An example replaces the tree, the dependencies and the config, so a source that cannot edit all three has none to offer
  const canOpenExamples = editTree && editDependencies && editConfig;

  const reset = useCallback(
    () => onReset(store.getState().sketch),
    [store, onReset]
  );
  const selectExample = useCallback(
    (example: Example) => onSelectExample(example, store.getState().sketch),
    [store, onSelectExample]
  );
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  // The dialog keeps the keyboard until it is gone, and the pointer does not always focus a button that it presses, so the keyboard goes back to the button that opened it. The button is there for as long as the dialog is
  const giveFocusBack = useCallback(
    () => (helpButtonRef.current as HTMLButtonElement).focus(),
    []
  );

  return (
    <>
      <TopBar
        files={files}
        dependencies={dependencies}
        problems={total}
        tone={getCountTone(hasErrors)}
        configHasErrors={configHasErrors}
        start={
          canOpenExamples ? (
            <ExamplePicker
              examples={EXAMPLES}
              currentId={currentExample?.id}
              onSelect={selectExample}
            />
          ) : null
        }
        end={
          <TopBarActions
            isHelpOpen={isHelpOpen}
            helpButtonRef={helpButtonRef}
            shareOutcome={outcome}
            onHelp={openHelp}
            onReset={reset}
            onShare={share}
          />
        }
        testId={SHELL_TOP_BAR_TEST_ID}
      />
      <HelpDialog
        isOpen={isHelpOpen}
        quickStartUrl={quickStartUrl}
        onClose={closeHelp}
        onExited={giveFocusBack}
      />
    </>
  );
}
