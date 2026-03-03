import componentsCss from "./components.scss?inline";

// Create a constructible stylesheet from the component CSS.
// This is shared across all Lit web components via adoptedStyleSheets,
// so the full VF CSS is parsed once, not per-component.
const vanillaStyleSheet = new CSSStyleSheet();
vanillaStyleSheet.replaceSync(componentsCss);

export { vanillaStyleSheet };
