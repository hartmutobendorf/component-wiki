import { LitElement, css, html } from "lit"
import { vanillaStyleSheet } from "../../styles/vanilla.js"

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
    ]

    static properties = {
        dataPath: {
            type: String,
            attribute: "data-path",
        },
        textContent: {
            type: String,
            attribute: "text-content",
        },
        buttonText: {
            type: String,
            attribute: "button-text",
        },
        _htmlContent: {
            type: String,
            state: true,
        },
        _buttonState: {
            type: String,
            state: true,
        },
    }

    constructor() {
        super()
        this.dataPath = ""
        this.textContent = "Button"
        this.buttonText = "Copy as Figma component"
        this._htmlContent = null
        this._buttonState = "idle" // idle, loading, success, error, no-data
        this._abortController = null
    }

    connectedCallback() {
        super.connectedCallback()
        this._preloadData()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        // Cancel any pending fetch operations
        if (this._abortController) {
            this._abortController.abort()
        }
    }

    firstUpdated() {
        // Set fixed width on first render to prevent resize during state changes
        const button = this.shadowRoot.querySelector("button")
        if (button) {
            const width = button.offsetWidth
            button.style.width = `${width}px`
        }
    }

    async _preloadData() {
        if (!this.dataPath) {
            console.warn("CopyFigmaButton: No data-path provided")
            return
        }

        // Cancel previous fetch if still running
        if (this._abortController) {
            this._abortController.abort()
        }

        this._abortController = new AbortController()

        try {
            const response = await fetch(this.dataPath, {
                signal: this._abortController.signal,
            })

            if (response.ok) {
                this._htmlContent = await response.text()
            } else {
                console.error(
                    "Failed to load Figma component data:",
                    response.statusText
                )
                this._htmlContent = null
            }
        } catch (err) {
            // Ignore abort errors
            if (err.name !== "AbortError") {
                console.error("Failed to preload Figma component data:", err)
                this._htmlContent = null
            }
        } finally {
            this._abortController = null
        }
    }

    async _handleClick() {
        if (!this._htmlContent) {
            this._buttonState = "no-data"
            setTimeout(() => {
                this._buttonState = "idle"
            }, 2000)
            return
        }

        try {
            const html = new Blob([this._htmlContent], { type: "text/html" })
            const text = new Blob([this.textContent], { type: "text/plain" })
            const data = new ClipboardItem({
                "text/html": html,
                "text/plain": text,
            })
            await navigator.clipboard.write([data])

            this._buttonState = "success"
            setTimeout(() => {
                this._buttonState = "idle"
            }, 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
            this._buttonState = "error"
            setTimeout(() => {
                this._buttonState = "idle"
            }, 2000)
        }
    }

    _getButtonText() {
        switch (this._buttonState) {
            case "success":
                return "Copied!"
            case "error":
                return "Failed to copy"
            case "no-data":
                return "No data available"
            case "idle":
            default:
                return this.buttonText
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
        `
    }
}

customElements.define("copy-figma-button", CopyFigmaButtonComponent)
