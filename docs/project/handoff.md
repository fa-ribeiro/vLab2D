# New Chat Handoff

Prefer attaching or making the entire source repository available.

The project-documentation entry point is [`README.md`](README.md). It indexes the continuity documents stored in `docs/project/` and explains their responsibilities.

For a fresh development context:

1. identify the latest commit explicitly confirmed by the project owner as the authoritative baseline;
2. read `README.md` in this directory for project-documentation orientation;
3. read `project-context.md` for stable project identity and architectural principles;
4. read `roadmap.md` for the active phased strategy and short-/long-term direction;
5. read `status.md` for the current checkpoint and next small goal;
6. consult `decisions.md`, `workflow.md`, `environment.md`, and `project-map.md` as required by the task.

If only the project documentation is available, also provide the current source files required for the work.

## Why the source repository is also necessary

The continuity pack records intent, roadmap, status, decisions, environment, and workflow. It is not a replacement for the actual source tree, tests, configuration, issue state, or commit history. For a faithful handoff, the new chat needs both.

## Current-state rule

Do not record the latest commit, feature, or checkpoint in this handoff file. Read `status.md` for the current implementation state, `roadmap.md` for the phased development strategy, and `project-context.md` for stable project identity. This avoids the handoff becoming another status document that must be synchronized after every feature.

## Authoritative repository baseline

The latest commit identifier explicitly confirmed by the project owner is the authoritative baseline for vLab2D.

When a baseline commit is established:

- treat the repository at that commit as the source of truth;
- ignore earlier uploaded ZIP files, generated working copies, local snapshots, and previous repository states;
- do not reconstruct current project state from older conversation artifacts when they conflict with the baseline;
- read the project documentation and source code from the baseline before continuing substantial work.

During development of the next feature or refactor, the working context consists of:

> **authoritative baseline + explicitly agreed uncommitted changes**

Those changes remain provisional until the work completes the normal review, documentation, and verification lifecycle.

Once the completed work is committed and its commit identifier is explicitly shared and confirmed, that commit becomes the new authoritative baseline and supersedes both:

1. the previous baseline; and
2. all provisional working-state descriptions that led to the new commit.

Git therefore provides the durable project state between development steps, while the project documentation contained in that commit provides the durable human-readable context.

A new chat should first identify the latest confirmed baseline and then use the repository and its documentation at that baseline to restore project context.
