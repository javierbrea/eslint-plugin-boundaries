import { render } from "@testing-library/react";
import { useState } from "react";
import type { ReactNode } from "react";

import type { ProblemItem } from "@/domains/problems/ui/helpers/problemItems";
import { ProblemList } from "@/domains/problems/ui/molecules/ProblemList";
import { ProblemListPom } from "@/domains/problems/ui/molecules/ProblemList/ProblemList.pom";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import { COUNT_BADGE_TEXT_COLORS } from "@/ui-kit/atoms/CountBadge/CountBadge.constants";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { FOCUS_RING } from "@/ui-kit/helpers/theme";
import { Note } from "@/ui-kit/molecules/Note";
import { NotePom } from "@/ui-kit/molecules/Note/Note.pom";

import { ProblemsPanel } from "./ProblemsPanel";
import { ProblemsPanelPom } from "./ProblemsPanel.pom";
import type { ProblemsPanelProps } from "./ProblemsPanel.types";

/** The ids of the tabs that the specs declare: free text, as a path or a line has spaces and slashes. */
type PanelProps = ProblemsPanelProps<string>;

const TABS: PanelProps["tabs"] = [
  { id: "sketch", label: "Project", count: 2, tone: "bad" },
  {
    id: "file:src/modules/checkout/index.js",
    label: "checkout/index.js",
    mono: true,
    count: 1,
    tone: "bad",
  },
  { id: "line 3", label: "line 3", mono: true, icon: "cross", tone: "bad" },
];

const SKETCH_ID = "sketch";

const FILE_ID = "file:src/modules/checkout/index.js";

const LINE_ID = "line 3";

/**
 * Creates the props of a panel with the tabs of the mockup and its first tab selected.
 * @param overrides The props that differ.
 * @returns The props.
 */
function createProps(overrides: Partial<PanelProps> = {}): PanelProps {
  return {
    tabs: TABS,
    selected: SKETCH_ID,
    onSelect: jest.fn(),
    collapsed: false,
    onCollapsedChange: jest.fn(),
    children: <p>Body of the tab</p>,
    ...overrides,
  };
}

/**
 * Renders a panel whose selected tab and collapsed state follow what the user asks for, as the shell does.
 * @param props The props of the panel; the ones that the state owns are the initial values.
 * @returns The panel.
 */
function Controlled(props: Readonly<PanelProps>): ReactNode {
  const [selected, setSelected] = useState(props.selected);
  const [collapsed, setCollapsed] = useState(props.collapsed);

  return (
    <ProblemsPanel
      {...props}
      selected={selected}
      onSelect={setSelected}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    />
  );
}

