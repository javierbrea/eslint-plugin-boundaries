---
title: Privacy
description: What data jsboundaries.dev collects, what it stores in your browser, and your privacy rights.
---

import GoogleAnalyticsModeContent from "../components/site/GoogleAnalyticsModeContent/GoogleAnalyticsModeContent";

# Privacy

## Who runs this site

jsboundaries.dev is run by Javier Brea, the maintainer of the open source project eslint-plugin-boundaries.

To contact him about privacy, or to exercise your rights, open an issue in the [project repository](https://github.com/javierbrea/eslint-plugin-boundaries/issues) asking for a private channel. Do not put any personal data in the issue: issues are public.

## What this page covers

This page covers the website www.jsboundaries.dev only.

## Analytics (Google Analytics 4)

<GoogleAnalyticsModeContent modes={["opt-in"]}>

The site uses Google Analytics 4 only after you accept the "Analytics" category in the cookie banner or in "Cookie settings" (footer). Until then the site does not load any Google script.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-out"]}>

The site loads Google Analytics 4 on every visit, with no cookie banner, until you turn the "Analytics" category off in "Cookie settings" (footer). If you made a choice in the cookie banner of an earlier version of the site, the site keeps it: if you rejected Analytics there, it stays off.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["disabled"]}>

The site does not use Google Analytics: it loads no Google script and sets no Google cookie.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-in", "opt-out"]}>

Its purpose is to collect aggregated statistics about how the site is used — pages visited, how visitors arrive, approximate location, and device and browser — to improve the documentation.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-in"]}>

The legal basis is your consent (GDPR Art. 6(1)(a)).

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-in", "opt-out"]}>

Google Analytics sets two cookies on `.jsboundaries.dev`: `_ga`, which distinguishes users, and `_ga_QDP350TYF0`, which keeps the session state. Each lasts up to 2 years by Google's default, though browsers shorten that if you do not come back (Chrome to 400 days, Safari to 7). Source: [Cookie usage on websites](https://support.google.com/analytics/answer/11397207).

