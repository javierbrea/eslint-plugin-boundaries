---
paths:
  - "packages/website/scripts/social-card.html"
  - "packages/website/src/css/tokens.css"
  - "packages/website/src/css/fonts.css"
  - "packages/website/static/fonts/**"
  - "packages/website/static/img/logo.svg"
  - "packages/website/src/components/home/Hero/Hero.tsx"
  - "packages/website/src/components/home/Hero/BlueprintSheet.*"
---

# Social card

The social card, `packages/website/static/img/og-image.png`, is rendered from `packages/website/scripts/social-card.html`, which links the site's tokens, fonts and logo. The build does not regenerate it.

- The card reproduces the hero's headline (`Hero.tsx`) and the final frame of its drawing (`BlueprintSheet`). A change to either updates `social-card.html` to match.
- A change to `social-card.html`, or to a token, font or logo it renders, runs `pnpm --filter website social-card` and commits the regenerated `og-image.png` in the same change.