describe("ProblemsPanel", () => {
  beforeEach(() => {
    // React logs a prop that a styled part leaks to the DOM as an attribute it does not know, once for each name, so every test of the file watches for it
    jest.spyOn(console, "error").mockReturnValue(undefined);
  });

  afterEach(() => {
    const logged = [...jest.mocked(console.error).mock.calls];

    jest.mocked(console.error).mockRestore();

    if (logged.length > 0) {
      throw new Error(`React logged to the console: ${JSON.stringify(logged)}`);
    }
  });

  // React logs a leaked prop once for each name, so the test that looks for it runs before any other test of the file renders the component
  describe("props", () => {
    it("should not pass the dimmed state to the DOM", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ dimmed: true })} />);

      // Act
      const logged = jest.mocked(console.error).mock.calls;

      // Assert
      expect(logged).toEqual([]);
    });
  });

  describe("head", () => {
    it("should label the panel Problems", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const isNamedRegion = panel.isRegionNamed("Problems");
      const { label } = panel.head;

      // Assert
      expect(isNamedRegion).toBe(true);
      expect(label).toBe("Problems");
    });
  });

  describe("test id", () => {
    it("should take the test id it is given in place of its own", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} testId="problems-pane" />);
      const given = new ProblemsPanelPom({ testId: "problems-pane" });
      const own = new ProblemsPanelPom();

      // Act
      const { isRendered } = given;

      // Assert
      expect(isRendered).toBe(true);
      expect(own.isRendered).toBe(false);
    });
  });

  describe("tabs", () => {
    it("should draw a tab for each tab it is given, in order", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { tabTexts } = panel;

      // Assert
      expect(tabTexts).toEqual(["Project2", "checkout/index.js1", "line 3"]);
    });

    it("should draw as many tabs as it is given", () => {
      // Arrange
      const tabs = Array.from({ length: 8 }, (_unused, index) => ({
        id: `tab-${index}`,
        label: `Tab ${index}`,
      }));
      render(<ProblemsPanel {...createProps({ tabs, selected: "tab-0" })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { tabs: drawn } = panel;

      // Assert
      expect(drawn).toHaveLength(8);
    });

    it("should name each tab by its label and its count", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const sketch = panel.tab("Project 2 problems");
      const file = panel.tab("checkout/index.js 1 problem");

      // Assert
      expect(sketch.text).toBe("Project2");
      expect(file.text).toBe("checkout/index.js1");
    });

    it("should draw the count in the tone of the tab", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Project", count: 3, tone: "warn" },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { color } = panel.tab("Project 3 problems").badge;

      // Assert
      expect(color).toBe(COUNT_BADGE_TEXT_COLORS.warn);
    });

    it("should draw the count as bad when the tab has no tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Project", count: 3 },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { color } = panel.tab("Project 3 problems").badge;

      // Assert
      expect(color).toBe(COUNT_BADGE_TEXT_COLORS.bad);
    });

    it.each([
      ["has no count", undefined],
      ["has a count of 0", 0],
    ])("should draw no badge when a tab %s", (_case, count) => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Project", count, tone: "bad" },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const [tab] = panel.tabs;

      // Assert
      expect(tab.hasBadge).toBe(false);
      expect(tab.text).toBe("Project");
    });

    it("should draw the label of a mono tab in the small mono text, and leave the label of the others alone", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const mono = panel.tab("line 3").labelStyle;
      const body = panel.tab("Project 2 problems").labelStyle;

      // Assert
      expect(mono.fontFamily).toBe("var(--jsb-font-mono)");
      expect(mono.fontSize).toBe("12px");
      expect(body.fontFamily).toBe("var(--jsb-font-body)");
      expect(body.fontSize).toBe("12.5px");
    });

    it("should leave the weight and the line height of a mono label to its tab", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { fontWeight, lineHeight } = panel.tab("line 3").labelStyle;

      // Assert
      expect(fontWeight).toBe("inherit");
      expect(lineHeight).toBe("inherit");
    });

    it("should draw the icon of a tab in its tone, hidden from assistive technology", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { icon } = panel.tab("line 3");

      // Assert
      expect(icon.isHidden).toBe(true);
      expect(icon.pathData).toBe(ICON_PATHS.cross);
      expect(icon.wrapperStyle.color).toBe("var(--jsb-bad)");
    });

    it("should draw the icon in the warning color for the warn tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "line 3", label: "line 3", icon: "warn", tone: "warn" },
      ];
      render(<ProblemsPanel {...createProps({ tabs, selected: "line 3" })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { icon } = panel.tab("line 3");

      // Assert
      expect(icon.wrapperStyle.color).toBe("var(--jsb-warn)");
    });

    it("should leave the icon in the color of the label when the tab has no tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "line 3", label: "line 3", icon: "check" },
      ];
      render(<ProblemsPanel {...createProps({ tabs, selected: "line 3" })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { icon } = panel.tab("line 3");

      // Assert
      expect(icon.wrapperStyle.color).not.toContain("var(--jsb-");
    });

    it.each<
      [
        "ok" | "bad" | "warn" | "faint",
        "check" | "cross" | "warn" | "skip",
        string,
      ]
    >([
      ["ok", "check", "var(--jsb-ok)"],
      ["bad", "cross", "var(--jsb-bad)"],
      ["warn", "warn", "var(--jsb-warn)"],
      ["faint", "skip", "var(--jsb-faint)"],
    ])(
      "should draw the icon of a verdict with the tone %s in the color of the verdict",
      (iconTone, icon, color) => {
        // Arrange
        const tabs: PanelProps["tabs"] = [
          { id: "line 3", label: "line 3", icon, iconTone },
        ];
        render(
          <ProblemsPanel {...createProps({ tabs, selected: "line 3" })} />
        );
        const panel = new ProblemsPanelPom();

        // Act
        const { icon: drawn } = panel.tab("line 3");

        // Assert
        expect(drawn.wrapperStyle.color).toBe(color);
      }
    );

    it("should prefer the tone of the verdict to the tone of the count for the icon, and keep the count in its tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        {
          id: "line 3",
          label: "line 3",
          icon: "check",
          iconTone: "ok",
          count: 2,
          tone: "bad",
        },
      ];
      render(<ProblemsPanel {...createProps({ tabs, selected: "line 3" })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const tab = panel.tab(/line 3/);

      // Assert
      expect(tab.icon.wrapperStyle.color).toBe("var(--jsb-ok)");
      expect(tab.badge.isRendered).toBe(true);
    });

    it("should draw the icon before the count", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        {
          id: "sketch",
          label: "Project",
          icon: "warn",
          count: 2,
          tone: "warn",
        },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { partsAfterLabel } = panel.tabs[0];

      // Assert
      expect(partsAfterLabel).toEqual(["icon", "count"]);
    });
  });

  describe("selection", () => {
    it("should select the tab that `selected` names", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: FILE_ID })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const selection = panel.tabs.map((tab) => tab.isSelected);

      // Assert
      expect(selection).toEqual([false, true, false]);
    });

    it("should follow `selected` when it changes", () => {
      // Arrange
      const { rerender } = render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      rerender(<ProblemsPanel {...createProps({ selected: LINE_ID })} />);

      // Assert
      expect(panel.selectedTabText).toBe("line 3");
    });

    it("should call onSelect with the id of the tab that is pressed", () => {
      // Arrange
      const onSelect = jest.fn();
      render(<ProblemsPanel {...createProps({ onSelect })} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("checkout/index.js 1 problem").select();

      // Assert
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(FILE_ID);
    });

    it("should give onSelect the ids that the caller declared, not plain text", () => {
      // Arrange
      type StoreTabId = "sketch" | "node";
      const received: StoreTabId[] = [];
      render(
        <ProblemsPanel<StoreTabId>
          tabs={[
            { id: "sketch", label: "Project" },
            { id: "node", label: "eslint.config.js", mono: true },
          ]}
          selected="sketch"
          onSelect={(id) => received.push(id)}
          collapsed={false}
          onCollapsedChange={jest.fn()}
        >
          <p>Body of the tab</p>
        </ProblemsPanel>
      );
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("eslint.config.js").select();

      // Assert
      expect(received).toEqual(["node"]);
    });

    it("should not change the selected tab by itself", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("line 3").select();

      // Assert
      expect(panel.selectedTabText).toBe("Project2");
    });

    it("should select the tab the user presses when the state follows onSelect", () => {
      // Arrange
      render(<Controlled {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("line 3").select();

      // Assert
      expect(panel.selectedTabText).toBe("line 3");
    });

    it("should name the tablist", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { tablistName, tablistTabCount } = panel;

      // Assert
      expect(tablistName).toBe("Problem lists");
      expect(tablistTabCount).toBe(TABS.length);
    });
  });

  describe("tab panel", () => {
    it("should show the body of the selected tab in a tab panel", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { text } = panel.tabPanel();

      // Assert
      expect(text).toBe("Body of the tab");
    });

    it("should label the tab panel with the selected tab", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: FILE_ID })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { text } = panel.tabPanel("checkout/index.js 1 problem");

      // Assert
      expect(text).toBe("Body of the tab");
    });

    it("should label the tab panel with a tab whose id has spaces", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: LINE_ID })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { isRendered } = panel.tabPanel("line 3");

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should give the elements of the tabs ids that are valid in aria-labelledby", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const ids = panel.tabs.map((tab) => tab.elementId);

      // Assert
      expect(new Set(ids).size).toBe(3);
      expect(ids.every((id) => !/\s/.test(id))).toBe(true);
    });

    it("should be controlled by the selected tab only", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: FILE_ID })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const controls = panel.tabs.map((tab) => tab.controls);

      // Assert
      expect(controls).toEqual([null, panel.tabPanel().elementId, null]);
    });

    it("should take the keyboard, as it scrolls and may hold nothing to focus", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { tabIndex } = panel.tabPanel();

      // Assert
      expect(tabIndex).toBe("0");
    });

    it("should draw the focus ring inside the panel, where its scroll cannot clip it", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { focusStyle } = panel.tabPanel();

      // Assert
      expect(focusStyle).toMatchObject({
        outline: FOCUS_RING,
        "outline-offset": "-2px",
      });
    });

    it("should hold the notes and the list that the pane composes", () => {
      // Arrange
      const items: ProblemItem[] = [
        {
          key: "config:0",
          level: "error",
          location: "eslint.config.js",
          position: ":15:16",
          message: "Invalid rule options.",
          meta: "error · rules",
          target: { kind: "config" },
        },
      ];
      const onOpen = jest.fn();
      render(
        <ProblemsPanel {...createProps()}>
          <Note>Dependencies are not evaluated.</Note>
          <ProblemList items={items} onOpen={onOpen} empty="No problems." />
        </ProblemsPanel>
      );
      const note = new NotePom();
      const list = new ProblemListPom();

      // Act
      list.row("Invalid rule options").press();

      // Assert
      expect(note.text).toBe("Dependencies are not evaluated.");
      expect(onOpen).toHaveBeenCalledWith({ kind: "config" });
    });
  });

  describe("notice", () => {
    it("should draw what the pane says above the body, and not inside it", () => {
      // Arrange
      render(
        <ProblemsPanel
          {...createProps({
            notice: <Note>The evaluation was stopped.</Note>,
          })}
        />
      );
      const panel = new ProblemsPanelPom();

      // Act
      const { noticeTexts, bodyText } = panel.tabPanel();

      // Assert
      expect(noticeTexts).toEqual(["The evaluation was stopped."]);
      expect(bodyText).toBe("Body of the tab");
    });

    it("should draw nothing above the body without a notice", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { noticeTexts } = panel.tabPanel();

      // Assert
      expect(noticeTexts).toEqual([]);
    });

    it("should not fade the notice while the body is faded", () => {
      // Arrange
      render(
        <ProblemsPanel
          {...createProps({
            notice: <Note>The evaluation was stopped.</Note>,
            dimmed: true,
          })}
        />
      );
      const panel = new ProblemsPanelPom();

      // Act
      const { noticeOpacities, bodyOpacity } = panel.tabPanel();

      // Assert
      expect(noticeOpacities).toEqual([1]);
      expect(bodyOpacity).toBe(0.5);
    });

    it("should not draw it while the panel is collapsed", () => {
      // Arrange
      render(
        <ProblemsPanel
          {...createProps({
            collapsed: true,
            notice: <Note>The evaluation was stopped.</Note>,
          })}
        />
      );
      const panel = new ProblemsPanelPom();

      // Act
      const { isRendered } = new NotePom();

      // Assert
      expect(isRendered).toBe(false);
      expect(panel.tabPanel().isRendered).toBe(false);
    });
  });

  describe("dimmed", () => {
    it("should show the body in full when it is not told that it is out of date", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { bodyOpacity } = panel.tabPanel();

      // Assert
      expect(bodyOpacity).toBe(1);
    });

    it("should fade the body while it is out of date, and show it in full when it is up to date again", () => {
      // Arrange
      const { rerender } = render(
        <ProblemsPanel {...createProps({ dimmed: true })} />
      );
      const panel = new ProblemsPanelPom();
      const whileOutOfDate = panel.tabPanel().bodyOpacity;

      // Act
      rerender(<ProblemsPanel {...createProps({ dimmed: false })} />);

      // Assert
      expect(whileOutOfDate).toBe(0.5);
      expect(panel.tabPanel().bodyOpacity).toBe(1);
    });

    it("should keep the tabs and the head in full while the body is faded", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ dimmed: true })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { tabs } = panel;

      // Assert
      expect(tabs.map((tab) => tab.opacity)).toEqual([1, 1, 1]);
    });
  });

  describe("collapse", () => {
    it("should offer to collapse the panel while it is expanded", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { toggleNames } = panel;

      // Assert
      expect(toggleNames).toEqual(["Collapse the problems"]);
      expect(panel.toggle.icon.isHidden).toBe(true);
    });

    it("should offer to expand the panel while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { toggleNames } = panel;

      // Assert
      expect(toggleNames).toEqual(["Expand the problems"]);
    });

    it("should ask to collapse when the button is pressed while expanded", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      render(<ProblemsPanel {...createProps({ onCollapsedChange })} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.toggle.press();

      // Assert
      expect(onCollapsedChange).toHaveBeenCalledTimes(1);
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });

    it("should ask to expand when the button is pressed while collapsed", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      render(
        <ProblemsPanel
          {...createProps({ collapsed: true, onCollapsedChange })}
        />
      );
      const panel = new ProblemsPanelPom();

      // Act
      panel.toggle.press();

      // Assert
      expect(onCollapsedChange).toHaveBeenCalledTimes(1);
      expect(onCollapsedChange).toHaveBeenCalledWith(false);
    });

    it("should change its label when the state follows onCollapsedChange", () => {
      // Arrange
      render(<Controlled {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.toggle.press();

      // Assert
      expect(panel.toggle.isButtonNamed("Expand the problems")).toBe(true);
      expect(panel.tabPanel().isRendered).toBe(false);
    });

    it("should turn the chevron up when it is collapsed", () => {
      // Arrange
      const { rerender } = render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();
      const expanded = panel.toggle.icon.wrapperStyle.transform;

      // Act
      rerender(<ProblemsPanel {...createProps({ collapsed: true })} />);
      const collapsed = panel.toggle.icon.wrapperStyle.transform;

      // Assert
      expect(expanded).toBe("");
      expect(collapsed).toBe("rotate(180deg)");
    });

    it("should show only the head while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { isRendered } = panel.tabPanel();

      // Assert
      expect(isRendered).toBe(false);
      expect(panel.holds("Body of the tab")).toBe(false);
      expect(panel.tabs).toHaveLength(3);
    });

    it("should have no tab that controls a panel while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const controls = panel.tabs.map((tab) => tab.controls);

      // Assert
      expect(controls).toEqual([null, null, null]);
    });

    it("should keep the tabs usable while it is collapsed", () => {
      // Arrange
      const onSelect = jest.fn();
      render(<ProblemsPanel {...createProps({ collapsed: true, onSelect })} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("line 3").select();

      // Assert
      expect(onSelect).toHaveBeenCalledWith(LINE_ID);
    });

    it("should ask to expand when the selected tab is pressed while it is collapsed", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      const onSelect = jest.fn();
      render(
        <ProblemsPanel
          {...createProps({ collapsed: true, onCollapsedChange, onSelect })}
        />
      );
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("Project 2 problems").select();

      // Assert
      expect(onCollapsedChange).toHaveBeenCalledWith(false);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should not ask to expand when the selected tab is pressed while it is open", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      render(<ProblemsPanel {...createProps({ onCollapsedChange })} />);
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("Project 2 problems").select();

      // Assert
      expect(onCollapsedChange).not.toHaveBeenCalled();
    });

    it("should leave the collapsing to the selection when another tab is pressed while it is collapsed", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      render(
        <ProblemsPanel
          {...createProps({ collapsed: true, onCollapsedChange })}
        />
      );
      const panel = new ProblemsPanelPom();

      // Act
      panel.tab("line 3").select();

      // Assert
      expect(onCollapsedChange).not.toHaveBeenCalled();
    });
  });
});
