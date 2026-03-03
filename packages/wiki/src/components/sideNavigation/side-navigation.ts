import { LitElement, css, html } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { vanillaStyleSheet } from "../../styles/vanilla.ts";
import type { NavData, NavGroup, NavItem } from "../../utils/nav-data.js";

type DrawerState = "hidden" | "expanded" | "collapsed";

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

  /** Reactive drawer state — drives CSS classes via classMap. */
  @state()
  private _drawerState: DrawerState = "hidden";

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

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._boundHandleKeyDown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("focus", this._boundTrapFocus, true);
    window.removeEventListener("keydown", this._boundHandleKeyDown);
  }

  // -- Collapsed groups (accordion) ------------------------------------------

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

  // -- Drawer (mobile) -------------------------------------------------------

  private _toggleDrawer(): void {
    if (this._drawerState === "expanded") {
      this._closeDrawer();
    } else {
      this._openDrawer();
    }
  }

  private _openDrawer(): void {
    this._drawerState = "expanded";
    this._focusAfterClose = this.shadowRoot!.querySelector(
      ".p-side-navigation__toggle",
    ) as HTMLElement | null;
    document.addEventListener("focus", this._boundTrapFocus, true);
  }

  private _closeDrawer(): void {
    this._drawerState = "collapsed";
    if (this._focusAfterClose?.focus) {
      this._focusAfterClose.focus();
    }
    document.removeEventListener("focus", this._boundTrapFocus, true);
  }

  private _handleDrawerAnimationEnd(): void {
    // After the collapse animation finishes, fully hide the drawer
    if (this._drawerState === "collapsed") {
      this._drawerState = "hidden";
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this._closeDrawer();
    }
  }

  // -- Focus trap -------------------------------------------------------------

  private _trapFocus(event: FocusEvent): void {
    if (this._ignoreFocusChanges || this._drawerState !== "expanded") return;
    const sidenavDrawer = this.shadowRoot!.querySelector(
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

  // -- Rendering --------------------------------------------------------------

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

  /** CSS classes for the top-level container, derived from reactive state. */
  private _containerClasses(isEmpty: boolean) {
    return classMap({
      "p-side-navigation--accordion": true,
      "is-sticky": true,
      "is-drawer-hidden": this._drawerState === "hidden",
      "is-drawer-expanded": this._drawerState === "expanded",
      "is-drawer-collapsed": this._drawerState === "collapsed",
      "is-dark": this.darkMode && isEmpty,
    });
  }

  private _renderShell(content: unknown) {
    const isExpanded = this._drawerState === "expanded";

    return html`
      <div
        class=${this._containerClasses(false)}
        id="drawer"
      >
        <button
          class="p-side-navigation__toggle js-drawer-toggle"
          aria-controls="drawer"
          aria-expanded="${isExpanded}"
          @click=${(e: Event) => { e.preventDefault(); this._toggleDrawer(); }}
        >
          Toggle side navigation
        </button>

        <div
          class="p-side-navigation__overlay"
          aria-controls="drawer"
          @click=${(e: Event) => { e.preventDefault(); this._closeDrawer(); }}
        ></div>

        <nav
          class="p-side-navigation__drawer"
          aria-label="Side navigation"
          @animationend=${this._handleDrawerAnimationEnd}
        >
          <div class="p-side-navigation__drawer-header">
            <button
              class="p-side-navigation__toggle--in-drawer js-drawer-toggle"
              aria-controls="drawer"
              aria-expanded="${isExpanded}"
              @click=${(e: Event) => { e.preventDefault(); this._toggleDrawer(); }}
            >
              Toggle side navigation
            </button>
          </div>
          ${content}
        </nav>
      </div>
    `;
  }

  render() {
    const sections = this.navData?.sections ?? [];
    const visibleSections = sections.filter(
      (s) => s.items && s.items.length > 0,
    );

    if (visibleSections.length === 0) {
      return this._renderShell(
        html`<p class="wiki-side-nav-empty">No navigation items available</p>`,
      );
    }

    return this._renderShell(html`
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
    `);
  }
}

customElements.define("side-navigation", SideNavigationComponent);
