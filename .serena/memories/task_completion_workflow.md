# Task Completion Workflow

## After Every Code Change

**IMPORTANT**: Run the following commands after every change and fix all issues immediately:

1. **`npm quality`** - This runs all quality checks:
   - `npm lint` - ESLint with auto-fix
   - `npm format` - Prettier formatting
   - `npm type-check` - TypeScript type checking

2. **`npm test`** - Run unit tests (when configured)

## Git Workflow

- Husky pre-commit hooks are configured
- lint-staged will auto-format files on commit
- All staged files (.ts,.tsx,.js,.jsx,.md,.json,.yml,.yaml,.css,.scss) are formatted

## Quality Gates

- **No ESLint errors** allowed
- **No TypeScript errors** allowed
- **All tests must pass** (when implemented)
- **Code must follow Clean Code Charter** principles

## Self-Review Checklist

Before marking a task complete, ask:

1. Could this be one function simpler?
2. Does it follow KISS, YAGNI, SRP, DRY principles?
3. Are files ≤ 400 logical LOC?
4. No forbidden practices (any types, console.log, etc.)?
5. Does it use proper naming conventions?

## When Unsure

1. **Stop** and ask a clear, single question
2. Offer options (A / B / C) if helpful
3. Wait for user guidance before proceeding
