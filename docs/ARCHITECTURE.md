# 아키텍처

## 전체 구조

```
Confluence DC 7.19.8 (Docker)
│
├── User Macro (Velocity)            # 1단계 — 빠른 프로토타이핑
│   └── 관리자 콘솔에서 직접 등록
│       ├── 파라미터 선언 (## @param)
│       └── Velocity 템플릿 렌더링
│
└── P2 플러그인 (.jar)                # 2단계 — 커스텀 편집 UI (구현 완료)
    ├── Java Macro 클래스 (PageTitleMacro.java)
    ├── Velocity 렌더링 템플릿 (page-title.vm)
    ├── atlassian-plugin.xml (xhtml-macro + web-resource 등록)
    └── AUI Dialog2 편집 UI (page-title-editor.js / .css)
        └── AJS.MacroBrowser.setMacroJsOverride() (Confluence ↔ Dialog2 통신)
```

## 디렉토리 구조

```
confluence/
├── docker-compose.yml
├── CLAUDE.md
├── macros/
│   ├── user-macros/
│   │   └── custom-page-title.md           # Velocity 템플릿 + 등록 가이드
│   └── wonikips-confluence-macro/         # P2 플러그인 프로젝트 (구현 완료)
│       ├── pom.xml                        # confluence.version=7.19.8
│       ├── spec.md                        # 피처 요구사항 명세
│       ├── plan.md                        # 기술 구현 계획
│       ├── tasks.md                       # 구현 태스크 목록
│       └── src/main/
│           ├── java/com/ohjih/macro/
│           │   └── PageTitleMacro.java    # Macro 인터페이스 구현
│           └── resources/
│               ├── atlassian-plugin.xml   # xhtml-macro + web-resource
│               ├── templates/
│               │   └── page-title.vm     # 렌더링 템플릿
│               ├── js/
│               │   └── page-title-editor.js  # AUI Dialog2 편집 UI
│               └── css/
│                   └── page-title-editor.css # 편집 UI 스타일
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── ADR.md
    ├── UI_GUIDE.md
    ├── 01-environment-setup.md
    ├── 02-user-macro-guide.md
    ├── 03-p2-plugin-guide.md
    └── 04-troubleshooting.md
```

## 컴포넌트별 역할

### 1. User Macro (Velocity)

- **역할**: Java 없이 Confluence 관리자 콘솔에서 직접 등록하는 경량 매크로
- **한계**: 커스텀 편집 UI 불가, 외부 API 호출 불가
- **파라미터 처리**: `## @param` 선언 → Confluence가 기본 편집 폼 자동 생성

```
파라미터 입력 → Confluence 기본 폼 → $paramXxx 변수 → Velocity 렌더링 → HTML
```

### 2. P2 플러그인 Java 레이어

- **`PageTitleMacro.java`**: `Macro` 인터페이스 구현, `execute()` 에서 파라미터 수신. 표시 텍스트 우선순위: `cloudText` 파라미터 → `body` → 페이지 제목 → "(제목 없음)"
- **`atlassian-plugin.xml`**: 플러그인 키, 매크로 모듈, 편집기 URL 등록
- **`page-title.vm`**: 파라미터를 받아 최종 HTML 생성

### 3. AUI Dialog2 편집 UI

- **역할**: Confluence 편집기 내 팝업으로 뜨는 커스텀 파라미터 입력창
- **오버라이드**: `AJS.MacroBrowser.setMacroJsOverride('page-title', { opener })` — 기본 매크로 브라우저 대체 (인자는 `key`가 아닌 `name`)
- **로드 시점**: web-resource `context: editor` → 편집기 진입 시 로드, `AJS.bind('init.rte', ...)` + `AJS.toInit()` 이중 등록
- **미리보기**: 파라미터 변경 시 `updatePreview()` 로 동일 DOM에서 즉시 반영 (postMessage 불필요)
- **저장**: `tinymce.confluence.macrobrowser.macroBrowserComplete({ name, params, body })` 로 파라미터를 페이지 스토리지에 기록 (`MacroUtils.insertMacro`는 이 컨텍스트에서 동작하지 않음)

## 데이터 흐름

### 편집 시

