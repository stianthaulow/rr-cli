import path from "node:path";
import fs from "fs-extra";
import { copyFileAtomic } from "./atomicFs.js";

async function copyDirLayer(srcDir: string, destDir: string): Promise<void> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirLayer(srcPath, destPath);
      continue;
    }

    if (entry.isFile()) {
      await copyFileAtomic(srcPath, destPath);
    }
  }
}

export async function applyExtras(
  extraDirs: string[],
  targetDir: string,
): Promise<void> {
  for (const extraDir of extraDirs) {
    await copyDirLayer(extraDir, targetDir);
  }
}
