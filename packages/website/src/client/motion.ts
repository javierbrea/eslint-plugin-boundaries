// Marks that JS runs, so reveal-on-scroll may hide elements until they enter the viewport.
// Without the mark (SSR HTML, no JS) everything stays visible. It is an attribute, not a class,
// because Docusaurus rewrites the class of <html> on every navigation.
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-jsb-js", "");
}
