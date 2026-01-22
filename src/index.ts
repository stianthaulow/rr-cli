#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { intro, outro, spinner } from "@clack/prompts";
import { Command } from "commander";
import { z } from "zod";

import { runInteractivePrompts } from "./cli/prompts.js";
import type {
  CliOptions,
  DrizzleChoice,
  InstallerResult,
} from "./cli/types.js";
import { applyExtras } from "./helpers/applyExtras.js";
import { copyTemplate } from "./helpers/copyTemplate.js";
import { editPackageJson } from "./helpers/editPackageJson.js";
import { initGitRepo } from "./helpers/git.js";
import { logger } from "./helpers/logger.js";
import { runCmd } from "./helpers/runCmd.js";
import { writeEnvFiles } from "./helpers/writeEnvFiles.js";
import { drizzleInstaller } from "./installers/drizzle.js";
import { shadcnInstaller } from "./installers/shadcn.js";

const booleanString = z
  .enum(["true", "false"])
  .transform((v: "true" | "false") => v === "true");
const drizzleChoiceEnum = z.enum(["no", "sqlite", "postgres"]);

const optionsSchema = z.object({
  outputPath: z.string().min(1),
  drizzle: drizzleChoiceEnum,
  shadcn: z.boolean(),
  install: z.boolean(),
  git: z.boolean(),
});

function getPackageRoot(): string {
  const distDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(distDir, "..");
}

function parseArgs(argv: string[]): Partial<CliOptions> {
  const program = new Command();
  program
    .name("rr")
    .argument("[output-path]", "Output directory (use . for current directory)")
    .option("--drizzle <none|sqlite|postgres>")
    .option("--shadcn <true|false>")
    .option("--install <true|false>")
    .option("--git <true|false>");

  program.parse(argv);
  const opts = program.opts() as Record<string, string | undefined>;
  const outputPath = program.args[0];

  const parsed = z
    .object({
      drizzle: drizzleChoiceEnum.optional(),
      shadcn: booleanString.optional(),
      install: booleanString.optional(),
      git: booleanString.optional(),
    })
    .safeParse(opts);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const data = parsed.data;
  return {
    outputPath,
    drizzle: data.drizzle as DrizzleChoice | undefined,
    shadcn: data.shadcn,
    install: data.install,
    git: data.git,
  };
}

function mergeInstallerResults(results: InstallerResult[]): InstallerResult {
  return results.reduce<InstallerResult>(
    (acc, r) => ({
      extraDirs: [...acc.extraDirs, ...r.extraDirs],
      pkg: {
        dependencies: { ...acc.pkg.dependencies, ...r.pkg.dependencies },
        devDependencies: {
          ...acc.pkg.devDependencies,
          ...r.pkg.devDependencies,
        },
        scripts: { ...acc.pkg.scripts, ...r.pkg.scripts },
      },
      envExample: r.envExample ?? acc.envExample,
    }),
    { extraDirs: [], pkg: {} },
  );
}

async function main(): Promise<void> {
  intro("rr");

  const partial = parseArgs(process.argv);

  const shouldPrompt =
    process.stdin.isTTY &&
    (!partial.outputPath ||
      !partial.drizzle ||
      partial.shadcn === undefined ||
      partial.install === undefined ||
      partial.git === undefined);

  const options = shouldPrompt
    ? await runInteractivePrompts(partial)
    : optionsSchema.parse({
        outputPath: partial.outputPath,
        drizzle: (partial.drizzle ?? "no") as DrizzleChoice,
        shadcn: partial.shadcn ?? false,
        install: partial.install ?? false,
        git: partial.git ?? false,
      });

  const pkgRoot = getPackageRoot();
  const templateDir = path.join(pkgRoot, "template");
  const extrasRoot = path.join(pkgRoot, "extras");
  const targetDir = path.resolve(process.cwd(), options.outputPath);
  const projectDirName = path.basename(targetDir);

  const packageName = projectDirName
    .trim()
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll(/[^a-z0-9-_.]/g, "");

  const s = spinner();
  s.start("Copying template...");
  await copyTemplate({ templateDir, targetDir });

  const installers: InstallerResult[] = [];

  if (options.drizzle !== "no") {
    installers.push(
      await drizzleInstaller({ drizzle: options.drizzle, extrasRoot }),
    );
  }

  if (options.shadcn) {
    installers.push(await shadcnInstaller({ extrasRoot }));
  }

  const merged = mergeInstallerResults(installers);

  if (merged.extraDirs.length > 0) {
    s.message("Applying extras...");
    await applyExtras(merged.extraDirs, targetDir);
  }

  if (merged.envExample) {
    s.message("Writing .env files...");
    await writeEnvFiles({ targetDir, envExampleContent: merged.envExample });
  }

  s.message("Updating package.json...");
  await editPackageJson(targetDir, {
    name: packageName || "rr-app",
    dependencies: merged.pkg.dependencies,
    devDependencies: merged.pkg.devDependencies,
    scripts: merged.pkg.scripts,
  });

  if (options.install) {
    s.message("Running pnpm install...");
    await runCmd("pnpm", ["install"], { cwd: targetDir });
  }

  if (options.git) {
    s.message("Initializing git...");
    await initGitRepo(targetDir);
  }

  s.stop("Done.");

  logger.success("Next steps:");
  logger.info(`cd ${projectDirName} && pnpm dev`);

  outro("Project ready");
}

main().catch((err) => {
  logger.error((err as Error).message);
  process.exit(1);
});
