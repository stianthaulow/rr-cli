import path from "node:path";
import fs from "fs-extra";

function getTempPath(filePath: string): string {
  return `${filePath}.rr-tmp-${process.pid}-${Date.now()}`;
}

export async function copyFileAtomic(
  srcFile: string,
  destFile: string,
): Promise<void> {
  const tmp = getTempPath(destFile);
  await fs.ensureDir(path.dirname(destFile));
  await fs.copyFile(srcFile, tmp);
  await fs.move(tmp, destFile, { overwrite: true });
}

export async function writeFileAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  const tmp = getTempPath(filePath);
  await fs.writeFile(tmp, content, "utf8");
  await fs.move(tmp, filePath, { overwrite: true });
}
