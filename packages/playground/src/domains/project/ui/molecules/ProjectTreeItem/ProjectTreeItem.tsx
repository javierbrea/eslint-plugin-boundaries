import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useTreeItemModel } from "@mui/x-tree-view/hooks";
import { TreeItemProvider } from "@mui/x-tree-view/TreeItemProvider";
import { useTreeItem } from "@mui/x-tree-view/useTreeItem";
import { useEffect, useId } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import { getCountTone } from "@/domains/problems/ui/helpers/problemItems";
import { RenameField } from "@/domains/project/ui/atoms/RenameField";
import { useProjectTreeContext } from "@/domains/project/ui/contexts/ProjectTreeContext";
import type { ProjectItem } from "@/domains/project/ui/helpers/projectItems";
import { formatCount } from "@/shared/helpers/formatCount";
import { CountBadge } from "@/ui-kit/atoms/CountBadge";
import { Icon } from "@/ui-kit/atoms/Icon";
import type { IconName } from "@/ui-kit/atoms/Icon";
import {
  FOCUS_RING,
  HOVER_BACKGROUND,
  STATE_TEXT,
} from "@/ui-kit/helpers/theme";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { Tone } from "@/ui-kit/helpers/tone";

import {
  CONFIG_GLYPH,
  DELETE_ACTION_LABEL,
  PROJECT_TREE_ITEM_TEST_ID,
  RENAME_ACTION_LABEL,
} from "./ProjectTreeItem.constants";
import type { ProjectTreeItemProps } from "./ProjectTreeItem.types";

/** The mark of a file with failing dependencies: the cross of errors, or the triangle of the line of a warning. */
const FAILURE_ICONS: Readonly<Record<Tone, IconName>> = {
  bad: "cross",
  warn: "warn",
};

const Root = styled("li")({
  margin: 0,
  padding: 0,
  listStyle: "none",
  outline: 0,
  // The keyboard ring is the row's, which is what the user sees as the item
  "&:focus-visible > div": { outline: FOCUS_RING, outlineOffset: -2 },
  // The separator below the config node: 4 px under its row, 6 px above the tree, inset from the rows
  "&[data-kind='config']": {
    position: "relative",
    paddingBottom: 11,
    "&::after": {
      content: '""',
      position: "absolute",
      right: 6,
      bottom: 6,
      left: 6,
      height: 1,
      background: "var(--jsb-line)",
    },
  },
});

const Row = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  boxSizing: "border-box",
  width: "100%",
  height: 26,
  // 14 px per level: the root of the item sets the depth
  paddingLeft: "calc(6px + var(--TreeView-itemDepth) * 14px)",
  paddingRight: 6,
  borderRadius: 4,
  color: "var(--jsb-ink)",
  ...theme.typography.mono,
  // The height of the row, so that the name is centered
  lineHeight: "26px",
  whiteSpace: "nowrap",
  cursor: "default",
  "&:hover": { background: HOVER_BACKGROUND },
  "&[data-selected]": {
    background: "var(--jsb-accent-soft)",
    boxShadow: "inset 2px 0 0 var(--jsb-accent)",
  },
  "&[data-kind='folder']": { color: "var(--jsb-muted)" },
  "&[data-kind='config']": { color: "var(--jsb-accent)" },
  // The name is text, so it has the text color of errors; the icon and the badge at the end keep the token
  "&[data-bad]": { color: STATE_TEXT.bad },
  // What the dependency in focus points to: outlined inside the row, so that the neighbors do not cover it
  "&[data-target]": {
    outline: "1px dashed var(--jsb-accent)",
    outlineOffset: -1,
  },
  // The row actions show on hover and while the row has the focus
  "&:hover [data-actions], &[data-focused] [data-actions], &:focus-within [data-actions]":
    { maxWidth: 52, opacity: 1 },
}));

const Chevron = styled("span")({
  display: "inline-flex",
  flex: "none",
  width: 12,
  color: "var(--jsb-faint)",
});

// The size of a badge, in the weight and line height of the row
const Glyph = styled("span")(({ theme }) => ({
  flex: "none",
  color: "var(--jsb-faint)",
  ...theme.typography.monoTiny,
  fontWeight: "inherit",
  lineHeight: "inherit",
}));

// The row centers it, so it needs no line height of the row's
const TargetTag = styled("span")(({ theme }) => ({
  color: "var(--jsb-accent)",
  ...theme.typography.monoMicro,
}));

