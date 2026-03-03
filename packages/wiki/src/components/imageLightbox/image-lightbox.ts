import { LitElement, css, html } from "lit";
import { state, query } from "lit/decorators.js";

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

  @state()
  private _isOpen = false;

  @query("dialog")
  private _dialog!: HTMLDialogElement;

  private _image: HTMLImageElement | undefined;

  firstUpdated(): void {
    // Find the slotted image
    const slot = this.shadowRoot!.querySelector("slot");
    const assignedElements = slot?.assignedElements() ?? [];
    this._image = assignedElements.find(
      (el): el is HTMLImageElement => el.tagName === "IMG",
    );

    if (!this._image) {
      console.warn("ImageLightbox: No image element found in slot");
    }

    // Sync _isOpen state when the native dialog closes (e.g. Escape key)
    this._dialog?.addEventListener("close", () => {
      this._isOpen = false;
    });
  }

  private _handleSlotClick(e: Event): void {
    const path = e.composedPath();
    const clickedImage = path.find(
      (el): el is HTMLImageElement =>
        el instanceof HTMLElement && el.tagName === "IMG",
    );

    if (clickedImage) {
      this._openDialog();
    }
  }

  private _openDialog(): void {
    if (!this._image || !this._dialog) return;
    this._dialog.showModal();
    this._isOpen = true;
  }

  private _closeDialog(): void {
    if (!this._dialog) return;
    this._dialog.close();
    this._isOpen = false;
  }

  private _handleDialogClick(): void {
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
