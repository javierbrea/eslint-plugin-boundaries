import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { SketchSpecifier } from "@/contract";
import { NamesEditor } from "@/domains/files/ui/atoms/NamesEditor";
import { Statement } from "@/domains/files/ui/atoms/Statement";
import {
  changeSyntax,
  createDraft,
  getPreviewTokens,
  toDependency,
} from "@/domains/files/ui/helpers/dependencyDraft";
import {
  IMPORT_KIND_OPTIONS,
  SYNTAX_OPTIONS,
  getFileOptionLabel,
} from "@/domains/files/ui/helpers/dependencyLabels";
import type { LabeledOption } from "@/domains/files/ui/helpers/dependencyLabels";
import {
  getDependencyError,
  getFiles,
  getSyntaxFacts,
} from "@/domains/project/helpers/sketch";
import { Icon } from "@/ui-kit/atoms/Icon";
import { STATE_TEXT } from "@/ui-kit/helpers/tone";

import {
  ADD_LABEL,
  ADD_TITLE,
  CANCEL_LABEL,
  DEPENDENCY_PICKER_TEST_ID,
  EDIT_TITLE,
  EXTERNAL_TARGET_LABEL,
  FILE_FIELD_LABEL,
  FILE_TARGET_LABEL,
  FROM_PREFIX,
  IMPORTED_ROW_LABEL,
  KIND_ROW_LABEL,
  MODULE_FIELD_LABEL,
  NO_FILE_TEXT,
  PREVIEW_ROW_LABEL,
  SAVE_LABEL,
  SYNTAX_ROW_LABEL,
  TARGET_ROW_LABEL,
} from "./DependencyPicker.constants";
import type { DependencyPickerProps } from "./DependencyPicker.types";

/** The kinds of target, with the label of their radio. */
const TARGET_OPTIONS: readonly LabeledOption<"node" | "external">[] = [
  { value: "node", label: FILE_TARGET_LABEL },
  { value: "external", label: EXTERNAL_TARGET_LABEL },
];

// The picker is 620 px wide with its border, whatever the box model of the host, and a narrower page leaves it its margin
const PickerDialog = styled(Dialog)({
  "& .MuiDialog-paper": { boxSizing: "border-box", width: 620 },
});

// The path of the file takes the line below the title, which has the padding of the title
const From = styled("p")(({ theme }) => ({
  ...theme.typography.mono,
  margin: "-4px 0 0",
  padding: "0 22px 6px",
  color: "var(--jsb-muted)",
}));

const Form = styled("div")({ display: "grid" });

const Row = styled("div")({
  display: "grid",
  gridTemplateColumns: "92px minmax(0, 1fr)",
  gap: 12,
  padding: "11px 0",
  borderTop: "1px solid var(--jsb-line)",
  "&:first-of-type": { borderTop: 0 },
});

const RowLabel = styled("span")(({ theme }) => ({
  ...theme.typography.monoSmall,
  paddingTop: 3,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.45,
  color: "var(--jsb-muted)",
}));

// The box of a radio has 2 px of space around its ring: 16 px between one label and the next ring, and 2 px that the group takes off its left, so that the first ring is aligned with the rest of the row
const Radios = styled(RadioGroup)({ gap: "4px 16px", marginLeft: -2 });

// The field is 10 px below the radios of its row
const Field = styled("div")({ marginTop: 10 });

