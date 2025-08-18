# Project Structure Guidelines

## What belongs in the root directory

### ✅ Essential Configuration Files
- `.gitignore` - Git ignore patterns
- `LICENSE` - Project license
- `README.md` - Project overview and setup instructions
- `package.json` - Root package configuration
- `package-lock.json` - Dependency lock file

### ✅ Build Tool Configurations
- `Makefile` - Make commands for project management
- `turbo.json` - Turborepo configuration
- `nx.json` - Nx monorepo configuration
- `pnpm-workspace.yaml` - pnpm workspace configuration

### ✅ Project Directories
- `frontend/` - Frontend application
- `backend/` - Backend API server
- `admin-dashboard/` - Admin interface
- `docs/` - Documentation
- `shared/` - Shared utilities/types
- `.git/` - Git repository data
- `node_modules/` - Dependencies (git-ignored)

## What should NOT be in root

### ❌ Files that were moved
- `favicon.ico`, `favicon.svg` → Moved to `frontend/public/`
- All `.md` documentation files → Moved to `docs/`
- Test HTML files → Moved to `docs/features/`

### ❌ Common mistakes to avoid
- Application-specific assets (images, icons)
- Test files
- Build outputs
- Environment files (except .env.example)
- IDE-specific configurations (except shared ones like .editorconfig)

## Current Clean Structure
```
parking-space-prototype/
├── .gitignore
├── LICENSE
├── README.md
├── Makefile
├── package.json
├── package-lock.json
├── pnpm-workspace.yaml
├── turbo.json
├── nx.json
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   └── ...
│   └── src/
├── backend/
├── admin-dashboard/
├── docs/
│   ├── features/
│   ├── planning/
│   └── setup/
└── shared/
```

This structure follows monorepo best practices and keeps the root directory focused on project-wide configuration and orchestration.
