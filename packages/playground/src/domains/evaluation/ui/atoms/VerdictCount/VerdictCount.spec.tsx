import { render } from "@testing-library/react";

import type { VerdictTone } from "@/domains/evaluation/ui/helpers/verdictText";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { VerdictCount } from "./VerdictCount";
import { VerdictCountPom } from "./VerdictCount.pom";

describe("VerdictCount", () => {
  it("should say what it counts", () => {
    // Arrange
    render(
      <VerdictCount tone="faint" icon="skip">
        4 not checked
      </VerdictCount>
    );
    const verdictCount = new VerdictCountPom();

    // Act
    const { text } = verdictCount;

    // Assert
    expect(text).toBe("4 not checked");
  });

  it.each<[VerdictTone, string]>([
    ["ok", "var(--jsb-ok)"],
    ["bad", "var(--jsb-bad)"],
    ["warn", "var(--jsb-warn)"],
    ["faint", "var(--jsb-faint)"],
  ])("should draw the %s tone in %s", (tone, expected) => {
    // Arrange
    render(
      <VerdictCount tone={tone} icon="check">
        2
      </VerdictCount>
    );
    const verdictCount = new VerdictCountPom();

    // Act
    const { color } = verdictCount;

    // Assert
    expect(color).toBe(expected);
  });

  it("should draw the icon it is given, hidden from assistive technology", () => {
    // Arrange
    render(
      <VerdictCount tone="bad" icon="cross">
        1
      </VerdictCount>
    );
    const { icon } = new VerdictCountPom();

    // Act
    const { pathData, isHidden } = icon;

    // Assert
    expect(pathData).toBe(ICON_PATHS.cross);
    expect(isHidden).toBe(true);
  });

  it("should list the counts of its parent", () => {
    // Arrange
    render(
      <>
        <VerdictCount tone="ok" icon="check">
          2
        </VerdictCount>
        <VerdictCount tone="bad" icon="cross">
          1
        </VerdictCount>
      </>
    );
    const { count } = new VerdictCountPom();
    const texts = Array.from(
      { length: count },
      (_, index) => new VerdictCountPom({ index }).text
    );

    // Act
    const second = new VerdictCountPom({ containing: "1" }).text;

    // Assert
    expect(texts).toEqual(["2", "1"]);
    expect(second).toBe("1");
  });
});
