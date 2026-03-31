#!/usr/bin/env bash
# Claude Code status line: hash bar for context + 5-hour rate limit

input=$(cat)

BAR_WIDTH=20

# Build a filled hash bar from a percentage (0-100)
make_bar() {
  local pct="$1"
  local filled=$(( pct * BAR_WIDTH / 100 ))
  local empty=$(( BAR_WIDTH - filled ))
  local bar=""
  local i
  for (( i=0; i<filled; i++ )); do bar="${bar}#"; done
  for (( i=0; i<empty; i++ )); do bar="${bar}-"; done
  printf "%s" "$bar"
}

# Pick ANSI color based on percentage used
usage_color() {
  local pct="$1"
  if [ "$pct" -lt 50 ]; then
    printf "\033[32m"   # green
  elif [ "$pct" -lt 80 ]; then
    printf "\033[33m"   # yellow
  else
    printf "\033[31m"   # red
  fi
}

RESET="\033[0m"

parts=()

# Context window section
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
if [ -n "$used_pct" ]; then
  used_int=$(printf '%.0f' "$used_pct")
  color=$(usage_color "$used_int")
  bar=$(make_bar "$used_int")
  parts+=("$(printf "ctx ${color}[%s]${RESET} %d%%" "$bar" "$used_int")")
fi

# 5-hour rate limit section
five_used=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
five_resets_at=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
if [ -n "$five_used" ]; then
  five_int=$(printf '%.0f' "$five_used")
  color=$(usage_color "$five_int")
  bar=$(make_bar "$five_int")
  limit_str="$(printf "5h ${color}[%s]${RESET} %d%%" "$bar" "$five_int")"

  if [ -n "$five_resets_at" ]; then
    reset_time=$(date -d "@${five_resets_at}" +"%H:%M" 2>/dev/null || date -r "${five_resets_at}" +"%H:%M" 2>/dev/null)
    [ -n "$reset_time" ] && limit_str="${limit_str} (resets ${reset_time})"
  fi

  parts+=("$limit_str")
fi

# Join parts with separator
if [ ${#parts[@]} -gt 0 ]; then
  output=""
  for i in "${!parts[@]}"; do
    [ $i -gt 0 ] && output="${output}  |  "
    output="${output}${parts[$i]}"
  done
  printf "%b" "$output"
fi
