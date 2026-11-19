import type { ClientModule } from "@docusaurus/types";

import { disableAnalytics, enableAnalytics, sendPageView } from "./analytics";
import {
  ANALYTICS_CATEGORY,
  ANALYTICS_TRACKING_ID,
  CONSENT_LABELS,
  COOKIE_SETTINGS_ATTRIBUTE,
  PRODUCTION_HOSTNAME,
} from "./consent.constants";

// Client modules are also evaluated during the server render, where there is no
// document. The consent library is loaded with a dynamic import, so it stays a
// chunk of its own and the server render never touches it.
if (typeof document !== "undefined") {
  const cookieConsentReady = import("vanilla-cookieconsent")
    .then(async (cookieConsent) => {
      const { acceptedCategory, run } = cookieConsent;

      const syncAnalytics = (): void => {
        if (acceptedCategory(ANALYTICS_CATEGORY)) {
          enableAnalytics();
        } else {
          disableAnalytics();
        }
      };

      // The library shows its modals with these classes on <html>, and
      // Docusaurus rewrites the class attribute of <html> on hydration and on
      // every client-side navigation, which wipes them
      const MODAL_CLASSES = {
        consentModal: "show--consent",
        preferencesModal: "show--preferences",
      } as const;

      const visibleModals = new Set<keyof typeof MODAL_CLASSES>();

      // Adds back the class of each visible modal that a rewrite removed.
      // Adding only what is missing keeps the MutationObserver below from looping
      const restoreModalClasses = (): void => {
        const { classList } = document.documentElement;
        for (const modalName of visibleModals) {
          const modalClass = MODAL_CLASSES[modalName];
          if (!classList.contains(modalClass)) {
            classList.add(modalClass);
          }
        }
      };

      new MutationObserver(restoreModalClasses).observe(
        document.documentElement,
        {
          attributes: true,
          attributeFilter: ["class"],
        }
      );

      await run({
        categories: {
          necessary: {
            enabled: true,
            readOnly: true,
          },
          [ANALYTICS_CATEGORY]: {
            // Erases the `_ga` cookies that gtag.js sets on the parent domain `.jsboundaries.dev`: the eraser reaches it only because PRODUCTION_HOSTNAME starts with `www.`
            autoClear: {
              cookies: [{ name: /^_ga/ }],
            },
          },
        },
        // A browser that sends Global Privacy Control keeps the analytics
        // category off and the consent modal closed until the user chooses
        respectGpc: true,
        onConsent: syncAnalytics,
        onChange: syncAnalytics,
        onModalShow: ({ modalName }) => {
          visibleModals.add(modalName);
          restoreModalClasses();
        },
        onModalHide: ({ modalName }) => {
          visibleModals.delete(modalName);
        },
        guiOptions: {
          consentModal: {
            layout: "box",
            position: "bottom left",
            equalWeightButtons: true,
            flipButtons: false,
          },
          preferencesModal: {
            layout: "box",
            equalWeightButtons: true,
          },
        },
        language: {
          default: "en",
          translations: {
            en: {
              consentModal: {
                title: CONSENT_LABELS.consentTitle,
                description: `${CONSENT_LABELS.consentQuestion} Details in the <a href="/privacy/">Privacy page</a>.`,
                acceptAllBtn: CONSENT_LABELS.acceptAll,
                acceptNecessaryBtn: CONSENT_LABELS.rejectAll,
              },
              preferencesModal: {
                title: CONSENT_LABELS.preferencesTitle,
                acceptAllBtn: CONSENT_LABELS.acceptAll,
                acceptNecessaryBtn: CONSENT_LABELS.rejectAll,
                savePreferencesBtn: CONSENT_LABELS.savePreferences,
                closeIconLabel: CONSENT_LABELS.close,
                sections: [
                  {
                    title: "Cookie usage",
                    description:
                      "This site stores your choices in your browser and uses them only for what each section describes.",
                  },
                  {
                    title: "Strictly necessary",
                    description:
                      "The <code>cc_cookie</code> cookie keeps your consent choice for 182 days, whatever you choose, so the banner does not ask again on every visit.",
                    linkedCategory: "necessary",
                  },
                  {
                    title: CONSENT_LABELS.analyticsSection,
                    description: `Google Analytics 4 collects aggregated statistics about how the documentation is used. It runs only on ${PRODUCTION_HOSTNAME} and only if you accept, and it sets the <code>_ga</code> and <code>_ga_${ANALYTICS_TRACKING_ID.replace(/^G-/, "")}</code> cookies.`,
                    linkedCategory: ANALYTICS_CATEGORY,
                  },
                  {
                    title: CONSENT_LABELS.webAnalyticsSection,
                    description: `Cloudflare Web Analytics counts the visits and page views of ${PRODUCTION_HOSTNAME} and measures how fast its pages load, for every visitor. It sets no cookies and stores nothing in your browser, so it runs whatever you choose here.`,
                  },
                  {
                    title: "More information",
                    description:
                      'The <a href="/privacy/">Privacy page</a> says what the site collects, what it keeps in your browser and what your rights are.',
                  },
                ],
              },
            },
          },
        },
      });

      return cookieConsent;
    })
    // When the library cannot load, the site stays without banner and without analytics, the safe state
    .catch(() => undefined);

  // The footer re-renders on every client-side navigation, so the library's
  // `data-cc` binding, done once at run() time, cannot be used: one delegated
  // listener on document keeps the button working after every navigation, and a
  // click during the import still opens the preferences once the library is ready
  document.addEventListener("click", (clickEvent) => {
    const { target } = clickEvent;
    if (
      !(target instanceof Element) ||
      !target.closest(`[${COOKIE_SETTINGS_ATTRIBUTE}]`)
    ) {
      return;
    }
    void cookieConsentReady.then((cookieConsent) => {
      cookieConsent?.showPreferences();
    });
  });
}

const clientModule: ClientModule = {
  onRouteDidUpdate({ location: newLocation, previousLocation }) {
    if (
      previousLocation &&
      (newLocation.pathname !== previousLocation.pathname ||
        newLocation.search !== previousLocation.search ||
        newLocation.hash !== previousLocation.hash)
    ) {
      // Deferred so that the document title is already the new page's, as the
      // client module of @docusaurus/plugin-google-gtag does
      setTimeout(() => {
        sendPageView(
          newLocation.pathname + newLocation.search + newLocation.hash
        );
      });
    }
  },
};

export default clientModule;
