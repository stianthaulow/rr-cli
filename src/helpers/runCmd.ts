import { spawn } from "node:child_process";

export type RunCmdOptions = {
  cwd: string;
};

export async function runCmd(
  cmd: string,
  args: string[],
  opts: RunCmdOptions,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", (err) => reject(err));
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(
        new Error(`${cmd} ${args.join(" ")} failed with exit code ${code}`),
      );
    });
  });
}
