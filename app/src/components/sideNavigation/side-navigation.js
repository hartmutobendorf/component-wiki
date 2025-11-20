import { LitElement, css, html } from "lit"
import { vanillaStyleSheet } from "../../styles/vanilla.js"

export class SideNavigationComponent extends LitElement {
    static styles = [
        vanillaStyleSheet,
        css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }

            /* Desktop: Show side nav normally, hide toggle and drawer features */
            /* Using Vanilla's navigation threshold (1036px) for consistency */
            @media (min-width: 1037px) {
                .p-side-navigation__toggle,
                .p-side-navigation__toggle--in-drawer,
                .p-side-navigation__overlay {
                    display: none !important;
                }

                .p-side-navigation__drawer-header {
                    display: none;
                }

                .p-side-navigation {
                    /* Remove drawer classes on desktop */
                    &.is-drawer-hidden,
                    &.is-drawer-expanded,
                    &.is-drawer-collapsed {
                        /* Reset to normal state */
                    }
                }

                .p-side-navigation__drawer {
                    position: static;
                    height: auto;
                }
            }

            /* Mobile: Use drawer pattern */
            @media (max-width: 1036px) {
                :host {
                    pointer-events: none;
                }

                .p-side-navigation__toggle {
                    pointer-events: auto;
                    position: fixed;
                    top: 0.75rem;
                    left: 1rem;
                    z-index: 201;
                }

                .p-side-navigation__drawer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    overflow-y: auto;
                    pointer-events: auto;
                }

