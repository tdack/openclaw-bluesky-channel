# Changelog

## [2026.7.3] - 2026-07-19

### Fixed
- **Manifest:** Migrated legacy `channelEnvVars` to modern `setup.env` format to comply with ClawHub validation requirements.
- **Project Structure:** Properly tracked `pnpm-workspace.yaml` in Git.

## [2026.7.2] - 2026-07-19

### Fixed
- **Configuration:** Synchronized channel configuration schema with multi-account support.
- **Build/Packaging:** Excluded compiled test files from the npm tarball and ensured proper `openclaw.build` configuration.

## [2026.7.1] - 2026-07-19

### Features
- **Security:** Added `SecretRef` support for `appPassword` to improve authentication security.
- **Automation:** Introduced a manual GitHub Actions publish workflow to automate versioning, tagging, and publishing to both npm and ClawHub.

### Refactoring
- **SDK Compliance:** Adopted `defineChannelPluginEntry` and split logic into a lightweight `setup-entry.ts`.

### Documentation
- Updated `README.md` to cover secrets management, multi-account configuration, and onboarding via CLI.

### Maintenance
- Cleaned up build dependencies and fixed Docker environment setup.
- General repository cleanup: removed invalid manifest fields, fixed install commands, and renamed package to `openclaw-bluesky-channel`.

---
*Note: This summary covers the evolution of the project from its initial scaffold to the most recent SDK compliance and configuration fixes.*
