#!/usr/bin/env bash
set -euo pipefail

# Read tool input from stdin
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // ""')

# Dangerous command patterns
dangerous_patterns=(
  'rm -rf /'
  'git reset --hard'
  'git push.*--force'
  'git clean -f'
  'sudo '
  'chmod 777'
  'curl.*|.*sh'
  'wget.*|.*sh'
)

for pattern in "${dangerous_patterns[@]}"; do
  if echo "$cmd" | grep -qE "$pattern"; then
    echo "BLOCKED: dangerous command pattern '$pattern' detected" >&2
    echo "Command: $cmd" >&2
    exit 2
  fi
done

exit 0
