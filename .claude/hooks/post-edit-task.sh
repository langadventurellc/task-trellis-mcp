#!/bin/bash

# Post-tool use hook for file edits
# Runs lint and type-check after editing files

echo "🔧 Running post-edit checks..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

echo "📝 Running lint checks..."
LINT_OUTPUT=$(mise run lint 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ Lint checks failed - consider fixing issues before continuing. continue with your work after fixing." >&2
    echo "$LINT_OUTPUT" | grep -E "(error|warning)" >&2
    exit 2
fi

echo "✅ Lint checks passed"

echo "📝 Running type checks..."
TYPE_OUTPUT=$(mise run type-check 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ Type checks failed - consider fixing issues before continuing. continue with your work after fixing." >&2
    echo "$TYPE_OUTPUT" | grep -E "(error|warning)" >&2
    exit 2
fi

echo "✅ Type checks passed"
exit 0
