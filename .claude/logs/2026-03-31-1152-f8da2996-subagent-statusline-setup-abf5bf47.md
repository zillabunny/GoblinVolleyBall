# Subagent: statusline-setup `abf5bf47` — 2026-03-31 11:52

*Parent session: `f8da2996`*

---
**User:**
> visualize my token usage and display the time at which my hourly useage will reset

I'll read the necessary files to set up the status line configuration.

● `Read(/root/.zshrc)`
  ⎿  **Error:** EACCES: permission denied, statx '/root/.zshrc'

● `Read(/root/.claude/settings.json)`
  ⎿  **Error:** EACCES: permission denied, statx '/root/.claude/settings.json'

● `Read(/home/user/.zshrc)`
  ⎿  **Error:** File does not exist. Note: your current working directory is /workspaces/GoblinVolleyball.

● `Read(/home/user/.claude/settings.json)`
  ⎿  **Error:** File does not exist. Note: your current working directory is /workspaces/GoblinVolleyball.

● `Read(/workspaces/GoblinVolleyball/.claude/settings.json)`
  ⎿  **Error:** File does not exist. Note: your current working directory is /workspaces/GoblinVolleyball.

The settings file does not exist yet. I'll create the script and settings file in the `.claude` directory that already exists in the workspace.

● `Read(/workspaces/GoblinVolleyball/.claude)`
  ⎿  **Error:** EISDIR: illegal operation on a directory, read '/workspaces/GoblinVolleyball/.claude'

Good, the `.claude` directory exists. Now I'll create the status line script and settings file.

● `Update(/workspaces/GoblinVolleyball/.claude/statusline-command.sh)`
```diff
+#!/usr/bin/env bash
+# Claude Code status line: token usage + 5-hour reset time
 
+input=$(cat)
+
+# Context window usage
+used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
+remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
+
+# Rate limit: 5-hour window
+five_used=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
+five_resets_at=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
+
+parts=()
+
+# Context window section
+if [ -n "$used_pct" ] && [ -n "$remaining_pct" ]; then
+  used_int=$(printf '%.0f' "$used_pct")
+  remaining_int=$(printf '%.0f' "$remaining_pct")
+
+  # Color based on usage: green -> yellow -> red
+  if [ "$used_int" -lt 50 ]; then
+    color="\033[32m"   # green
+  elif [ "$used_int" -lt 80 ]; then
+    color="\033[33m"   # yellow
+  else
+    color="\033[31m"   # red
+  fi
+  reset="\033[0m"
+
+  parts+=("$(printf "${color}ctx: %d%% used / %d%% left${reset}" "$used_int" "$remaining_int")")
+fi
+
+# 5-hour rate limit section
+if [ -n "$five_used" ]; then
+  five_int=$(printf '%.0f' "$five_used")
+
+  if [ "$five_int" -lt 50 ]; then
+    color="\033[32m"
+  elif [ "$five_int" -lt 80 ]; then
+    color="\033[33m"
+  else
+    color="\033[31m"
+  fi
+  reset="\033[0m"
+
+  limit_str="$(printf "${color}5h limit: %d%%${reset}" "$five_int")"
+
+  # Append reset time if available
+  if [ -n "$five_resets_at" ]; then
+    reset_time=$(date -d "@${five_resets_at}" +"%H:%M" 2>/dev/null || date -r "${five_resets_at}" +"%H:%M" 2>/dev/null)
+    if [ -n "$reset_time" ]; then
+      limit_str="${limit_str} (resets ${reset_time})"
+    fi
+  fi
+
+  parts+=("$limit_str")
+fi
+
+# Join parts with separator
+if [ ${#parts[@]} -gt 0 ]; then
+  output=""
+  for i in "${!parts[@]}"; do
+    if [ $i -gt 0 ]; then
+      output="${output}  |  "
+    fi
+    output="${output}${parts[$i]}"
+  done
+  printf "%b" "$output"
+fi
+
```
  ⎿  The file /workspaces/GoblinVolleyball/.claude/statusline-command.sh has been updated successfully.

● `Update(/workspaces/GoblinVolleyball/.claude/settings.json)`
```diff
+{
+  "statusLine": {
+    "type": "command",
+    "command": "bash /workspaces/GoblinVolleyball/.claude/statusline-command.sh"
+  }
+}
 
```
  ⎿  The file /workspaces/GoblinVolleyball/.claude/settings.json has been updated successfully.

The status line is now configured. Here is what was set up:

**Script:** `/workspaces/GoblinVolleyball/.claude/statusline-command.sh`
**Settings:** `/workspaces/GoblinVolleyball/.claude/settings.json`

The status line displays two sections separated by `|`:

1. **Context window usage** — shows percentage of the context window used and remaining (e.g., `ctx: 23% used / 77% left`)
2. **5-hour rate limit** — shows how much of your hourly session budget is consumed, plus the clock time when that window resets (e.g., `5h limit: 45% (resets 14:30)`)

Both sections use color coding: green below 50%, yellow from 50-79%, red at 80% and above. Nothing is displayed for a section until Claude Code has data for it (i.e., after the first API response).

Note: this "statusline-setup" agent should be used for any future changes to the status line. You can ask Claude to update or adjust the status line at any time and it will invoke this agent again.
