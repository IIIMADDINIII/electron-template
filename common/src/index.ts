
type TimerHandler = string | Function;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/clearTimeout) */
declare function clearTimeout(id: number | undefined): void;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/setTimeout) */
declare function setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;

/**
 * Returns a Promis wich will resolve after the specified amount of milliseconds.
 * @param ms - time in milliseconds to wait before the promise is resolved.
 * @returns a Promise.
 * @public
 */
export function wait(ms: number): Promise<void> {
  return new Promise((res, _rej) => {
    const tm = setTimeout(() => {
      clearTimeout(tm);
      res();
    }, ms);
  });
}

/**
 * RemoteObject Api for the Ready Signal for a RendererWindow.
 * Used to only show the Window once it finished loading and rendering.
 * @public
 */
export type ReadySignalApi = {
  /**
   * Call this when you want to use the Ready Signal very early on.
   */
  isUsed(): void;
  /**
   * Call this once the Window has finished loading and rendering.
   */
  send(): void;
};

export const REMOTE_OBJECT_MESSAGE_CHANNEL = "remote-objects";