import path from "node:path";
import fs from "fs-extra";
import { writeFileAtomic } from "./atomicFs.js";

export type PackageJsonEdits = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

function sortObject<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  ) as T;
}

export async function editPackageJson(
  targetDir: string,
  edits: PackageJsonEdits,
): Promise<void> {
  const pkgPath = path.join(targetDir, "package.json");
  const raw = await fs.readFile(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;

  if (edits.name) pkg.name = edits.name;

  if (edits.dependencies) {
    const existing = (pkg.dependencies ?? {}) as Record<string, string>;
    pkg.dependencies = sortObject({ ...existing, ...edits.dependencies });
  }

  if (edits.devDependencies) {
    const existing = (pkg.devDependencies ?? {}) as Record<string, string>;
    pkg.devDependencies = sortObject({ ...existing, ...edits.devDependencies });
  }

  if (edits.scripts) {
    const existing = (pkg.scripts ?? {}) as Record<string, string>;
    pkg.scripts = sortObject({ ...existing, ...edits.scripts });
  }

  const updated = `${JSON.stringify(pkg, null, 2)}\n`;
  await writeFileAtomic(pkgPath, updated);
}
