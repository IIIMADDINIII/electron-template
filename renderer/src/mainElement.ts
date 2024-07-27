import { localized, msg, str } from "@lit/localize";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getLocale, setLocale } from "./base/mainInterface.js";
import image from "./image.jpg";


@customElement('main-element')
@localized()
export class MainElement extends LitElement {
  static override styles = css`:host { color: blue; font-size: 30px }`;

  @property()
  accessor text = 'World';

  override render() {
    return html`
      <lang-selector></lang-selector><br>
      ${msg(html`Hello <b>${this.text}</b>!`, { desc: "Greeting for a name." })}<br>
      ${msg(str`Hello ${this.text}!`, { desc: "Greeting for a name." })}<br>
      ${msg("Hello", { desc: "Greeting" })}<br>
      <img src="${image}">`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lang-selector": LangSelector;
    "main-element": MainElement;
  }
}

@customElement("lang-selector")
@localized()
export class LangSelector extends LitElement {
  override render() {
    return html`
      <select @change=${this.#changeLang} .value=${getLocale()}>
        <option value="en">${msg("English")}</option>
        <option value="de">${msg("German")}</option>
      </select>
      `;
  }

  #changeLang(e: Event) {
    setLocale((e.currentTarget as HTMLSelectElement).value);
  }
}