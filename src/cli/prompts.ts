import path from "node:path";
import { cancel, confirm, isCancel, select, text } from "@clack/prompts";
import fs from "fs-extra";

import type { CliOptions, DrizzleChoice } from "./types.js";

function exitIfCancelled<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Cancelled.");
    process.exit(1);
  }
  return value;
}

async function isDirEmpty(dirPath: string): Promise<boolean> {
  if (!(await fs.pathExists(dirPath))) {
    return true;
  }
  const entries = await fs.readdir(dirPath);
  return entries.length === 0;
}

export async function runInteractivePrompts(
  partial: Partial<CliOptions>,
): Promise<CliOptions> {
  const outputPath = exitIfCancelled(
    partial.outputPath ??
      (await text({
        message: "Output directory (use . for current directory)",
        placeholder: "my-rr-app",
        validate: (value) => {
          if (!value?.trim()) return "Please enter an output path.";
          return;
        },
      })),
  );

  const targetDir = path.resolve(process.cwd(), String(outputPath).trim());
  if (!(await isDirEmpty(targetDir))) {
    cancel(`Target directory is not empty: ${targetDir}`);
    process.exit(1);
  }

  const drizzle = exitIfCancelled(
    partial.drizzle ??
      (await select<DrizzleChoice>({
        message: "Add Drizzle?",
        options: [
          { label: "None", value: "no" },
          { label: "Drizzle + SQLite (libsql)", value: "sqlite" },
          { label: "Drizzle + Postgres (pg)", value: "postgres" },
        ],
      })),
  );

  const shadcn = exitIfCancelled(
    partial.shadcn ??
      (await confirm({
        message: "Add shadcn prerequisites (deps only)?",
        initialValue: false,
      })),
  );

  const install = exitIfCancelled(
    partial.install ??
      (await confirm({
        message: "Run pnpm install after scaffolding?",
        initialValue: true,
      })),
  );

  const git = exitIfCancelled(
    partial.git ??
      (await confirm({
        message: "Initialize git and make an initial commit?",
        initialValue: true,
      })),
  );

  return {
    outputPath: String(outputPath).trim(),
    drizzle,
    shadcn,
    install,
    git,
  };
}
