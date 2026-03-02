#!/usr/bin/env bash
cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "PRESERVE on compact: 1. All modified file paths 2. Current task progress and next steps 3. Test commands and results 4. Architectural decisions 5. Failed attempts and reasons"
  }
}
EOF
exit 0
