import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

type OptionalDeps = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

let cachedDeps: OptionalDeps | null = null;

function getOptionalDepsPath(): string {
  const distDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(distDir, "optional-deps.json");
}

async function loadOptionalDeps(): Promise<OptionalDeps> {
  if (cachedDeps) return cachedDeps;

  const filePath = getOptionalDepsPath();
  const content = await fs.readJson(filePath);
  cachedDeps = content as OptionalDeps;
  return cachedDeps;
}

export async function getDep(name: string): Promise<string> {
  const deps = await loadOptionalDeps();
  const version = deps.dependencies[name];
  if (!version) {
    throw new Error(`Missing dependency version for: ${name}`);
  }
  return version;
}

export async function getDevDep(name: string): Promise<string> {
  const deps = await loadOptionalDeps();
  const version = deps.devDependencies[name];
  if (!version) {
    throw new Error(`Missing devDependency version for: ${name}`);
  }
  return version;
}
