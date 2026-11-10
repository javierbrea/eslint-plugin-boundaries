import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import { useId } from "react";
import type { ReactNode } from "react";

import { formatCount } from "@/shared/helpers/formatCount";
import { CountBadge } from "@/ui-kit/atoms/CountBadge";
import { Icon } from "@/ui-kit/atoms/Icon";
import { PaneHead } from "@/ui-kit/atoms/PaneHead";
import { DIMMED, FOCUS_RING, UNDIMMED } from "@/ui-kit/helpers/theme";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";

import {
  COLLAPSE_PROBLEMS_LABEL,
  EXPAND_PROBLEMS_LABEL,
  PROBLEMS_PANEL_LABEL,
  PROBLEMS_PANEL_TEST_ID,
  PROBLEM_LISTS_LABEL,
} from "./ProblemsPanel.constants";
import type {
  ProblemsPanelProps,
  ProblemsPanelTab,
} from "./ProblemsPanel.types";

const Panel = styled("section")({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

// The text of a path or a line, in the mono font; the weight and the line height are the ones of the tab around it
const MonoLabel = styled("span")(({ theme }) => ({
  ...theme.typography.monoSmall,
  fontWeight: "inherit",
  lineHeight: "inherit",
}));

const ToneIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "iconColor",
})<{ iconColor?: string }>(({ iconColor }) => ({
  display: "inline-flex",
  color: iconColor,
}));

// The chevron of the button points down to collapse the panel and up to expand it
const Chevron = styled("span", {
  shouldForwardProp: (prop) => prop !== "turned",
})<{ turned: boolean }>(({ turned }) => ({
  display: "inline-flex",
  transform: turned ? "rotate(180deg)" : undefined,
}));

// The rows of a tab fade while what they show is out of date, and the notice above them does not
const Rows = styled("div", {
  shouldForwardProp: (prop) => prop !== "dimmed",
})<{ dimmed: boolean }>(({ dimmed }) => (dimmed ? DIMMED : UNDIMMED));

const TabPanel = styled("div")({
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  padding: "6px 0 10px",
  // A note above a list sits 4 px from its first row, as in the mockup, and so do the rows under the notice
  "& > [role='note'] + *, & > * > [role='note'] + *": { marginTop: 4 },
  // The panel scrolls, so it takes the keyboard even when it holds nothing to focus
  "&:focus-visible": { outline: FOCUS_RING, outlineOffset: -2 },
});

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
 * Picks the color of the icon of a tab.
 * @param tab The tab.
 * @param tab.tone The tone of the count.
 * @param tab.iconTone The tone of the verdict that the tab gives its icon.
 * @returns The color of the verdict when the tab has one, else the color of its count, else `undefined`, which leaves the icon in the color of the label.
 */
function getIconColor({
  tone,
  iconTone,
}: ProblemsPanelTab): string | undefined {
  if (iconTone !== undefined) {
    return TONE_COLORS[iconTone];
  }
  return tone === undefined ? undefined : TONE_COLORS[tone];
}

/**
 * The content of a tab: its label, its icon and its count. The icon is in the tone of the verdict that the tab gives it, else in the tone of the count, else in the color of the label.
 * @param props TabLabel props.
 * @param props.tab The tab.
 * @returns The nodes inside the tab, laid out in a row by the theme of the tab.
 */
function TabLabel({ tab }: Readonly<{ tab: ProblemsPanelTab }>): ReactNode {
  const { label, icon, tone, count = 0, mono = false } = tab;

  return (
    <>
      {mono ? <MonoLabel>{label}</MonoLabel> : label}
      {icon === undefined ? null : (
        <ToneIcon iconColor={getIconColor(tab)}>
          <Icon name={icon} />
        </ToneIcon>
      )}
      {count > 0 ? (
        <CountBadge
          count={count}
          tone={tone ?? "bad"}
          label={formatCount(count, "problem", "problems")}
        />
      ) : null}
    </>
  );
}

/**
 * The bottom pane: a head with a strip of tabs and a button that collapses the panel, and the body of the selected tab. The tabs and the body come from the problems pane, which knows what is in focus, so the panel handles any number of tabs and draws no problem by itself. It is generic over the ids of its tabs, so that `onSelect` receives the ids the caller declared. Collapsed, only the head shows.
 * @param props ProblemsPanel props.
 * @param props.tabs The tabs, in order.
 * @param props.selected The id of the selected tab.
 * @param props.onSelect Called with the id of the tab the user selects.
 * @param props.collapsed Whether only the head shows.
 * @param props.onCollapsedChange Called with what the user asks for when they press the collapse button.
 * @param props.children The body of the selected tab.
 * @param props.notice What the body says above the rest, which never fades, such as that the evaluation stopped.
 * @param props.dimmed Whether the body under the notice is out of date, which fades it.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The panel, as tall as its container.
 */
export function ProblemsPanel<Id extends string>({
  tabs,
  selected,
  onSelect,
  collapsed,
  onCollapsedChange,
  children,
  notice,
  dimmed = false,
  testId = PROBLEMS_PANEL_TEST_ID,
}: Readonly<ProblemsPanelProps<Id>>): ReactNode {
  const prefix = useId();
  const collapseLabel = collapsed
    ? EXPAND_PROBLEMS_LABEL
    : COLLAPSE_PROBLEMS_LABEL;
  const panelId = `${prefix}-panel`;

  return (
    <Panel aria-label={PROBLEMS_PANEL_LABEL} data-testid={testId}>
      <PaneHead
        label={PROBLEMS_PANEL_LABEL}
        end={
          <>
            <Tabs
              value={selected}
              variant="scrollable"
              scrollButtons={false}
              aria-label={PROBLEM_LISTS_LABEL}
              // `Tabs` reports the value of one of the tabs, which are the ids given
              onChange={(_event, id: Id) => onSelect(id)}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
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
          {notice}
          <Rows dimmed={dimmed}>{children}</Rows>
        </TabPanel>
      )}
    </Panel>
  );
}
