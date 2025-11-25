import { LitElement, css, html } from "lit";
import { vanillaStyleSheet } from "../../styles/vanilla.js";

export class GithubCopilotButtonComponent extends LitElement {
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

  static properties = {
    componentId: {
      type: String,
      attribute: "component-id",
    },
  };

  constructor() {
    super();
    this.componentId = "";
  }

  _handleClick() {
    // Build the GitHub Copilot URL with the prompt referencing the markdown file
    const githubFilePath = `@dgtlntv/component-wiki/app/src/content/md/${this.componentId}/llm.md`;
    const prompt = `${githubFilePath}`;
    const copilotUrl = `https://github.com/copilot?prompt=${encodeURIComponent(prompt)}`;

    // Open in a new tab
    window.open(copilotUrl, "_blank");
  }

  render() {
    return html`
      <button class="p-button u-no-margin--bottom" @click=${this._handleClick}>
        Ask GitHub Copilot about this page
      </button>
    `;
  }
}

customElements.define("github-copilot-button", GithubCopilotButtonComponent);
