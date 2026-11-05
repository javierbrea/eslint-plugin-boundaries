import { act, render, screen as view } from "@testing-library/react";
import type { ComponentProps, createElement, useImperativeHandle } from "react";
import type { Panel, PanelImperativeHandle } from "react-resizable-panels";

import { stubResizeObserver } from "@/shared/testing/resizeObserver";

import { Regions } from "./Regions";
import type { RegionsProps } from "./Regions.types";

/** What the library's panel receives: the sizes and the callbacks the regions give it */
type PanelProps = ComponentProps<typeof Panel>;

/** The props of every panel that rendered, in the order they rendered, to read the sizes the regions gave them and to call what they gave the library */
const mockRendered: PanelProps[] = [];

/** The handle that each panel gives its ref, by default size: one for the whole test, so that the calls the regions make on it can be read */
const mockHandles = new Map<PanelProps["defaultSize"], PanelImperativeHandle>();

/**
 * Creates the handle of a panel that remembers whether it is collapsed.
 * @param defaultSize The default size of the panel, which stands for it.
 * @returns A handle whose calls can be read.
 */
function mockGetHandle(
  defaultSize: PanelProps["defaultSize"]
): PanelImperativeHandle {
  let handle = mockHandles.get(defaultSize);

  if (!handle) {
    let collapsed = false;
    handle = {
      collapse: jest.fn(() => {
        collapsed = true;
      }),
      expand: jest.fn(() => {
        collapsed = false;
      }),
      isCollapsed: jest.fn(() => collapsed),
      getSize: jest.fn(() => ({ asPercentage: 0, inPixels: 0 })),
      resize: jest.fn(),
    };
    mockHandles.set(defaultSize, handle);
  }
  return handle;
}

// The real library for the groups and the separators. The panel is a stand-in that draws its children and gives its ref a handle that remembers its calls: a panel has no size in jsdom, so the library cannot tell what its imperative methods did
jest.mock<{ Panel: typeof Panel }>("react-resizable-panels", () => {
  const actual = jest.requireActual<{ Panel: typeof Panel }>(
    "react-resizable-panels"
  );
  const react = jest.requireActual<{
    createElement: typeof createElement;
    useImperativeHandle: typeof useImperativeHandle;
  }>("react");

  return {
    ...actual,
    Panel: Object.assign(
      (props: PanelProps) => {
        mockRendered.push(props);
        react.useImperativeHandle(props.panelRef, () =>
          mockGetHandle(props.defaultSize)
        );
        return react.createElement(
          "div",
          { "data-panel": true },
          props.children
        );
      },
      { displayName: "Panel" }
    ),
  };
});

/**
 * Creates the props of the regions, with a node for each region.
 * @param overrides What differs from regions with the project as a tree and the problems panel open.
 * @returns The props.
 */
function createProps(overrides: Partial<RegionsProps> = {}): RegionsProps {
  return {
    project: <p>The project</p>,
    node: <p>The node</p>,
    inspector: <p>The inspector</p>,
    problems: <p>The problems</p>,
    isTextMode: false,
    isProblemsCollapsed: false,
    onProblemsCollapsedChange: jest.fn(),
    ...overrides,
  };
}

/**
 * Finds the props of the latest render of the panel with a size.
 * @param defaultSize The default size of the panel, in pixels.
 * @returns The props.
 */
function getPanel(defaultSize: number): PanelProps {
  const found = mockRendered.filter(
    (props) => props.defaultSize === defaultSize
  );

  expect(found.length).toBeGreaterThan(0);

  return found[found.length - 1];
}

/**
 * Gets the imperative handle of the panel with a size, as the regions use it.
 * @param defaultSize The default size of the panel, in pixels.
 * @returns The handle that the panel gave the regions.
 */
function getHandle(defaultSize: number): jest.Mocked<PanelImperativeHandle> {
  return mockGetHandle(defaultSize) as jest.Mocked<PanelImperativeHandle>;
}

const PROJECT_WIDTH = 264;

const INSPECTOR_WIDTH = 320;

const PROBLEMS_HEIGHT = 212;