const OptionPath = styled("span")({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const OptionElement = styled("small")(({ theme }) => ({
  ...theme.typography.monoCaption,
  flexShrink: 0,
  color: "var(--jsb-muted)",
}));

const Preview = styled("pre")(({ theme }) => ({
  ...theme.typography.mono,
  // A statement of one line is as tall as the font, which is the 34 px of the mockup
  lineHeight: "normal",
  margin: 0,
  padding: "9px 12px",
  borderRadius: "var(--jsb-radius)",
  backgroundColor: "var(--jsb-code)",
  color: "var(--jsb-code-fg)",
  // The statement wraps, as it does in the file, and is never cut
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
}));

// The longest sentences do not fit on one line of the picker, so the sentence wraps and is never cut
const Refusal = styled("p")(({ theme }) => ({
  ...theme.typography.caption,
  margin: "6px 0 0",
  color: STATE_TEXT.bad,
}));

/** Props of {@link Choice}. */
type ChoiceProps<Value extends string> = {
  /** The id of the label that names the group. */
  labelId: string;
  /** The radios, in order. */
  options: readonly LabeledOption<Value>[];
  /** The value of the radio that is checked. */
  value: Value;
  /** The position of the radio that takes the focus when the dialog opens, if there is one. */
  autoFocusIndex?: number;
  /** Called with the value of the radio that the user checks. */
  onChange: (value: Value) => void;
};

/**
 * A group of radios with a row label as its name.
 * @param props Choice props.
 * @param props.labelId The id of the label that names the group.
 * @param props.options The radios, in order.
 * @param props.value The value of the radio that is checked.
 * @param props.autoFocusIndex The position of the radio that takes the focus when it mounts.
 * @param props.onChange Called with the value of the radio that the user checks.
 * @returns The group.
 */
function Choice<Value extends string>({
  labelId,
  options,
  value,
  autoFocusIndex,
  onChange,
}: Readonly<ChoiceProps<Value>>): ReactNode {
  return (
    <Radios row aria-labelledby={labelId} value={value}>
      {options.map((option, index) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          label={option.label}
          control={
            <Radio
              autoFocus={index === autoFocusIndex}
              onChange={() => onChange(option.value)}
            />
          }
        />
      ))}
    </Radios>
  );
}

/** Props of {@link FormRow}. */
type FormRowProps = {
  /** The label of the row. */
  label: string;
  /** The id the label has, which names what the row holds. */
  labelId: string;
  /** What the row holds. */
  children: ReactNode;
};

/**
 * A row of the form: its label in the narrow column of the left, and what it holds.
 * @param props FormRow props.
 * @param props.label The label of the row.
 * @param props.labelId The id the label has.
 * @param props.children What the row holds.
 * @returns The row.
 */
function FormRow({
  label,
  labelId,
  children,
}: Readonly<FormRowProps>): ReactNode {
  return (
    <Row>
      <RowLabel id={labelId}>{label}</RowLabel>
      <div>{children}</div>
    </Row>
  );
}

/**
 * The dialog that adds a dependency to a file or edits one: the target (a file of the sketch or an external module), the syntax, the kind, the names and a preview of the statement they write, which shows why a draft is refused. The draft is its own: the dialog calls `onSubmit` only with a dependency that the sketch can hold, and starts from `initial`, or empty, each time it opens. A name that is typed in the editor of the names and not added yet counts as if it had been: the preview writes it after the names that are added, the draft is checked with it and the dependency that is submitted holds it, until the editor closes.
 * @param props DependencyPicker props.
 * @param props.open Whether the dialog is open.
 * @param props.from Path of the file the dependency belongs to.
 * @param props.tree The tree of the sketch.
 * @param props.descriptions The description of each file, by path.
 * @param props.initial The dependency being edited, or `undefined` to add one.
 * @param props.onCancel Called when the user gives up.
 * @param props.onSubmit Called with the dependency of the draft when the user confirms it, with the name being typed if there is one.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The dialog.
 */
export function DependencyPicker({
  open: isOpen,
  from,
  tree,
  descriptions,
  initial,
  onCancel,
  onSubmit,
  testId = DEPENDENCY_PICKER_TEST_ID,
}: Readonly<DependencyPickerProps>): ReactNode {
  const baseId = useId();
  const [draft, setDraft] = useState(() => createDraft(initial));
  // The name that the editor of the names holds and has not added, which is part of the statement
  const [pending, setPending] = useState<SketchSpecifier | undefined>();
  // Counts the times the dialog opened: the editor of the names is new each time, so it starts closed, and the name it held is gone with it
  const [openings, setOpenings] = useState(0);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const files = useMemo(() => getFiles({ tree }), [tree]);
  const options = useMemo(
    () => files.filter((path) => path !== from),
    [files, from]
  );

  // A dialog that opens starts from the dependency it is given, whatever the user did before it closed. React renders again at once with the new state, before it draws
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDraft(createDraft(initial));
      // The editor that held the name unmounts after this render, so the preview of the first one must not write it
      setPending(undefined);
      setOpenings(openings + 1);
    }
  }

  const { importKinds, specifierKinds } = getSyntaxFacts(draft.syntax);
  // The name that was typed and not confirmed counts as if it had been: the statement, the check and the dependency that is submitted hold the names that are confirmed and then that one
  const withPending =
    pending === undefined
      ? draft
      : { ...draft, specifiers: [...draft.specifiers, pending] };
  const dependency = toDependency(withPending, from);
  const refusal =
    dependency === undefined
      ? undefined
      : getDependencyError({ tree }, dependency);
  // Only a draft that has a target and that the sketch can hold is submitted
  const submittable = refusal === undefined ? dependency : undefined;
  const titleId = `${baseId}-title`;
  const isEditing = initial !== undefined;

  return (
    <PickerDialog
      open={isOpen}
      onClose={() => onCancel()}
      maxWidth={false}
      aria-labelledby={titleId}
      data-testid={testId}
    >
      <DialogTitle id={titleId}>
        {isEditing ? EDIT_TITLE : ADD_TITLE}
      </DialogTitle>
      <From>
        {FROM_PREFIX} {from}
      </From>
      <DialogContent>
        <Form>
          <FormRow label={TARGET_ROW_LABEL} labelId={`${baseId}-target`}>
            <Choice
              labelId={`${baseId}-target`}
              options={TARGET_OPTIONS}
              value={draft.targetKind}
              autoFocusIndex={0}
              onChange={(targetKind) => setDraft({ ...draft, targetKind })}
            />
            <Field>
              {draft.targetKind === "node" ? (
                <Autocomplete
                  options={options}
                  value={draft.file}
                  autoHighlight
                  noOptionsText={NO_FILE_TEXT}
                  popupIcon={<Icon name="chevron-down" />}
                  onChange={(_event, file) => setDraft({ ...draft, file })}
                  renderOption={({ key, ...optionProps }, path) => (
                    <li key={key} {...optionProps}>
                      <OptionPath>{path}</OptionPath>
                      <OptionElement>
                        {getFileOptionLabel(descriptions.get(path))}
                      </OptionElement>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label={FILE_FIELD_LABEL} />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label={MODULE_FIELD_LABEL}
                  value={draft.module}
                  onChange={(changeEvent) =>
                    setDraft({ ...draft, module: changeEvent.target.value })
                  }
                />
              )}
            </Field>
          </FormRow>
          <FormRow label={SYNTAX_ROW_LABEL} labelId={`${baseId}-syntax`}>
            <Choice
              labelId={`${baseId}-syntax`}
              options={SYNTAX_OPTIONS}
              value={draft.syntax}
              onChange={(syntax) => setDraft(changeSyntax(draft, syntax))}
            />
          </FormRow>
          {/* A syntax that holds one kind of statement has nothing to choose */}
          {importKinds.length > 1 ? (
            <FormRow label={KIND_ROW_LABEL} labelId={`${baseId}-kind`}>
              <Choice
                labelId={`${baseId}-kind`}
                options={IMPORT_KIND_OPTIONS.filter(({ value }) =>
                  importKinds.includes(value)
                )}
                value={draft.importKind}
                onChange={(importKind) => setDraft({ ...draft, importKind })}
              />
            </FormRow>
          ) : null}
          {specifierKinds.length > 0 ? (
            <FormRow label={IMPORTED_ROW_LABEL} labelId={`${baseId}-imported`}>
              <NamesEditor
                key={openings}
                specifiers={draft.specifiers}
                kinds={specifierKinds}
                onAdd={(specifier) =>
                  setDraft({
                    ...draft,
                    specifiers: [...draft.specifiers, specifier],
                  })
                }
                onPendingChange={setPending}
                onRemove={(index) =>
                  setDraft({
                    ...draft,
                    specifiers: draft.specifiers.filter(
                      (_specifier, position) => position !== index
                    ),
                  })
                }
              />
            </FormRow>
          ) : null}
          <FormRow label={PREVIEW_ROW_LABEL} labelId={`${baseId}-preview`}>
            <Preview>
              <Statement tokens={getPreviewTokens(withPending, from)} />
            </Preview>
            {refusal === undefined ? null : (
              <Refusal role="alert">{refusal}</Refusal>
            )}
          </FormRow>
        </Form>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={() => onCancel()}>
          {CANCEL_LABEL}
        </Button>
        <Button
          variant="contained"
          disabled={submittable === undefined}
          onClick={
            submittable === undefined ? undefined : () => onSubmit(submittable)
          }
        >
          {isEditing ? SAVE_LABEL : ADD_LABEL}
        </Button>
      </DialogActions>
    </PickerDialog>
  );
}
