import { render } from "@testing-library/react";
import { useState } from "react";
import type { ReactNode } from "react";

import type { ProblemItem } from "@/domains/problems/ui/helpers/problemItems";
import { ProblemList } from "@/domains/problems/ui/molecules/ProblemList";
import { ProblemListPom } from "@/domains/problems/ui/molecules/ProblemList/ProblemList.pom";
import { renderInRoot } from "@/shared/testing/renderInRoot";
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
  { id: "sketch", label: "Sketch", count: 2, tone: "bad" },
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
  describe("head", () => {
    it("should label the panel Problems", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { isLandmark } = panel;
      const { label } = panel.head;

      // Assert
      expect(isLandmark).toBe(true);
      expect(label).toBe("Problems");
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
      expect(tabTexts).toEqual(["Sketch2", "checkout/index.js1", "line 3"]);
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
      const sketch = panel.tab("Sketch 2 problems");
      const file = panel.tab("checkout/index.js 1 problem");

      // Assert
      expect(sketch.text).toBe("Sketch2");
      expect(file.text).toBe("checkout/index.js1");
    });

    it("should draw the count in the tone of the tab", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", count: 3, tone: "warn" },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { color } = panel.tab("Sketch 3 problems").badge;

      // Assert
      expect(color).toBe("var(--jsb-warn)");
    });

    it("should draw the count as bad when the tab has no tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", count: 3 },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { color } = panel.tab("Sketch 3 problems").badge;

      // Assert
      expect(color).toBe("var(--jsb-bad)");
    });

    it.each([
      ["has no count", undefined],
      ["has a count of 0", 0],
    ])("should draw no badge when a tab %s", (_case, count) => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", count, tone: "bad" },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const [tab] = panel.tabs;

      // Assert
      expect(tab.hasBadge).toBe(false);
      expect(tab.text).toBe("Sketch");
    });

    it("should draw the label of a mono tab in the small mono text, and leave the label of the others alone", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const mono = panel.tab("line 3").labelStyle;
      const body = panel.tab("Sketch 2 problems").labelStyle;

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

    it("should draw the icon before the count", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", icon: "warn", count: 2, tone: "warn" },
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
            { id: "sketch", label: "Sketch" },
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
      expect(panel.selectedTabText).toBe("Sketch2");
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
      const { tablistLabel } = panel;

      // Assert
      expect(tablistLabel).toBe("Problem lists");
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
      const { labelledBy } = panel.tabPanel("line 3");

      // Assert
      expect(labelledBy).toBe(panel.tab("line 3").elementId);
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

  describe("collapse", () => {
    it("should offer to collapse the panel while it is expanded", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { toggleLabels } = panel;

      // Assert
      expect(toggleLabels).toEqual(["Collapse the problems"]);
      expect(panel.toggle.icon.isHidden).toBe(true);
    });

    it("should offer to expand the panel while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);
      const panel = new ProblemsPanelPom();

      // Act
      const { toggleLabels } = panel;

      // Assert
      expect(toggleLabels).toEqual(["Expand the problems"]);
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
      expect(panel.toggle.label).toBe("Expand the problems");
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
      panel.tab("Sketch 2 problems").select();

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
      panel.tab("Sketch 2 problems").select();

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