describe("Regions", () => {
  beforeEach(() => {
    mockRendered.length = 0;
    mockHandles.clear();
    stubResizeObserver();
  });

  describe("regions", () => {
    it("should draw the four regions", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(view.getByText("The project")).toBeTruthy();
      expect(view.getByText("The node")).toBeTruthy();
      expect(view.getByText("The inspector")).toBeTruthy();
      expect(view.getByText("The problems")).toBeTruthy();
    });

    it("should stack the problems under the row of the other regions", () => {
      // Arrange
      render(<Regions {...createProps()} />);

      // Act
      const [column, row] = Array.from(
        document.querySelectorAll("[data-group]")
      );

      // Assert
      expect((column as HTMLElement).style.flexDirection).toBe("column");
      expect((row as HTMLElement).style.flexDirection).toBe("row");
      expect(column.contains(view.getByText("The problems"))).toBe(true);
      expect(row.contains(view.getByText("The problems"))).toBe(false);
    });

    it("should draw the project, the node and the inspector side by side", () => {
      // Arrange
      render(<Regions {...createProps()} />);

      // Act
      const row = document.querySelectorAll("[data-group]")[1];

      // Assert
      expect(row.contains(view.getByText("The project"))).toBe(true);
      expect(row.contains(view.getByText("The node"))).toBe(true);
      expect(row.contains(view.getByText("The inspector"))).toBe(true);
    });
  });

  describe("sizes", () => {
    it("should start the project at 264 px, with 200 px as its least, and keep its width when the page is resized", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(getPanel(PROJECT_WIDTH)).toMatchObject({
        minSize: 200,
        groupResizeBehavior: "preserve-pixel-size",
      });
    });

    it("should start the inspector at 320 px, with 260 px as its least, and keep its width when the page is resized", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(getPanel(INSPECTOR_WIDTH)).toMatchObject({
        minSize: 260,
        groupResizeBehavior: "preserve-pixel-size",
      });
    });

    it("should give the node at least 360 px and the rest of the width", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      const node = mockRendered.find((props) => props.minSize === 360);

      expect(node).toBeTruthy();
      expect(node?.defaultSize).toBeUndefined();
      expect(node?.groupResizeBehavior).toBeUndefined();
    });

    it("should start the problems at 212 px, with 120 px as its least, collapsible to a 34 px head", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(getPanel(PROBLEMS_HEIGHT)).toMatchObject({
        minSize: 120,
        collapsible: true,
        collapsedSize: 34,
        groupResizeBehavior: "preserve-pixel-size",
      });
    });
  });

  describe("separators", () => {
    it("should draw a separator between the regions, named for what it resizes", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(
        view
          .getAllByRole("separator")
          .map((separator) => separator.getAttribute("aria-label"))
      ).toEqual([
        "Resize the project pane",
        "Resize the inspector",
        "Resize the problems panel",
      ]);
    });

    it("should orient the separators across the regions they resize", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(
        view
          .getAllByRole("separator")
          .map((separator) => separator.getAttribute("aria-orientation"))
      ).toEqual(["vertical", "vertical", "horizontal"]);
    });

    it("should let the keyboard reach the separators", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(
        view
          .getAllByRole("separator")
          .map((separator) => separator.getAttribute("tabindex"))
      ).toEqual(["0", "0", "0"]);
    });

    it("should draw a line of 1 px between the regions", () => {
      // Act
      render(<Regions {...createProps()} />);
      const [project, , problems] = view.getAllByRole("separator");

      // Assert
      expect(getComputedStyle(project).width).toBe("1px");
      expect(getComputedStyle(project).backgroundColor).toBe("var(--jsb-line)");
      expect(getComputedStyle(problems).height).toBe("1px");
    });
  });

  describe("text mode", () => {
    it("should leave the width of the project alone while the project is a tree", () => {
      // Arrange
      const { rerender } = render(<Regions {...createProps()} />);

      // Act
      rerender(<Regions {...createProps()} />);

      // Assert
      expect(getHandle(PROJECT_WIDTH).resize).not.toHaveBeenCalled();
    });

    it("should widen the project to 420 px while the text is shown", () => {
      // Arrange
      const { rerender } = render(<Regions {...createProps()} />);

      // Act
      rerender(<Regions {...createProps({ isTextMode: true })} />);

      // Assert
      expect(getHandle(PROJECT_WIDTH).resize).toHaveBeenCalledTimes(1);
      expect(getHandle(PROJECT_WIDTH).resize).toHaveBeenCalledWith(420);
    });

    it("should give the project the width it had before the text", () => {
      // Arrange
      const { rerender } = render(<Regions {...createProps()} />);
      const handle = getHandle(PROJECT_WIDTH);
      handle.getSize.mockReturnValue({ asPercentage: 18.3, inPixels: 264 });
      rerender(<Regions {...createProps({ isTextMode: true })} />);
      handle.resize.mockClear();

      // Act
      rerender(<Regions {...createProps({ isTextMode: false })} />);

      // Assert
      expect(handle.resize).toHaveBeenCalledTimes(1);
      expect(handle.resize).toHaveBeenCalledWith(264);
    });

    it("should give back the width the user chose before the text, not the default", () => {
      // Arrange
      const { rerender } = render(<Regions {...createProps()} />);
      const handle = getHandle(PROJECT_WIDTH);
      handle.getSize.mockReturnValue({ asPercentage: 25, inPixels: 360 });
      rerender(<Regions {...createProps({ isTextMode: true })} />);
      handle.resize.mockClear();

      // Act
      rerender(<Regions {...createProps({ isTextMode: false })} />);

      // Assert
      expect(handle.resize).toHaveBeenCalledWith(360);
    });

    it("should give back the width only once", () => {
      // Arrange
      const { rerender } = render(<Regions {...createProps()} />);
      const handle = getHandle(PROJECT_WIDTH);
      rerender(<Regions {...createProps({ isTextMode: true })} />);
      rerender(<Regions {...createProps({ isTextMode: false })} />);
      handle.resize.mockClear();

      // Act
      rerender(
        <Regions
          {...createProps({ isTextMode: false, project: <p>Another</p> })}
        />
      );

      // Assert
      expect(handle.resize).not.toHaveBeenCalled();
    });
  });

  describe("collapsing", () => {
    it("should leave the problems expanded while the workbench does not collapse them", () => {
      // Act
      render(<Regions {...createProps()} />);

      // Assert
      expect(getHandle(PROBLEMS_HEIGHT).collapse).not.toHaveBeenCalled();
      expect(getHandle(PROBLEMS_HEIGHT).expand).not.toHaveBeenCalled();
    });

    it("should collapse the problems when the workbench collapses them", () => {
      // Arrange
      const { rerender } = render(<Regions {...createProps()} />);

      // Act
      rerender(<Regions {...createProps({ isProblemsCollapsed: true })} />);

      // Assert
      expect(getHandle(PROBLEMS_HEIGHT).collapse).toHaveBeenCalledTimes(1);
      expect(getHandle(PROBLEMS_HEIGHT).isCollapsed()).toBe(true);
    });

    it("should collapse them from the start when the workbench starts with them collapsed", () => {
      // Act
      render(<Regions {...createProps({ isProblemsCollapsed: true })} />);

      // Assert
      expect(getHandle(PROBLEMS_HEIGHT).collapse).toHaveBeenCalledTimes(1);
    });

    it("should expand the problems when the workbench expands them", () => {
      // Arrange
      const { rerender } = render(
        <Regions {...createProps({ isProblemsCollapsed: true })} />
      );

      // Act
      rerender(<Regions {...createProps({ isProblemsCollapsed: false })} />);

      // Assert
      expect(getHandle(PROBLEMS_HEIGHT).expand).toHaveBeenCalledTimes(1);
      expect(getHandle(PROBLEMS_HEIGHT).isCollapsed()).toBe(false);
    });

    it("should not collapse a panel that is already collapsed", () => {
      // Arrange
      const { rerender } = render(
        <Regions {...createProps({ isProblemsCollapsed: true })} />
      );

      // Act
      rerender(
        <Regions
          {...createProps({ isProblemsCollapsed: true, node: <p>Another</p> })}
        />
      );

      // Assert
      expect(getHandle(PROBLEMS_HEIGHT).collapse).toHaveBeenCalledTimes(1);
    });

    it("should tell the workbench when the user collapses the panel with its separator", () => {
      // Arrange
      const onProblemsCollapsedChange = jest.fn();
      render(<Regions {...createProps({ onProblemsCollapsedChange })} />);
      act(() => getHandle(PROBLEMS_HEIGHT).collapse());

      // Act
      act(() =>
        getPanel(PROBLEMS_HEIGHT).onResize?.(
          { asPercentage: 4, inPixels: 34 },
          undefined,
          { asPercentage: 24, inPixels: 212 }
        )
      );

      // Assert
      expect(onProblemsCollapsedChange).toHaveBeenCalledWith(true);
    });

    it("should tell the workbench when the user expands the panel with its separator", () => {
      // Arrange
      const onProblemsCollapsedChange = jest.fn();
      render(
        <Regions
          {...createProps({
            isProblemsCollapsed: true,
            onProblemsCollapsedChange,
          })}
        />
      );
      act(() => getHandle(PROBLEMS_HEIGHT).expand());

      // Act
      act(() =>
        getPanel(PROBLEMS_HEIGHT).onResize?.(
          { asPercentage: 20, inPixels: 180 },
          undefined,
          { asPercentage: 4, inPixels: 34 }
        )
      );

      // Assert
      expect(onProblemsCollapsedChange).toHaveBeenCalledWith(false);
    });
  });
});
