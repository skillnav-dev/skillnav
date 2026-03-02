#!/usr/bin/env bash
set -euo pipefail

# Read tool input from stdin
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Only format project source files
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css)
    if command -v npx &> /dev/null; then
      npx prettier --write "$file_path" 2>/dev/null || true
    fi
    ;;
esac

exit 0
