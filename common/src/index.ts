
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