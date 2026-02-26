import { LitElement, css, html } from "lit"
import { vanillaStyleSheet } from "../../styles/vanilla.js"

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
    ]

    static properties = {
        componentId: {
            type: String,
            attribute: "component-id",
        },
        _buttonState: {
            type: String,
            state: true,
        },
    }

    constructor() {
        super()
        this.componentId = ""
        this._buttonState = "idle" // idle, loading, success, error
        this._abortController = null
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        // Cancel any pending fetch operations
        if (this._abortController) {
            this._abortController.abort()
        }
    }

    async _handleClick() {
        if (this._buttonState === "loading") {
            return
        }

        this._buttonState = "loading"

        // Cancel previous fetch if still running
        if (this._abortController) {
            this._abortController.abort()
        }

        this._abortController = new AbortController()

        try {
            const currentPath = window.location.pathname.replace(/\/$/, "")
            const markdownPath = `${currentPath}.md`
            const response = await fetch(markdownPath, {
                signal: this._abortController.signal,
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch markdown: ${response.statusText}`)
            }

            const markdownContent = await response.text()

            // Copy to clipboard
            await navigator.clipboard.writeText(markdownContent)

            this._buttonState = "success"
            setTimeout(() => {
                this._buttonState = "idle"
            }, 2000)
        } catch (err) {
            // Ignore abort errors
            if (err.name !== "AbortError") {
                console.error("Failed to copy markdown:", err)
                this._buttonState = "error"
                setTimeout(() => {
                    this._buttonState = "idle"
                }, 2000)
            }
        } finally {
            this._abortController = null
        }
    }

    _getButtonText() {
        switch (this._buttonState) {
            case "loading":
                return "Loading..."
            case "success":
                return "Copied!"
            case "error":
                return "Failed to copy"
            case "idle":
            default:
                return "Copy page as markdown"
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
        `
    }
}

customElements.define("copy-markdown-button", CopyMarkdownButtonComponent)
