import { Pom } from "@/shared/testing/pom";

/** The selector of the message: a status while the sketch loads, an alert when it could not be loaded. */
const MESSAGE_SELECTOR = "[role='status'], [role='alert']";

/** Page object of the message that describes why the sketch is not on screen. It has no test id: it finds the status or the alert within its parent. */
export class LoadStatePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(MESSAGE_SELECTOR);
  }

  /**
   * What assistive technology announces the message as: a status while the sketch loads, an alert when it could not be loaded.
   * @returns The `role` attribute, or null when the message has none.
   */
  get role(): string | null {
    return this.root.getAttribute("role");
  }

  /**
   * Everything the message says.
   * @returns The text of the message.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The color of the message.
   * @returns The computed value.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }
}
