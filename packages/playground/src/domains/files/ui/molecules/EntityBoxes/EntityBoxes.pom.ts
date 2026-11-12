import { PropertyListPom } from "@/domains/files/ui/atoms/PropertyList/PropertyList.pom";
import { Pom } from "@/shared/testing/pom";
import { DISCLOSURE_TEST_ID } from "@/ui-kit/molecules/Disclosure/Disclosure.constants";
import { DisclosurePom } from "@/ui-kit/molecules/Disclosure/Disclosure.pom";

import { ENTITY_BOXES_TEST_ID } from "./EntityBoxes.constants";

/** Page object of a box of the description of an entity, a part of the boxes: the page object of the boxes builds it, so it is exported only as a type. It is the disclosure that has the name of the box as its label, with the properties it lists. */
class EntityBoxPom extends DisclosurePom {
  /**
   * The properties of the box.
   * @returns The text of the value of each key, by key, such as `{ types: '[ "module" ]' }`.
   * @throws When the box is folded, which lists no property.
   */
  get entries(): Record<string, string> {
    return this.list.entries;
  }

  /**
   * The color a value is drawn in, which tells a value that is null apart from the others.
   * @param key The key, such as `types`.
   * @returns The computed color of the value.
   */
  valueColor(key: string): string {
    return this.list.valueColor(key);
  }

  /**
   * The list of the properties, which is in the body of the box.
   * @returns The page object of the list.
   */
  private get list(): PropertyListPom {
    return this.childPom(PropertyListPom);
  }
}

/** Page object of the boxes of the description of an entity. */
export class EntityBoxesPom extends Pom {
  protected readonly defaultTestId = ENTITY_BOXES_TEST_ID;

  /**
   * The names of the boxes.
   * @returns The label of each box, in order.
   */
  get boxNames(): string[] {
    return this.scope
      .queryAllByTestId(DISCLOSURE_TEST_ID)
      .map((root) => this.childPom(DisclosurePom, { root }).label);
  }

  /**
   * Gets a box of the description.
   * @param boxName The name of the box, such as `element`.
   * @returns The page object of the box.
   */
  box(boxName: string): EntityBoxPom {
    return this.childPom(EntityBoxPom, { name: boxName });
  }
}

export type { EntityBoxPom };
