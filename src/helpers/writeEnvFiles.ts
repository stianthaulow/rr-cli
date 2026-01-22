import path from "node:path";
import { writeFileAtomic } from "./atomicFs.js";

export type EnvFilesOptions = {
  targetDir: string;
  envExampleContent: string;
};

export async function writeEnvFiles({
  targetDir,
  envExampleContent,
}: EnvFilesOptions): Promise<void> {
  const normalized = envExampleContent.endsWith("\n")
    ? envExampleContent
    : `${envExampleContent}\n`;

  await writeFileAtomic(path.join(targetDir, ".env.example"), normalized);
  await writeFileAtomic(path.join(targetDir, ".env"), normalized);
}
