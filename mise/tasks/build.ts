#!/usr/bin/env -S deno run --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Build the project using Vite"

import * as common from "@app/common";
import * as main from "@app/main";
import * as preload from "@app/preload";
import { Ctx, pnpm, task } from "@iiimaddiniii/task-utils";

export const build = task("Build project", async (ctx) => {
  await pnpm.install(ctx);
  await common.build(ctx);
  await main.build(ctx);
  await preload.build(ctx);
});

if (import.meta.main) {
  Ctx.run(build);
}
