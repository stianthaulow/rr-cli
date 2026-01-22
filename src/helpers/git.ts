import { logger } from "./logger.js";
import { runCmd } from "./runCmd.js";

export async function initGitRepo(targetDir: string): Promise<void> {
  try {
    await runCmd("git", ["init"], { cwd: targetDir });
    await runCmd("git", ["add", "-A"], { cwd: targetDir });
    await runCmd("git", ["commit", "-m", "Initial commit"], { cwd: targetDir });
  } catch (err) {
    logger.warn(
      `Git init/commit failed (you may need to configure git user.name/user.email). ${(err as Error).message}`,
    );
  }
}
