import path from "node:path";

import type { InstallerResult } from "../cli/types.js";
import { getDep } from "./versions.js";

export async function shadcnInstaller(opts: {
  extrasRoot: string;
}): Promise<InstallerResult> {
  return {
    extraDirs: [path.join(opts.extrasRoot, "shadcn")],
    pkg: {
      dependencies: {
        "class-variance-authority": await getDep("class-variance-authority"),
        clsx: await getDep("clsx"),
        "lucide-react": await getDep("lucide-react"),
        "tailwind-merge": await getDep("tailwind-merge"),
      },
    },
  };
}
