import { app } from "electron/main";
import { setTimeout } from "timers/promises";


export async function asyncExit(exitCode?: number | undefined): Promise<never> {
  app.exit(exitCode);
  while (true) {
    await setTimeout(100);
  }
}