import { LitElement, css, html } from "lit";
import { vanillaStyleSheet } from "../../styles/vanilla.js";

export class LlmButtonComponent extends LitElement {
  static styles = [
    vanillaStyleSheet,
    css`
      :host {
        display: inline-block;
      }

      .llm-button-wrapper {
        display: inline-flex;
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
        gap: 0.5rem;
      }

      .p-contextual-menu--left {
        display: inline-block;
        margin-left: 0;
        vertical-align: top;
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
        width: 20px;
        height: 20px;
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

  static properties = {
    componentId: {
      type: String,
      attribute: "component-id",
    },
    _selectedProvider: {
      type: String,
      state: true,
    },
    _isOpen: {
      type: Boolean,
      state: true,
    },
  };

  constructor() {
    super();
    this.componentId = "";
    this._selectedProvider = this._loadSelectedProvider();
    this._isOpen = false;
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleOutsideClick);
  }

  _loadSelectedProvider() {
    try {
      const stored = localStorage.getItem("llm-provider-preference");
      if (stored && this._isValidProvider(stored)) {
        return stored;
      }
    } catch (e) {
      console.error("Error loading LLM provider preference:", e);
    }
    return "copilot";
  }

  _saveSelectedProvider(provider) {
    try {
      localStorage.setItem("llm-provider-preference", provider);
    } catch (e) {
      console.error("Error saving LLM provider preference:", e);
    }
  }

  _isValidProvider(provider) {
    return ["claude", "chatgpt", "copilot"].includes(provider);
  }

  _getProviderConfig(provider) {
    const configs = {
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
    return configs[provider] || configs.copilot;
  }

  _buildPrompt() {
    // GitHub Copilot uses the file path, others use the website URL
    if (this._selectedProvider === "copilot") {
      const githubFilePath = `@dgtlntv/component-wiki/app/src/content/md/${this.componentId}/llm.mdx`;
      const prompt = `${githubFilePath}

Please analyze the component documentation in this file and help me understand this component and answer any questions I have about it.`;
      return prompt;
    }

    const baseUrl = window.location.origin || "https://component.wiki";
    const markdownUrl = `${baseUrl}/md/${this.componentId}/llm.mdx`;

    const prompt = `Please fetch and analyze the component documentation from the following URL: ${markdownUrl}

After reading the documentation, please help me understand this component and answer any questions I have about it.`;

    return prompt;
  }

  _handleMainButtonClick() {
    const config = this._getProviderConfig(this._selectedProvider);
    const prompt = this._buildPrompt();
    const url = config.urlTemplate + encodeURIComponent(prompt);

    window.open(url, "_blank");
  }

  _handleDropdownToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    this._isOpen = !this._isOpen;
  }

  _handleProviderSelect(e, provider) {
    e.preventDefault();
    e.stopPropagation();
    this._selectedProvider = provider;
    this._saveSelectedProvider(provider);
    this._isOpen = false;
  }

  _handleOutsideClick(e) {
    if (this._isOpen && !this.contains(e.target)) {
      this._isOpen = false;
    }
  }

  _handleDropdownClick(e) {
    e.stopPropagation();
  }

  _renderProviderIcon(provider) {
    const icons = {
      claude: html`
        <svg
          class="llm-provider-icon"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
          />
        </svg>
      `,
      chatgpt: html`
        <svg
          class="llm-provider-icon"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.206 8.765v-2.26c0-.19.07-.333.238-.428l4.542-2.616c.62-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.548l-4.71-2.76a.797.797 0 0 0-.856 0zm10.608 8.8v-5.4c0-.332-.143-.57-.428-.736l-5.97-3.473 1.95-1.118a.433.433 0 0 1 .476 0l4.542 2.617c1.308.76 2.188 2.378 2.188 3.948 0 1.808-1.07 3.473-2.759 4.163zM7.803 12.81l-1.95-1.142c-.167-.095-.238-.238-.238-.428V6.006c0-2.545 1.95-4.472 4.59-4.472 1 0 1.926.333 2.711.928L8.232 5.174c-.285.166-.428.404-.428.737v6.898zM12 15.235l-2.794-1.57v-3.33L12 8.765l2.795 1.57v3.33zm1.796 7.23a4.451 4.451 0 0 1-2.712-.927l4.686-2.711c.286-.167.428-.405.428-.738V11.19l1.975 1.142a.454.454 0 0 1 .238.428v5.233c0 2.545-1.975 4.472-4.615 4.472zm-5.636-5.303-4.543-2.617c-1.31-.761-2.19-2.378-2.19-3.948a4.482 4.482 0 0 1 2.784-4.163v5.423c0 .333.143.571.428.738l5.946 3.449-1.95 1.118a.433.433 0 0 1-.475 0zm-.262 3.9c-2.687 0-4.662-2.021-4.662-4.52 0-.19.024-.38.048-.57l4.686 2.712c.284.167.57.167.855 0l5.97-3.45v2.26c0 .19-.07.334-.238.429l-4.543 2.616c-.618.356-1.355.523-2.116.523zm5.9 2.83a5.947 5.947 0 0 0 5.826-4.756c2.664-.69 4.376-3.188 4.376-5.733 0-1.665-.713-3.282-1.998-4.448.12-.5.19-.999.19-1.498 0-3.4-2.759-5.947-5.946-5.947a5.64 5.64 0 0 0-1.879.31A5.962 5.962 0 0 0 10.205.107a5.947 5.947 0 0 0-5.827 4.757C1.714 5.554 0 8.052 0 10.597c0 1.665.714 3.282 1.998 4.448-.12.5-.19.999-.19 1.498 0 3.4 2.76 5.945 5.946 5.945.643 0 1.26-.095 1.88-.308a5.96 5.96 0 0 0 4.161 1.712z"
          />
        </svg>
      `,
      copilot: html`
        <svg
          class="llm-provider-icon"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z"
          />
        </svg>
      `,
    };
    return icons[provider] || icons.copilot;
  }

  render() {
    const currentConfig = this._getProviderConfig(this._selectedProvider);

    return html`
      <div class="llm-button-wrapper">
        <button
          class="p-button llm-main-button"
          @click=${this._handleMainButtonClick}
        >
          ${this._renderProviderIcon(this._selectedProvider)} Ask
          ${currentConfig.name}
        </button>

        <span class="p-contextual-menu--left">
          <button
            type="button"
            class="p-button has-icon p-contextual-menu__toggle"
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
            ${["claude", "chatgpt", "copilot"].map(
              (provider) => html`
                <a
                  href="#"
                  class="p-contextual-menu__link ${this._selectedProvider ===
                  provider
                    ? "is-selected"
                    : ""}"
                  @click=${(e) => this._handleProviderSelect(e, provider)}
                >
                  ${this._renderProviderIcon(provider)}
                  ${this._getProviderConfig(provider).name}
                </a>
              `,
            )}
          </span>
        </span>
      </div>
    `;
  }
}

customElements.define("llm-button", LlmButtonComponent);
