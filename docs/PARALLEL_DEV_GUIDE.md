# 매크로 병렬 개발 가이드

여러 매크로(Cards / Button / Panel / Tab / ...)를 **동시에** 진행하기 위한 워크플로우. registry 패턴(`docs/CUSTOM_PANEL_PLAN.md` Phase 11+ 인프라)이 깔린 1.0.24부터 유효.

---

## 0. 전제

- 한 매크로 = 한 파일 묶음 (`src/macros/{name}.ts` + `src/editors/{Name}Editor/` + `src/schema/{name}.ts` + `src/schema/{name}-mapper.ts`)
- 공유 코드(`host/`, `components/`, `main.tsx`, `vite.config.ts`, `pom.xml`)는 인프라 완료 후 거의 안 건드린다 = 충돌 표면 0
- `src/macros/index.ts`만 한 줄(`import './button';`)씩 늘어남 → 머지 충돌 발생 가능 지점이지만 자동 해결 가능

---

## 1. git worktree 기본

```bash
# 1. main에서 worktree 생성 (현재 디렉토리 그대로 둔 채 옆 디렉토리로 분기)
git worktree add ../wonik-button feature/macro-button

# 2. 현재 worktree 목록
git worktree list

# 3. 작업 끝나고 정리
git worktree remove ../wonik-button
git branch -d feature/macro-button   # 머지 후
```

worktree는 같은 `.git` 저장소를 공유하지만 working tree만 별도 디렉토리에 펼침. 동일 디렉토리에서 `git switch`로 왔다갔다 할 필요 없음.

---

## 2. 매크로 작업 worktree 절차

### 2.1 시작

```bash
# main 기준 worktree 생성
git worktree add ../wonik-{macro} feature/macro-{macro}
cd ../wonik-{macro}/macros/wonikips-confluence-macro/src/main/resources/client-custom

# Node 의존성은 Maven이 빌드 시 자동 설치. 직접 npm install 안 해도 됨
# (단, Vite dev로 시각 검수하려면 npm install 필요)
npm install
npm run dev   # http://localhost:5173 에서 매크로 디자인 검수
```

### 2.2 작성할 파일 (한 매크로 기준)

| 경로 | 역할 |
|------|------|
| `src/schema/{name}.ts` | Zod schema + `{Name}Params` 타입 |
| `src/schema/{name}-mapper.ts` | UI ↔ Java Map 양방향 변환 |
| `src/editors/{Name}Editor/{Name}Editor.tsx` | 사이드바 React 편집 UI |
| `src/editors/{Name}Editor/{Name}Editor.module.css` | 편집 UI 스타일 |
| `src/macros/{name}.ts` | Dialog shell + opener + `registerMacro()` |
| `src/macros/index.ts` | **한 줄 추가**: `import './{name}';` |

### 2.3 끝낼 때

```bash
# main의 client-custom에서 빌드 한 번 해서 회귀 없는지 확인
npm run build
# bundle size: 215KB ± (한 매크로 당 ~5~10KB 증가 예상)

# commit + push
git add .
git commit -m "feat({name}): 자체 React 패널"
git push origin feature/macro-{name}
```

---

## 3. 충돌 방지 정책 (★)

worktree에서 **하면 안 되는 것**:

1. **`pom.xml` 버전 bump 금지** — 머지 직전 main에서만 한 번에 처리. 각 worktree가 독립적으로 1.0.25, 1.0.26... 올리면 머지 충돌 + 어떤 버전이 정답인지 모호.
2. **npm 패키지 추가 금지** — `package.json`/`package-lock.json` 동시 수정은 머지 충돌 1순위. 추가가 꼭 필요하면 main에 먼저 PR로 추가 → 모든 worktree에서 pull.
3. **`host/v4-adapter.ts` / `main.tsx` 수정 금지** — 인프라 완료(1.0.24) 이후엔 매크로별로 건드릴 일 없음. 건드려야 한다면 인프라 결함이니 먼저 main에서 고친다.
4. **`src/components/` 공유 컴포넌트 시그니처 변경 금지** — 추가는 OK, 기존 prop 이름/타입 변경은 다른 worktree 깸. 부득이하게 변경 시 사전 공유.
5. **`docs/CLAUDE.md` 수정 금지** — main 머지 후에 한 번에 갱신.

