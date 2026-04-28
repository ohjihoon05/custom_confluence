#!/usr/bin/env bash
# Phase 05~08 컴포넌트 병렬 실행 (Slider, TextInput, ColorPicker, IconPicker)
# 각 phase는 commit 안 함 — 작업 끝나면 사용자가 일괄 commit
#
# 사용법:
#   ./run-parallel-components.sh
#
# 결과: 4개 phase가 4개 백그라운드 프로세스로 동시 실행. 로그는 .claude/logs/phase-XX.log
# 모두 끝나면 본 스크립트가 종료. tsc 검증은 각 phase 안에서 수행.

set -e
cd "$(dirname "$0")/.."

mkdir -p .claude/logs

PHASES=(05 06 07 08)
PIDS=()

for ph in "${PHASES[@]}"; do
  echo "▶ Starting phase-$ph (background)"
  claude -p "/phase-$ph" \
    --max-turns 30 \
    --output-format json \
    > ".claude/logs/phase-$ph.log" 2>&1 &
  PIDS+=($!)
done

echo ""
echo "4 phases running in parallel. PIDs: ${PIDS[*]}"
echo "Logs: .claude/logs/phase-{05,06,07,08}.log"
echo "Waiting for all to finish..."
echo ""

FAILED=0
for i in "${!PIDS[@]}"; do
  pid="${PIDS[$i]}"
  ph="${PHASES[$i]}"
  if wait "$pid"; then
    echo "✓ phase-$ph completed"
  else
    echo "✗ phase-$ph FAILED (see .claude/logs/phase-$ph.log)"
    FAILED=$((FAILED+1))
  fi
done

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "All 4 phases succeeded. Run 'git status' and commit when ready:"
  echo ""
  echo "  git add macros/wonikips-confluence-macro/src/main/resources/client-custom/src/components/"
  echo "  git commit -m 'phase 05-08: Slider, TextInput, ColorPicker, IconPicker components'"
else
  echo "$FAILED phase(s) failed. Check logs."
  exit 1
fi
