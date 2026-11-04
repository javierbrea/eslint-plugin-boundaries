import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useTreeItemModel } from "@mui/x-tree-view/hooks";
import type { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import { TreeItemProvider } from "@mui/x-tree-view/TreeItemProvider";
import { useTreeItem } from "@mui/x-tree-view/useTreeItem";
import { createContext, forwardRef, useContext, useEffect, useId } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { CountBadge } from "../common";
import { Icon } from "../icons";
import type { ProblemCounts } from "../state/Focus.types";

import type { ProjectItem, ProjectTreeContextValue } from "./ProjectTree.types";
import { RenameField } from "./RenameField";

/** What the items of the tree need from the tree that renders them. It is provided by `ProjectTree` */
export const ProjectTreeContext = createContext<ProjectTreeContextValue | null>(
  null
);

/** Hover over a row: the soft accent, fainter than a selection */
const HOVER_BACKGROUND =
  "color-mix(in srgb, var(--jsb-accent-soft) 60%, transparent)";

const Root = styled("li")({
  margin: 0,
  padding: 0,
  listStyle: "none",
  outline: 0,
  // The keyboard ring is the row's, which is what the user sees as the item
  "&:focus-visible > div": {
    outline: "2px solid var(--jsb-accent)",
    outlineOffset: -2,
  },
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

const Row = styled("div")({
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
  font: "12.5px/26px var(--jsb-font-mono)",
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
});

const Chevron = styled("span")({
  display: "inline-flex",
  flex: "none",
  width: 12,
  color: "var(--jsb-faint)",
});

const Glyph = styled("span")({
  flex: "none",
  color: "var(--jsb-faint)",
  fontSize: 11,
});

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
 * Writes a count with its noun.
 * @param count The number.
 * @param singular The noun for one.
 * @param plural The noun for any other number.
 * @returns The count and its noun, such as `1 problem` or `2 problems`.
 */
function describeCount(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Gets what the badge of an item counts: the problems of the config, or the failing dependencies of a file or a folder. The config is red only when it has errors.
 * @param item The item.
 * @param counts Problems per node.
 * @returns The number to show, the tone of the badge and what the number counts, for assistive technology.
 */
function getBadge(
  item: ProjectItem,
  counts: ProblemCounts
): { count: number; tone: "bad" | "warn"; label: string } {
  if (item.kind === "config") {
    return {
      count: counts.config,
      tone: counts.configHasErrors ? "bad" : "warn",
      label: describeCount(counts.config, "problem", "problems"),
    };
  }

  const count = counts.byPath.get(item.id) ?? 0;

  return {
    count,
    tone: "bad",
    label: describeCount(count, "failing dependency", "failing dependencies"),
  };
}

/**
 * An item of the project tree: the chevron, the name, and at the end the row actions and the badge. It replaces the item of the tree view, which does not have room for them, and keeps its behavior: selection, expansion and keyboard navigation come from `useTreeItem`.
 * @param props The props that the tree view gives each item: its id, label, id attribute and children.
 * @param ref The ref of the root element of the item.
 * @returns The item.
 */
export const ProjectTreeItem = forwardRef<HTMLLIElement, TreeItemProps>(
  function ProjectTreeItem(props, ref) {
    const { id, itemId, label, disabled, children } = props;
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

    // The item that was renamed has another id, so it is a new item: it takes the keyboard focus when it mounts, which is when it is in the page
    useEffect(() => {
      if (focusRequest === itemId) {
        publicAPI.focusItem(null, itemId);
        onFocusDone();
      }
    }, [focusRequest, itemId, publicAPI, onFocusDone]);

    const canEdit = context.editable && item.kind !== "config";
    const isRenaming = context.renaming === itemId;
    const badge = getBadge(item, context.counts);
    const isFailingFile = item.kind === "file" && badge.count > 0;
    const isBad =
      isFailingFile ||
      (item.kind === "config" && context.counts.configHasErrors);

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
);
