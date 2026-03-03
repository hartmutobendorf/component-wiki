import { LitElement, css, html } from "lit";
import { property, state } from "lit/decorators.js";
import { vanillaStyleSheet } from "../../styles/vanilla.ts";
import { PROVIDER_ICONS, type LlmProvider } from "../icons/provider-icons.ts";

const VALID_PROVIDERS: readonly LlmProvider[] = [
  "claude",
  "chatgpt",
  "copilot",
] as const;

interface ProviderConfig {
  name: string;
  urlTemplate: string;
}

const PROVIDER_CONFIGS: Record<LlmProvider, ProviderConfig> = {
  claude: {
    name: "Claude",
    urlTemplate: "https://claude.ai/new?q=",
  },
  chatgpt: {
    name: "ChatGPT",
    urlTemplate: "https://chatgpt.com/?q=",
  },
  copilot: {
    name: "GitHub Copilot",
    urlTemplate: "https://github.com/copilot?prompt=",
  },
};

export class LlmButtonComponent extends LitElement {
  static styles = [
    vanillaStyleSheet,
    css`
      :host {
        display: block;
      }

      .llm-button-wrapper {
        display: flex;
        gap: 0;
        align-items: stretch;
      }

      .llm-main-button {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        margin-bottom: 0;
        margin-right: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        flex: 1;
      }

      .p-contextual-menu--left {
        display: inline-block;
        margin-left: 0;
        vertical-align: top;
        position: relative;
      }

      .p-contextual-menu__dropdown {
        right: 0 !important;
        left: auto !important;
      }

      .p-contextual-menu__toggle {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-left: none;
        margin-bottom: 0;
        margin-left: 0;
        padding: 0.5rem 0.75rem;
        min-width: auto;
      }

      .llm-provider-icon {
        width: 16px;
        height: 16px;
        display: inline-block;
      }

      .p-contextual-menu__link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .p-contextual-menu__link.is-selected {
        background-color: #e5f4fd;
      }
    `,
  ];

  @property({ type: String, attribute: "component-id" })
  componentId = "";

  @property({ type: String, attribute: "repo-path" })
  repoPath = "@dgtlntv/component-wiki";

  @state()
  private _selectedProvider: LlmProvider = "copilot";

  @state()
  private _isOpen = false;

  private _boundHandleOutsideClick: (e: MouseEvent) => void;

  constructor() {
    super();
    this._selectedProvider = this._loadSelectedProvider();
    this._boundHandleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this._boundHandleOutsideClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this._boundHandleOutsideClick);
  }

  private _loadSelectedProvider(): LlmProvider {
    try {
      const stored = localStorage.getItem("llm-provider-preference");
      if (stored && this._isValidProvider(stored)) {
        return stored as LlmProvider;
      }
    } catch (e) {
      console.error("Error loading LLM provider preference:", e);
    }
    return "copilot";
  }

  private _saveSelectedProvider(provider: LlmProvider): void {
    try {
      localStorage.setItem("llm-provider-preference", provider);
    } catch (e) {
      console.error("Error saving LLM provider preference:", e);
    }
  }

  private _isValidProvider(provider: string): provider is LlmProvider {
    return VALID_PROVIDERS.includes(provider as LlmProvider);
  }

  private _buildPrompt(): string {
    const currentPath = window.location.pathname.replace(/\/$/, "");

    if (this._selectedProvider === "copilot") {
      const isConcept = currentPath.includes("/concept/");
      const dataDir = isConcept ? "concepts" : "constructs";
      const githubFilePath = `${this.repoPath}/data/wiki/${dataDir}/${this.componentId}.json`;
      return `${githubFilePath}\n\nPlease analyze the component documentation in this file and help me understand this component and answer any questions I have about it.`;
    }

    const baseUrl = window.location.origin || "https://component.wiki";
    const markdownUrl = `${baseUrl}${currentPath}.md`;
    return `Please fetch and analyze the component documentation from the following URL: ${markdownUrl}\n\nAfter reading the documentation, please help me understand this component and answer any questions I have about it.`;
  }

  private _handleMainButtonClick(): void {
    const config = PROVIDER_CONFIGS[this._selectedProvider];
    const prompt = this._buildPrompt();
    const url = config.urlTemplate + encodeURIComponent(prompt);
    window.open(url, "_blank");
  }

  private _handleDropdownToggle(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this._isOpen = !this._isOpen;
  }

  private _handleProviderSelect(e: Event, provider: LlmProvider): void {
    e.preventDefault();
    e.stopPropagation();
    this._selectedProvider = provider;
    this._saveSelectedProvider(provider);
    this._isOpen = false;
  }

  private _handleOutsideClick(e: MouseEvent): void {
    if (this._isOpen && !this.contains(e.target as Node)) {
      this._isOpen = false;
    }
  }

  private _handleDropdownClick(e: Event): void {
    e.stopPropagation();
  }

  render() {
    const currentConfig = PROVIDER_CONFIGS[this._selectedProvider];

    return html`
      <div class="llm-button-wrapper">
        <button
          class="p-button--base llm-main-button"
          @click=${this._handleMainButtonClick}
        >
          ${PROVIDER_ICONS[this._selectedProvider]} Ask ${currentConfig.name}
        </button>

        <span class="p-contextual-menu--left">
          <button
            type="button"
            class="p-button--base has-icon p-contextual-menu__toggle"
            aria-controls="llm-menu"
            aria-expanded="${this._isOpen}"
            @click="${this._handleDropdownToggle}"
          >
            <i class="p-icon--chevron-down"></i>
          </button>
          <span
            class="p-contextual-menu__dropdown"
            id="llm-menu"
            aria-hidden="${!this._isOpen}"
            @click="${this._handleDropdownClick}"
          >
            ${VALID_PROVIDERS.map(
              (provider) => html`
                <a
                  href="#"
                  class="p-contextual-menu__link ${this._selectedProvider ===
                  provider
                    ? "is-selected"
                    : ""}"
                  @click=${(e: Event) =>
                    this._handleProviderSelect(e, provider)}
                >
                  ${PROVIDER_ICONS[provider]}
                  ${PROVIDER_CONFIGS[provider].name}
                </a>
              `,
            )}
          </span>
        </span>
      </div>
    `;
  }
}

// Side-effectful: importing this module registers the <llm-button> element.
customElements.define("llm-button", LlmButtonComponent);
