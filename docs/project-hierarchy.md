# Project Hierarchy

Task Trellis supports up to 4 levels of hierarchy for organizing work, but you can use fewer for smaller efforts. See [Picking a Parent Issue Type](issues.md#picking-a-parent-issue-type)

```
Project (Top-level container)
└── Epic (Large feature groupings)
    └── Feature (Specific functionality)
        └── Task (Individual work items)
```

## File Storage

Task Trellis stores data in `~/.trellis/projects/<key>/` — shared across all sessions, not inside the repo. The `<key>` is a 12-character SHA-1 hash of the project's git remote URL (or its absolute path for non-git projects).

### Full Project Hierarchy

```
~/.trellis/projects/<key>/
└── p/
    └── P-project-id/
        └── e/
            └── E-epic-id/
                └── f/
                    └── F-feature-id/
                        └── t/
                            ├── open/
                            │   └── T-task-id.md
                            └── closed/
                                └── T-completed-task-id.md
```

### Epic-Parent Hierarchy

```
~/.trellis/projects/<key>/
└── e/
    └── E-epic-id/
        └── f/
            └── F-feature-id/
                └── t/
                    ├── open/
                    │   └── T-task-id.md
                    └── closed/
                        └── T-completed-task-id.md
```

### Feature-Parent Hierarchy

```
~/.trellis/projects/<key>/
└── f/
    └── F-feature-id/
        └── t/
            ├── open/
            │   └── T-task-id.md
            └── closed/
                └── T-completed-task-id.md
```

### Standalone Tasks

```
~/.trellis/projects/<key>/
└── t/
    ├── open/
    │   └── T-task-id.md
    └── closed/
        └── T-completed-task-id.md
```

Each issue is stored as a Markdown file with YAML frontmatter metadata and content body.
