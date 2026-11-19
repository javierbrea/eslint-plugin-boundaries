import { loadWebAnalytics } from "./analytics";

// Loads the Cloudflare Web Analytics beacon. The server render has no document.
// The beacon stores nothing in the browser, so it loads whatever the consent
// choice, and it counts client-side navigations itself, so this module has no
// onRouteDidUpdate.
if (typeof document !== "undefined") {
  loadWebAnalytics();
}
