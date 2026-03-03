import { LitElement, css, html } from "lit";
import { property, state } from "lit/decorators.js";
import { vanillaStyleSheet } from "../../styles/vanilla.ts";

type ButtonState = "idle" | "loading" | "success" | "error";

export class CopyMarkdownButtonComponent extends LitElement {
  static styles = [
    vanillaStyleSheet,
    css`
      :host {
        display: inline-block;
      }

      button {
        white-space: nowrap;
        min-width: 200px;
      }
    `,
  ];

  @property({ type: String, attribute: "component-id" })
  componentId = "";

  @state()
  private _buttonState: ButtonState = "idle";

  private _abortController: AbortController | null = null;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._abortController) {
      this._abortController.abort();
    }
  }

  private async _handleClick(): Promise<void> {
    if (this._buttonState === "loading") {
      return;
    }

    this._buttonState = "loading";

    if (this._abortController) {
      this._abortController.abort();
    }

    this._abortController = new AbortController();

    try {
      const currentPath = window.location.pathname.replace(/\/$/, "");
      const markdownPath = `${currentPath}.md`;
      const response = await fetch(markdownPath, {
        signal: this._abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.statusText}`);
      }

      const markdownContent = await response.text();
      await navigator.clipboard.writeText(markdownContent);

      this._buttonState = "success";
      setTimeout(() => {
        this._buttonState = "idle";
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to copy markdown:", err);
        this._buttonState = "error";
        setTimeout(() => {
          this._buttonState = "idle";
        }, 2000);
      }
    } finally {
      this._abortController = null;
    }
  }

  private _getButtonText(): string {
    switch (this._buttonState) {
      case "loading":
        return "Loading...";
      case "success":
        return "Copied!";
      case "error":
        return "Failed to copy";
      case "idle":
      default:
        return "Copy page as markdown";
    }
  }

  render() {
    return html`
      <button
        class="p-button u-no-margin--bottom"
        @click=${this._handleClick}
        ?disabled=${this._buttonState === "loading"}
        aria-live="polite"
      >
        ${this._getButtonText()}
      </button>
    `;
  }
}

// Side-effectful: importing this module registers the <copy-markdown-button> element.
customElements.define("copy-markdown-button", CopyMarkdownButtonComponent);