Google Analytics 4 does not log or store IP addresses. For EU users, the IP address is used only to derive a coarse location and is then discarded (source: [EU-focused data and privacy](https://support.google.com/analytics/answer/12017362)).

Data retention in Google Analytics is set to 2 months.

The recipient of the data is Google. The data may be processed in the United States; Google LLC is certified under the EU-U.S. Data Privacy Framework. See [Google's privacy policy](https://policies.google.com/privacy).

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-in"]}>

To withdraw your consent, open "Cookie settings" in the footer and turn Analytics off. The site then stops sending data to Google Analytics at once and deletes the `_ga` and `_ga_QDP350TYF0` cookies. If the Google script was already loaded, it stays in the page until you reload or leave it, but sends nothing.

If your browser sends the Global Privacy Control signal before you make a choice, Google Analytics stays off and the banner does not open by itself. You can still turn it on in "Cookie settings".

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-out"]}>

To turn Google Analytics off, open "Cookie settings" in the footer and turn Analytics off. The site then stops sending data to Google Analytics at once and deletes the `_ga` and `_ga_QDP350TYF0` cookies. If the Google script was already loaded, it stays in the page until you reload or leave it, but sends nothing. The site keeps your choice in the `cc_cookie` cookie.

Global Privacy Control does not turn Google Analytics off. You can turn it off in "Cookie settings".

</GoogleAnalyticsModeContent>

## Visit statistics (Cloudflare Web Analytics)

<GoogleAnalyticsModeContent modes={["opt-in"]}>

Every page of www.jsboundaries.dev loads Cloudflare Web Analytics without asking, to count visits and page views and to measure how fast the pages load. It counts every visitor, including those who do not accept Google Analytics.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-out"]}>

Every page of www.jsboundaries.dev loads Cloudflare Web Analytics without asking, to count visits and page views and to measure how fast the pages load. It counts every visitor, including those who turn Google Analytics off.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["disabled"]}>

Every page of www.jsboundaries.dev loads Cloudflare Web Analytics without asking, to count visits and page views and to measure how fast the pages load. It counts every visitor.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-in", "opt-out"]}>

Cloudflare Web Analytics stores nothing in your browser and reads none of its storage: no cookies, localStorage, sessionStorage or IndexedDB (source: [Cloudflare's documentation of the beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)). That is why it does not ask for your consent, and why neither your choice in "Cookie settings" nor the Global Privacy Control signal turns it off.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["disabled"]}>

Cloudflare Web Analytics stores nothing in your browser and reads none of its storage: no cookies, localStorage, sessionStorage or IndexedDB (source: [Cloudflare's documentation of the beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)). That is why it does not ask for your consent, and why the Global Privacy Control signal does not turn it off.

</GoogleAnalyticsModeContent>

For each page you visit, including those the site opens without a full reload, your browser sends Cloudflare the address of the page and of the previous page (the referrer), a random identifier of that page load, the engine and version of your browser and the version of your operating system, how much memory the page uses, and how fast the page loads and responds: its load and paint timings and its Core Web Vitals. Some of those measures point at the element of the page they measured, such as the largest element painted or the one you clicked. As any request does, it also gives Cloudflare your IP address and your browser's user agent.

Cloudflare discards your IP address at the nearest Cloudflare data center and does not store it in its core databases or logs (source: [Cloudflare's documentation of the beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)).

Cloudflare keeps the full data for 7 days; after that, it keeps the data aggregated down to around 10% (source: [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/)).

The legal basis is the legitimate interest in knowing how much the site is used (GDPR Art. 6(1)(f)).

The recipient of the data is Cloudflare. The data may be processed in a country or region other than the one where it originated; Cloudflare, Inc. is certified under the EU-U.S. Data Privacy Framework. See [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).

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

<GoogleAnalyticsModeContent modes={["opt-in", "opt-out"]}>

The site sets these cookies:

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-in"]}>

| Name | Type | Purpose | Duration |
| --- | --- | --- | --- |
| `cc_cookie` | cookie | Your consent choice, its date and a random identifier of the choice, set by the consent banner whatever you choose | 182 days |
| `_ga` | cookie | Google Analytics: distinguishes users. Set only after you accept Analytics | Up to 2 years |
| `_ga_QDP350TYF0` | cookie | Google Analytics: keeps the session state. Set only after you accept Analytics | Up to 2 years |

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-out"]}>

| Name | Type | Purpose | Duration |
| --- | --- | --- | --- |
| `cc_cookie` | cookie | Your choice in "Cookie settings" (or in the cookie banner of an earlier version of the site), its date and a random identifier of the choice, set when you save it | 182 days |
| `_ga` | cookie | Google Analytics: distinguishes users. Set unless you turn Analytics off | Up to 2 years |
| `_ga_QDP350TYF0` | cookie | Google Analytics: keeps the session state. Set unless you turn Analytics off | Up to 2 years |

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["disabled"]}>

The site sets no cookies. Cookies that an earlier version of the site set, such as `cc_cookie` and `_ga`, stay in your browser until they expire or you delete them, and nothing reads them.

</GoogleAnalyticsModeContent>

The site keeps these entries in your browser's localStorage:

| Name | Type | Purpose | Duration |
| --- | --- | --- | --- |
| `theme-244` | localStorage | Your color mode choice (light or dark) | Until you delete it |
| `docs-preferred-version-default-244` | localStorage | The documentation version you last picked in the version menu, or through the banner of an older version | Until you delete it |
| `__DOCSEARCH_RECENT_SEARCHES__jsboundaries` | localStorage | Your recent searches, so the search box can show them again | Until you delete it |
| `__DOCSEARCH_FAVORITE_SEARCHES__jsboundaries` | localStorage | The searches you mark as favorites | Until you delete it |
| `github-stars:javierbrea/eslint-plugin-boundaries` | localStorage | Cached GitHub star count | 24 hours |
| `npm-downloads:eslint-plugin-boundaries` | localStorage | Cached npm monthly downloads | 24 hours |
| `algolia-client-js-<version>-Q6XU3R4537` | localStorage | The state of the Algolia servers that answer the search, set on the first search | Until you delete it |

Docusaurus, which builds the site, adds the `-244` suffix to the names of its own entries, and `<version>` is the version of the Algolia client that the search box uses. The localStorage entries stay on your device and are not sent anywhere.

<GoogleAnalyticsModeContent modes={["opt-in", "opt-out"]}>

The cookies are sent back to the site with every request, as all cookies are, but nothing on the server reads them; the Google Analytics script sends the identifier in `_ga` to Google, as the [Google Analytics section](#analytics-google-analytics-4) says.

</GoogleAnalyticsModeContent>

The playground at [/playground/](/playground/) stores nothing in the browser: it keeps the project in the URL.

## Your rights

The site has no accounts or forms, and its maintainer holds no data of his own about you. Under the GDPR, this is what you can do:

<GoogleAnalyticsModeContent modes={["opt-in"]}>

- **Withdraw your consent** at any time in "Cookie settings". It does not affect what was collected before.
- **Delete what the site keeps in your browser**: clear the cookies and site data of www.jsboundaries.dev in your browser settings.
- **See or erase your Google Analytics data**: Google Analytics knows you only by the random identifier in your `_ga` cookie. Send its value through the private channel of [Who runs this site](#who-runs-this-site), and the maintainer can show you or delete the data that Google Analytics keeps under it. Without it, he cannot find your data.
- **The requests that Netlify, Cloudflare, Algolia, GitHub and npm receive** are not linked to you on the maintainer's side. GitHub and npm receive them directly from your browser and handle them under their own privacy policies.
- **File a complaint** with the data protection authority of the EU country where you live or work.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-out", "disabled"]}>

- **Delete what the site keeps in your browser**: clear the cookies and site data of www.jsboundaries.dev in your browser settings.
- **See or erase your Google Analytics data**: Google Analytics knows you only by the random identifier in your `_ga` cookie. Send its value through the private channel of [Who runs this site](#who-runs-this-site), and the maintainer can show you or delete the data that Google Analytics keeps under it. Without it, he cannot find your data.
- **The requests that Netlify, Cloudflare, Algolia, GitHub and npm receive** are not linked to you on the maintainer's side. GitHub and npm receive them directly from your browser and handle them under their own privacy policies.
- **File a complaint** with the data protection authority of the EU country where you live or work.

</GoogleAnalyticsModeContent>

## Changes to this page

<GoogleAnalyticsModeContent modes={["opt-in"]}>

This page may change. If the purposes of Google Analytics change, the banner will ask for your consent again.

</GoogleAnalyticsModeContent>

<GoogleAnalyticsModeContent modes={["opt-out", "disabled"]}>

This page may change.

</GoogleAnalyticsModeContent>

Last updated: November 19, 2026.
