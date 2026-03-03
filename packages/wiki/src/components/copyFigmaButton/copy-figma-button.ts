import { LitElement, css, html } from "lit";
import { property, state } from "lit/decorators.js";
import { vanillaStyleSheet } from "../../styles/vanilla.ts";

type ButtonState = "idle" | "loading" | "success" | "error" | "no-data";

export class CopyFigmaButtonComponent extends LitElement {
  static styles = [
    vanillaStyleSheet,
    css`
      :host {
        display: inline-block;
      }

      button {
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: String, attribute: "data-component-id" })
  componentId = "";

  @property({ type: String, attribute: "copy-text" })
  copyText = "Button";

  @property({ type: String, attribute: "button-text" })
  buttonText = "Copy as Figma component";

  @state()
  private _htmlContent: string | null = null;

  @state()
  private _buttonState: ButtonState = "idle";

  private _abortController: AbortController | null = null;

  constructor() {
    super();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._preloadData();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._abortController) {
      this._abortController.abort();
    }
  }

  firstUpdated(): void {
    // Set fixed width on first render to prevent resize during state changes
    const button = this.shadowRoot!.querySelector("button");
    if (button) {
      const width = button.offsetWidth;
      button.style.width = `${width}px`;
    }
  }

  private async _preloadData(): Promise<void> {
    if (!this.componentId) {
      console.warn("CopyFigmaButton: No component-id provided");
      return;
    }

    if (this._abortController) {
      this._abortController.abort();
    }

    this._abortController = new AbortController();

    try {
      const response = await fetch(`/figma/${this.componentId}`, {
        signal: this._abortController.signal,
      });

      if (response.ok) {
        this._htmlContent = await response.text();
      } else {
        console.error(
          "Failed to load Figma component data:",
          response.statusText,
        );
        this._htmlContent = null;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to preload Figma component data:", err);
        this._htmlContent = null;
      }
    } finally {
      this._abortController = null;
    }
  }

  private async _handleClick(): Promise<void> {
    if (!this._htmlContent) {
      this._buttonState = "no-data";
      setTimeout(() => {
        this._buttonState = "idle";
      }, 2000);
      return;
    }

    try {
      const htmlBlob = new Blob([this._htmlContent], { type: "text/html" });
      const textBlob = new Blob([this.copyText], { type: "text/plain" });
      const data = new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      });
      await navigator.clipboard.write([data]);

      this._buttonState = "success";
      setTimeout(() => {
        this._buttonState = "idle";
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      this._buttonState = "error";
      setTimeout(() => {
        this._buttonState = "idle";
      }, 2000);
    }
  }

  private _getButtonText(): string {
    switch (this._buttonState) {
      case "success":
        return "Copied!";
      case "error":
        return "Failed to copy";
      case "no-data":
        return "No data available";
      case "idle":
      default:
        return this.buttonText;
    }
  }

  render() {
    return html`
      <button
        class="p-button--positive u-no-margin--bottom"
        @click=${this._handleClick}
        aria-live="polite"
      >
        ${this._getButtonText()}
      </button>
    `;
  }
}

// Side-effectful: importing this module registers the <copy-figma-button> element.
customElements.define("copy-figma-button", CopyFigmaButtonComponent);
