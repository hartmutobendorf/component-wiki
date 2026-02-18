import { LitElement, css, html } from "lit";
import { vanillaStyleSheet } from "../../styles/vanilla.js";

export class SideNavigationComponent extends LitElement {
  static styles = [
    vanillaStyleSheet,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      @media (min-width: 1037px) {
        .p-side-navigation__toggle,
        .p-side-navigation__toggle--in-drawer,
        .p-side-navigation__overlay {
          display: none !important;
        }

        .p-side-navigation__drawer-header {
          display: none;
        }

        .p-side-navigation--accordion {
          min-height: calc(100vh - var(--navigation-height, 0px));

          &.is-drawer-hidden,
          &.is-drawer-expanded,
          &.is-drawer-collapsed {
          }
        }

        .p-side-navigation--accordion.is-sticky {
          max-height: calc(100dvh - var(--navigation-height, 0px));
          top: var(--navigation-height, 0px);
        }

        .p-side-navigation__drawer {
          position: static;
          height: auto;
        }
      }

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

        .p-side-navigation--accordion.is-drawer-expanded
          .p-side-navigation__overlay {
          pointer-events: auto;
          visibility: visible;
        }

        .p-side-navigation--accordion.is-drawer-expanded
          .p-side-navigation__drawer {
          pointer-events: auto;
        }
      }

      /* Align section headings (Concept/Construct) with the chevron */
      .p-side-navigation--accordion .p-side-navigation__heading {
        padding-left: 1rem;
      }

      /* Extend list border to align with the chevron */
      .p-side-navigation--accordion .p-side-navigation__list::after {
        left: 1rem;
      }

      .p-side-navigation__accordion-button {
        font-weight: bold;
        color: #000;
      }

      /* Align child links with accordion button text by removing the extra
         nesting indent. Vanilla sets nested accordion links to 4rem / 4.5rem.
         The accordion button itself uses 3rem / 3rem (accordion-offset only).
         Override with matching specificity to align child text with button text. */
      .p-side-navigation--accordion .p-side-navigation__item .p-side-navigation__item .p-side-navigation__link {
        padding-left: 3rem;
      }
      @media (min-width: 620px) {
        .p-side-navigation--accordion .p-side-navigation__item .p-side-navigation__item .p-side-navigation__link {
          padding-left: 3rem;
        }
      }
    `,
  ];

  static properties = {
    navData: {
      type: Object,
      attribute: "nav-data",
      converter: {
        fromAttribute: (value) => {
          try {
            return JSON.parse(value);
          } catch {
            return { sections: [] };
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
    _collapsedGroups: { state: true },
  };

  constructor() {
    super();
    this.navData = { sections: [] };
    this.currentSlug = "";
    this.darkMode = false;
    this.expandedSidenavContainer = null;
    this.lastFocus = null;
    this.ignoreFocusChanges = false;
    this.focusAfterClose = null;
    // All groups are expanded by default; collapsed ones are tracked here
    this._collapsedGroups = this._loadCollapsedGroups();
  }

  _loadCollapsedGroups() {
    try {
      const stored = sessionStorage.getItem("side-nav-collapsed-groups");
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
    return new Set();
  }

  _saveCollapsedGroups() {
    try {
      sessionStorage.setItem(
        "side-nav-collapsed-groups",
        JSON.stringify([...this._collapsedGroups]),
      );
    } catch (e) {
      // ignore
    }
  }

  _toggleGroup(groupKey) {
    const next = new Set(this._collapsedGroups);
    if (next.has(groupKey)) {
      next.delete(groupKey);
    } else {
      next.add(groupKey);
    }
    this._collapsedGroups = next;
    this._saveCollapsedGroups();
  }

  firstUpdated() {
    this.setupDrawerToggle();
  }

  trapFocus(event) {
    if (this.ignoreFocusChanges || !this.expandedSidenavContainer) return;
    const sidenavContainer = this.shadowRoot.querySelector(
      ".p-side-navigation--accordion",
    );
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
    const sideNavigation = this.shadowRoot.querySelector(
      ".p-side-navigation--accordion",
    );
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
    const sideNavigation = this.shadowRoot.querySelector(
      ".p-side-navigation--accordion",
    );
    const toggles = this.shadowRoot.querySelectorAll(".js-drawer-toggle");
    const drawerEl = sideNavigation.querySelector(
      ".p-side-navigation__drawer",
    );

    drawerEl.addEventListener("animationend", () => {
      if (!sideNavigation.classList.contains("is-drawer-expanded")) {
        sideNavigation.classList.add("is-drawer-hidden");
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.toggleDrawer(false);
      }
    });

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

  renderAccordionGroup(group, sectionHeading) {
    const groupKey = `${sectionHeading}/${group.type}`;
    const isExpanded = !this._collapsedGroups.has(groupKey);

    return html`
      <li class="p-side-navigation__item">
        <button
          class="p-side-navigation__accordion-button"
          aria-expanded="${isExpanded ? "true" : "false"}"
          @click=${() => this._toggleGroup(groupKey)}
        >
          ${group.type}
        </button>
        <ul
          class="p-side-navigation__list"
          aria-expanded="${isExpanded ? "true" : "false"}"
        >
          ${group.items.map((item) => this.renderNavigationItem(item))}
        </ul>
      </li>
    `;
  }

  render() {
    const sections =
      this.navData && this.navData.sections ? this.navData.sections : [];
    const visibleSections = sections.filter(
      (s) => s.items && s.items.length > 0,
    );

    if (visibleSections.length === 0) {
      return html`
        <div
          class="p-side-navigation--accordion is-sticky is-drawer-hidden ${this
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

          <nav class="p-side-navigation__drawer" aria-label="Side navigation">
            <div class="p-side-navigation__drawer-header">
              <button
                class="p-side-navigation__toggle--in-drawer js-drawer-toggle"
                aria-controls="drawer"
              >
                Toggle side navigation
              </button>
            </div>
            <p style="padding: 0 1rem;">No navigation items available</p>
          </nav>
        </div>
      `;
    }

    return html`
      <div
        class="p-side-navigation--accordion is-sticky is-drawer-hidden"
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
          <div class="p-side-navigation__drawer-header">
            <button
              class="p-side-navigation__toggle--in-drawer js-drawer-toggle"
              aria-controls="drawer"
            >
              Toggle side navigation
            </button>
          </div>

          <div style="padding-top: 1.5rem;"></div>

          ${visibleSections.map(
            (section) => html`
              <h3 class="p-side-navigation__heading p-text--small-caps">${section.heading}</h3>
              <ul class="p-side-navigation__list">
                ${section.items.map((group) =>
                  this.renderAccordionGroup(group, section.heading),
                )}
              </ul>
            `,
          )}
        </nav>
      </div>
    `;
  }
}

customElements.define("side-navigation", SideNavigationComponent);
