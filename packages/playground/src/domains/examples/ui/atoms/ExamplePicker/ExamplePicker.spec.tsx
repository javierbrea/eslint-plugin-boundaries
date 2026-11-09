import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { ExamplePicker } from "./ExamplePicker";
import { ExamplePickerPom } from "./ExamplePicker.pom";
import type { ExampleOption } from "./ExamplePicker.types";

const EXAMPLES: readonly ExampleOption[] = [
  { id: "quick-start", title: "Quick start" },
  { id: "overview", title: "Overview" },
  { id: "policies", title: "Policies" },
];

/**
 * Renders the picker inside the root of the playground, where its theme is.
 * @param currentId The id of the current example, if any.
 * @param onSelect Called with the example that is picked.
 * @param autoFocus Whether the button takes the keyboard focus when it is first rendered.
 * @returns The page object of the picker.
 */
function renderPicker(
  currentId: string | undefined,
  onSelect: (example: ExampleOption) => void = jest.fn(),
  autoFocus?: boolean
): ExamplePickerPom {
  renderInRoot(
    <ExamplePicker
      examples={EXAMPLES}
      currentId={currentId}
      onSelect={onSelect}
      autoFocus={autoFocus}
    />
  );

  return new ExamplePickerPom();
}

describe("ExamplePicker", () => {
  describe("button", () => {
    it("should say the label and the name of the current example", () => {
      // Arrange
      const picker = renderPicker("overview");

      // Act
      const { text } = picker;

      // Assert
      expect(text).toBe("Example Overview");
    });

    it("should say the label alone when the sketch is none of the examples", () => {
      // Arrange
      const picker = renderPicker(undefined);

      // Act
      const { text } = picker;

      // Assert
      expect(text).toBe("Example");
    });

    it("should say the label alone when the current example is not in the list", () => {
      // Arrange
      const picker = renderPicker("gone");

      // Act
      const { text } = picker;

      // Assert
      expect(text).toBe("Example");
    });

    it("should draw the label muted and the name of the example in ink", () => {
      // Arrange
      const picker = renderPicker("quick-start");

      // Act
      const { label, labelColor, titleColor } = picker;

      // Assert
      expect(label).toBe("Example");
      expect(labelColor).toBe("var(--jsb-muted)");
      expect(titleColor).toBe("var(--jsb-ink)");
    });

    it("should end with the chevron that points down", () => {
      // Arrange
      const picker = renderPicker("quick-start");

      // Act
      const { icon } = picker;

      // Assert
      expect(icon.pathData).toBe(ICON_PATHS["chevron-down"]);
      expect(icon.isHidden).toBe(true);
    });

    it("should announce a menu that is closed until it is pressed", () => {
      // Arrange
      const picker = renderPicker("quick-start");

      // Act
      const { popup, isExpanded, isListOpen } = picker;

      // Assert
      expect(popup).toBe("menu");
      expect(isExpanded).toBe(false);
      expect(isListOpen).toBe(false);
    });

    it("should take the keyboard focus when it is first rendered, if the caller asks for it", () => {
      // Arrange
      const picker = renderPicker("quick-start", jest.fn(), true);

      // Act
      const { isFocused } = picker;

      // Assert
      expect(isFocused).toBe(true);
    });

    it("should not take the keyboard focus by itself", () => {
      // Arrange
      const picker = renderPicker("quick-start");

      // Act
      const { isFocused } = picker;

      // Assert
      expect(isFocused).toBe(false);
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe("list", () => {
    it("should open when the button is pressed, and say so", () => {
      // Arrange
      const picker = renderPicker("quick-start");

      // Act
      picker.open();

      // Assert
      expect(picker.isListOpen).toBe(true);
      expect(picker.isExpanded).toBe(true);
    });

    it("should name every example, in the order they are given", () => {
      // Arrange
      const picker = renderPicker("quick-start");

      // Act
      picker.open();

      // Assert
      expect(picker.titles).toEqual(["Quick start", "Overview", "Policies"]);
    });

    it("should mark the current example, for the eyes and for assistive technology", () => {
      // Arrange
      const picker = renderPicker("overview");

      // Act
      picker.open();

      // Assert
      expect(picker.selectedTitles).toEqual(["Overview"]);
      expect(picker.checkedTitles).toEqual(["Overview"]);
    });

    it("should mark none when the sketch is none of the examples", () => {
      // Arrange
      const picker = renderPicker(undefined);

      // Act
      picker.open();

      // Assert
      expect(picker.selectedTitles).toEqual([]);
      expect(picker.checkedTitles).toEqual([]);
    });

    it("should give back the example that is picked, as it was given, and close", async () => {
      // Arrange
      const onSelect = jest.fn();
      const picker = renderPicker("quick-start", onSelect);

      picker.open();

      // Act
      picker.pick("Policies");
      await picker.waitUntilClosed();

      // Assert
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect.mock.calls[0][0]).toBe(EXAMPLES[2]);
      expect(picker.isExpanded).toBe(false);
    });

    it("should give back the current example when it is picked again", () => {
      // Arrange
      const onSelect = jest.fn();
      const picker = renderPicker("quick-start", onSelect);

      picker.open();

      // Act
      picker.pick("Quick start");

      // Assert
      expect(onSelect).toHaveBeenCalledWith(EXAMPLES[0]);
    });

    it("should close with the Escape key, and pick nothing", async () => {
      // Arrange
      const onSelect = jest.fn();
      const picker = renderPicker("quick-start", onSelect);

      picker.open();

      // Act
      picker.pressEscape();
      await picker.waitUntilClosed();

      // Assert
      expect(onSelect).not.toHaveBeenCalled();
      expect(picker.isExpanded).toBe(false);
    });
  });
});
