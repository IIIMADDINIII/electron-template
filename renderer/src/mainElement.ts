import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('main-element')
export class MainElement extends LitElement {
  static override styles = css`:host { color: blue; font-size: 30px }`;

  @property()
  accessor text = 'Hello World';

  override render() {
    return html`${this.text}             !               `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "main-element": MainElement;
  }
}