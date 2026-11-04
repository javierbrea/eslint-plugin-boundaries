import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import { useId } from "react";
import type { ReactNode } from "react";

import { CountBadge, PaneHead } from "../common";
import { Icon } from "../icons";

import type {
  ProblemTone,
  ProblemsPanelProps,
  ProblemsTab,
} from "./Problems.types";

/** The color of an icon in each tone. */
const TONE_COLORS: Readonly<Record<ProblemTone, string>> = {
  bad: "var(--jsb-bad)",
  warn: "var(--jsb-warn)",
};

const Panel = styled("section")({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

const MonoTab = styled(Tab, {
  shouldForwardProp: (prop) => prop !== "mono",
})<{ mono: boolean }>(({ mono }) =>
  mono ? { fontFamily: "var(--jsb-font-mono)", fontSize: 12 } : {}
);

const ToneIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone?: ProblemTone }>(({ tone }) => ({
  display: "inline-flex",
  color: tone === undefined ? undefined : TONE_COLORS[tone],
}));

// The chevron of the button points down to collapse the panel and up to expand it
const Chevron = styled("span", {
  shouldForwardProp: (prop) => prop !== "turned",
})<{ turned: boolean }>(({ turned }) => ({
  display: "inline-flex",
  transform: turned ? "rotate(180deg)" : undefined,
}));

const TabPanel = styled("div")({
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  padding: "6px 0 10px",
  // A note above a list sits 4 px from its first row, as in the mockup
  "& > [role='note'] + *": { marginTop: 4 },
  // The panel scrolls, so it takes the keyboard even when it holds nothing to focus
  "&:focus-visible": {
    outline: "2px solid var(--jsb-accent)",
    outlineOffset: -2,
  },
});

/**
 * Says how many problems a count is about.
 * @param count The count, a positive number.
 * @returns The count with its unit, such as `2 problems`.
 */
function getCountLabel(count: number): string {
  return `${count} ${count === 1 ? "problem" : "problems"}`;
}

/**
 * Builds the id of the element of a tab. The id of a tab can have spaces and slashes, such as a path, and an element id with a space breaks `aria-labelledby`, so it is encoded.
 * @param prefix The prefix that is unique to the panel.
 * @param tabId The id of the tab.
 * @returns A valid element id.
 */
function getTabElementId(prefix: string, tabId: string): string {
  return `${prefix}-${encodeURIComponent(tabId)}`;
}

/**
 * The content of a tab: its label, its icon and its count.
 * @param props TabLabel props.
 * @param props.tab The tab.
 * @returns The nodes inside the tab, laid out in a row by the theme of the tab.
 */
function TabLabel({ tab }: Readonly<{ tab: ProblemsTab }>): ReactNode {
  const { label, icon, tone, count = 0 } = tab;

  return (
    <>
      {label}
      {icon === undefined ? null : (
        <ToneIcon tone={tone}>
          <Icon name={icon} />
        </ToneIcon>
      )}
      {count > 0 ? (
        <CountBadge
          count={count}
          tone={tone ?? "bad"}
          label={getCountLabel(count)}
        />
      ) : null}
    </>
  );
}

/**
 * The bottom pane: a head with a strip of tabs and a button that collapses the panel, and the body of the selected tab. The tabs and the body come from the workbench, which knows what is in focus, so the panel handles any number of tabs and draws no problem by itself. Collapsed, only the head shows.
 * @param props ProblemsPanel props.
 * @param props.tabs The tabs, in order.
 * @param props.selected The id of the selected tab.
 * @param props.onSelect Called with the id of the tab the user selects.
 * @param props.collapsed Whether only the head shows.
 * @param props.onCollapsedChange Called with what the user asks for when they press the collapse button.
 * @param props.children The body of the selected tab.
 * @returns The panel, as tall as its container.
 */
export function ProblemsPanel({
  tabs,
  selected,
  onSelect,
  collapsed,
  onCollapsedChange,
  children,
}: Readonly<ProblemsPanelProps>): ReactNode {
  const prefix = useId();
  const collapseLabel = collapsed
    ? "Expand the problems"
    : "Collapse the problems";
  const panelId = `${prefix}-panel`;

  return (
    <Panel aria-label="Problems">
      <PaneHead
        label="Problems"
        end={
          <>
            <Tabs
              value={selected}
              variant="scrollable"
              scrollButtons={false}
              aria-label="Problem lists"
              onChange={(_event, id: string) => onSelect(id)}
            >
              {tabs.map((tab) => (
                <MonoTab
                  key={tab.id}
                  value={tab.id}
                  mono={tab.mono === true}
                  id={getTabElementId(prefix, tab.id)}
                  // `Tabs` reports a tab that is not the selected one, so pressing the selected tab of a collapsed panel is told apart here: it expands the panel
                  onClick={() => {
                    if (collapsed && tab.id === selected) {
                      onCollapsedChange(false);
                    }
                  }}
                  // Only the selected tab has a panel, and none while the panel is collapsed
                  aria-controls={
                    !collapsed && tab.id === selected ? panelId : undefined
                  }
                  label={<TabLabel tab={tab} />}
                />
              ))}
            </Tabs>
            <Tooltip title={collapseLabel}>
              <IconButton
                aria-label={collapseLabel}
                sx={{ marginLeft: "auto" }}
                onClick={() => onCollapsedChange(!collapsed)}
              >
                <Chevron turned={collapsed}>
                  <Icon name="collapse" size={16} />
                </Chevron>
              </IconButton>
            </Tooltip>
          </>
        }
      />
      {collapsed ? null : (
        <TabPanel
          role="tabpanel"
          id={panelId}
          aria-labelledby={getTabElementId(prefix, selected)}
          tabIndex={0}
        >
          {children}
        </TabPanel>
      )}
    </Panel>
  );
}
