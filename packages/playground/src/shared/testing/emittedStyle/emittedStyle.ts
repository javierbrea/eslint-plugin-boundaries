import { CACHE_KEY, ROOT_CLASS } from "@/ui-kit/helpers/theme";

import { OWN_CLASS } from "./emittedStyle.constants";

/**
 * Lists the CSS rules that the playground inserted in the document. Its Emotion style elements are in the head of the page and not in the playground's root, so the rules remain after the playground unmounts.
 * @returns The rules of every style element of the playground, in the order they were inserted.
 */
export function getInsertedRules(): CSSRule[] {
  return Array.from(
    document.head.querySelectorAll<HTMLStyleElement>(
      `style[data-emotion^="${CACHE_KEY}"]`
    )
  ).flatMap((style) => Array.from(style.sheet?.cssRules ?? []));
}

/**
 * Reads the steps of an animation that the playground inserted, which jsdom keeps but never runs.
 * @param animationName The name of the animation, such as the first word of the computed `animation` of an element.
 * @returns What each step declares, by its key (`from`, `to` or a percentage), from the last rule of that name; empty when there is none.
 */
export function getKeyframes(
  animationName: string
): Record<string, Record<string, string>> {
  const rule = getInsertedRules()
    .filter(
      (inserted): inserted is CSSKeyframesRule =>
        inserted.type === CSSRule.KEYFRAMES_RULE &&
        (inserted as CSSKeyframesRule).name === animationName
    )
    .at(-1);

  return Object.fromEntries(
    Array.from((rule?.cssRules ?? []) as Iterable<CSSKeyframeRule>).map(
      (step) => [
        step.keyText,
        Object.fromEntries(
          Array.from(step.style).map((property) => [
            property,
            step.style.getPropertyValue(property),
          ])
        ),
      ]
    )
  );
}

/**
 * Collects what the CSS rules of the playground declare for an element: its own Emotion class, or a selector built around it. jsdom cannot tell whether an element is hovered, has a keyboard focus ring or is under a media query such as `prefers-reduced-motion`, so a spec reads the rule instead of the computed style.
 * @param element The element that carries the class.
 * @param selector The selector to read, with {@link OWN_CLASS} where the class goes. It is the class alone by default.
 * @param media The condition of the media query whose rules are read, such as `(prefers-reduced-motion: reduce)`. It reads the rules that are not inside a media query by default.
 * @returns The declarations of the rules with that selector in the order they were inserted, so the last one of each property is the one that wins.
 */
export function getStyle(
  element: Element,
  selector: string = OWN_CLASS,
  media?: string
): Record<string, string> {
  const selectors = Array.from(element.classList)
    .filter(
      (className) =>
        className.startsWith(`${CACHE_KEY}-`) && className !== ROOT_CLASS
    )
    .map((className) => selector.replace(OWN_CLASS, `.${className}`));
  const declarations: Record<string, string> = {};

  const rules =
    media === undefined
      ? getInsertedRules()
      : getInsertedRules()
          .filter(
            (rule): rule is CSSMediaRule =>
              rule instanceof CSSMediaRule && rule.conditionText === media
          )
          .flatMap((rule) => Array.from(rule.cssRules));

  rules.forEach((rule) => {
    if (rule instanceof CSSStyleRule && selectors.includes(rule.selectorText)) {
      Array.from(rule.style).forEach((property) => {
        declarations[property] = rule.style.getPropertyValue(property);
      });
    }
  });

  return declarations;
}