                .p-side-navigation__overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    visibility: hidden;
                }

                /* Only show and enable overlay when drawer is expanded */
                .p-side-navigation.is-drawer-expanded
                    .p-side-navigation__overlay {
                    pointer-events: auto;
                    visibility: visible;
                }

                .p-side-navigation.is-drawer-expanded
                    .p-side-navigation__drawer {
                    pointer-events: auto;
                }
            }
        `,
    ]

    static properties = {
        navItems: {
            type: Array,
            attribute: "nav-items",
            converter: {
                fromAttribute: (value) => {
                    try {
                        return JSON.parse(value)
                    } catch {
                        return []
                    }
                },
            },
        },
        currentSlug: {
            type: String,
            attribute: "current-slug",
        },
        darkMode: {
            type: Boolean,
            attribute: "dark-mode",
        },
    }

    constructor() {
        super()
        this.navItems = []
        this.currentSlug = ""
        this.darkMode = false
        this.expandedSidenavContainer = null
        this.lastFocus = null
        this.ignoreFocusChanges = false
        this.focusAfterClose = null
    }

    firstUpdated() {
        this.setupDrawerToggle()
    }

    trapFocus(event) {
        if (this.ignoreFocusChanges || !this.expandedSidenavContainer) return
        const sidenavContainer = this.shadowRoot.querySelector(
            ".p-side-navigation"
        )
        if (!sidenavContainer.classList.contains("is-drawer-expanded")) return
        const sidenavDrawer = sidenavContainer.querySelector(
            ".p-side-navigation__drawer"
        )

        if (sidenavDrawer.contains(event.target)) {
            this.lastFocus = event.target
        } else {
            this.focusFirstDescendant(sidenavDrawer)
            if (this.lastFocus == this.shadowRoot.activeElement) {
                this.focusLastDescendant(sidenavDrawer)
            }
            this.lastFocus = this.shadowRoot.activeElement
        }
    }

    attemptFocus(child) {
        if (child.focus) {
            this.ignoreFocusChanges = true
            child.focus()
            this.ignoreFocusChanges = false
            return this.shadowRoot.activeElement === child
        }
        return false
    }

    focusFirstDescendant(element) {
        for (var i = 0; i < element.childNodes.length; i++) {
            var child = element.childNodes[i]
            if (this.attemptFocus(child) || this.focusFirstDescendant(child)) {
                return true
            }
        }
        return false
    }

    focusLastDescendant(element) {
        for (var i = element.childNodes.length - 1; i >= 0; i--) {
            var child = element.childNodes[i]
            if (this.attemptFocus(child) || this.focusLastDescendant(child)) {
                return true
            }
        }
        return false
    }

    toggleDrawer(show) {
        const sideNavigation = this.shadowRoot.querySelector(
            ".p-side-navigation"
        )
        const toggleButtonOutsideDrawer = sideNavigation.querySelector(
            ".p-side-navigation__toggle"
        )
        const toggleButtonInsideDrawer = sideNavigation.querySelector(
            ".p-side-navigation__toggle--in-drawer"
        )

        this.expandedSidenavContainer = show ? sideNavigation : null

        if (sideNavigation) {
            if (show) {
                sideNavigation.classList.remove("is-drawer-collapsed")
                sideNavigation.classList.add("is-drawer-expanded")
                sideNavigation.classList.remove("is-drawer-hidden")

                toggleButtonOutsideDrawer.setAttribute("aria-expanded", true)
                toggleButtonInsideDrawer.setAttribute("aria-expanded", true)
                this.focusAfterClose = toggleButtonOutsideDrawer
                document.addEventListener(
                    "focus",
                    this.trapFocus.bind(this),
                    true
                )
            } else {
                sideNavigation.classList.remove("is-drawer-expanded")
                sideNavigation.classList.add("is-drawer-collapsed")

                toggleButtonOutsideDrawer.setAttribute("aria-expanded", false)
                toggleButtonInsideDrawer.setAttribute("aria-expanded", false)
                if (this.focusAfterClose && this.focusAfterClose.focus) {
                    this.focusAfterClose.focus()
                }
                document.removeEventListener(
                    "focus",
                    this.trapFocus.bind(this),
                    true
                )
            }
        }
    }

    setupDrawerToggle() {
        const sideNavigation = this.shadowRoot.querySelector(
            ".p-side-navigation"
        )
        const toggles = this.shadowRoot.querySelectorAll(".js-drawer-toggle")
        const drawerEl = sideNavigation.querySelector(
            ".p-side-navigation__drawer"
        )

        // Handle animation end
        drawerEl.addEventListener("animationend", () => {
            if (!sideNavigation.classList.contains("is-drawer-expanded")) {
                sideNavigation.classList.add("is-drawer-hidden")
            }
        })

        // Handle Escape key
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.toggleDrawer(false)
            }
        })

        // Setup toggle buttons
        toggles.forEach((toggle) => {
            toggle.addEventListener("click", (event) => {
                event.preventDefault()
                sideNavigation.classList.remove("is-drawer-hidden")
                this.toggleDrawer(
                    !sideNavigation.classList.contains("is-drawer-expanded")
                )
            })
        })
    }

    isCurrentPage(slug) {
        return this.currentSlug === slug
    }

    renderNavigationItem(item) {
        const href = `/${item.slug}`
        const isCurrentPage = this.isCurrentPage(item.slug)

        return html`
            <li class="p-side-navigation__item">
                <a
                    class="p-side-navigation__link ${isCurrentPage
                        ? "is-active"
                        : ""}"
                    href="${href}"
                    ${isCurrentPage ? 'aria-current="page"' : ""}
                >
                    ${item.name}
                </a>
            </li>
        `
    }

    render() {
        if (!this.navItems || this.navItems.length === 0) {
            return html`
                <div
                    class="p-side-navigation is-sticky is-drawer-hidden ${this
                        .darkMode
                        ? "is-dark"
                        : ""}"
                    id="drawer"
                >
                    <button
                        class="p-side-navigation__toggle js-drawer-toggle"
                        aria-controls="drawer"
                    >
                        Toggle side navigation
                    </button>

                    <div
                        class="p-side-navigation__overlay js-drawer-toggle"
                        aria-controls="drawer"
                    ></div>

                    <nav
                        class="p-side-navigation__drawer"
                        aria-label="Side navigation"
                    >
                        <div class="p-strip is-shallow">
                            <div class="p-side-navigation__drawer-header">
                                <button
                                    class="p-side-navigation__toggle--in-drawer js-drawer-toggle"
                                    aria-controls="drawer"
                                >
                                    Toggle side navigation
                                </button>
                            </div>
                            <p>No navigation items available</p>
                        </div>
                    </nav>
                </div>
            `
        }

        return html`
            <div
                class="p-side-navigation is-sticky is-drawer-hidden"
                id="drawer"
            >
                <button
                    class="p-side-navigation__toggle js-drawer-toggle"
                    aria-controls="drawer"
                >
                    Toggle side navigation
                </button>

                <div
                    class="p-side-navigation__overlay js-drawer-toggle"
                    aria-controls="drawer"
                ></div>

                <nav
                    class="p-side-navigation__drawer"
                    aria-label="Side navigation"
                >
                    <div class="p-strip is-shallow">
                        <div class="p-side-navigation__drawer-header">
                            <button
                                class="p-side-navigation__toggle--in-drawer js-drawer-toggle"
                                aria-controls="drawer"
                            >
                                Toggle side navigation
                            </button>
                        </div>

                        <h3 class="p-side-navigation__heading">Components</h3>
                        <ul class="p-side-navigation__list">
                            ${this.navItems.map((item) =>
                                this.renderNavigationItem(item)
                            )}
                        </ul>
                    </div>
                </nav>
            </div>
        `
    }
}

customElements.define("side-navigation", SideNavigationComponent)
