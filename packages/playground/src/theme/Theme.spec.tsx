import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { fireEvent, render, screen as view } from "@testing-library/react";
import type { ReactNode } from "react";

import { Root } from "./Root";
import { CACHE_KEY, ROOT_CLASS, createPlaygroundTheme } from "./Theme";

/** The placeholder of the element's own class in the selector passed to {@link getStyle}. */
const OWN_CLASS = "{class}";

/**
 * Collects what the CSS rules of the playground declare for an element: its own Emotion class, or a selector built around it.
 * @param element The element that carries the class.
 * @param selector The selector to read, with {@link OWN_CLASS} where the class goes. It is the class alone by default.
 * @returns The declarations of the rules with that selector in the order they were inserted, so the last one of each property is the one that wins.
 */
function getStyle(
  element: Element,
  selector: string = OWN_CLASS
): Record<string, string> {
  const selectors = Array.from(element.classList)
    .filter(
      (className) =>
        className.startsWith(`${CACHE_KEY}-`) && className !== ROOT_CLASS
    )
    .map((className) => selector.replace(OWN_CLASS, `.${className}`));
  const declarations: Record<string, string> = {};

  document.head
    .querySelectorAll<HTMLStyleElement>(`style[data-emotion^="${CACHE_KEY}"]`)
    .forEach((style) => {
      Array.from(style.sheet?.cssRules ?? []).forEach((rule) => {
        if (
          rule instanceof CSSStyleRule &&
          selectors.includes(rule.selectorText)
        ) {
          Array.from(rule.style).forEach((property) => {
            declarations[property] = rule.style.getPropertyValue(property);
          });
        }
      });
    });

  return declarations;
}

/**
 * Renders content inside the root element of the playground, which is where its theme applies.
 * @param children The content.
 * @returns The root element.
 */
function renderInRoot(children: ReactNode): HTMLElement {
  const { container } = render(<Root>{children}</Root>);
  return container.querySelector(`.${ROOT_CLASS}`) as HTMLElement;
}

describe("createPlaygroundTheme", () => {
  describe("typography", () => {
    it("should set a 13 px body and buttons of 12.5 px, 600 weight and no text transform", () => {
      // Arrange
      const theme = createPlaygroundTheme(() => null);

      // Assert
      expect(theme.typography.body1.fontSize).toBe("13px");
      expect(theme.typography.button).toMatchObject({
        fontSize: "12.5px",
        fontWeight: 600,
        textTransform: "none",
      });
    });

    it("should keep the display font of the headings", () => {
      // Arrange
      const theme = createPlaygroundTheme(() => null);

      // Assert
      expect(theme.typography.h2.fontFamily).toBe("var(--jsb-font-display)");
    });
  });

  describe("overlays", () => {
    it("should render them in the element that getContainer returns", () => {
      // Arrange
      const container = document.createElement("div");
      const theme = createPlaygroundTheme(() => container);

      // Assert
      expect(
        theme.components?.MuiModal?.defaultProps?.container
      ).toBeInstanceOf(Function);
      expect(
        (
          theme.components?.MuiPopper?.defaultProps as {
            container: () => HTMLElement | null;
          }
        ).container()
      ).toBe(container);
    });
  });

  describe("generateStyleSheets", () => {
    it("should declare every variable on the root element, never on :root", () => {
      // Arrange
      const theme = createPlaygroundTheme(() => null);

      // Act
      const sheets = theme.generateStyleSheets();

      // Assert
      expect(sheets.some((sheet) => ":root" in sheet)).toBe(false);
      expect(sheets.some((sheet) => `.${ROOT_CLASS}` in sheet)).toBe(true);
    });
  });
});

