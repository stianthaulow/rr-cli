import path from "node:path";
import fs from "fs-extra";

import type { DrizzleChoice, InstallerResult } from "../cli/types.js";
import { getDep, getDevDep } from "./versions.js";

export async function drizzleInstaller(opts: {
  drizzle: Exclude<DrizzleChoice, "no">;
  extrasRoot: string;
}): Promise<InstallerResult> {
  const variantDir =
    opts.drizzle === "sqlite"
      ? path.join(opts.extrasRoot, "drizzle", "sqlite-libsql")
      : path.join(opts.extrasRoot, "drizzle", "postgres-pg");

  const envExamplePath =
    opts.drizzle === "sqlite"
      ? path.join(opts.extrasRoot, "env", "sqlite-libsql.env.example")
      : path.join(opts.extrasRoot, "env", "postgres-pg.env.example");

  const envExample = await fs.readFile(envExamplePath, "utf8");

  const pkg: InstallerResult["pkg"] = {
    dependencies: {
      "drizzle-orm": await getDep("drizzle-orm"),
      dotenv: await getDep("dotenv"),
      ...(opts.drizzle === "sqlite"
        ? { "@libsql/client": await getDep("@libsql/client") }
        : { pg: await getDep("pg") }),
    },
    devDependencies: {
      "drizzle-kit": await getDevDep("drizzle-kit"),
    },
    scripts: {
      "db:generate": "drizzle-kit generate",
      "db:migrate": "drizzle-kit migrate",
      "db:studio": "drizzle-kit studio",
    },
  };

  return {
    extraDirs: [variantDir],
    pkg,
    envExample,
  };
}
