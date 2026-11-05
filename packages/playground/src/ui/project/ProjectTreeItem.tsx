import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useTreeItemModel } from "@mui/x-tree-view/hooks";
import type { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import { TreeItemProvider } from "@mui/x-tree-view/TreeItemProvider";
import { useTreeItem } from "@mui/x-tree-view/useTreeItem";
import { createContext, useContext, useEffect, useId } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
} from "react";

import { FOCUS_RING, HOVER_BACKGROUND } from "@/theme";
import { CountBadge, formatCount } from "@/ui/common";
import type { Tone } from "@/ui/common";
import { Icon } from "@/ui/icons";
import type { ProblemCounts } from "@/ui/state";

import type { ProjectItem, ProjectTreeContextValue } from "./ProjectTree.types";
import { RenameField } from "./RenameField";

/** Props of {@link ProjectTreeItem}: the ones that the tree view gives each item, and the ref of its root element, which is a plain prop of a function component */
type ProjectTreeItemProps = TreeItemProps & {
  /** The ref of the root element of the item */
  ref?: Ref<HTMLLIElement>;
};

/** What the items of the tree need from the tree that renders them. It is provided by `ProjectTree` */
export const ProjectTreeContext = createContext<ProjectTreeContextValue | null>(
  null
);

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
  "&[data-bad]": { color: "var(--jsb-bad)" },
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

const Failure = styled("span")({
  display: "inline-flex",
  color: "var(--jsb-bad)",
});

const Group = styled("ul")({ margin: 0, padding: 0, listStyle: "none" });

/**
 * Gets what the badge of an item counts: the problems of the config, or the failing dependencies of a file or a folder. The config is red only when it has errors.
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
      tone: counts.configHasErrors ? "bad" : "warn",
      label: formatCount(counts.config, "problem", "problems"),
    };
  }

  const count = counts.byPath.get(item.id) ?? 0;

  return {
    count,
    tone: "bad",
    label: formatCount(count, "failing dependency", "failing dependencies"),
  };
}

/**
 * Tells whether the row of an item is drawn in the color of errors: a file with failing dependencies, or the config when it has errors. A folder never is, whatever its files do.
 * @param item The item.
 * @param isFailingFile Whether the item is a file with failing dependencies.
 * @param counts Problems per node.
 * @returns Whether the row is red.
 */
function isRowBad(
  item: ProjectItem,
  isFailingFile: boolean,
  counts: ProblemCounts
): boolean {
  return isFailingFile || (item.kind === "config" && counts.configHasErrors);
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
 * An item of the project tree: the chevron, the name, and at the end the row actions and the badge. It replaces the item of the tree view, which does not have room for them, and keeps its behavior: selection, expansion and keyboard navigation come from `useTreeItem`.
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
  // The tree provides it to everything it renders
  const context = useContext(ProjectTreeContext) as ProjectTreeContextValue;
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
  const isBad = isRowBad(item, isFailingFile, context.counts);

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
      >
        <Row
          {...getContentProps()}
          data-kind={item.kind}
          data-bad={isBad ? "" : undefined}
        >
          <Chevron aria-hidden>
            {itemStatus.expandable ? (
              <Icon
                name={itemStatus.expanded ? "chevron-down" : "chevron-right"}
                size={12}
              />
            ) : null}
          </Chevron>
          {item.kind === "config" ? <Glyph aria-hidden>{"{}"}</Glyph> : null}
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
                <Tooltip title="Rename">
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    aria-label={`Rename ${itemId}`}
                    onClick={(clickEvent) => {
                      // The row would take the click as a selection
                      clickEvent.stopPropagation();
                      context.onRename(itemId);
                    }}
                  >
                    <Icon name="edit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    aria-label={`Delete ${itemId}`}
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
            {isFailingFile ? (
              <Failure>
                <Icon name="cross" />
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
