import { setTimeout } from "timers/promises";

import { app } from "electron/main";

export async function asyncExit(exitCode?: number): Promise<never> {
  app.exit(exitCode);
  while (true) {
    await setTimeout(100);
  }
}

/**
 * Run the given callback function when the Electron app is ready.
 *
 * @param callback - The function to run when the app is ready.
 */
export function runWhenReady(callback: () => void): void {
  app
    .whenReady()
    .then(callback)
    .catch((e) => console.error("Error running when app is ready:", e));
}
