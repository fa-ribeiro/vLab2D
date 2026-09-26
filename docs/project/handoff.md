# New Chat Handoff

Prefer attaching or making the entire source repository available. The continuity pack lives inside the repository at `docs/project/`. If only the continuity pack is available, also provide the current source files needed for the task.

Then say:

> We are continuing the vLab2D project. Read `project-context.md` first, then `status.md`, `decisions.md`, `environment.md`, `workflow.md`, and `project-map.md`. Treat them as the source of truth. Continue from the recorded state rather than redesigning the project. Update the continuity documentation whenever materially relevant project information changes.

## Why the source repository is also necessary

The continuity pack records intent, status, decisions, environment, and workflow. It is not a replacement for the actual source tree, tests, configuration, issue state, or commit history. For a faithful handoff, the new chat needs both.

## Current-state rule

Do not record the latest commit, feature, or checkpoint in this handoff file. Read `status.md` for the current implementation state and `project-context.md` for stable project identity. This avoids the handoff becoming another status document that must be synchronized after every feature.
