export type DrizzleChoice = "no" | "sqlite" | "postgres";

export type CliOptions = {
  outputPath: string;
  drizzle: DrizzleChoice;
  shadcn: boolean;
  install: boolean;
  git: boolean;
};

export type InstallerResult = {
  extraDirs: string[];
  pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  envExample?: string;
};
