#!/usr/bin/env -S deno run --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Clean the project directory"

import { cleanup, Ctx, task } from "@iiimaddiniii/task-utils";

export const clean = task("Clean project", async (ctx) => {
  await cleanup.gitIgnored(ctx);
});

if (import.meta.main) {
  Ctx.run(clean);
}
