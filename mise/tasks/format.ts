#!/usr/bin/env -S deno run --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Format all files in the project"

import { Ctx, pnpm, task, vp } from "@iiimaddiniii/task-utils";

export const format = task("Format project", async (ctx) => {
  await pnpm.install(ctx);
  await vp.fmt(ctx, { check: false });
});

if (import.meta.main) {
  Ctx.run(format);
}
