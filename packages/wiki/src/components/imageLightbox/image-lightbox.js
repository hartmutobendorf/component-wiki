import { LitElement, css, html } from "lit";

export class ImageLightboxComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      cursor: pointer;
    }

    dialog {
      padding: 0;
      border: none;
      background: rgba(0, 0, 0, 0.95);
      max-width: 90vw;
      max-height: 90vh;
      cursor: pointer;
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.8);
      cursor: pointer;
    }

    dialog img {
      display: block;
      max-width: 90vw;
      max-height: 90vh;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    /* Reset default dialog styles */
    dialog[open] {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  static properties = {
    _isOpen: { state: true },
  };

  constructor() {
    super();
    this._isOpen = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  firstUpdated() {
    // Find the slotted image
    const slot = this.shadowRoot.querySelector("slot");
    const assignedElements = slot.assignedElements();
    this._image = assignedElements.find((el) => el.tagName === "IMG");

    if (!this._image) {
      console.warn("ImageLightbox: No image element found in slot");
    }
  }

  _handleKeyDown(e) {
    if (e.key === "Escape" && this._isOpen) {
      this._closeDialog();
    }
  }

  _handleSlotClick(e) {
    // Check if the clicked element is an image
    const path = e.composedPath();
    const clickedImage = path.find((el) => el.tagName === "IMG");

    if (clickedImage) {
      this._openDialog();
    }
  }

  _openDialog() {
    if (!this._image) return;

    const dialog = this.shadowRoot.querySelector("dialog");
    if (dialog) {
      dialog.showModal();
      this._isOpen = true;
    }
  }

  _closeDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (dialog) {
      dialog.close();
      this._isOpen = false;
    }
  }

  _handleDialogClick(e) {
    // Close when clicking anywhere in the dialog
    this._closeDialog();
  }

  render() {
    return html`
      <div @click=${this._handleSlotClick}>
        <slot></slot>
      </div>

      <dialog @click=${this._handleDialogClick}>
        ${this._isOpen && this._image
          ? html`<img
              src="${this._image.src}"
              alt="${this._image.alt || ""}"
            />`
          : ""}
      </dialog>
    `;
  }
}

customElements.define("image-lightbox", ImageLightboxComponent);
