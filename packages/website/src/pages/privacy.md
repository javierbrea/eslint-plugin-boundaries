---
title: Privacy
description: What data jsboundaries.dev collects, what it stores in your browser, and your privacy rights.
---

# Privacy

## Who runs this site

jsboundaries.dev is run by Javier Brea, the maintainer of the open source project eslint-plugin-boundaries.

To contact him about privacy, or to exercise your rights, open an issue in the [project repository](https://github.com/javierbrea/eslint-plugin-boundaries/issues) asking for a private channel. Do not put any personal data in the issue: issues are public.

## What this page covers

This page covers the website www.jsboundaries.dev only.

## Analytics (Google Analytics 4)

The site uses Google Analytics 4 only on www.jsboundaries.dev, and only after you accept the "Analytics" category in the cookie banner or in "Cookie settings" (footer). Until then the site does not load any Google script. Deploy previews and copies of the site running elsewhere never load it.

Its purpose is to collect aggregated statistics about how the site is used — pages visited, how visitors arrive, approximate location, and device and browser — to improve the documentation.

The legal basis is your consent (GDPR Art. 6(1)(a)).

Google Analytics sets two cookies on `.jsboundaries.dev`: `_ga`, which distinguishes users, and `_ga_QDP350TYF0`, which keeps the session state. Each lasts up to 2 years by Google's default, though browsers shorten that if you do not come back (Chrome to 400 days, Safari to 7). Source: [Cookie usage on websites](https://support.google.com/analytics/answer/11397207).

Google Analytics 4 does not log or store IP addresses. For EU users, the IP address is used only to derive a coarse location and is then discarded (source: [EU-focused data and privacy](https://support.google.com/analytics/answer/12017362)).

Data retention in Google Analytics is set to 2 months.

The recipient of the data is Google. The data may be processed in the United States; Google LLC is certified under the EU-U.S. Data Privacy Framework. See [Google's privacy policy](https://policies.google.com/privacy).

To withdraw your consent, open "Cookie settings" in the footer and turn Analytics off. The site then stops sending data to Google Analytics at once and deletes the `_ga` and `_ga_QDP350TYF0` cookies. If the Google script was already loaded, it stays in the page until you reload or leave it, but sends nothing.

If your browser sends the Global Privacy Control signal before you make a choice, Analytics stays off and the banner does not open by itself. You can still turn Analytics on in "Cookie settings".

## Hosting (Netlify)

The site is static and hosted by Netlify. To serve each page and file, Netlify receives what any web server receives: your IP address, your browser's user agent, the URL requested and the referring page.

Netlify processes them as the site's service provider to deliver and protect the site. The legal basis is the legitimate interest in running the site (Art. 6(1)(f)).

Netlify sets no cookies on this site. See [Netlify's privacy policy](https://www.netlify.com/privacy/).

## Search (Algolia DocSearch)

Every page opens a connection to Algolia in advance, so that search answers fast: Algolia can see your IP address even if you never search. When you type in the search box, your query, together with your IP address and user agent, is sent to Algolia to return results from the `jsboundaries` index. The legal basis is the legitimate interest in running the site (Art. 6(1)(f)).

DocSearch keeps your recent and favorite searches in your browser's localStorage, under the `__DOCSEARCH_RECENT_SEARCHES__jsboundaries` and `__DOCSEARCH_FAVORITE_SEARCHES__jsboundaries` keys. They never leave your device. DocSearch sets no cookies.

## Live project figures

Some figures on the site are fetched by your browser directly from public APIs: the GitHub star count from api.github.com (shown in the navbar on every page and on the home page) and the npm monthly downloads from api.npmjs.org (shown on the home page). Those services receive your IP address and user agent. The legal basis is the legitimate interest in running the site (Art. 6(1)(f)).

The requests carry no credentials or cookies. The values are cached in your browser's localStorage for 24 hours to respect the rate limits of those APIs.

## GitHub Sponsor button

The [Acknowledgments](/docs/misc/acknowledgments/) page, in every version of the documentation, shows GitHub's Sponsor button, which your browser loads from github.com. GitHub receives your IP address, your browser's user agent and the address of this site. The legal basis is the legitimate interest in running the site (Art. 6(1)(f)). See the [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## What the site stores in your browser

| Name | Type | Purpose | Duration |
| --- | --- | --- | --- |
| `cc_cookie` | cookie | Your consent choice, its date and a random identifier of the choice, set by the consent banner whatever you choose | 182 days |
| `_ga` | cookie | Google Analytics: distinguishes users. Set only after you accept Analytics | Up to 2 years |
| `_ga_QDP350TYF0` | cookie | Google Analytics: keeps the session state. Set only after you accept Analytics | Up to 2 years |
| `theme-244` | localStorage | Your color mode choice (light or dark) | Until you delete it |
| `docs-preferred-version-default-244` | localStorage | The documentation version you last picked in the version menu, or through the banner of an older version | Until you delete it |
| `__DOCSEARCH_RECENT_SEARCHES__jsboundaries` | localStorage | Your recent searches, so the search box can show them again | Until you delete it |
| `__DOCSEARCH_FAVORITE_SEARCHES__jsboundaries` | localStorage | The searches you mark as favorites | Until you delete it |
| `github-stars:javierbrea/eslint-plugin-boundaries` | localStorage | Cached GitHub star count | 24 hours |
| `npm-downloads:eslint-plugin-boundaries` | localStorage | Cached npm monthly downloads | 24 hours |
| `algolia-client-js-<version>-Q6XU3R4537` | localStorage | The state of the Algolia servers that answer the search, set on the first search | Until you delete it |

Docusaurus, which builds the site, adds the `-244` suffix to the names of its own entries, and `<version>` is the version of the Algolia client that the search box uses. The localStorage entries stay on your device and are not sent anywhere. The cookies are sent back to the site with every request, as all cookies are, but nothing on the server reads them; the Google Analytics script sends the identifier in `_ga` to Google, as the Analytics section says.

The playground at [/playground/](/playground/) stores nothing in the browser: it keeps the project in the URL.

## Your rights

The site has no accounts or forms, and its maintainer holds no data of his own about you. Under the GDPR, this is what you can do:

- **Withdraw your consent** at any time in "Cookie settings". It does not affect what was collected before.
- **Delete what the site keeps in your browser**: clear the cookies and site data of www.jsboundaries.dev in your browser settings.
- **See or erase your Google Analytics data**: Google Analytics knows you only by the random identifier in your `_ga` cookie. Send its value through the private channel of [Who runs this site](#who-runs-this-site), and the maintainer can show you or delete the data that Google Analytics keeps under it. Without it, he cannot find your data.
- **The requests that Netlify, Algolia, GitHub and npm receive** are not linked to you on the maintainer's side. GitHub and npm receive them directly from your browser and handle them under their own privacy policies.
- **File a complaint** with the data protection authority of the EU country where you live or work.

## Changes to this page

This page may change. If the purposes of the analytics change, the banner will ask for your consent again.

Last updated: November 16, 2026.
