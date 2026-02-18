import { LitElement, css, html } from "lit";
import { vanillaStyleSheet } from "../../styles/vanilla.js";
import "../multiselect/multiselect.js";

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
          min-height: calc(100vh - var(--navigation-height, 0px));

          &.is-drawer-hidden,
          &.is-drawer-expanded,
          &.is-drawer-collapsed {
            /* Reset to normal state */
          }
        }

        .p-side-navigation.is-sticky {
          max-height: calc(100dvh - var(--navigation-height, 0px));
          top: var(--navigation-height, 0px);
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
          z-index: 100;
        }

        .p-side-navigation__drawer {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          overflow-y: auto;
          pointer-events: auto;
          z-index: 101;
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
        .p-side-navigation.is-drawer-expanded .p-side-navigation__overlay {
          pointer-events: auto;
          visibility: visible;
        }

        .p-side-navigation.is-drawer-expanded .p-side-navigation__drawer {
          pointer-events: auto;
        }
      }
    `,
  ];

  static properties = {
    navItems: {
      type: Array,
      attribute: "nav-items",
      converter: {
        fromAttribute: (value) => {
          try {
            return JSON.parse(value);
          } catch {
            return [];
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
    _selectedTypes: { state: true },
  };

  constructor() {
    super();
    this.navItems = [];
    this.currentSlug = "";
    this.darkMode = false;
    this.expandedSidenavContainer = null;
    this.lastFocus = null;
    this.ignoreFocusChanges = false;
    this.focusAfterClose = null;

    // Initialize filters from localStorage or defaults
    this._selectedTypes = this._loadSelectedTypes();
  }

  _loadSelectedTypes() {
    try {
      const stored = localStorage.getItem("component-filter-types");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error loading types from localStorage:", e);
    }
    // Default: all types selected
    return [
      "Foundation",
      "Component",
      "Complex component",
      "Pattern",
      "Page",
      "Mental model",
    ];
  }

  _handleFilterChange(e) {
    const allItems = e.detail.items.flatMap((group) => group.items);

    this._selectedTypes = allItems
      .filter((item) => item.selected)
      .map((item) => item.value);

    // Save to localStorage
    try {
      localStorage.setItem(
        "component-filter-types",
        JSON.stringify(this._selectedTypes),
      );
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
  }

  _filterNavItems() {
    if (!this.navItems || this.navItems.length === 0) {
      return [];
    }

    return this.navItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          this._selectedTypes.includes(item.type),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }

  firstUpdated() {
    this.setupDrawerToggle();
  }

  trapFocus(event) {
    if (this.ignoreFocusChanges || !this.expandedSidenavContainer) return;
    const sidenavContainer =
      this.shadowRoot.querySelector(".p-side-navigation");
    if (!sidenavContainer.classList.contains("is-drawer-expanded")) return;
    const sidenavDrawer = sidenavContainer.querySelector(
      ".p-side-navigation__drawer",
    );

    if (sidenavDrawer.contains(event.target)) {
      this.lastFocus = event.target;
    } else {
      this.focusFirstDescendant(sidenavDrawer);
      if (this.lastFocus == this.shadowRoot.activeElement) {
        this.focusLastDescendant(sidenavDrawer);
      }
      this.lastFocus = this.shadowRoot.activeElement;
    }
  }

  attemptFocus(child) {
    if (child.focus) {
      this.ignoreFocusChanges = true;
      child.focus();
      this.ignoreFocusChanges = false;
      return this.shadowRoot.activeElement === child;
    }
    return false;
  }

  focusFirstDescendant(element) {
    for (var i = 0; i < element.childNodes.length; i++) {
      var child = element.childNodes[i];
      if (this.attemptFocus(child) || this.focusFirstDescendant(child)) {
        return true;
      }
    }
    return false;
  }

  focusLastDescendant(element) {
    for (var i = element.childNodes.length - 1; i >= 0; i--) {
      var child = element.childNodes[i];
      if (this.attemptFocus(child) || this.focusLastDescendant(child)) {
        return true;
      }
    }
    return false;
  }

  toggleDrawer(show) {
    const sideNavigation = this.shadowRoot.querySelector(".p-side-navigation");
    const toggleButtonOutsideDrawer = sideNavigation.querySelector(
      ".p-side-navigation__toggle",
    );
    const toggleButtonInsideDrawer = sideNavigation.querySelector(
      ".p-side-navigation__toggle--in-drawer",
    );

    this.expandedSidenavContainer = show ? sideNavigation : null;

    if (sideNavigation) {
      if (show) {
        sideNavigation.classList.remove("is-drawer-collapsed");
        sideNavigation.classList.add("is-drawer-expanded");
        sideNavigation.classList.remove("is-drawer-hidden");

        toggleButtonOutsideDrawer.setAttribute("aria-expanded", true);
        toggleButtonInsideDrawer.setAttribute("aria-expanded", true);
        this.focusAfterClose = toggleButtonOutsideDrawer;
        document.addEventListener("focus", this.trapFocus.bind(this), true);
      } else {
        sideNavigation.classList.remove("is-drawer-expanded");
        sideNavigation.classList.add("is-drawer-collapsed");

        toggleButtonOutsideDrawer.setAttribute("aria-expanded", false);
        toggleButtonInsideDrawer.setAttribute("aria-expanded", false);
        if (this.focusAfterClose && this.focusAfterClose.focus) {
          this.focusAfterClose.focus();
        }
        document.removeEventListener("focus", this.trapFocus.bind(this), true);
      }
    }
  }

  setupDrawerToggle() {
    const sideNavigation = this.shadowRoot.querySelector(".p-side-navigation");
    const toggles = this.shadowRoot.querySelectorAll(".js-drawer-toggle");
    const drawerEl = sideNavigation.querySelector(".p-side-navigation__drawer");

    // Handle animation end
    drawerEl.addEventListener("animationend", () => {
      if (!sideNavigation.classList.contains("is-drawer-expanded")) {
        sideNavigation.classList.add("is-drawer-hidden");
      }
    });

    // Handle Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.toggleDrawer(false);
      }
    });

    // Setup toggle buttons
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        sideNavigation.classList.remove("is-drawer-hidden");
        this.toggleDrawer(
          !sideNavigation.classList.contains("is-drawer-expanded"),
        );
      });
    });
  }

  isCurrentPage(slug) {
    return this.currentSlug === slug;
  }

  renderNavigationItem(item) {
    const href = `/${item.slug}`;
    const isCurrentPage = this.isCurrentPage(item.slug);

    return html`
      <li class="p-side-navigation__item">
        <a
          class="p-side-navigation__link ${isCurrentPage ? "is-active" : ""}"
          href="${href}"
          ${isCurrentPage ? 'aria-current="page"' : ""}
        >
          ${item.name}
        </a>
      </li>
    `;
  }

  render() {
    const filteredNavItems = this._filterNavItems();

    const filterGroups = [
      {
        heading: "Component type",
        items: [
          {
            label: "Foundation",
            value: "Foundation",
            selected: this._selectedTypes.includes("Foundation"),
          },
          {
            label: "Component",
            value: "Component",
            selected: this._selectedTypes.includes("Component"),
          },
          {
            label: "Complex component",
            value: "Complex component",
            selected: this._selectedTypes.includes("Complex component"),
          },
          {
            label: "Pattern",
            value: "Pattern",
            selected: this._selectedTypes.includes("Pattern"),
          },
          {
            label: "Page",
            value: "Page",
            selected: this._selectedTypes.includes("Page"),
          },
          {
            label: "Mental model",
            value: "Mental model",
            selected: this._selectedTypes.includes("Mental model"),
          },
        ],
      },
    ];

    if (!this.navItems || this.navItems.length === 0) {
      return html`
        <div
          class="p-side-navigation is-sticky is-drawer-hidden ${this.darkMode
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

          <nav class="p-side-navigation__drawer" aria-label="Side navigation">
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
      `;
    }

    return html`
      <div class="p-side-navigation is-sticky is-drawer-hidden" id="drawer">
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

        <nav class="p-side-navigation__drawer" aria-label="Side navigation">
          <div class="p-strip is-shallow">
            <div class="p-side-navigation__drawer-header">
              <button
                class="p-side-navigation__toggle--in-drawer js-drawer-toggle"
                aria-controls="drawer"
              >
                Toggle side navigation
              </button>
            </div>

            <div style="margin-bottom: 1rem;">
              <label class="p-side-navigation__heading" for="filter-components"
                >Filter components</label
              >
              <div style="padding: 0 1rem;">
                <multi-select
                  id="filter-components"
                  label="Filter components"
                  .groups=${filterGroups}
                  @selection-changed=${this._handleFilterChange}
                ></multi-select>
              </div>
            </div>

            ${filteredNavItems.length === 0
              ? html`<p style="padding: 0 1rem;">
                  No components match the selected filters.
                </p>`
              : filteredNavItems.map(
                  (group) => html`
                    <h3 class="p-side-navigation__heading">${group.type}</h3>
                    <ul class="p-side-navigation__list">
                      ${group.items.map((item) =>
                        this.renderNavigationItem(item),
                      )}
                    </ul>
                  `,
                )}
          </div>
        </nav>
      </div>
    `;
  }
}

customElements.define("side-navigation", SideNavigationComponent);
