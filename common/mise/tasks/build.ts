#!/usr/bin/env -S deno run --node-modules-dir=none --no-lock --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Build the project using Vite"

import { Ctx, type Task, task, vp } from "@iiimaddiniii/task-utils";

export const build: Task<(ctx: Ctx) => Promise<void>> = task("Build common", async (ctx) => {
  await vp.fmt(ctx, { check: false });
  await vp.check(ctx);
  await vp.pack(ctx);
});

if (import.meta.main) {
  Ctx.run(build);
}