const Name = styled("span")({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const End = styled("span")({
  display: "inline-flex",
  flex: "none",
  alignItems: "center",
  gap: 4,
  marginLeft: "auto",
});

// Clipped, not removed, until the row is hovered or focused: the buttons stay in the accessibility tree and take no room
const Actions = styled("span")({
  display: "inline-flex",
  maxWidth: 0,
  overflow: "hidden",
  opacity: 0,
});

const Failure = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: Tone }>(({ tone }) => ({
  display: "inline-flex",
  color: TONE_COLORS[tone],
}));

const Group = styled("ul")({ margin: 0, padding: 0, listStyle: "none" });

/**
 * Writes the value of a data attribute that a row sets without a value, so that the styles select the rows that have it.
 * @param isSet Whether the row has the attribute.
 * @returns An empty value to set the attribute, or `undefined` to leave it out.
 */
function flag(isSet: boolean): "" | undefined {
  return isSet ? "" : undefined;
}

/**
 * Gets what the badge of an item counts: the problems of the config, or the failing dependencies of a file or a folder. The badge is red when the config has errors, or when any failing dependency it counts is an error, and in the color of warnings otherwise.
 * @param item The item.
 * @param counts Problems per node.
 * @returns The number to show, the tone of the badge and what the number counts, for assistive technology.
 */
function getBadge(
  item: ProjectItem,
  counts: ProblemCounts
): { count: number; tone: Tone; label: string } {
  if (item.kind === "config") {
    return {
      count: counts.config,
      tone: getCountTone(counts.configHasErrors),
      label: formatCount(counts.config, "problem", "problems"),
    };
  }

  const failing = counts.byPath.get(item.id);
  const count = failing?.count ?? 0;

  return {
    count,
    tone: getCountTone(failing?.hasErrors ?? false),
    label: formatCount(count, "failing dependency", "failing dependencies"),
  };
}

/**
 * Tells whether the row of an item is drawn in the color of errors: a file with failing dependencies, any of which is an error, or the config when it has errors. A file whose failures are all warnings is not, and a folder never is, whatever its files do.
 * @param item The item.
 * @param badge What the badge of the item counts.
 * @param badge.count
 * @param badge.tone
 * @param counts Problems per node.
 * @returns Whether the row is red.
 */
function isRowBad(
  item: ProjectItem,
  badge: { count: number; tone: Tone },
  counts: ProblemCounts
): boolean {
  return item.kind === "config"
    ? counts.configHasErrors
    : item.kind === "file" && badge.count > 0 && badge.tone === "bad";
}

/**
 * Gives the keyboard focus to an item when the tree asks for it. The item that was renamed has another id, so it is a new item: it asks when it mounts, which is when it is in the page. The focus is only taken when it is on the body, as Enter, Escape and a closed dialog leave it. Leaving the rename field with a click or Tab puts it where the user went, and that is not taken back.
 * @param itemId The id of the item.
 * @param focusRequest The id of the item that must take the keyboard focus, if any.
 * @param onFocusDone Called when the request is dealt with.
 * @param focusItem Focuses an item of the tree.
 */
function useFocusRequest(
  itemId: string,
  focusRequest: string | undefined,
  onFocusDone: () => void,
  focusItem: (event: null, id: string) => void
): void {
  useEffect(() => {
    if (focusRequest !== itemId) {
      return undefined;
    }

    // Leaving the field renames the node while the focus is still on the body: the browser puts it on its target when the handlers of the blur return. So the effect cannot tell that case from Enter, and looks one task later
    const timer = setTimeout(() => {
      const { activeElement } = document;

      if (activeElement === null || activeElement === document.body) {
        focusItem(null, itemId);
      }
      onFocusDone();
    }, 0);

    return () => clearTimeout(timer);
  }, [focusRequest, itemId, focusItem, onFocusDone]);
}

/**
 * An item of the project tree: the chevron, the name, and at the end the row actions and the badge. The item that the dependency in focus points to is outlined and tagged `target`. It replaces the item of the tree view, which does not have room for them, and keeps its behavior: selection, expansion and keyboard navigation come from `useTreeItem`.
 * @param props ProjectTreeItem props.
 * @param props.ref The ref of the root element of the item.
 * @param props.id The id attribute of the item.
 * @param props.itemId The id of the item: its path.
 * @param props.label What the row reads.
 * @param props.disabled Whether the item is disabled.
 * @param props.children The items inside a folder.
 * @returns The item.
 */
export function ProjectTreeItem({
  ref,
  id,
  itemId,
  label,
  disabled,
  children,
}: Readonly<ProjectTreeItemProps>): ReactNode {
  // The tree only renders the items of its own model
  const item = useTreeItemModel<ProjectItem>(itemId) as ProjectItem;
  const context = useProjectTreeContext();
  const nameId = useId();
  const {
    getContextProviderProps,
    getRootProps,
    getContentProps,
    status: itemStatus,
    publicAPI,
  } = useTreeItem({ id, itemId, label, disabled, children, rootRef: ref });
  const { focusRequest, onFocusDone } = context;

  useFocusRequest(itemId, focusRequest, onFocusDone, publicAPI.focusItem);

  const canEdit = context.editable && item.kind !== "config";
  const isRenaming = context.renaming === itemId;
  const badge = getBadge(item, context.counts);
  const isFailingFile = item.kind === "file" && badge.count > 0;
  const isBad = isRowBad(item, badge, context.counts);
  const isTarget = context.target === itemId;

  /**
   * Starts the rename with F2 and removes the node with Delete.
   * @param keyEvent The key press in the item.
   */
  function handleKeyDown(keyEvent: ReactKeyboardEvent<HTMLLIElement>): void {
    // Only the key presses on the item itself: its field, its buttons and the items inside it have their own
    if (!canEdit || keyEvent.target !== keyEvent.currentTarget) {
      return;
    }
    if (keyEvent.key === "F2") {
      keyEvent.preventDefault();
      context.onRename(itemId);
    } else if (keyEvent.key === "Delete") {
      keyEvent.preventDefault();
      context.onDelete(itemId);
    }
  }

  return (
    <TreeItemProvider {...getContextProviderProps()}>
      <Root
        {...getRootProps({
          // The name of the item is its own, not the one of everything inside it
          "aria-labelledby": nameId,
          // The keys that rename and remove the node are not written anywhere in the row
          "aria-keyshortcuts": canEdit ? "F2 Delete" : undefined,
          onKeyDown: handleKeyDown,
        })}
        data-kind={item.kind}
        data-testid={PROJECT_TREE_ITEM_TEST_ID}
      >
        <Row
          {...getContentProps()}
          data-kind={item.kind}
          data-bad={flag(isBad)}
          data-target={flag(isTarget)}
        >
          <Chevron aria-hidden>
            {itemStatus.expandable ? (
              <Icon
                name={itemStatus.expanded ? "chevron-down" : "chevron-right"}
                size={12}
              />
            ) : null}
          </Chevron>
          {item.kind === "config" ? (
            <Glyph aria-hidden>{CONFIG_GLYPH}</Glyph>
          ) : null}
          {isRenaming ? (
            <RenameField
              path={itemId}
              name={item.name}
              onCommit={context.onRenameCommit}
              onCancel={context.onRenameCancel}
            />
          ) : (
            <Name
              id={nameId}
              title={itemId}
              onDoubleClick={() => {
                if (canEdit) {
                  context.onRename(itemId);
                }
              }}
            >
              {label}
            </Name>
          )}
          <End>
            {canEdit && !isRenaming ? (
              <Actions data-actions="">
                <Tooltip title={RENAME_ACTION_LABEL}>
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    aria-label={`${RENAME_ACTION_LABEL} ${itemId}`}
                    onClick={(clickEvent) => {
                      // The row would take the click as a selection
                      clickEvent.stopPropagation();
                      context.onRename(itemId);
                    }}
                  >
                    <Icon name="edit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={DELETE_ACTION_LABEL}>
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    aria-label={`${DELETE_ACTION_LABEL} ${itemId}`}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      context.onDelete(itemId);
                    }}
                  >
                    <Icon name="trash" />
                  </IconButton>
                </Tooltip>
              </Actions>
            ) : null}
            {/* After the actions, which take a gap even while they are clipped: before them, the tag would be that gap away from the end of the row */}
            {isTarget ? <TargetTag data-target-tag="">target</TargetTag> : null}
            {isFailingFile ? (
              <Failure tone={badge.tone} data-failure="">
                <Icon name={FAILURE_ICONS[badge.tone]} />
              </Failure>
            ) : null}
            {badge.count > 0 ? (
              <CountBadge
                count={badge.count}
                tone={badge.tone}
                label={badge.label}
              />
            ) : null}
          </End>
        </Row>
        {itemStatus.expandable && itemStatus.expanded ? (
          <Group role="group">{children}</Group>
        ) : null}
      </Root>
    </TreeItemProvider>
  );
}
