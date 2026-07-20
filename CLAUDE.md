# Release process

Releases are cut by the `Publish` workflow ([.github/workflows/publish.yml](.github/workflows/publish.yml)), triggered manually via `workflow_dispatch`. It bumps `package.json`, tags, pushes, and publishes to npm and ClawHub.

**Before running the Publish workflow, update [CHANGELOG.md](CHANGELOG.md):** add an entry for every user-facing change under the `## [Unreleased]` heading at the top of the file (create the heading if it's missing). Do this in the same PR/commit as the change it describes, not as an afterthought — do not batch it up for later.

The workflow reads `CHANGELOG.md` from `origin`, not from your working tree — an uncommitted or unpushed edit is invisible to it. So `## [Unreleased]` entries must be **committed and pushed to `main`** before you trigger the workflow, or the gate will fail (empty section) or, worse, silently miss your entry if something else in Unreleased makes the gate pass.

The workflow enforces the gate: it fails before bumping the version if `## [Unreleased]` has no content. On a successful run it automatically promotes `## [Unreleased]` to `## [<new-version>] - <date>`, commits, tags, and pushes that to `main` — so never hand-write the version header or date yourself, just add bullets under `## [Unreleased]`.

**After the workflow succeeds, `git pull`** before doing anything else in the repo — it pushed a release commit (and tag) you don't have locally yet, and starting new work or editing `CHANGELOG.md` before pulling will desync your branch and likely conflict with the promoted heading.
