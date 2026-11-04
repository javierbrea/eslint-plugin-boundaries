import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Root } from "../Root";
import { ROOT_CLASS } from "../Theme";

/**
 * Renders content inside the root element of the playground, which is where its theme applies. A spec that reads the text styles of a component renders it here, because the type scale is part of that theme.
 * @param children The content.
 * @returns The root element.
 */
export function renderInRoot(children: ReactNode): HTMLElement {
  const { container } = render(<Root>{children}</Root>);
  return container.querySelector(`.${ROOT_CLASS}`) as HTMLElement;
}
