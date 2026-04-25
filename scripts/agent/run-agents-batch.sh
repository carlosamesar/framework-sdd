#!/usr/bin/env bash
set -euo pipefail

TASK_FILE="${1:-scripts/agent/tasks.queue.txt}"
PARALLEL="${2:-3}"
AGENT_RETRIES="${AGENT_RETRIES:-0}"
TASK_TIMEOUT_SECONDS="${TASK_TIMEOUT_SECONDS:-0}"
AGENT_DRY_RUN="${AGENT_DRY_RUN:-0}"
AGENT_GIT_AUTOCOMMIT="${AGENT_GIT_AUTOCOMMIT:-0}"
AGENT_GIT_AUTO_BRANCH="${AGENT_GIT_AUTO_BRANCH:-0}"
AGENT_GIT_AUTOPUSH="${AGENT_GIT_AUTOPUSH:-0}"
AGENT_GIT_BRANCH_PREFIX="${AGENT_GIT_BRANCH_PREFIX:-chore/agent-batch}"
MANDATORY_PREMISE="${MANDATORY_PREMISE:-El Corazon del Sistema Orquestacion 100% IA}"

if [[ ! -f "$TASK_FILE" ]]; then
  echo "ERROR: no existe el archivo de tareas: $TASK_FILE"
  exit 1
fi

mkdir -p reports/agent-runs logs
STATUS_DIR=".tmp/agent-status"
mkdir -p "$STATUS_DIR"

skipped_count=0
started_count=0

if command -v gd-cycle >/dev/null 2>&1; then
  GD_CMD=(gd-cycle)
else
  GD_CMD=(node /home/cto-grupo4d/Documents/Good4D/Framework-SDD/packages/sdd-agent-orchestrator/src/run-gd-cycle.mjs)
fi

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  echo "$value"
}

contains_premise() {
  local objective="$1"
  local premise="$2"
  if [[ "$objective" == *"$premise"* ]]; then
    return 0
  fi
  return 1
}

run_task() {
  local task_id="$1"
  local stack="$2"
  local project="$3"
  local project_root="$4"
  local complexity="$5"
  local objective="$6"
  local status_file="$STATUS_DIR/${task_id}.status"

  local prompt
  prompt="Stack: ${stack}. Proyecto: ${project}. Complejidad: ${complexity}. Objetivo: ${objective}"

  local attempt=0
  local max_attempts=$((AGENT_RETRIES + 1))
  local exit_code=1

  echo "[START] ${task_id}"

  while (( attempt < max_attempts )); do
    attempt=$((attempt + 1))
    echo "[INFO] ${task_id} intento ${attempt}/${max_attempts}" >> "logs/${task_id}.err"

    if [[ "$AGENT_DRY_RUN" == "1" ]]; then
      printf '{"task_id":"%s","dry_run":true,"status":"ok"}\n' "$task_id" > "reports/agent-runs/${task_id}.json"
      exit_code=0
    else
      if (( TASK_TIMEOUT_SECONDS > 0 )); then
        set +e
        timeout "$TASK_TIMEOUT_SECONDS" \
          env FRAMEWORK_SDD_PROJECT_ROOT="$project_root" \
          SDD_SKIP_HUMAN_GATE=1 \
          SDD_GD_CYCLE_FULL_JSON=1 \
          "${GD_CMD[@]}" "$prompt" \
          > "reports/agent-runs/${task_id}.json" \
          2> "logs/${task_id}.err"
        exit_code=$?
        set -e
      else
        set +e
        FRAMEWORK_SDD_PROJECT_ROOT="$project_root" \
          SDD_SKIP_HUMAN_GATE=1 \
          SDD_GD_CYCLE_FULL_JSON=1 \
          "${GD_CMD[@]}" "$prompt" \
          > "reports/agent-runs/${task_id}.json" \
          2> "logs/${task_id}.err"
        exit_code=$?
        set -e
      fi
    fi

    if [[ "$exit_code" -eq 0 ]]; then
      echo "DONE" > "$status_file"
      echo "[DONE] ${task_id}"
      return 0
    fi

    if (( attempt < max_attempts )); then
      echo "[RETRY] ${task_id} fallo (exit=${exit_code}), reintentando..."
    fi
  done

  echo "FAIL" > "$status_file"
  echo "[FAIL] ${task_id}"
  return 1
}

running=0

while IFS='|' read -r _ task_id status stack project project_root complexity objective _; do
  task_id="$(trim "${task_id:-}")"
  status="$(trim "${status:-}")"
  stack="$(trim "${stack:-}")"
  project="$(trim "${project:-}")"
  project_root="$(trim "${project_root:-}")"
  complexity="$(trim "${complexity:-}")"
  objective="$(trim "${objective:-}")"

  [[ -z "$task_id" ]] && continue
  [[ "$task_id" == "task_id" ]] && continue
  [[ "$task_id" =~ ^-+$ ]] && continue

  if [[ -z "$status" || -z "$stack" || -z "$project" || -z "$project_root" || -z "$complexity" || -z "$objective" ]]; then
    echo "[SKIP] linea invalida para task_id=${task_id}"
    continue
  fi

  if [[ "$status" != "READY" ]]; then
    echo "[SKIP] ${task_id} status=${status}"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if [[ "$stack" != "frontend" && "$stack" != "backend" && "$stack" != "fullstack" ]]; then
    echo "[FAIL-PREFLIGHT] ${task_id} stack invalido: ${stack}"
    echo "FAIL" > "$STATUS_DIR/${task_id}.status"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if [[ ! -d "$project_root" ]]; then
    echo "[FAIL-PREFLIGHT] ${task_id} project_root inexistente: ${project_root}"
    echo "FAIL" > "$STATUS_DIR/${task_id}.status"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if ! contains_premise "$objective" "$MANDATORY_PREMISE"; then
    echo "[FAIL-PREFLIGHT] ${task_id} no incluye premisa obligatoria"
    echo "FAIL" > "$STATUS_DIR/${task_id}.status"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  run_task "$task_id" "$stack" "$project" "$project_root" "$complexity" "$objective" &
  started_count=$((started_count + 1))
  running=$((running + 1))

  if (( running >= PARALLEL )); then
    wait -n
    running=$((running - 1))
  fi
