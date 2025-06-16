

export function noAdopt() {

  delete (CSSStyleSheet as any).prototype.replace;
}
noAdopt();