import { LitElement, css, html } from "lit";
import { property, state } from "lit/decorators.js";
import { vanillaStyleSheet } from "../../styles/vanilla.ts";
import type { NavData, NavGroup, NavItem } from "../../utils/nav-data.js";

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
      .p-side-navigation--accordion
        .p-side-navigation__item
        .p-side-navigation__item
        .p-side-navigation__link {
        padding-left: 3rem;
      }
      @media (min-width: 620px) {
        .p-side-navigation--accordion
          .p-side-navigation__item
          .p-side-navigation__item
          .p-side-navigation__link {
          padding-left: 3rem;
        }
      }

      .wiki-side-nav-spacer {
        padding-top: 1.5rem;
      }

      .wiki-side-nav-empty {
        padding: 0 1rem;
      }
    `,
  ];

  @property({
    type: Object,
    attribute: "nav-data",
    converter: {
      fromAttribute: (value: string | null): NavData => {
        try {
          return JSON.parse(value ?? "{}") as NavData;
        } catch {
          return { sections: [] };
        }
      },
    },
  })
  navData: NavData = { sections: [] };

  @property({ type: String, attribute: "current-slug" })
  currentSlug = "";

  @property({ type: Boolean, attribute: "dark-mode" })
  darkMode = false;

  @state()
  private _collapsedGroups: Set<string> = new Set();

  private _expandedSidenavContainer: HTMLElement | null = null;
  private _lastFocus: Element | null = null;
  private _ignoreFocusChanges = false;
  private _focusAfterClose: HTMLElement | null = null;

  // Store bound references for proper add/removeEventListener pairing
  private _boundTrapFocus: (e: FocusEvent) => void;
  private _boundHandleKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    super();
    this._collapsedGroups = this._loadCollapsedGroups();
    this._boundTrapFocus = this._trapFocus.bind(this);
    this._boundHandleKeyDown = this._handleKeyDown.bind(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up all global listeners to prevent leaks
    document.removeEventListener("focus", this._boundTrapFocus, true);
    window.removeEventListener("keydown", this._boundHandleKeyDown);
  }

  private _loadCollapsedGroups(): Set<string> {
    try {
      const stored = sessionStorage.getItem("side-nav-collapsed-groups");
      if (stored) {
        return new Set(JSON.parse(stored) as string[]);
      }
    } catch {
      // ignore
    }
    return new Set();
  }

  private _saveCollapsedGroups(): void {
    try {
      sessionStorage.setItem(
        "side-nav-collapsed-groups",
        JSON.stringify([...this._collapsedGroups]),
      );
    } catch {
      // ignore
    }
  }

  private _toggleGroup(groupKey: string): void {
    const next = new Set(this._collapsedGroups);
    if (next.has(groupKey)) {
      next.delete(groupKey);
    } else {
      next.add(groupKey);
    }
    this._collapsedGroups = next;
    this._saveCollapsedGroups();
  }

  firstUpdated(): void {
    this._setupDrawerToggle();
  }

  private _trapFocus(event: FocusEvent): void {
    if (this._ignoreFocusChanges || !this._expandedSidenavContainer) return;
    const sidenavContainer = this.shadowRoot!.querySelector(
      ".p-side-navigation--accordion",
    ) as HTMLElement | null;
    if (!sidenavContainer?.classList.contains("is-drawer-expanded")) return;
    const sidenavDrawer = sidenavContainer.querySelector(
      ".p-side-navigation__drawer",
    ) as HTMLElement | null;
    if (!sidenavDrawer) return;

    if (sidenavDrawer.contains(event.target as Node)) {
      this._lastFocus = event.target as Element;
    } else {
      this._focusFirstDescendant(sidenavDrawer);
      if (this._lastFocus === this.shadowRoot!.activeElement) {
        this._focusLastDescendant(sidenavDrawer);
      }
      this._lastFocus = this.shadowRoot!.activeElement;
    }
  }

  private _attemptFocus(child: HTMLElement): boolean {
    if (child.focus) {
      this._ignoreFocusChanges = true;
      child.focus();
      this._ignoreFocusChanges = false;
      return this.shadowRoot!.activeElement === child;
    }
    return false;
  }

  private _focusFirstDescendant(element: HTMLElement): boolean {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (
        child instanceof HTMLElement &&
        (this._attemptFocus(child) || this._focusFirstDescendant(child))
      ) {
        return true;
      }
    }
    return false;
  }

  private _focusLastDescendant(element: HTMLElement): boolean {
    for (let i = element.childNodes.length - 1; i >= 0; i--) {
      const child = element.childNodes[i];
      if (
        child instanceof HTMLElement &&
        (this._attemptFocus(child) || this._focusLastDescendant(child))
      ) {
        return true;
      }
    }
    return false;
  }

  private _toggleDrawer(show: boolean): void {
    const sideNavigation = this.shadowRoot!.querySelector(
      ".p-side-navigation--accordion",
    ) as HTMLElement | null;
    if (!sideNavigation) return;

    const toggleButtonOutsideDrawer = sideNavigation.querySelector(
      ".p-side-navigation__toggle",
    ) as HTMLElement | null;
    const toggleButtonInsideDrawer = sideNavigation.querySelector(
      ".p-side-navigation__toggle--in-drawer",
    ) as HTMLElement | null;

    this._expandedSidenavContainer = show ? sideNavigation : null;

    if (show) {
      sideNavigation.classList.remove("is-drawer-collapsed");
      sideNavigation.classList.add("is-drawer-expanded");
      sideNavigation.classList.remove("is-drawer-hidden");

      toggleButtonOutsideDrawer?.setAttribute("aria-expanded", "true");
      toggleButtonInsideDrawer?.setAttribute("aria-expanded", "true");
      this._focusAfterClose = toggleButtonOutsideDrawer;
      document.addEventListener("focus", this._boundTrapFocus, true);
    } else {
      sideNavigation.classList.remove("is-drawer-expanded");
      sideNavigation.classList.add("is-drawer-collapsed");

      toggleButtonOutsideDrawer?.setAttribute("aria-expanded", "false");
      toggleButtonInsideDrawer?.setAttribute("aria-expanded", "false");
      if (this._focusAfterClose?.focus) {
        this._focusAfterClose.focus();
      }
      document.removeEventListener("focus", this._boundTrapFocus, true);
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this._toggleDrawer(false);
    }
  }

  private _setupDrawerToggle(): void {
    const sideNavigation = this.shadowRoot!.querySelector(
      ".p-side-navigation--accordion",
    ) as HTMLElement | null;
    if (!sideNavigation) return;

    const toggles = this.shadowRoot!.querySelectorAll(".js-drawer-toggle");
    const drawerEl = sideNavigation.querySelector(
      ".p-side-navigation__drawer",
    ) as HTMLElement | null;

    drawerEl?.addEventListener("animationend", () => {
      if (!sideNavigation.classList.contains("is-drawer-expanded")) {
        sideNavigation.classList.add("is-drawer-hidden");
      }
    });

    window.addEventListener("keydown", this._boundHandleKeyDown);

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        sideNavigation.classList.remove("is-drawer-hidden");
        this._toggleDrawer(
          !sideNavigation.classList.contains("is-drawer-expanded"),
        );
      });
    });
  }

  private _isCurrentPage(slug: string): boolean {
    return this.currentSlug === slug;
  }

  private _renderNavigationItem(item: NavItem) {
    const href = `/${item.slug}`;
    const isCurrentPage = this._isCurrentPage(item.slug);

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

  private _renderAccordionGroup(group: NavGroup, sectionHeading: string) {
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
          ${group.items.map((item) => this._renderNavigationItem(item))}
        </ul>
      </li>
    `;
  }

  render() {
    const sections = this.navData?.sections ?? [];
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
            <p class="wiki-side-nav-empty">
              No navigation items available
            </p>
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

          <div class="wiki-side-nav-spacer"></div>

          ${visibleSections.map(
            (section) => html`
              <h3 class="p-side-navigation__heading p-text--small-caps">
                ${section.heading}
              </h3>
              <ul class="p-side-navigation__list">
                ${section.items.map((group) =>
                  this._renderAccordionGroup(group, section.heading),
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
