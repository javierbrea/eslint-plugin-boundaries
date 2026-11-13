---
paths:
  - "packages/website/scripts/social-card.html"
  - "packages/website/scripts/social-card.mjs"
  - "packages/design-tokens/tokens.css"
  - "packages/design-tokens/fonts.css"
  - "packages/design-tokens/static/fonts/**"
  - "packages/website/static/img/logo.svg"
  - "packages/website/src/components/home/Hero/Hero.*"
  - "packages/website/src/components/home/Hero/BlueprintSheet.*"
---

# Social card

The social card, `packages/website/static/img/og-image.png`, is rendered from `packages/website/scripts/social-card.html`, which links the tokens and fonts of `@boundaries/design-tokens` and the site's logo. The build does not regenerate it.

- The card reproduces the hero's headline and background (`Hero.*`) and the final frame of its drawing (`BlueprintSheet`). A change to either updates `social-card.html` to match.
- A change to `social-card.html` or `social-card.mjs`, or to a token, font or logo the card renders, runs `pnpm --filter website social-card` and commits the regenerated `og-image.png` in the same change.