```
사용자 → Confluence 편집기에서 매크로 삽입 (또는 기존 매크로 더블클릭)
  → AJS.MacroBrowser가 'page-title-macro' override 감지
  → page-title-editor.js의 opener() 호출
  → AUI Dialog2 팝업 표시 (좌: 파라미터 패널 / 우: 미리보기)
  → 기존 파라미터 있으면 복원 (편집 재진입 시)
  → 사용자가 Font Size, Color 등 설정 → updatePreview() 즉시 반영
  → Save 클릭 → tinymce.confluence.macrobrowser.macroBrowserComplete({ name, params, body }) 호출
  → Confluence가 파라미터를 페이지 스토리지에 저장
  ※ MacroUtils.insertMacro()는 setMacroJsOverride 컨텍스트에서 동작하지 않음 (→ ADR-007)
```

### 렌더링 시

```
페이지 로드
  → Confluence가 매크로 발견
  → PageTitleMacro.execute(params, body, conversionContext) 호출
  → params에서 fontSize, color 등 추출
  → Velocity 템플릿에 변수 바인딩
  → HTML 문자열 반환
  → Confluence가 페이지에 삽입
```

### 에러 흐름

```
execute() 예외 발생
  → MacroExecutionException throw
  → Confluence가 "[매크로 실행 오류]" 메시지 표시
  → 페이지 나머지 콘텐츠는 정상 표시

파라미터 누락/잘못된 값
  → execute() 내에서 null 체크 → 기본값으로 대체
  → 예외 없이 기본 스타일로 렌더링
```

## 환경 구성

### 로컬 개발 환경

```
개발자 PC
├── Docker Desktop
│   ├── confluence-dc (atlassian/confluence:7.19.8) → :8090
│   └── confluence-postgres (postgres:14)           → :5432
├── JDK 11.0.30 (Eclipse Adoptium)
├── Maven 3.9.6 (C:\Users\ohjih\maven)
└── Atlassian Plugin SDK 9.1.1 (C:\Users\ohjih\atlassian-sdk) ← 설치 필요
```

### 빌드 → 배포 사이클

#### 테스트 환경 (Single-Node, localhost:8090)

```
코드 수정
  → atlas-package -P server -DskipTests
  → wonikips-confluence-macro-1.0.0-SNAPSHOT-server.jar 생성
  → Confluence 관리자 → 앱 관리 → 앱 업로드
  → Confluence 자동 핫 디플로이 (재시작 불필요)
  → 페이지에서 매크로 동작 확인
```

#### 운영 DC 환경 (Clustered, node1:3737c48)

```
코드 수정
  → atlas-package -DskipTests  (dc 프로파일이 activeByDefault)
  → wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar 생성
  → 업로드 전 DC 플래그 확인:
      unzip -p *-dc.jar atlassian-plugin.xml | grep data-center
  → Confluence 관리자 → 앱 관리 → 앱 업로드
  → UPM이 모든 노드에 자동 배포 (수동 설치 불필요)
  → 페이지에서 매크로 동작 확인
```

> **환경별 JAR 구분**: 테스트(Single-Node)에는 `-server.jar`, 운영 DC(Clustered)에는 `-dc.jar` 사용. suffix 없는 JAR(`*-SNAPSHOT.jar`)는 사용하지 않는다. (→ ADR-012)

## 기술 선택 근거

| 항목 | 선택 | 이유 |
|---|---|---|
| Confluence 버전 | 7.19.8 LTS | 원익IPS 사내 도입 검토 버전 |
| DB | PostgreSQL 14 | DC 7.19 공식 지원 범위 내 최신 (15 이상 미지원) |
| 매크로 방식 | User Macro → P2 | 단계적 복잡도 증가, 빠른 검증 우선 |
| 편집 UI | iframe (P2) | DC 환경에서 커스텀 UI 구현 유일한 방법 |
| 빌드 도구 | Maven (atlas-*) | Atlassian SDK 표준, atlas-run으로 로컬 테스트 지원 |

## 제약사항 및 한계

| 제약 | 내용 |
|---|---|
| Timebomb 라이선스 | 3시간마다 재입력 필요 (개발 중 불편) |
| 단일 노드 전용 | DC 클러스터링 미적용 (테스트 목적이므로 허용) |
| Java 의존성 | P2 플러그인 유지보수에 Java 지식 필요 |
| Cloud 비호환 | DC/Server 전용 — Cloud 전환 시 Forge로 재작성 필요 |
| 핫 디플로이 한계 | atlassian-plugin.xml 변경 시 Confluence 재시작 필요 |