done < "$TASK_FILE"

wait

status_map_file="$STATUS_DIR/status-map.txt"
> "$status_map_file"
for status_file in "$STATUS_DIR"/*.status; do
  [[ -f "$status_file" ]] || continue
  task_id="$(basename "$status_file" .status)"
  task_status="$(cat "$status_file")"
  echo "${task_id}|${task_status}" >> "$status_map_file"
done

if [[ -s "$status_map_file" ]]; then
  awk -v mapFile="$status_map_file" '
    function trim(s) {
      gsub(/^[ \t]+|[ \t]+$/, "", s)
      return s
    }
    BEGIN {
      while ((getline line < mapFile) > 0) {
        split(line, p, "|")
        update[p[1]] = p[2]
      }
      close(mapFile)
    }
    {
      if ($0 !~ /^\|/) {
        print $0
        next
      }

      n = split($0, c, "|")
      if (n < 8) {
        print $0
        next
      }

      task_id = trim(c[2])
      status = trim(c[3])
      stack = trim(c[4])
      project = trim(c[5])
      project_root = trim(c[6])
      complexity = trim(c[7])
      objective = trim(c[8])

      if (task_id == "task_id") {
        print "| task_id | status | stack | project | project_root | complexity | objective |"
        next
      }

      if (task_id ~ /^-+$/) {
        print "|---------|--------|-------|---------|--------------|------------|-----------|"
        next
      }

      if (status == "READY" && (task_id in update)) {
        status = update[task_id]
      }

      print "| " task_id " | " status " | " stack " | " project " | " project_root " | " complexity " | " objective " |"
    }
  ' "$TASK_FILE" > "$TASK_FILE.tmp"

  mv "$TASK_FILE.tmp" "$TASK_FILE"
fi

done_count=0
fail_count=0
for status_file in "$STATUS_DIR"/*.status; do
  [[ -f "$status_file" ]] || continue
  task_status="$(cat "$status_file")"
  if [[ "$task_status" == "DONE" ]]; then
    done_count=$((done_count + 1))
  elif [[ "$task_status" == "FAIL" ]]; then
    fail_count=$((fail_count + 1))
  fi
done

summary_file="reports/agent-runs/summary-$(date +%Y%m%d-%H%M%S).md"
{
  echo "# Agent Batch Summary"
  echo ""
  echo "- task_file: $TASK_FILE"
  echo "- parallel: $PARALLEL"
  echo "- retries: $AGENT_RETRIES"
  echo "- timeout_seconds: $TASK_TIMEOUT_SECONDS"
  echo "- started: $started_count"
  echo "- done: $done_count"
  echo "- fail: $fail_count"
  echo "- skipped: $skipped_count"
  echo ""
  echo "## Per-task status"
  for status_file in "$STATUS_DIR"/*.status; do
    [[ -f "$status_file" ]] || continue
    task_id="$(basename "$status_file" .status)"
    task_status="$(cat "$status_file")"
    echo "- $task_id: $task_status"
  done
} > "$summary_file"

if [[ "$AGENT_GIT_AUTOCOMMIT" == "1" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    current_branch="$(git rev-parse --abbrev-ref HEAD)"
    target_branch="$current_branch"

    if [[ "$AGENT_GIT_AUTO_BRANCH" == "1" ]]; then
      target_branch="${AGENT_GIT_BRANCH_PREFIX}-$(date +%Y%m%d-%H%M%S)"
      git checkout -b "$target_branch"
    fi

    git add "$TASK_FILE" "$summary_file" reports/agent-runs logs .tmp/agent-status >/dev/null 2>&1 || true

    if ! git diff --cached --quiet; then
      commit_msg="chore(agent): batch update ${done_count} done ${fail_count} fail ${skipped_count} skipped"
      git commit -m "$commit_msg"
      echo "- Git commit: OK ($commit_msg)"
      echo "- Git branch: $target_branch"

      if [[ "$AGENT_GIT_AUTOPUSH" == "1" ]]; then
        git push --set-upstream origin "$target_branch"
        echo "- Git push: OK"
      fi
    else
      echo "- Git commit: sin cambios para registrar"
    fi
  else
    echo "- Git commit: omitido (directorio no git)"
  fi
fi

echo ""
echo "Batch finalizado"
echo "- Resultados JSON: reports/agent-runs/"
echo "- Errores: logs/"
echo "- Resumen: $summary_file"
