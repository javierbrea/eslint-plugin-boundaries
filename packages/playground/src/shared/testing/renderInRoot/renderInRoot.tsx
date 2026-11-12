import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ROOT_CLASS } from "@/ui-kit/helpers/theme";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

/**
 * Renders content inside the root element of the playground, which is where its theme applies. A spec that reads the text styles of a component renders it here, because the type scale is part of that theme.
 * @param children The content.
 * @returns The root element.
 */
export function renderInRoot(children: ReactNode): HTMLElement {
  const { container } = render(<ThemeRoot>{children}</ThemeRoot>);
  return container.querySelector(`.${ROOT_CLASS}`) as HTMLElement;
}
