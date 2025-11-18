import { LitElement, css, html } from "lit"
import { vanillaStyleSheet } from "../../styles/vanilla.js"

export class SideNavigationComponent extends LitElement {
    static styles = [
        vanillaStyleSheet,
        css`
            :host {
                display: block;
                width: 100%;
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
                    class="p-side-navigation ${this.darkMode ? "is-dark" : ""}"
                >
                    <nav
                        class="p-side-navigation__drawer"
                        aria-label="Side navigation"
                    >
                        <p>No navigation items available</p>
                    </nav>
                </div>
            `
        }

        return html`
            <div class="p-side-navigation ${this.darkMode ? "is-dark" : ""}">
                <nav
                    class="p-side-navigation__drawer"
                    aria-label="Side navigation"
                >
                    <h3 class="p-side-navigation__heading">Components</h3>
                    <ul class="p-side-navigation__list">
                        ${this.navItems.map((item) =>
                            this.renderNavigationItem(item)
                        )}
                    </ul>
                </nav>
            </div>
        `
    }
}

customElements.define("side-navigation", SideNavigationComponent)
