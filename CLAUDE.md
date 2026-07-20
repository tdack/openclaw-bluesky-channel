# Release process

Releases are cut by the `Publish` workflow ([.github/workflows/publish.yml](.github/workflows/publish.yml)), triggered manually via `workflow_dispatch`. It bumps `package.json`, tags, pushes, and publishes to npm and ClawHub.

**Before running the Publish workflow, update [CHANGELOG.md](CHANGELOG.md):** add an entry for every user-facing change under the `## [Unreleased]` heading at the top of the file (create the heading if it's missing). Do this in the same PR/commit as the change it describes, not as an afterthought — do not batch it up for later.

The workflow enforces this: it fails before bumping the version if `## [Unreleased]` has no content. On a successful run it automatically promotes `## [Unreleased]` to `## [<new-version>] - <date>`, so never hand-write the version header or date yourself — just add bullets under `## [Unreleased]`.
