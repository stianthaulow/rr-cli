import path from "node:path";
import fs from "fs-extra";

export type CopyTemplateOptions = {
  templateDir: string;
  targetDir: string;
};

function shouldExclude(relativePath: string): boolean {
  const normalized = relativePath.replaceAll("\\", "/");

  if (normalized === "pnpm-workspace.yaml") return true;
  if (normalized.startsWith("node_modules/")) return true;
  if (normalized.startsWith(".react-router/")) return true;
  if (normalized.startsWith("build/")) return true;

  return false;
}

async function isDirEmpty(dirPath: string): Promise<boolean> {
  if (!(await fs.pathExists(dirPath))) {
    return true;
  }
  const entries = await fs.readdir(dirPath);
  return entries.length === 0;
}

export async function copyTemplate({
  templateDir,
  targetDir,
}: CopyTemplateOptions): Promise<void> {
  const parent = path.dirname(targetDir);
  const baseName = path.basename(targetDir);
  const stagingDir = path.join(parent, `.${baseName}.rr-tmp-${Date.now()}`);

  const targetExists = await fs.pathExists(targetDir);
  const targetEmpty = await isDirEmpty(targetDir);

  if (targetExists && !targetEmpty) {
    throw new Error(`Target directory is not empty: ${targetDir}`);
  }

  await fs.ensureDir(parent);

  // If target exists but is empty, we'll copy directly into it
  if (targetExists && targetEmpty) {
    await fs.copy(templateDir, targetDir, {
      dereference: true,
      filter: (src) => {
        const rel = path.relative(templateDir, src);
        if (!rel) return true;
        return !shouldExclude(rel);
      },
    });
    return;
  }

  await fs.ensureDir(stagingDir);

  await fs.copy(templateDir, stagingDir, {
    dereference: true,
    filter: (src) => {
      const rel = path.relative(templateDir, src);
      if (!rel) return true;
      return !shouldExclude(rel);
    },
  });

  await fs.move(stagingDir, targetDir, { overwrite: false });
}
