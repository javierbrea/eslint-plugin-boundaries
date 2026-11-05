import { fireEvent } from "@testing-library/react";

import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import { Pom } from "@/shared/testing/pom";
import { SectionTitlePom } from "@/ui-kit/atoms/SectionTitle/SectionTitle.pom";

import { CONFIG_INSPECTOR_TEST_ID } from "./ConfigInspector.constants";

/** The separator between the parts of a row in its text. */
const PART_SEPARATOR = " | ";

/** Page object of a row of the config inspector, a part of the inspector: the page object of the inspector builds it, so it is exported only as a type. It has no test id: it finds the buttons within its parent, the one named by the `name` option (a string or a pattern, matched against the accessible name, such as `/^component/`) when it is set, and the `index` and `containing` options pick among them. */
class ConfigRowPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole(
        "button",
        accessibleName === undefined ? {} : { name: accessibleName }
      ),
      accessibleName === undefined
        ? 'the role "button"'
        : `the role "button" named ${accessibleName}`
    );
  }

  /**
   * The parts of the row, which are its name, what is at its end and, when there is one, what is below.
   * @returns The elements in order.
   */
  private get parts(): HTMLElement[] {
    return Array.from(this.root.children) as HTMLElement[];
  }

  /**
   * How many rows its parent holds, whatever the `index`, `name` and `containing` options. A page object that lists them builds one `ConfigRowPom` per index below this number.
   * @returns The number of buttons within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("button").length;
  }

  /**
   * Everything the row says: its name, what is at its end and what is below, joined by a bar.
   * @returns The text of each part of the row, in order.
   */
  get text(): string {
    return this.parts.map((part) => part.textContent).join(PART_SEPARATOR);
  }

  /**
   * The color of the name of the row.
   * @returns The computed color of the first part.
   */
  get nameColor(): string {
    return getComputedStyle(this.parts[0]).color;
  }

  /**
   * The color of what is at the end of the row.
   * @returns The computed color of the second part.
   */
  get statusColor(): string {
    return getComputedStyle(this.parts[1]).color;
  }

  /** Presses the row, which opens its entry in the config. */
  press(): void {
    fireEvent.click(this.root);
  }
}

/** Page object of a group of rows, a part of the inspector: the page object of the inspector builds it, so it is exported only as a type. It has no test id: it finds the heading named by the `name` option, which is required, and takes the element that follows the heading as its root, which is the list of rows or the line that says there are none. */
class ConfigGroupPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const groupName = this.requireName();

    return this.pickMatch(
      this.searchBase
        .queryAllByRole("heading", { name: groupName })
        .map((heading) => heading.nextElementSibling as HTMLElement),
      `the heading ${groupName}`
    );
  }

  /**
   * The text of each row of the group.
   * @returns The name, what is at the end and what is below of each row, joined by a bar, in order. Empty when the group says there are none.
   */
  get rowTexts(): string[] {
    const { count } = this.childPom(ConfigRowPom);

    return Array.from(
      { length: count },
      (_, index) => this.childPom(ConfigRowPom, { index }).text
    );
  }
}

/** Page object of the config inspector. */
export class ConfigInspectorPom extends Pom {
  protected readonly defaultTestId = CONFIG_INSPECTOR_TEST_ID;

  /**
   * The name of the file, over the groups.
   * @returns The page object of the title.
   */
  get title(): SectionTitlePom {
    return this.childPom(SectionTitlePom, { name: CONFIG_PATH });
  }

  /**
   * The headings of the groups.
   * @returns The text of each heading of the inspector, in order.
   */
  get groupLabels(): string[] {
    return this.scope
      .queryAllByRole("heading")
      .map((heading) => heading.textContent);
  }

  /**
   * Gets a group of rows.
   * @param label The text of its heading, such as `Element types`.
   * @returns The page object of the group.
   */
  group(label: string): ConfigGroupPom {
    return this.childPom(ConfigGroupPom, { name: label });
  }

  /**
   * The text of each row of every group.
   * @returns The name, what is at the end and what is below of each row, joined by a bar, in order. Empty when every group says there are none.
   */
  get rowTexts(): string[] {
    return this.childPom(ConfigGroupPom, { root: this.root }).rowTexts;
  }

  /**
   * Gets the row that has an accessible name, whichever its group.
   * @param accessibleName The name of the row, as a string or a pattern.
   * @returns The page object of the row.
   */
  row(accessibleName: string | RegExp): ConfigRowPom {
    return this.childPom(ConfigRowPom, { name: accessibleName });
  }

  /**
   * The lines that say a group has no rows.
   * @returns The text of each, in order.
   */
  get noneMessages(): string[] {
    return this.scope
      .queryAllByText("None")
      .map((message) => message.textContent);
  }
}

export type { ConfigGroupPom, ConfigRowPom };
