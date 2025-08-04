PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ "$1" != "$PROJECT_ROOT" ]; then
  echo "Current working directory: $1" >&2
  exit 2
fi