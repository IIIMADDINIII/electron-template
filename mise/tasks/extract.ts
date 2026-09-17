#!/usr/bin/env -S deno run --allow-all
//MISE env={DENO_NO_PACKAGE_JSON = "1"}
//MISE description="Extract messages for translation"

import { Ctx, lit, task } from "@iiimaddiniii/task-utils";

export const extract = task("Extract messages for translation", async (ctx) => {
  await lit.extract(ctx);
});

if (import.meta.main) {
  Ctx.run(extract);
}
