import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { fireEvent, screen as view } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { createPlaygroundTheme } from "./theme";
import {
  FOCUS_RING,
  HOVER_BACKGROUND,
  ROOT_CLASS,
  STATE_TEXT,
} from "./theme.constants";
import { TYPOGRAPHY } from "./typography";

/** A variant of the type scale, which the specs read from the theme. */
type Variant =
  | "fieldLabel"
  | "paneLabel"
  | "bodyLarge"
  | "monoLarge"
  | "mono"
  | "monoSmall"
  | "monoCaption"
  | "monoTiny"
  | "monoMicro"
  | "code"
  | "dialogTitle"
  | "title"
  | "figure"
  | "caption";

describe("tokens", () => {
  it("should draw the keyboard focus ring as a 2 px accent line", () => {
    // Assert
    expect(FOCUS_RING).toBe("2px solid var(--jsb-accent)");
  });

  it("should hover a row with 60% of the soft accent", () => {
    // Assert
    expect(HOVER_BACKGROUND).toBe(
      "color-mix(in srgb, var(--jsb-accent-soft) 60%, transparent)"
    );
  });
});

describe("STATE_TEXT", () => {
  it.each<[keyof typeof STATE_TEXT, string]>([
    ["ok", "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))"],
    ["bad", "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"],
    ["warn", "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"],
  ])(
    "should mix 15%% of the ink into the token of the %s state, for contrast",
    (state, color) => {
      // Assert
      expect(STATE_TEXT[state]).toBe(color);
    }
  );

  it("should read not-checked text in the muted color, which already passes the contrast", () => {
    // Assert
    expect(STATE_TEXT.faint).toBe("var(--jsb-muted)");
  });
});

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

    it("should make 600 the bold weight, the one of the buttons and the titles", () => {
      // Arrange
      const theme = createPlaygroundTheme(() => null);

      // Assert
      expect(theme.typography.fontWeightBold).toBe(600);
      expect(theme.typography.button.fontWeight).toBe(600);
    });

    it.each<[Variant, string, string, number, number | string]>([
      ["caption", "var(--jsb-font-body)", "12px", 400, 1.45],
      ["fieldLabel", "var(--jsb-font-body)", "11px", 500, 1.3],
      ["paneLabel", "var(--jsb-font-mono)", "10.5px", 500, 1],
      ["bodyLarge", "var(--jsb-font-body)", "13.5px", 400, 1.45],
      ["monoLarge", "var(--jsb-font-mono)", "13px", 400, 1.45],
      ["mono", "var(--jsb-font-mono)", "12.5px", 400, 1.45],
      ["monoSmall", "var(--jsb-font-mono)", "12px", 400, 1.45],
      ["monoCaption", "var(--jsb-font-mono)", "11.5px", 400, 1.45],
      ["monoTiny", "var(--jsb-font-mono)", "11px", 500, 1],
      ["monoMicro", "var(--jsb-font-mono)", "10.5px", 400, 1],
      ["code", "var(--jsb-font-mono)", "13px", 400, "28px"],
      ["dialogTitle", "var(--jsb-font-display)", "18px", 600, 1.3],
      ["title", "var(--jsb-font-display)", "16px", 600, 1.3],
      ["figure", "var(--jsb-font-display)", "20px", 600, 1.1],
    ])(
      "should declare the %s variant of the type scale",
      (variant, fontFamily, fontSize, fontWeight, lineHeight) => {
        // Arrange
        const theme = createPlaygroundTheme(() => null);

        // Assert
        expect(theme.typography[variant]).toMatchObject({
          fontFamily,
          fontSize,
          fontWeight,
          lineHeight,
        });
      }
    );

    it("should space out and uppercase only the label of a pane, and keep the titles free of the letter spacing of the host", () => {
      // Arrange
      const { typography } = createPlaygroundTheme(() => null);

      // Assert
      expect(typography.paneLabel).toMatchObject({
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      });
      expect(typography.mono.letterSpacing).toBeUndefined();
      expect(typography.dialogTitle.letterSpacing).toBe("normal");
      expect(typography.title.letterSpacing).toBe("normal");
    });

    it("should be the type scale that the editor of the config reads", () => {
      // Arrange
      const { typography } = createPlaygroundTheme(() => null);

      // Assert
      expect(typography.mono).toEqual(TYPOGRAPHY.mono);
      expect(typography.body2).toMatchObject(TYPOGRAPHY.body2);
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
        outline: FOCUS_RING,
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
        "font-weight": "400",
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
        outline: FOCUS_RING,
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
      expect(hover["background-color"]).toBe(HOVER_BACKGROUND);
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
        "line-height": "1.3",
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
        "line-height": "1.4",
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

  describe("inputLabel", () => {
    it("should float over the border of the field even though it is empty and has no focus", () => {
      // Arrange
      renderInRoot(<TextField label="Module" />);

      // Act
      const label = view.getByText("Module", { selector: "label" });

      // Assert
      expect(label.classList).toContain("MuiInputLabel-shrink");
    });

    it("should be the 11 px label of the body font, muted, on the card, 8 px from the corner of the field", () => {
      // Arrange
      renderInRoot(<TextField label="Module" />);
      const label = view.getByText("Module", { selector: "label" });

      // Act
      const style = getStyle(label);

      // Assert
      expect(style).toMatchObject({
        "font-family": "var(--jsb-font-body)",
        "font-size": "11px",
        "font-weight": "500",
        "line-height": "1.3",
        color: "var(--jsb-muted)",
        padding: "0 4px",
        "background-color": "var(--jsb-card)",
        transform: "translate(8px, -7px)",
        "max-width": "calc(100% - 16px)",
      });
    });

    it("should be accent while the field has the focus and the text red of errors when it is in error", () => {
      // Arrange
      renderInRoot(<TextField label="Module" />);
      const label = view.getByText("Module", { selector: "label" });

      // Act
      const focused = getStyle(label, `${OWN_CLASS}.Mui-focused`);
      const error = getStyle(label, `${OWN_CLASS}.Mui-error`);

      // Assert
      expect(focused.color).toBe("var(--jsb-accent)");
      expect(error.color).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
    });

    it("should leave a gap in the border as wide as the label, which is the font of the hidden copy that MUI measures", () => {
      // Arrange
      renderInRoot(<TextField label="Module" />);
      const outline = document.querySelector("fieldset") as HTMLElement;

      // Act
      const legend = getStyle(outline, `${OWN_CLASS} legend`);

      // Assert
      expect(legend).toEqual({
        "font-family": "var(--jsb-font-body)",
        "font-size": "11px",
        "font-weight": "500",
      });
    });
  });

  describe("autocomplete", () => {
    /**
     * Renders a field with two files, with the first one picked, and returns the element that the theme styles.
     * @returns The root of the autocomplete.
     */
    function renderAutocomplete(): HTMLElement {
      renderInRoot(
        <Autocomplete
          options={["src/index.js", "src/helpers/format/index.js"]}
          value="src/index.js"
          renderInput={(params) => <TextField {...params} label="File" />}
        />
      );

      return document.querySelector(".MuiAutocomplete-root") as HTMLElement;
    }

    /**
     * Opens the list of the field.
     */
    function openList(): void {
      fireEvent.mouseDown(view.getByRole("combobox"));
    }

    it("should have no padding around the input of the field, which is 10 px away from the border as every input", () => {
      // Arrange
      const field = renderAutocomplete();

      // Act
      const root = getStyle(field, `${OWN_CLASS} .MuiOutlinedInput-root`);
      const input = getStyle(
        field,
        `${OWN_CLASS} .MuiOutlinedInput-root .MuiAutocomplete-input`
      );

      // Assert
      expect(root.padding).toBe("0");
      expect(input.padding).toBe("10px");
    });

    it("should leave the room of one button at the end of the field, whether or not it can be cleared", () => {
      // Arrange
      const field = renderAutocomplete();

      // Act
      const popup = getStyle(
        field,
        `.MuiAutocomplete-hasPopupIcon${OWN_CLASS} .MuiOutlinedInput-root`
      );
      const popupAndClear = getStyle(
        field,
        `.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon${OWN_CLASS} .MuiOutlinedInput-root`
      );

      // Assert
      expect(popup["padding-right"]).toBe("36px");
      expect(popupAndClear["padding-right"]).toBe("36px");
    });

    it("should put the button 6 px from the end of the field", () => {
      // Arrange
      const field = renderAutocomplete();

      // Act
      const style = getStyle(
        field,
        `${OWN_CLASS} .MuiOutlinedInput-root .MuiAutocomplete-endAdornment`
      );

      // Assert
      expect(style.right).toBe("6px");
    });

    it("should have no button to clear it, and a muted one to open the list", () => {
      // Arrange
      renderAutocomplete();
      const clear = document.querySelector(
        ".MuiAutocomplete-clearIndicator"
      ) as HTMLElement;
      const popup = document.querySelector(
        ".MuiAutocomplete-popupIndicator"
      ) as HTMLElement;

      // Act
      const clearStyle = getStyle(clear);
      const popupStyle = getStyle(popup);

      // Assert
      expect(clearStyle.display).toBe("none");
      expect(popupStyle.color).toBe("var(--jsb-muted)");
    });

    it("should draw the list as a card on the lighter surface, 4 px away from the field", () => {
      // Arrange
      renderAutocomplete();
      openList();
      const paper = document.querySelector(
        ".MuiAutocomplete-paper"
      ) as HTMLElement;

      // Act
      const style = getStyle(paper);

      // Assert
      expect(style).toMatchObject({
        margin: "4px 0",
        "background-color": "var(--jsb-paper-2)",
        border: "1px solid var(--jsb-line)",
        "border-radius": "var(--jsb-radius)",
        "box-shadow": "var(--jsb-shadow)",
      });
    });

    it("should draw each option as a 28 px mono row with 8 px of padding, its text at one end and its detail at the other", () => {
      // Arrange
      renderAutocomplete();
      openList();
      const listbox = view.getByRole("listbox");

      // Act
      const list = getStyle(listbox);
      const option = getStyle(listbox, `${OWN_CLASS} .MuiAutocomplete-option`);

      // Assert
      expect(list.padding).toBe("4px");
      expect(option).toMatchObject({
        "font-family": "var(--jsb-font-mono)",
        "font-size": "12.5px",
        "min-height": "28px",
        padding: "0 8px",
        gap: "12px",
        "justify-content": "space-between",
        "border-radius": "4px",
      });
    });

    it("should hover and highlight an option with the soft accent, and fill the one that is picked", () => {
      // Arrange
      renderAutocomplete();
      openList();
      const listbox = view.getByRole("listbox");
      const option = `${OWN_CLASS} .MuiAutocomplete-option`;

      // Act
      const focused = getStyle(listbox, `${option}.Mui-focused`);
      const focusVisible = getStyle(listbox, `${option}.Mui-focusVisible`);
      const selected = getStyle(listbox, `${option}[aria-selected='true']`);
      const selectedFocused = getStyle(
        listbox,
        `${option}[aria-selected='true'].Mui-focused`
      );

      // Assert
      expect(focused["background-color"]).toBe(HOVER_BACKGROUND);
      expect(focusVisible["background-color"]).toBe(HOVER_BACKGROUND);
      expect(selected["background-color"]).toBe("var(--jsb-accent-soft)");
      expect(selectedFocused["background-color"]).toBe(
        "var(--jsb-accent-soft)"
      );
    });

    it("should say that no option matches in muted mono", () => {
      // Arrange
      renderInRoot(
        <Autocomplete
          options={[]}
          noOptionsText="No file matches"
          renderInput={(params) => <TextField {...params} label="File" />}
        />
      );
      openList();

      // Act
      const style = getStyle(view.getByText("No file matches") as HTMLElement);

      // Assert
      expect(style).toMatchObject({
        "font-family": "var(--jsb-font-mono)",
        padding: "6px 8px",
        color: "var(--jsb-muted)",
      });
    });
  });

  describe("chip", () => {
    it("should be a 26 px pill of mono text, outlined with the strong line, with no fill", () => {
      // Arrange
      renderInRoot(<Chip variant="outlined" label="named round" />);
      const chip = document.querySelector(".MuiChip-root") as HTMLElement;

      // Act
      const style = getStyle(chip);

      // Assert
      expect(style).toMatchObject({
        height: "26px",
        "border-radius": "13px",
        "font-family": "var(--jsb-font-mono)",
        "font-size": "12px",
        "line-height": "1",
        color: "var(--jsb-ink)",
        "background-color": "transparent",
        "border-color": "var(--jsb-line-strong)",
      });
    });

    it("should lay out its label in a row, 6 px between what it holds, with 10 px at the ends", () => {
      // Arrange
      renderInRoot(<Chip variant="outlined" label="named round" />);
      const label = document.querySelector(".MuiChip-label") as HTMLElement;

      // Act
      const style = getStyle(label);

      // Assert
      expect(style).toMatchObject({
        display: "inline-flex",
        "align-items": "center",
        gap: "6px",
        padding: "0 10px",
      });
    });

    it("should answer to the pointer and to the keyboard with the soft accent when it can be pressed", () => {
      // Arrange
      renderInRoot(<Chip variant="outlined" label="Name" onClick={() => {}} />);
      const chip = document.querySelector(".MuiChip-root") as HTMLElement;

      // Act
      const hover = getStyle(chip, `${OWN_CLASS}.MuiChip-clickable:hover`);
      const focused = getStyle(chip, `${OWN_CLASS}.Mui-focusVisible`);

      // Assert
      expect(hover["background-color"]).toBe(HOVER_BACKGROUND);
      expect(focused["background-color"]).toBe(HOVER_BACKGROUND);
    });
  });

  describe("radio", () => {
    it("should be the small radio, with no padding around its ring, which is faint until it is checked", () => {
      // Arrange
      renderInRoot(<Radio slotProps={{ input: { "aria-label": "Option" } }} />);
      const radio = view
        .getByRole("radio")
        .closest(".MuiRadio-root") as HTMLElement;

      // Act
      const style = getStyle(radio);
      const checked = getStyle(radio, `${OWN_CLASS}.Mui-checked`);

      // Assert
      expect(radio.classList).toContain("MuiRadio-sizeSmall");
      expect(style).toMatchObject({ padding: "0", color: "var(--jsb-faint)" });
      expect(checked.color).toBe("var(--jsb-accent)");
    });

    it("should draw the keyboard ring around its box, which the focus of its input leaves to the class that MUI sets", () => {
      // Arrange
      renderInRoot(<Radio slotProps={{ input: { "aria-label": "Option" } }} />);
      const radio = view
        .getByRole("radio")
        .closest(".MuiRadio-root") as HTMLElement;

      // Act
      const style = getStyle(radio, `${OWN_CLASS}.Mui-focusVisible`);

      // Assert
      expect(style).toEqual({
        outline: FOCUS_RING,
        "outline-offset": "0",
        "border-radius": "50%",
      });
    });
  });

  describe("formControlLabel", () => {
    it("should have no margin and 5 px between the box of the ring and its text", () => {
      // Arrange
      renderInRoot(<FormControlLabel control={<Radio />} label="import" />);
      const label = view
        .getByText("import")
        .closest(".MuiFormControlLabel-root") as HTMLElement;

      // Act
      const style = getStyle(label);

      // Assert
      expect(style).toMatchObject({ margin: "0", gap: "5px" });
    });
  });
});
