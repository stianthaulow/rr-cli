import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type DrizzleChoice = "no" | "sqlite" | "postgres";

interface ScaffoldConfig {
  name: string;
  drizzle: DrizzleChoice;
  shadcn: boolean;
  install: boolean;
  git: boolean;
}

// Generate all meaningful combinations
const configs: ScaffoldConfig[] = [
  // Base template (no extras)
  { name: "base", drizzle: "no", shadcn: false, install: false, git: false },

  // Drizzle variants (without shadcn)
  {
    name: "drizzle-sqlite",
    drizzle: "sqlite",
    shadcn: false,
    install: false,
    git: false,
  },
  {
    name: "drizzle-postgres",
    drizzle: "postgres",
    shadcn: false,
    install: false,
    git: false,
  },

  // Shadcn only
  {
    name: "shadcn",
    drizzle: "no",
    shadcn: true,
    install: false,
    git: false,
  },

  // Full combos (drizzle + shadcn)
  {
    name: "drizzle-sqlite-shadcn",
    drizzle: "sqlite",
    shadcn: true,
    install: false,
    git: false,
  },
  {
    name: "drizzle-postgres-shadcn",
    drizzle: "postgres",
    shadcn: true,
    install: false,
    git: false,
  },

  // With install (to verify pnpm install works)
  {
    name: "with-install",
    drizzle: "no",
    shadcn: false,
    install: true,
    git: false,
  },

  // With git (to verify git init works)
  {
    name: "with-git",
    drizzle: "no",
    shadcn: false,
    install: false,
    git: true,
  },

  // Full featured (all options enabled)
  {
    name: "full",
    drizzle: "postgres",
    shadcn: true,
    install: true,
    git: true,
  },
];

const labDir = path.join(import.meta.dirname, "..", "lab");
const cliPath = path.join(import.meta.dirname, "..", "src", "index.ts");

function runCli(config: ScaffoldConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "--import",
      "tsx",
      cliPath,
      config.name,
      "--drizzle",
      config.drizzle,
      "--shadcn",
      String(config.shadcn),
      "--install",
      String(config.install),
      "--git",
      String(config.git),
    ];

    console.log(`\n📦 Scaffolding: ${config.name}`);
    console.log(
      `   drizzle=${config.drizzle} shadcn=${config.shadcn} install=${config.install} git=${config.git}`,
    );

    const child = spawn("node", args, {
      cwd: labDir,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`CLI exited with code ${code} for ${config.name}`));
      }
    });

    child.on("error", reject);
  });
}

async function main() {
  // Ensure lab directory exists
  if (!fs.existsSync(labDir)) {
    fs.mkdirSync(labDir, { recursive: true });
  }

  console.log(`🧪 Scaffolding ${configs.length} test projects in ${labDir}\n`);

  for (const config of configs) {
    await runCli(config);
  }

  console.log("\n✅ All projects scaffolded successfully!");
  console.log("\nProjects created:");
  for (const config of configs) {
    console.log(`  - lab/${config.name}`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
