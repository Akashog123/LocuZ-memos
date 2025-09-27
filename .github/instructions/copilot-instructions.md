<!-- Auto-generated guidance for AI coding agents. Keep concise and actionable. -->
# Copilot instructions — LocuZ-memos

Purpose
- Help AI coding agents become productive quickly in this repository (Go backend + Vite React frontend).

Quick architecture (why/how)
- **Backend**: Go HTTP/gRPC server with CLI entry in `bin/memos/main.go` (cobra/viper config), domain logic in `internal/`, persistence in `store/`, API routes in `server/router/`.
- **Frontend**: Vite React app in `web/` with MobX stores, protobuf-generated TypeScript types, and Tailwind/Radix UI components.
- **APIs**: Schema-driven with protobuf in `proto/` (Buf-managed); `buf generate` creates Go server code and TypeScript client types.
- **Data flow**: CLI → Profile → DB Driver → Store → Server → Router handlers → Protobuf services.
- **Build integration**: `pnpm release` bundles React app into `server/router/frontend/dist` for single-binary deployment.

Dev workflows & important commands
- **Full stack dev**: `go run ./bin/memos --mode dev --port 8081` (SQLite default) + `cd web && pnpm dev` (hot-reload frontend).
- **Backend build/test**: `go build ./bin/memos`; `go test ./...` (table-driven tests in `*_test.go` files).
- **Frontend build**: `cd web && pnpm install && pnpm dev` (dev) or `pnpm build && pnpm release` (production bundle).
- **API generation**: `buf generate` (from `proto/` root) - generates Go gRPC services and TypeScript types in `web/src/types/proto/`.
- **Database**: SQLite default; migrations in `store/migration/{sqlite,mysql,postgres}/` with versioned SQL files.

Conventions & project-specific patterns
- **Go style**: `gofmt`-clean (tabs, grouped imports), lowercase packages, context-first functions, errors wrapped with `%w` (see `internal/util/util.go`).
- **Protobuf APIs**: Define in `proto/api/v1/*.proto`, generate with Buf, implement services in `server/router/api/v1/*_service.go`.
- **Database layer**: Store interfaces in `store/*.go`, implementations in `store/db/*`, migrations as versioned SQL files.
- **Frontend**: PascalCase components (`web/src/components/`), camelCase hooks (`web/src/hooks/`), MobX stores (`web/src/store/`), i18n keys in `web/src/locales/`.
- **State management**: MobX observables with `makeAutoObservable()`, protobuf types for API data (see `web/src/store/user.ts`).
- **UI components**: Radix UI primitives + Tailwind classes; custom components in `web/src/components/ui/`.

Files to check when making changes
- **Adding API endpoints**: `proto/api/v1/*.proto` (schema) → `buf generate` → `server/router/api/v1/*_service.go` (implementation).
- **Database changes**: Add migration in `store/migration/*/LATEST.sql`, update store interfaces in `store/*.go`, implement in `store/db/*`.
- **Frontend features**: Check `web/src/store/` for state patterns, `web/src/components/` for UI patterns, update i18n in `web/src/locales/`.
- **Configuration**: CLI flags in `bin/memos/main.go`, environment variables as `MEMOS_*` (see `internal/profile/profile.go`).

Testing & validation notes for agents
- **Go tests**: Table-driven in `*_test.go` siblings; run `go test ./...` before PRs, especially after migrations or API changes.
- **Frontend**: `cd web && pnpm lint` (TypeScript + ESLint), manual testing with `pnpm dev`.
- **Integration**: `pnpm release` then test full server with `go run ./bin/memos` to verify frontend bundling.
- **Database**: Test migrations on all drivers (SQLite/MySQL/PostgreSQL) when changing schemas.

Examples (concrete patterns to follow)
- **Error handling**: `return fmt.Errorf("failed to create user: %w", err)` (see `internal/util/util.go`).
- **API service**: Define protobuf message in `.proto`, implement in `*Service` struct with methods matching protobuf service (see `server/router/api/v1/memo_service.go`).
- **Store pattern**: Interface in `store/memo.go`, implementation in `store/db/sqlite/memo.go`, caching in `Store` struct (see `store/store.go`).
- **MobX store**: `makeAutoObservable(this)` in constructor, computed getters, async actions (see `web/src/store/user.ts`).
- **Migration**: Add SQL to `store/migration/sqlite/LATEST.sql`, increment version, test with `go test ./store/test/` (see existing migration files).

Safety & repo rules
- **Protobuf workflow**: Never edit generated code in `proto/gen/` or `web/src/types/proto/` - regenerate with `buf generate`.
- **Migrations**: Versioned SQL files only; test on fresh databases to avoid breaking existing installations.
- **Frontend bundling**: Always run `pnpm release` after UI changes to update server-embedded assets.
- Follow `AGENTS.md` for commits (`feat:`, `fix:`) and `SECURITY.md` for vulnerability handling.

When in doubt
- **New API**: Check existing services in `server/router/api/v1/` for protobuf + implementation patterns.
- **Database query**: Look at `store/db/sqlite/` implementations and corresponding tests in `store/test/`.
- **UI component**: Reference `web/src/components/` for Tailwind + Radix patterns, check `web/src/store/` for data flow.
- **Build issue**: Verify `buf generate` ran after proto changes, `pnpm release` after frontend changes.
