import { localized, msg, str } from "@lit/localize";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('main-element')
@localized()
export class MainElement extends LitElement {
  static override styles = css`:host { color: blue; font-size: 30px }`;

  @property()
  accessor text = 'World';

  override render() {
    return html`${msg(str`Hello ${this.text}!`, { desc: "Greeting for a name." })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "main-element": MainElement;
  }
}