worktree에서 **OK**:
- `src/macros/{your-name}.ts`, `src/editors/{Your}Editor/**`, `src/schema/{your-name}*.ts` — 자기 매크로 파일
- `src/components/` 신규 컴포넌트 추가 (이름이 안 겹치게)
- `src/macros/index.ts`에 `import './{your-name}';` 한 줄 추가

---

## 4. 머지 절차

### 4.1 PR 흐름 (권장)

```bash
# worktree에서
git push origin feature/macro-{name}
# → GitHub PR 생성 → main으로 머지

# main worktree에서
git pull origin main
git worktree remove ../wonik-{name}
git branch -D feature/macro-{name}
```

### 4.2 직접 fast-forward (소규모 팀)

```bash
# main worktree로 이동
cd ~/confluence

git fetch origin
git merge feature/macro-button     # ff-only로 충돌 0 기대
git merge feature/macro-panel
git merge feature/macro-tab

# 머지 후 한 번에 빌드 + 통합 검증
cd macros/wonikips-confluence-macro/src/main/resources/client-custom
npm run build
# → bundle size 회귀 확인
# → 콘솔 5줄 + monkey-patch 등록 매크로 목록 출력 확인

# pom.xml 버전 한 번에 bump (1.0.24 → 1.0.27 등)
# atlas-package + Confluence 통합 검증
```

### 4.3 `src/macros/index.ts` 충돌 해결

여러 worktree가 각자 한 줄씩 추가하면 머지 시 충돌 가능. 해결 패턴:

```ts
// merge conflict 표시 시 — 양쪽 다 채택
import './cards';
<<<<<<< HEAD
import './button';
=======
import './panel';
>>>>>>> feature/macro-panel
```
→ 수동으로:
```ts
import './cards';
import './button';
import './panel';
```
순서는 무관 (각 매크로는 자기 이름으로 registry에 등록).

---

## 5. claude -p 병렬 실행 (선택)

각 worktree에 별도 Claude 세션을 붙여 병렬 작업:

```bash
# Terminal 1
cd ../wonik-button
claude -p "Button 매크로를 docs/PARALLEL_DEV_GUIDE.md §2.2 절차대로 자체 패널화. 검증 끝나면 commit+push." --dangerously-skip-permissions

# Terminal 2
cd ../wonik-panel
claude -p "Panel 매크로를 ..." --dangerously-skip-permissions
```

worktree가 독립 디렉토리라 파일 잠금/Vite dev 포트 충돌 없음 (Vite dev 포트는 5173, 5174... 자동 증가).

`--dangerously-skip-permissions`은 격리된 worktree에서만 권장. main에선 절대 사용 금지.

---

## 6. 문제 상황별 대응

| 증상 | 원인 | 해결 |
|------|------|------|
| `git worktree add` 실패: "branch already checked out" | 같은 브랜치를 두 worktree가 잡고 있음 | 새 브랜치명 사용 또는 기존 worktree 정리 |
| 머지 후 `package-lock.json` 충돌 | worktree에서 npm install 실행 | main에서 `npm install` 한 번 다시 + commit으로 정렬 |
| 머지 후 빌드 실패 (모듈 not found) | 한 worktree가 import한 신규 컴포넌트가 다른 worktree에서 누락 | 머지 직후 `npm run build` → 누락 컴포넌트 추가 commit |
| `src/macros/index.ts` 한 매크로가 보이지 않음 (콘솔에 등록 로그 없음) | barrel에 import 라인 누락 | `import './{name}';` 추가 후 재빌드 |
| Vite dev 포트 충돌 | 여러 worktree가 같은 포트 시도 | Vite는 5173 → 5174 자동 fallback. 명시적으로는 `npm run dev -- --port 5180` |
| Confluence에 1.0.24, 1.0.25 둘 다 떠있는 상태 | 옛 plugin 안 지우고 업로드 | UPM에서 옛 버전 명시적 삭제 (caching 충돌 방지) |

---

## 7. 한눈 요약

```
main worktree
├── ../wonik-button   ← Cards 외 Button 작업
├── ../wonik-panel    ← Panel 작업
└── ../wonik-tab      ← Tab 작업

각자: src/macros/{name}.ts + src/editors/ + src/schema/만 건드림
머지: feature/macro-{name} → main (충돌 표면은 src/macros/index.ts 한 줄뿐)
빌드: 모든 머지 끝난 후 main에서 한 번 (pom.xml 버전 bump + atlas-package)
```

병렬 N개 매크로 = main 빌드/배포 1회 + 각 worktree에서 시각 검수 N회.
