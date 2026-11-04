import { fireEvent, render, screen as view } from "@testing-library/react";
import { useState } from "react";
import type { ReactNode } from "react";

import { FOCUS_RING } from "../../theme";
import { OWN_CLASS, getStyle } from "../../theme/__fixtures__/GetStyle";
import { renderInRoot } from "../../theme/__fixtures__/RenderInRoot";
import { Note } from "../common";
import type { ProblemItem } from "../state";

import { ProblemList } from "./ProblemList";
import type { ProblemsPanelProps } from "./Problems.types";
import { ProblemsPanel } from "./ProblemsPanel";

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
 * Renders a panel whose selected tab and collapsed state follow what the user asks for, as the workbench does.
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

      // Act
      const panel = view.getByRole("region", { name: "Problems" });

      // Assert
      expect(panel.textContent).toContain("Problems");
    });
  });

  describe("tabs", () => {
    it("should draw a tab for each tab it is given, in order", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const tabs = view.getAllByRole("tab");

      // Assert
      expect(tabs.map((tab) => tab.textContent)).toEqual([
        "Sketch2",
        "checkout/index.js1",
        "line 3",
      ]);
    });

    it("should draw as many tabs as it is given", () => {
      // Arrange
      const tabs = Array.from({ length: 8 }, (_unused, index) => ({
        id: `tab-${index}`,
        label: `Tab ${index}`,
      }));
      render(<ProblemsPanel {...createProps({ tabs, selected: "tab-0" })} />);

      // Act
      const drawn = view.getAllByRole("tab");

      // Assert
      expect(drawn).toHaveLength(8);
    });

    it("should name each tab by its label and its count", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const sketch = view.getByRole("tab", { name: "Sketch 2 problems" });
      const file = view.getByRole("tab", {
        name: "checkout/index.js 1 problem",
      });

      // Assert
      expect(sketch.textContent).toBe("Sketch2");
      expect(file.textContent).toBe("checkout/index.js1");
    });

    it("should draw the count in the tone of the tab", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", count: 3, tone: "warn" },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);

      // Act
      const badge = view.getByRole("img", { name: "3 problems" });

      // Assert
      expect(getComputedStyle(badge).color).toBe("var(--jsb-warn)");
    });

    it("should draw the count as bad when the tab has no tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", count: 3 },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);

      // Act
      const badge = view.getByRole("img", { name: "3 problems" });

      // Assert
      expect(getComputedStyle(badge).color).toBe("var(--jsb-bad)");
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

      // Act
      const badges = view.queryAllByRole("img");

      // Assert
      expect(badges).toHaveLength(0);
      expect(view.getByRole("tab").textContent).toBe("Sketch");
    });

    it("should draw the label of a mono tab in the small mono text, and leave the label of the others alone", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);

      // Act
      const mono = getComputedStyle(view.getByText("line 3"));
      const body = getComputedStyle(
        view.getByRole("tab", { name: "Sketch 2 problems" })
      );

      // Assert
      expect(mono.fontFamily).toBe("var(--jsb-font-mono)");
      expect(mono.fontSize).toBe("12px");
      expect(body.fontFamily).toBe("var(--jsb-font-body)");
      expect(body.fontSize).toBe("12.5px");
    });

    it("should leave the weight and the line height of a mono label to its tab", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);

      // Act
      const style = getComputedStyle(view.getByText("line 3"));

      // Assert
      expect(style.fontWeight).toBe("inherit");
      expect(style.lineHeight).toBe("inherit");
    });

    it("should draw the icon of a tab in its tone, hidden from assistive technology", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const icon = view
        .getByRole("tab", { name: "line 3" })
        .querySelector("svg");

      // Assert
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      expect(icon?.querySelector("path")?.getAttribute("d")).toBe(
        "M4 4l8 8M12 4l-8 8"
      );
      expect(getComputedStyle(icon?.parentElement as HTMLElement).color).toBe(
        "var(--jsb-bad)"
      );
    });

    it("should draw the icon in the warning color for the warn tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "line 3", label: "line 3", icon: "warn", tone: "warn" },
      ];
      render(<ProblemsPanel {...createProps({ tabs, selected: "line 3" })} />);

      // Act
      const icon = view.getByRole("tab").querySelector("svg");

      // Assert
      expect(getComputedStyle(icon?.parentElement as HTMLElement).color).toBe(
        "var(--jsb-warn)"
      );
    });

    it("should leave the icon in the color of the label when the tab has no tone", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "line 3", label: "line 3", icon: "check" },
      ];
      render(<ProblemsPanel {...createProps({ tabs, selected: "line 3" })} />);

      // Act
      const icon = view.getByRole("tab").querySelector("svg");

      // Assert
      expect(
        getComputedStyle(icon?.parentElement as HTMLElement).color
      ).not.toContain("var(--jsb-");
    });

    it("should draw the icon before the count", () => {
      // Arrange
      const tabs: PanelProps["tabs"] = [
        { id: "sketch", label: "Sketch", icon: "warn", count: 2, tone: "warn" },
      ];
      render(<ProblemsPanel {...createProps({ tabs })} />);

      // Act
      const items = Array.from(view.getByRole("tab").childNodes).map((node) =>
        node.nodeName.toLowerCase()
      );

      // Assert
      expect(items).toEqual(["#text", "span", "span"]);
      expect(view.getByRole("tab").lastElementChild?.getAttribute("role")).toBe(
        "img"
      );
    });
  });

  describe("selection", () => {
    it("should select the tab that `selected` names", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: FILE_ID })} />);

      // Act
      const tabs = view.getAllByRole("tab");

      // Assert
      expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual([
        "false",
        "true",
        "false",
      ]);
    });

    it("should follow `selected` when it changes", () => {
      // Arrange
      const { rerender } = render(<ProblemsPanel {...createProps()} />);

      // Act
      rerender(<ProblemsPanel {...createProps({ selected: LINE_ID })} />);

      // Assert
      expect(view.getByRole("tab", { selected: true }).textContent).toBe(
        "line 3"
      );
    });

    it("should call onSelect with the id of the tab that is pressed", () => {
      // Arrange
      const onSelect = jest.fn();
      render(<ProblemsPanel {...createProps({ onSelect })} />);

      // Act
      fireEvent.click(
        view.getByRole("tab", { name: "checkout/index.js 1 problem" })
      );

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

      // Act
      fireEvent.click(view.getByRole("tab", { name: "eslint.config.js" }));

      // Assert
      expect(received).toEqual(["node"]);
    });

    it("should not change the selected tab by itself", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      fireEvent.click(view.getByRole("tab", { name: "line 3" }));

      // Assert
      expect(view.getByRole("tab", { selected: true }).textContent).toBe(
        "Sketch2"
      );
    });

    it("should select the tab the user presses when the state follows onSelect", () => {
      // Arrange
      render(<Controlled {...createProps()} />);

      // Act
      fireEvent.click(view.getByRole("tab", { name: "line 3" }));

      // Assert
      expect(view.getByRole("tab", { selected: true }).textContent).toBe(
        "line 3"
      );
    });

    it("should name the tablist", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const tablist = view.getByRole("tablist", { name: "Problem lists" });

      // Assert
      expect(tablist.children.length).toBeGreaterThan(0);
    });
  });

  describe("tab panel", () => {
    it("should show the body of the selected tab in a tab panel", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const tabpanel = view.getByRole("tabpanel");

      // Assert
      expect(tabpanel.textContent).toBe("Body of the tab");
    });

    it("should label the tab panel with the selected tab", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: FILE_ID })} />);

      // Act
      const tabpanel = view.getByRole("tabpanel", {
        name: "checkout/index.js 1 problem",
      });

      // Assert
      expect(tabpanel.textContent).toBe("Body of the tab");
    });

    it("should label the tab panel with a tab whose id has spaces", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: LINE_ID })} />);

      // Act
      const tabpanel = view.getByRole("tabpanel", { name: "line 3" });

      // Assert
      expect(tabpanel.getAttribute("aria-labelledby")).toBe(
        view.getByRole("tab", { name: "line 3" }).id
      );
    });

    it("should give the elements of the tabs ids that are valid in aria-labelledby", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const ids = view.getAllByRole("tab").map((tab) => tab.id);

      // Assert
      expect(new Set(ids).size).toBe(3);
      expect(ids.every((id) => !/\s/.test(id))).toBe(true);
    });

    it("should be controlled by the selected tab only", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ selected: FILE_ID })} />);

      // Act
      const controls = view
        .getAllByRole("tab")
        .map((tab) => tab.getAttribute("aria-controls"));

      // Assert
      expect(controls[0]).toBeNull();
      expect(controls[1]).toBe(view.getByRole("tabpanel").id);
      expect(controls[2]).toBeNull();
    });

    it("should take the keyboard, as it scrolls and may hold nothing to focus", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const tabpanel = view.getByRole("tabpanel");

      // Assert
      expect(tabpanel.getAttribute("tabindex")).toBe("0");
    });

    it("should draw the focus ring inside the panel, where its scroll cannot clip it", () => {
      // Arrange
      renderInRoot(<ProblemsPanel {...createProps()} />);

      // Act
      const style = getStyle(
        view.getByRole("tabpanel"),
        `${OWN_CLASS}:focus-visible`
      );

      // Assert
      expect(style).toMatchObject({
        outline: FOCUS_RING,
        "outline-offset": "-2px",
      });
    });

    it("should hold the notes and the list that the workbench composes", () => {
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

      // Act
      fireEvent.click(
        view.getByRole("button", { name: /Invalid rule options/ })
      );

      // Assert
      expect(view.getByRole("note").textContent).toBe(
        "Dependencies are not evaluated."
      );
      expect(onOpen).toHaveBeenCalledWith({ kind: "config" });
    });
  });

  describe("collapse", () => {
    it("should offer to collapse the panel while it is expanded", () => {
      // Arrange
      render(<ProblemsPanel {...createProps()} />);

      // Act
      const button = view.getByRole("button", {
        name: "Collapse the problems",
      });

      // Assert
      expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true"
      );
    });

    it("should offer to expand the panel while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);

      // Act
      const button = view.queryByRole("button", {
        name: "Expand the problems",
      });

      // Assert
      expect(button).not.toBeNull();
      expect(
        view.queryByRole("button", { name: "Collapse the problems" })
      ).toBeNull();
    });

    it("should ask to collapse when the button is pressed while expanded", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      render(<ProblemsPanel {...createProps({ onCollapsedChange })} />);

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

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

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Expand the problems" })
      );

      // Assert
      expect(onCollapsedChange).toHaveBeenCalledTimes(1);
      expect(onCollapsedChange).toHaveBeenCalledWith(false);
    });

    it("should change its label when the state follows onCollapsedChange", () => {
      // Arrange
      render(<Controlled {...createProps()} />);

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

      // Assert
      expect(
        view
          .getByRole("button", { name: "Expand the problems" })
          .getAttribute("aria-label")
      ).toBe("Expand the problems");
      expect(view.queryByRole("tabpanel")).toBeNull();
    });

    it("should turn the chevron up when it is collapsed", () => {
      // Arrange
      const { rerender } = render(<ProblemsPanel {...createProps()} />);
      const getChevron = (): HTMLElement =>
        view.getByRole("button").querySelector("svg")
          ?.parentElement as HTMLElement;
      const expanded = getComputedStyle(getChevron()).transform;

      // Act
      rerender(<ProblemsPanel {...createProps({ collapsed: true })} />);
      const collapsed = getComputedStyle(getChevron()).transform;

      // Assert
      expect(expanded).toBe("");
      expect(collapsed).toBe("rotate(180deg)");
    });

    it("should show only the head while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);

      // Act
      const tabpanel = view.queryByRole("tabpanel");

      // Assert
      expect(tabpanel).toBeNull();
      expect(view.queryByText("Body of the tab")).toBeNull();
      expect(view.getAllByRole("tab")).toHaveLength(3);
    });

    it("should have no tab that controls a panel while it is collapsed", () => {
      // Arrange
      render(<ProblemsPanel {...createProps({ collapsed: true })} />);

      // Act
      const controls = view
        .getAllByRole("tab")
        .map((tab) => tab.getAttribute("aria-controls"));

      // Assert
      expect(controls).toEqual([null, null, null]);
    });

    it("should keep the tabs usable while it is collapsed", () => {
      // Arrange
      const onSelect = jest.fn();
      render(<ProblemsPanel {...createProps({ collapsed: true, onSelect })} />);

      // Act
      fireEvent.click(view.getByRole("tab", { name: "line 3" }));

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

      // Act
      fireEvent.click(view.getByRole("tab", { name: "Sketch 2 problems" }));

      // Assert
      expect(onCollapsedChange).toHaveBeenCalledWith(false);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should not ask to expand when the selected tab is pressed while it is open", () => {
      // Arrange
      const onCollapsedChange = jest.fn();
      render(<ProblemsPanel {...createProps({ onCollapsedChange })} />);

      // Act
      fireEvent.click(view.getByRole("tab", { name: "Sketch 2 problems" }));

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

      // Act
      fireEvent.click(view.getByRole("tab", { name: "line 3" }));

      // Assert
      expect(onCollapsedChange).not.toHaveBeenCalled();
    });
  });
});
