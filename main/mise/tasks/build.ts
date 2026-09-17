#!/usr/bin/env -S deno run --node-modules-dir=none --no-lock --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Build the project using Vite"

import { Ctx, lit, type Task, task, vp } from "@iiimaddiniii/task-utils";

export const build: Task<(ctx: Ctx, options?: {prod?: boolean}) => Promise<void>> = task("Build main", async (ctx, {prod} = {}) => {
  await lit.build(ctx);
  await vp.fmt(ctx, { check: false });
  await vp.check(ctx);
  await vp.build(ctx);
});

if (import.meta.main) {
  Ctx.run(build);
}


