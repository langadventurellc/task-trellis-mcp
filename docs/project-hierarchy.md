# Project Hierarchy

Task Trellis supports up to 4 levels of hierarchy for organizing work, but you can use fewer for smaller efforts. See [IssuesPicking a Parent Issue Type](issues.md#picking-a-parent-issue-type)

```
Project (Top-level container)
└── Epic (Large feature groupings)
    └── Feature (Specific functionality)
        └── Task (Individual work items)
```

## File Storage

Task Trellis uses a local file-based storage system with different hierarchy patterns:

### Full Project Hierarchy

```
your-project/
└── .trellis/
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
your-project/
└── .trellis/
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
your-project/
└── .trellis/
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
your-project/
└── .trellis/
    └── t/
        ├── open/
        │   └── T-task-id.md
        └── closed/
            └── T-completed-task-id.md
```

Each issue is stored as a Markdown file with YAML frontmatter metadata and content body.
