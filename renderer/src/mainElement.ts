import { localized, msg, str } from "@lit/localize";
import { LitElement, ReactiveElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getLocale, setLocale } from "./base/rendererWindowApi.js";
import { waitImageSettled } from "./base/tools.js";
import image from "./image.jpg";


@customElement('main-element')
@localized()
export class MainElement extends LitElement {
  static override styles = css`:host { color: blue; font-size: 30px }`;

  @property()
  accessor text = 'World';

  protected override async getUpdateComplete(): Promise<boolean> {
    const ret = await super.getUpdateComplete();
    const children = await Promise.all(Array.from(this.renderRoot.querySelectorAll("*")).map((element) => {
      if (element instanceof HTMLImageElement) return waitImageSettled(element).then(() => true);
      if (element instanceof ReactiveElement) return element.updateComplete;
      return true;
    }));
    return ret && children.every((e) => e);
  }

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

  protected override async getUpdateComplete(): Promise<boolean> {
    const ret = await super.getUpdateComplete();
    const children = await Promise.all(Array.from(this.renderRoot.querySelectorAll("*")).map((element) => {
      if (element instanceof HTMLImageElement) return waitImageSettled(element).then(() => true);
      if (element instanceof ReactiveElement) return element.updateComplete;
      return true;
    }));
    return ret && children.every((e) => e);
  }

  #changeLang(e: Event) {
    setLocale((e.currentTarget as HTMLSelectElement).value);
  }
}