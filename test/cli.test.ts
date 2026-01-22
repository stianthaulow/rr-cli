import { execSync } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI_PATH = path.resolve(__dirname, "../src/index.ts");
const TEST_DIR = path.resolve(__dirname, "../.test-output");

function runCli(args: string): string {
  const cmd = `npx tsx ${CLI_PATH} ${args}`;
  return execSync(cmd, {
    encoding: "utf8",
    cwd: TEST_DIR,
    env: { ...process.env, CI: "true" },
    timeout: 30000,
  });
}

function readPackageJson(projectDir: string): Record<string, unknown> {
  const pkgPath = path.join(projectDir, "package.json");
  return fs.readJsonSync(pkgPath);
}

describe("rr CLI", () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe("Drizzle: SQLite (libsql)", () => {
    const PROJECT_NAME = "sqlite-test";

    it("generates expected files and directories", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle sqlite --shadcn false --install false --git false`,
      );

      // app/db.ts
      expect(await fs.pathExists(path.join(projectDir, "app/db.ts"))).toBe(
        true,
      );

      // app/db/schema.ts
      expect(
        await fs.pathExists(path.join(projectDir, "app/db/schema.ts")),
      ).toBe(true);

      // drizzle.config.ts
      expect(
        await fs.pathExists(path.join(projectDir, "drizzle.config.ts")),
      ).toBe(true);
    });

    it("generates .env and .env.example with correct DATABASE_URL", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle sqlite --shadcn false --install false --git false`,
      );

      const envPath = path.join(projectDir, ".env");
      const envExamplePath = path.join(projectDir, ".env.example");

      expect(await fs.pathExists(envPath)).toBe(true);
      expect(await fs.pathExists(envExamplePath)).toBe(true);

      const envContent = await fs.readFile(envPath, "utf8");
      const envExampleContent = await fs.readFile(envExamplePath, "utf8");

      expect(envContent).toContain('DATABASE_URL="file:./db.sqlite"');
      expect(envExampleContent).toContain('DATABASE_URL="file:./db.sqlite"');
    });

    it("adds correct dependencies to package.json", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle sqlite --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const deps = pkg.dependencies as Record<string, string>;
      const devDeps = pkg.devDependencies as Record<string, string>;

      expect(deps["drizzle-orm"]).toBeDefined();
      expect(deps.dotenv).toBeDefined();
      expect(deps["@libsql/client"]).toBeDefined();
      expect(devDeps["drizzle-kit"]).toBeDefined();
    });

    it("adds db scripts to package.json", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle sqlite --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const scripts = pkg.scripts as Record<string, string>;

      expect(scripts["db:generate"]).toBe("drizzle-kit generate");
      expect(scripts["db:migrate"]).toBe("drizzle-kit migrate");
      expect(scripts["db:studio"]).toBe("drizzle-kit studio");
    });
  });

  describe("Drizzle: Postgres (pg)", () => {
    const PROJECT_NAME = "postgres-test";

    it("generates expected files and directories", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle postgres --shadcn false --install false --git false`,
      );

      // app/db.ts
      expect(await fs.pathExists(path.join(projectDir, "app/db.ts"))).toBe(
        true,
      );

      // app/db/schema.ts
      expect(
        await fs.pathExists(path.join(projectDir, "app/db/schema.ts")),
      ).toBe(true);

      // drizzle.config.ts
      expect(
        await fs.pathExists(path.join(projectDir, "drizzle.config.ts")),
      ).toBe(true);

      // docker-compose.yml
      expect(
        await fs.pathExists(path.join(projectDir, "docker-compose.yml")),
      ).toBe(true);
    });

    it("generates .env and .env.example with correct DATABASE_URL", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle postgres --shadcn false --install false --git false`,
      );

      const envPath = path.join(projectDir, ".env");
      const envExamplePath = path.join(projectDir, ".env.example");

      expect(await fs.pathExists(envPath)).toBe(true);
      expect(await fs.pathExists(envExamplePath)).toBe(true);

      const envContent = await fs.readFile(envPath, "utf8");
      const envExampleContent = await fs.readFile(envExamplePath, "utf8");

      expect(envContent).toContain(
        'DATABASE_URL="postgres://postgres:postgres@localhost:5432/app"',
      );
      expect(envExampleContent).toContain(
        'DATABASE_URL="postgres://postgres:postgres@localhost:5432/app"',
      );
    });

    it("adds correct dependencies to package.json", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle postgres --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const deps = pkg.dependencies as Record<string, string>;
      const devDeps = pkg.devDependencies as Record<string, string>;

      expect(deps["drizzle-orm"]).toBeDefined();
      expect(deps.dotenv).toBeDefined();
      expect(deps.pg).toBeDefined();
      expect(devDeps["drizzle-kit"]).toBeDefined();
    });

    it("adds db scripts to package.json", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle postgres --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const scripts = pkg.scripts as Record<string, string>;

      expect(scripts["db:generate"]).toBe("drizzle-kit generate");
      expect(scripts["db:migrate"]).toBe("drizzle-kit migrate");
      expect(scripts["db:studio"]).toBe("drizzle-kit studio");
    });
  });

  describe("shadcn prerequisites", () => {
    const PROJECT_NAME = "shadcn-test";

    it("adds shadcn dependencies to package.json", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn true --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const deps = pkg.dependencies as Record<string, string>;

      expect(deps["class-variance-authority"]).toBeDefined();
      expect(deps["tailwind-merge"]).toBeDefined();
      expect(deps["lucide-react"]).toBeDefined();
    });

    it("adds shadcn config files", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn true --install false --git false`,
      );

      // components.json and tailwind.config.ts should be added by shadcn
      expect(
        await fs.pathExists(path.join(projectDir, "components.json")),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(projectDir, "tailwind.config.ts")),
      ).toBe(true);
    });
  });

  describe("No Drizzle selected", () => {
    const PROJECT_NAME = "no-drizzle-test";

    it("does NOT generate .env or .env.example", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn false --install false --git false`,
      );

      const envPath = path.join(projectDir, ".env");
      const envExamplePath = path.join(projectDir, ".env.example");

      expect(await fs.pathExists(envPath)).toBe(false);
      expect(await fs.pathExists(envExamplePath)).toBe(false);
    });

    it("does NOT add drizzle dependencies", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const deps = pkg.dependencies as Record<string, string>;
      const devDeps = pkg.devDependencies as Record<string, string>;

      expect(deps["drizzle-orm"]).toBeUndefined();
      expect(deps.dotenv).toBeUndefined();
      expect(deps["@libsql/client"]).toBeUndefined();
      expect(deps.pg).toBeUndefined();
      expect(devDeps["drizzle-kit"]).toBeUndefined();
    });

    it("does NOT add db scripts", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const scripts = pkg.scripts as Record<string, string>;

      expect(scripts["db:generate"]).toBeUndefined();
      expect(scripts["db:migrate"]).toBeUndefined();
      expect(scripts["db:studio"]).toBeUndefined();
    });
  });

  describe("Current directory scaffolding", () => {
    it("scaffolds in current directory when using '.'", async () => {
      const projectDir = path.join(TEST_DIR, "dot-test");
      await fs.ensureDir(projectDir);

      // Run CLI with . in the project directory
      const cmd = `npx tsx ${CLI_PATH} . --drizzle no --shadcn false --install false --git false`;
      execSync(cmd, {
        encoding: "utf8",
        cwd: projectDir,
        env: { ...process.env, CI: "true" },
        timeout: 30000,
      });

      // Should have scaffolded files in the current directory
      expect(await fs.pathExists(path.join(projectDir, "package.json"))).toBe(
        true,
      );
      expect(
        await fs.pathExists(path.join(projectDir, "react-router.config.ts")),
      ).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, "vite.config.ts"))).toBe(
        true,
      );
    });

    it("fails if current directory is not empty", async () => {
      const projectDir = path.join(TEST_DIR, "non-empty-test");
      await fs.ensureDir(projectDir);
      await fs.writeFile(path.join(projectDir, "existing-file.txt"), "content");

      const cmd = `npx tsx ${CLI_PATH} . --drizzle no --shadcn false --install false --git false`;

      expect(() => {
        execSync(cmd, {
          encoding: "utf8",
          cwd: projectDir,
          env: { ...process.env, CI: "true" },
          timeout: 30000,
        });
      }).toThrow();
    });
  });

  describe("Project name handling", () => {
    it("normalizes project name for package.json", async () => {
      const projectDir = path.join(TEST_DIR, "My Cool App");

      runCli(
        `"My Cool App" --drizzle no --shadcn false --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      // Name should be normalized: lowercase, spaces to hyphens, special chars removed
      expect(pkg.name).toBe("my-cool-app");
    });
  });

  describe("Base template", () => {
    const PROJECT_NAME = "base-template-test";

    it("copies essential React Router template files", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn false --install false --git false`,
      );

      // Check essential files exist
      expect(await fs.pathExists(path.join(projectDir, "package.json"))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(projectDir, "tsconfig.json"))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(projectDir, "vite.config.ts"))).toBe(
        true,
      );
      expect(
        await fs.pathExists(path.join(projectDir, "react-router.config.ts")),
      ).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, "biome.json"))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(projectDir, "Dockerfile"))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(projectDir, "app"))).toBe(true);
    });

    it("excludes node_modules and build directories", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle no --shadcn false --install false --git false`,
      );

      expect(await fs.pathExists(path.join(projectDir, "node_modules"))).toBe(
        false,
      );
      expect(
        await fs.pathExists(path.join(projectDir, "pnpm-workspace.yaml")),
      ).toBe(false);
    });
  });

  describe("Combined options", () => {
    const PROJECT_NAME = "combined-test";

    it("works with both drizzle and shadcn enabled", async () => {
      const projectDir = path.join(TEST_DIR, PROJECT_NAME);

      runCli(
        `${PROJECT_NAME} --drizzle sqlite --shadcn true --install false --git false`,
      );

      const pkg = readPackageJson(projectDir);
      const deps = pkg.dependencies as Record<string, string>;

      // Drizzle deps
      expect(deps["drizzle-orm"]).toBeDefined();
      expect(deps["@libsql/client"]).toBeDefined();

      // shadcn deps
      expect(deps["class-variance-authority"]).toBeDefined();
      expect(deps["tailwind-merge"]).toBeDefined();
      expect(deps["lucide-react"]).toBeDefined();

      // Both env and shadcn files
      expect(await fs.pathExists(path.join(projectDir, ".env"))).toBe(true);
      expect(
        await fs.pathExists(path.join(projectDir, "components.json")),
      ).toBe(true);
    });
  });
});
