import componentsCss from "./components.scss?inline"

// Create a constructible stylesheet from the component CSS
const vanillaStyleSheet = new CSSStyleSheet()
vanillaStyleSheet.replaceSync(componentsCss)

// Export the constructible stylesheet - Lit can use CSSStyleSheet objects directly
export { vanillaStyleSheet }
