# rr-cli 🚀

A CLI to scaffold [React Router](https://reactrouter.com/) apps with optional extras like [Drizzle](https://orm.drizzle.team/) ORM and [shadcn/ui](https://ui.shadcn.com/) components.

Uses a template with React Router in framework mode, with [Biome](https://biomejs.dev/) configured.

## 🔧 Setup

**Build:**

```bash
pnpm build
```

**Run globally:**

```bash
pnpm link --global
rr my-app --drizzle sqlite
```

Or add an alias to your shell config:

```bash
alias rr="node /path/to/rr-cli/dist/index.js"
```


## 🛠️ Usage

**Interactive:**

```bash
rr
```

**Non-interactive:**

```bash
rr my-app --drizzle sqlite --shadcn true --install false --git false
```

### Flags

| Flag | Options | Description |
|------|---------|-------------|
| `[output-path]` | | Project directory (use `.` for current dir) |
| `--drizzle` | `no` `sqlite` `postgres` | Database setup |
| `--shadcn` | `true` `false` | Add shadcn dependencies |
| `--install` | `true` `false` | Run `pnpm install` |
| `--git` | `true` `false` | Init git + initial commit |

## 📦 What gets added

### 🗄️ Drizzle

- `app/db/index.ts` + `app/db/schema.ts`
- `drizzle.config.ts`
- `.env` with database connection string
- Deps: `drizzle-orm`, `drizzle-kit`, `dotenv`

**[SQLite](https://www.sqlite.org/):** uses `@libsql/client`

**[Postgres](https://www.postgresql.org/):** uses `pg`, adds `docker-compose.yml`

### 🎨 shadcn

Adds dependencies: `clsx`, `class-variance-authority`, `tailwind-merge`, `lucide-react`

No components are installed, but a `components.json` is set up so `pnpx shadcn add button` will work.