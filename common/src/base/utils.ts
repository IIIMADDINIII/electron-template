type TimerHandler = string | Function;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/clearTimeout) */
declare function clearTimeout(id: number | undefined): void;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/setTimeout) */
declare function setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number;

/**
 * Returns a Promis wich will resolve after the specified amount of milliseconds.
 *
 * @param ms - Time in milliseconds to wait before the promise is resolved.
 * @returns A Promise.
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
