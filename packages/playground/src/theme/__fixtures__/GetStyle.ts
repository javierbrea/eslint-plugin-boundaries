import { CACHE_KEY, ROOT_CLASS } from "../Theme";

/** The placeholder of the element's own class in the selector passed to {@link getStyle}. */
export const OWN_CLASS = "{class}";

/**
 * Collects what the CSS rules of the playground declare for an element: its own Emotion class, or a selector built around it. jsdom cannot tell whether an element is hovered or has a keyboard focus ring, so a spec reads the rule instead of the computed style.
 * @param element The element that carries the class.
 * @param selector The selector to read, with {@link OWN_CLASS} where the class goes. It is the class alone by default.
 * @returns The declarations of the rules with that selector in the order they were inserted, so the last one of each property is the one that wins.
 */
export function getStyle(
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
      // An Emotion style element in the document has its sheet
      Array.from((style.sheet as CSSStyleSheet).cssRules).forEach((rule) => {
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
