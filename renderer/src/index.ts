
import { wait } from "@app/common";
import { css } from "lit";
import { MainElement } from "./mainElement.js";
import { initLocalization, readySignalIsUsed, readySignalSend } from "./mainInterface.js";


async function run() {
  readySignalIsUsed();
  setDocumentStyles();
  await initLocalization();
  document.body.appendChild(new MainElement());
  await wait(100);
  readySignalSend();
}
run().catch(console.log);

function setDocumentStyles() {
  const styleSheet = css`
    html, body {
      height: 100%;
      width: 100%;
      margin: 0px;
      user-select: none;
    }
  `.styleSheet;
  if (styleSheet === undefined) throw new Error("Error while creating Document Styles");
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
}