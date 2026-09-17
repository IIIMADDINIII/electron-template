#!/usr/bin/env -S deno run --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Build the project using Vite"

import { Ctx, pnpm, task } from "@iiimaddiniii/task-utils";
import { clean } from "./clean.ts";

export const buildCi = task("Build CI", async (ctx) => {
  await clean(ctx);
  await pnpm.install(ctx, { frozenLockfile: true });
});

if (import.meta.main) {
  Ctx.run(buildCi);
}