describe("the widgets of MUI", () => {
  describe("button", () => {
    it("should be outlined with the strong line, 30 px tall and 12 px of padding", () => {
      // Arrange
      renderInRoot(<Button variant="outlined">Example</Button>);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style).toMatchObject({
        height: "30px",
        padding: "0 12px",
        "min-width": "0",
        border: "1px solid transparent",
        "border-color": "var(--jsb-line-strong)",
        color: "var(--jsb-ink)",
        "font-size": "12.5px",
        "font-weight": "600",
        "text-transform": "none",
      });
    });

    it("should have the radius of the playground", () => {
      // Arrange
      renderInRoot(<Button variant="outlined">Example</Button>);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style["border-radius"]).toBe("var(--jsb-radius)");
    });

    it("should be contained in the accent, without elevation", () => {
      // Arrange
      renderInRoot(<Button variant="contained">Share</Button>);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style).toMatchObject({
        "background-color": "var(--variant-containedBg)",
        color: "var(--variant-containedColor)",
        "box-shadow": "none",
      });
    });

    it("should be a text button in the muted color", () => {
      // Arrange
      renderInRoot(<Button variant="text">Reset</Button>);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style.color).toBe("var(--jsb-muted)");
    });

    it("should be 26 px tall in the small size", () => {
      // Arrange
      renderInRoot(
        <Button variant="text" size="small">
          File
        </Button>
      );

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style).toMatchObject({
        height: "26px",
        padding: "0 8px",
        "font-size": "12px",
      });
    });

    it("should draw an icon next to its label with a gap and no margins", () => {
      // Arrange
      renderInRoot(
        <Button startIcon={<span data-testid="icon" />} endIcon={<span />}>
          Share
        </Button>
      );
      const button = view.getByRole("button");

      // Act
      const icon = view.getByTestId("icon").parentElement as HTMLElement;

      // Assert
      expect(getStyle(button).gap).toBe("6px");
      expect(getStyle(icon).margin).toBe("0");
      expect(getStyle(button.lastElementChild as HTMLElement).margin).toBe("0");
    });

    it("should highlight on hover", () => {
      // Arrange
      renderInRoot(
        <>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
        </>
      );

      // Act
      const outlined = getStyle(
        view.getByRole("button", { name: "Outlined" }),
        `${OWN_CLASS}:hover`
      );
      const text = getStyle(
        view.getByRole("button", { name: "Text" }),
        `${OWN_CLASS}:hover`
      );

      // Assert
      expect(outlined["background-color"]).toBe("var(--jsb-accent-soft)");
      expect(outlined["border-color"]).toBe("var(--jsb-line-strong)");
      expect(text["background-color"]).toBe("var(--jsb-accent-soft)");
    });

    it("should be pressed in the soft accent", () => {
      // Arrange
      renderInRoot(<Button aria-pressed="true">Help</Button>);

      // Act
      const style = getStyle(
        view.getByRole("button"),
        `${OWN_CLASS}[aria-pressed='true']`
      );

      // Assert
      expect(style).toEqual({
        "background-color": "var(--jsb-accent-soft)",
        color: "var(--jsb-accent)",
      });
    });

    it("should be disabled at 45% opacity, in the colors it has when it is enabled", () => {
      // Arrange
      renderInRoot(
        <>
          <Button variant="outlined" disabled>
            Outlined
          </Button>
          <Button variant="contained" disabled>
            Contained
          </Button>
          <Button variant="text" disabled>
            Text
          </Button>
        </>
      );
      const disabled = `${OWN_CLASS}.Mui-disabled`;

      // Act
      const outlined = getStyle(
        view.getByRole("button", { name: "Outlined" }),
        disabled
      );
      const contained = getStyle(
        view.getByRole("button", { name: "Contained" }),
        disabled
      );
      const text = getStyle(
        view.getByRole("button", { name: "Text" }),
        disabled
      );

      // Assert
      expect(outlined).toMatchObject({
        opacity: "0.45",
        color: "var(--jsb-ink)",
        "border-color": "var(--jsb-line-strong)",
      });
      expect(contained).toMatchObject({
        opacity: "0.45",
        color: "var(--variant-containedColor)",
        "background-color": "var(--variant-containedBg)",
      });
      expect(text).toMatchObject({
        opacity: "0.45",
        color: "var(--jsb-muted)",
      });
    });
  });

  describe("buttonBase", () => {
    it("should draw a 2 px accent ring, 2 px away, on keyboard focus", () => {
      // Arrange
      renderInRoot(<Button>Example</Button>);

      // Act
      const style = getStyle(
        view.getByRole("button"),
        `${OWN_CLASS}:focus-visible`
      );

      // Assert
      expect(style).toMatchObject({
        outline: "2px solid var(--jsb-accent)",
        "outline-offset": "2px",
      });
    });

    it("should have no ripple when it is pressed", () => {
      // Arrange
      renderInRoot(
        <>
          <Button>Button</Button>
          <IconButton aria-label="Icon button" />
          <Tabs value="a">
            <Tab label="A" value="a" />
          </Tabs>
          <ToggleButton value="a">Toggle</ToggleButton>
        </>
      );

      // Act
      [...view.getAllByRole("button"), view.getByRole("tab")].forEach(
        (button) => fireEvent.mouseDown(button)
      );

      // Assert
      expect(document.querySelector(".MuiTouchRipple-root")).toBeNull();
    });
  });

  describe("iconButton", () => {
    it("should be 30 px square, in the muted color", () => {
      // Arrange
      renderInRoot(<IconButton aria-label="Help" />);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style).toMatchObject({
        width: "30px",
        height: "30px",
        padding: "0",
        "border-radius": "var(--jsb-radius)",
        color: "var(--jsb-muted)",
      });
    });

    it("should keep the color of its surroundings when it is inherit", () => {
      // Arrange
      renderInRoot(<IconButton color="inherit" aria-label="Edit" />);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style.color).toBe("inherit");
    });

    it("should be 24 px square with a 4 px radius in the small size", () => {
      // Arrange
      renderInRoot(<IconButton size="small" aria-label="Edit" />);

      // Act
      const style = getStyle(view.getByRole("button"));

      // Assert
      expect(style).toMatchObject({
        width: "24px",
        height: "24px",
        "border-radius": "4px",
      });
    });

    it("should highlight on hover even though it has no ripple", () => {
      // Arrange
      renderInRoot(<IconButton aria-label="Edit" />);

      // Act
      const style = getStyle(view.getByRole("button"), `${OWN_CLASS}:hover`);

      // Assert
      expect(style["background-color"]).toBe("var(--jsb-accent-soft)");
    });

    it("should be pressed in the soft accent", () => {
      // Arrange
      renderInRoot(<IconButton aria-label="Help" aria-pressed="true" />);

      // Act
      const style = getStyle(
        view.getByRole("button"),
        `${OWN_CLASS}[aria-pressed='true']`
      );

      // Assert
      expect(style).toEqual({
        "background-color": "var(--jsb-accent-soft)",
        color: "var(--jsb-accent)",
      });
    });

    it("should be disabled at 45% opacity", () => {
      // Arrange
      renderInRoot(<IconButton aria-label="Edit" disabled />);

      // Act
      const style = getStyle(
        view.getByRole("button"),
        `${OWN_CLASS}.Mui-disabled`
      );

      // Assert
      expect(style).toMatchObject({
        opacity: "0.45",
        color: "var(--jsb-muted)",
      });
    });
  });

  describe("tooltip", () => {
    it("should be ink on paper, 12 px, with a 4 px radius and no arrow", () => {
      // Arrange
      renderInRoot(
        <Tooltip title="Help" open>
          <button type="button">Target</button>
        </Tooltip>
      );

      // Act
      const style = getStyle(
        view.getByRole("tooltip").firstElementChild as HTMLElement
      );

      // Assert
      expect(style).toMatchObject({
        "background-color": "var(--jsb-ink)",
        color: "var(--jsb-paper)",
        "font-size": "12px",
        "border-radius": "4px",
        padding: "4px 8px",
      });
      expect(document.querySelector(".MuiTooltip-arrow")).toBeNull();
    });
  });

  describe("tabs", () => {
    it("should be 34 px tall with a 2 px accent indicator", () => {
      // Arrange
      renderInRoot(
        <Tabs value="a">
          <Tab label="A" value="a" />
        </Tabs>
      );

      // Act
      const tabs = getStyle(
        view.getByRole("tablist").parentElement?.parentElement as HTMLElement
      );
      const indicator = getStyle(
        document.querySelector(".MuiTabs-indicator") as HTMLElement
      );

      // Assert
      expect(tabs["min-height"]).toBe("34px");
      expect(indicator).toMatchObject({
        height: "2px",
        "background-color": "var(--jsb-accent)",
      });
    });

    it("should have tabs of 34 px, 12 px of side padding, no minimum width and no text transform", () => {
      // Arrange
      renderInRoot(
        <Tabs value="a">
          <Tab label="A" value="a" />
        </Tabs>
      );

      // Act
      const style = getStyle(view.getByRole("tab"));

      // Assert
      expect(style).toMatchObject({
        "min-height": "34px",
        "min-width": "0",
        "flex-direction": "row",
        padding: "0 12px",
        "font-size": "12.5px",
        "font-weight": "500",
        "text-transform": "none",
        color: "var(--jsb-muted)",
      });
    });

    it("should show the selected tab in ink", () => {
      // Arrange
      renderInRoot(
        <Tabs value="a">
          <Tab label="A" value="a" />
          <Tab label="B" value="b" />
        </Tabs>
      );

      // Act
      const style = getStyle(
        view.getByRole("tab", { name: "A" }),
        `${OWN_CLASS}.Mui-selected`
      );

      // Assert
      expect(style.color).toBe("var(--jsb-ink)");
    });

    it("should draw the focus ring inside the tab, where the tabs cannot clip it", () => {
      // Arrange
      renderInRoot(
        <Tabs value="a">
          <Tab label="A" value="a" />
        </Tabs>
      );

      // Act
      const style = getStyle(
        view.getByRole("tab"),
        `${OWN_CLASS}:focus-visible`
      );

      // Assert
      expect(style).toMatchObject({
        outline: "2px solid var(--jsb-accent)",
        "outline-offset": "-2px",
      });
    });
  });

  describe("toggleButtonGroup", () => {
    it("should be a bordered track with a 2 px padding around flat buttons", () => {
      // Arrange
      renderInRoot(
        <ToggleButtonGroup exclusive value="tree" aria-label="View">
          <ToggleButton value="tree">Tree</ToggleButton>
          <ToggleButton value="text">Text</ToggleButton>
        </ToggleButtonGroup>
      );
      const group = view.getByRole("group");

      // Act
      const track = getStyle(group);
      const grouped = getStyle(
        group,
        `${OWN_CLASS} .MuiToggleButtonGroup-grouped`
      );

      // Assert
      expect(track).toMatchObject({
        padding: "2px",
        border: "1px solid var(--jsb-line)",
        "border-radius": "var(--jsb-radius)",
      });
      expect(grouped).toMatchObject({
        margin: "0",
        border: "0",
        "border-radius": "4px",
      });
    });

    it("should have 22 px buttons in the muted color, and the selected one in the soft accent", () => {
      // Arrange
      renderInRoot(
        <ToggleButtonGroup exclusive value="tree" aria-label="View">
          <ToggleButton value="tree">Tree</ToggleButton>
          <ToggleButton value="text" disabled>
            Text
          </ToggleButton>
        </ToggleButtonGroup>
      );
      const tree = view.getByRole("button", { name: "Tree" });
      const text = view.getByRole("button", { name: "Text" });

      // Act
      const style = getStyle(tree);
      const hover = getStyle(tree, `${OWN_CLASS}:hover`);
      const selected = getStyle(tree, `${OWN_CLASS}.Mui-selected`);
      const selectedHover = getStyle(tree, `${OWN_CLASS}.Mui-selected:hover`);
      const disabled = getStyle(text, `${OWN_CLASS}.Mui-disabled`);

      // Assert
      expect(style).toMatchObject({
        height: "22px",
        padding: "0 9px",
        border: "0",
        color: "var(--jsb-muted)",
        "font-size": "12px",
        "text-transform": "none",
      });
      expect(hover["background-color"]).toContain("var(--jsb-accent-soft) 60%");
      expect(selected).toMatchObject({
        color: "var(--jsb-accent)",
        "background-color": "var(--jsb-accent-soft)",
      });
      expect(selectedHover["background-color"]).toBe("var(--jsb-accent-soft)");
      expect(disabled).toMatchObject({ border: "0", opacity: "0.45" });
    });
  });

  describe("paper", () => {
    it("should be a card with a line around it and no elevation overlay", () => {
      // Arrange
      renderInRoot(<Paper>Card</Paper>);

      // Act
      const style = getStyle(view.getByText("Card"));

      // Assert
      expect(style).toMatchObject({
        "background-color": "var(--jsb-card)",
        border: "1px solid var(--jsb-line)",
        "background-image": "none",
      });
    });
  });

  describe("dialog", () => {
    /**
     * Opens a dialog with the three parts MUI gives it.
     * @returns The root element, where the dialog renders.
     */
    function renderDialog(): HTMLElement {
      return renderInRoot(
        <Dialog open aria-labelledby="title">
          <DialogTitle id="title">Title</DialogTitle>
          <DialogContent>Content</DialogContent>
          <DialogActions>
            <Button>Close</Button>
          </DialogActions>
        </Dialog>
      );
    }

    it("should be a card with a line, a 12 px radius and no elevation overlay, inside the root element", () => {
      // Arrange
      const root = renderDialog();

      // Act
      const dialog = view.getByRole("dialog");
      const style = getStyle(dialog);

      // Assert
      expect(root.contains(dialog)).toBe(true);
      expect(style).toMatchObject({
        "background-color": "var(--jsb-card)",
        border: "1px solid var(--jsb-line)",
        "background-image": "none",
        "border-radius": "var(--jsb-radius-xl)",
        "box-shadow": "0 30px 80px -30px rgba(0, 0, 0, 0.5)",
      });
    });

    it("should dim the page with ink in the light scheme and black in the dark one", () => {
      // Arrange
      renderDialog();
      const backdrop = document.querySelector(
        ".MuiBackdrop-root"
      ) as HTMLElement;

      // Act
      const light = getStyle(backdrop);
      const dark = getStyle(
        backdrop,
        `*:where([data-theme="dark"] .${ROOT_CLASS}) ${OWN_CLASS}`
      );

      // Assert
      expect(light["background-color"]).toBe(
        "color-mix(in srgb, var(--jsb-ink) 34%, transparent)"
      );
      expect(dark["background-color"]).toBe("rgba(0, 0, 0, 0.55)");
    });

    it("should give its title, content and actions 22 px of side padding", () => {
      // Arrange
      renderDialog();

      // Act
      const title = getStyle(view.getByText("Title"));
      const content = getStyle(view.getByText("Content"));
      const afterTitle = getStyle(
        view.getByText("Content"),
        `.MuiDialogTitle-root+${OWN_CLASS}`
      );
      const actions = getStyle(
        view.getByRole("button", { name: "Close" }).parentElement as HTMLElement
      );

      // Assert
      expect(title).toMatchObject({
        padding: "18px 22px 6px",
        "font-family": "var(--jsb-font-display)",
        "font-size": "18px",
        "font-weight": "600",
        "letter-spacing": "normal",
      });
      expect(content.padding).toBe("6px 22px 4px");
      expect(afterTitle["padding-top"]).toBe("6px");
      expect(actions.padding).toBe("12px 22px 18px");
    });
  });

  describe("outlinedInput", () => {
    it("should be mono, 12.5 px, with a 1 px strong line and 10 px of padding", () => {
      // Arrange
      renderInRoot(<OutlinedInput inputProps={{ "aria-label": "Name" }} />);
      const input = view.getByRole("textbox", { name: "Name" });
      const field = input.parentElement as HTMLElement;

      // Act
      const root = getStyle(field);
      const outline = getStyle(
        field,
        `${OWN_CLASS} .MuiOutlinedInput-notchedOutline`
      );
      const padding = getStyle(input, `${OWN_CLASS}:not(textarea)`);

      // Assert
      expect(root).toMatchObject({
        "font-family": "var(--jsb-font-mono)",
        "font-size": "12.5px",
        "border-radius": "var(--jsb-radius)",
      });
      expect(outline["border-color"]).toBe("var(--jsb-line-strong)");
      expect(padding.padding).toBe("10px");
    });

    it("should have a 3 px soft accent ring and an accent line of 1 px when it is focused", () => {
      // Arrange
      renderInRoot(<OutlinedInput inputProps={{ "aria-label": "Name" }} />);
      const field = view.getByRole("textbox", { name: "Name" })
        .parentElement as HTMLElement;

      // Act
      const ring = getStyle(field, `${OWN_CLASS}.Mui-focused`);
      const outline = getStyle(
        field,
        `${OWN_CLASS}.Mui-focused .MuiOutlinedInput-notchedOutline`
      );

      // Assert
      expect(ring["box-shadow"]).toBe("0 0 0 3px var(--jsb-accent-soft)");
      expect(outline).toMatchObject({
        "border-color": "var(--jsb-accent)",
        "border-width": "1px",
      });
    });

    it("should have a red line when it is in error, over the focus line", () => {
      // Arrange
      renderInRoot(
        <OutlinedInput error inputProps={{ "aria-label": "Name" }} />
      );
      const field = view.getByRole("textbox", { name: "Name" })
        .parentElement as HTMLElement;

      // Act
      const outline = getStyle(
        field,
        `${OWN_CLASS}.Mui-error .MuiOutlinedInput-notchedOutline`
      );

      // Assert
      expect(outline["border-color"]).toBe("var(--jsb-bad)");
    });

    it("should pad a textarea in its root, since the textarea itself has none", () => {
      // Arrange
      renderInRoot(
        <OutlinedInput multiline inputProps={{ "aria-label": "Notes" }} />
      );
      const textarea = view.getByRole("textbox", { name: "Notes" });

      // Act
      const root = getStyle(textarea.parentElement as HTMLElement);

      // Assert
      expect(root.padding).toBe("10px");
      expect(textarea.matches(":not(textarea)")).toBe(false);
    });

    it("should be 20 px tall in the dense size", () => {
      // Arrange
      renderInRoot(
        <OutlinedInput size="small" inputProps={{ "aria-label": "Name" }} />
      );
      const field = view.getByRole("textbox", { name: "Name" })
        .parentElement as HTMLElement;

      // Act
      const style = getStyle(
        field,
        `${OWN_CLASS} .MuiOutlinedInput-input:not(textarea)`
      );

      // Assert
      expect(field.classList).toContain("MuiInputBase-sizeSmall");
      expect(style.padding).toBe("1px 6px");
    });
  });
});
