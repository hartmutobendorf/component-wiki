import { LitElement, css, html } from "lit";
import { vanillaStyleSheet } from "../../styles/vanilla.js";

export class MultiSelectComponent extends LitElement {
  static styles = [
    vanillaStyleSheet,
    css`
      :host {
        display: block;
        position: relative;
      }

      .p-contextual-menu__toggle {
        width: 100%;
        margin-bottom: 0;
        justify-content: space-between;
        text-align: left;
      }

      .p-contextual-menu__dropdown {
        width: max-content;
        min-width: 10rem;
        max-width: 30rem;
        padding-left: 1rem;
        padding-top: 0.5rem;
        padding-right: 1rem;
        padding-bottom: 0.5rem;
      }

      .p-checkbox {
        white-space: nowrap;
      }

      .p-contextual-menu__group {
        display: flex;
        flex-direction: column;
      }

      .p-contextual-menu__group:not(:first-child) {
        padding-top: 0.5rem;
      }

      .group-heading {
        margin-bottom: 0.25rem;
      }
    `,
  ];

  static properties = {
    items: {
      type: Array,
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
    groups: {
      type: Array,
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
    label: { type: String },
    storageKey: { type: String, attribute: "storage-key" },
    _isOpen: { state: true },
  };

  constructor() {
    super();
    this.items = [];
    this.groups = [];
    this.label = "Select options";
    this.storageKey = "";
    this._isOpen = false;
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleOutsideClick);
    this._loadFromStorage();
  }

  _loadFromStorage() {
    if (!this.storageKey) return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const selectedValues = JSON.parse(stored);

        // Update groups if using groups
        if (this.groups.length > 0) {
          this.groups = this.groups.map((group) => ({
            ...group,
            items: group.items.map((item) => ({
              ...item,
              selected: selectedValues.includes(item.value),
            })),
          }));
        } else {
          // Update flat items
          this.items = this.items.map((item) => ({
            ...item,
            selected: selectedValues.includes(item.value),
          }));
        }
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
  }

  _saveToStorage() {
    if (!this.storageKey) return;

    try {
      const selectedValues = this._getSelectedValues();
      localStorage.setItem(this.storageKey, JSON.stringify(selectedValues));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  }

  _getSelectedValues() {
    if (this.groups.length > 0) {
      return this.groups.flatMap((group) =>
        group.items.filter((item) => item.selected).map((item) => item.value),
      );
    }
    return this.items.filter((item) => item.selected).map((item) => item.value);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleOutsideClick);
  }

  _handleOutsideClick(e) {
    if (this._isOpen && !this.contains(e.target)) {
      this._isOpen = false;
    }
  }

  _toggleOpen(e) {
    e.preventDefault();
    e.stopPropagation();
    this._isOpen = !this._isOpen;
  }

  _handleButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this._toggleOpen(e);
  }

  _handleCheckboxChange(e, item, groupIndex = null) {
    e.stopPropagation();

    if (groupIndex !== null) {
      // Handle grouped items
      const itemIndex = this.groups[groupIndex].items.indexOf(item);
      if (itemIndex > -1) {
        this.groups[groupIndex].items[itemIndex] = {
          ...item,
          selected: e.target.checked,
        };
        this.groups = [...this.groups]; // Trigger update
      }
    } else {
      // Handle flat items
      const index = this.items.indexOf(item);
      if (index > -1) {
        this.items[index] = { ...item, selected: e.target.checked };
        this.items = [...this.items]; // Trigger update
      }
    }

    this._saveToStorage();

    this.dispatchEvent(
      new CustomEvent("selection-changed", {
        detail: {
          items: this.groups.length > 0 ? this.groups : this.items,
          selectedValues: this._getSelectedValues(),
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _handleDropdownClick(e) {
    e.stopPropagation();
  }

  render() {
    const hasGroups = this.groups.length > 0;
    const selectedCount = hasGroups
      ? this.groups.reduce(
          (sum, group) => sum + group.items.filter((i) => i.selected).length,
          0,
        )
      : this.items.filter((i) => i.selected).length;

    const displayLabel =
      selectedCount > 0 ? `${selectedCount} selected` : this.label;

    return html`
      <span class="p-contextual-menu--left">
        <button
          type="button"
          class="p-button--base p-contextual-menu__toggle has-icon"
          aria-controls="menu"
          aria-expanded="${this._isOpen}"
          @click="${this._handleButtonClick}"
        >
          <span>${displayLabel}</span>
          <i class="p-icon--chevron-down"></i>
        </button>
        <span
          class="p-contextual-menu__dropdown"
          id="menu"
          aria-hidden="${!this._isOpen}"
          @click="${this._handleDropdownClick}"
        >
          ${hasGroups
            ? this.groups.map(
                (group, groupIndex) => html`
                  <span class="p-contextual-menu__group">
                    ${group.heading
                      ? html`<div
                          class="p-text--small-caps p-text--small u-text--muted group-heading"
                        >
                          ${group.heading}
                        </div>`
                      : ""}
                    ${group.items.map(
                      (item, itemIndex) => html`
                        <label class="p-checkbox">
                          <input
                            type="checkbox"
                            class="p-checkbox__input"
                            aria-labelledby="checkboxLabel${groupIndex}-${itemIndex}"
                            .checked="${item.selected || false}"
                            @change="${(e) =>
                              this._handleCheckboxChange(e, item, groupIndex)}"
                          />
                          <span
                            class="p-checkbox__label"
                            id="checkboxLabel${groupIndex}-${itemIndex}"
                            >${item.label}</span
                          >
                        </label>
                      `,
                    )}
                  </span>
                `,
              )
            : this.items.map(
                (item, index) => html`
                  <label class="p-checkbox">
                    <input
                      type="checkbox"
                      class="p-checkbox__input"
                      aria-labelledby="checkboxLabel${index}"
                      .checked="${item.selected || false}"
                      @change="${(e) => this._handleCheckboxChange(e, item)}"
                    />
                    <span class="p-checkbox__label" id="checkboxLabel${index}"
                      >${item.label}</span
                    >
                  </label>
                `,
              )}
        </span>
      </span>
    `;
  }
}

customElements.define("multi-select", MultiSelectComponent);
