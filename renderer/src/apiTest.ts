import { proxy, Remote } from "comlink-electron-renderer";

export class Api {
  field: number = 10;
  func(): number {
    return 11;
  }
  funcParam(data: number): number {
    return data + 1;
  }
  funcComplex(cb: () => number): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(cb()));
    });
  }
  proxy() {
    return proxy(new Api());
  }
}

export async function testApi(api: Remote<Api>): Promise<void> {
  if (await api.field !== 10) throw new Error("api.field");
  if (await api.func() !== 11) throw new Error("api.func");
  if (await api.funcParam(11) !== 12) throw new Error("api.funcParam");
  if (await api.funcComplex(proxy(() => 13)) !== 13) throw new Error("api.funcParam");
  if (await (await api.proxy()).funcComplex(proxy(() => 14)) !== 14) throw new Error("api.funcParam");
}