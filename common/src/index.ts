
export * from "./base/remoteObjectApi.js";
export * from "./base/rendererWindowApi.js";
export * from "./base/utils.js";

export type SampleWindowApi = {
  add(a: number, b: number): Promise<Number>;
};

export const SAMPLE_WINDOW_API_ID = "sample-window-api";