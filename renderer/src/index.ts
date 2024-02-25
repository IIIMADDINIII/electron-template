
import { MainElement } from "./mainElement.js";


async function run() {
  document.body.appendChild(new MainElement());
}
run().catch(console.log);