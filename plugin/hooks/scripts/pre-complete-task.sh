#!/bin/bash

# Pre-tool use hook for Trellis Complete Task
# Runs lint and test before completing tasks

echo "Running pre-completion checks for Trellis task..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

echo "Running quality checks..."
if ! npm run quality; then
    echo "Quality checks failed - fix issues before completing task" >&2
    exit 2
fi

echo "Quality checks passed"

echo "Running tests..."
if ! npm run test; then
    echo "Tests failed - fix issues before completing task" >&2
    exit 2
fi

echo "Tests passed"
echo "Pre-completion checks successful - proceeding with task completion"
exit 0
