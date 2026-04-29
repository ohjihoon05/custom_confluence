# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Confluence Data Center 7.19.8 테스트 환경 + 매크로 개발** — 원익IPS 사내 도입 검토용.

- Docker Compose로 로컬 Confluence DC 인스턴스를 구동
- Confluence User Macro / P2 플러그인 매크로 제작 및 검증
- 목표: 사내 도입 전 기능 검토 및 커스텀 매크로 PoC

## 환경 구성

### 스택
- **Confluence DC**: 7.19.8 (`atlassian/confluence:7.19.8`)
- **Database**: PostgreSQL 14
- **JDK**: 11.0.30 (Eclipse Adoptium) — `C:\Program Files\Eclipse Adoptium\jdk-11.0.30.7-hotspot`
- **Maven**: 3.9.6 — `C:\Users\ohjih\maven`
- **Atlassian Plugin SDK**: 9.1.1 — 설치 필요 (`C:\Users\ohjih\atlassian-sdk`)
- **라이선스**: Timebomb 라이선스 (3시간) — https://developer.atlassian.com/platform/marketplace/timebomb-licenses-for-testing-server-apps/

### 포트
- Confluence: `http://localhost:8090`
- PostgreSQL: `5432` (내부)

## 주요 명령어

```bash
# 환경 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f confluence

# 중지 (데이터 유지)
docker-compose down

# 초기화 (데이터 삭제)
docker-compose down -v

# 라이선스 만료 시 재시작
docker-compose restart confluence
```

## 디렉토리 구조

```
confluence/
├── docker-compose.yml
├── macros/
│   └── user-macros/          # User Macro 소스 (.md)
└── docs/
    ├── PRD.md            # 요구사항 + 에러/엣지 케이스
    ├── ARCHITECTURE.md   # 구조, 데이터 흐름, 제약사항
    ├── ADR.md            # 기술 결정 이유 + 에러 케이스
    └── UI_GUIDE.md       # 편집 UI 디자인 스펙
```

## 매크로 개발 방식

### User Macro (현재)
- 관리자 콘솔에서 직접 등록: ⚙️ → **일반 구성** → **사용자 매크로**
- Velocity 템플릿 기반, Java 불필요
- 한계: 커스텀 편집 UI(슬라이더, 컬러 피커) 불가

### P2 플러그인 (예정)
- Aura Title처럼 iframe 기반 커스텀 편집 UI 구현 가능
- Java + Atlassian Plugin SDK 필요
- 빌드: `atlas-package` → `.jar` → Confluence 앱 업로드

## P2 플러그인 빌드 방법

### 빌드 전 버전 업 규칙

**atlas-package 실행 전 반드시 `pom.xml`의 버전을 올린다.**

```xml
<!-- pom.xml -->
<version>1.0.x-SNAPSHOT</version>  ← 빌드마다 x를 1씩 증가
```

예: `1.0.0-SNAPSHOT` → `1.0.1-SNAPSHOT` → `1.0.2-SNAPSHOT`

버전을 올려야 Confluence가 새 JAR임을 인식하고 캐시 없이 정상 반영된다.

### 빌드 명령어 (반드시 atlas-package 사용, mvn 직접 사용 불가)
```bash
# 테스트 서버용 (Confluence Server 7.19.8 — node 표기 없음)
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P server -DskipTests

# 실제 운영 서버용 (Confluence Data Center 7.19.8 — "node1:3737c48" 표기)
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P dc -DskipTests
```

### 생성 위치
```
target/
├── wonikips-confluence-macro-1.0.0-SNAPSHOT-server.jar  ← 테스트 서버용
└── wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar      ← 운영 DC 서버용
```

### Server vs DC 차이
- **Server** (`atlassian-plugin.xml` DC 선언 없음): 테스트 환경 `localhost:8090` 대상
- **DC** (`atlassian-data-center-compatible: true` 포함): 운영 Confluence DC (`node1:3737c48`) 대상
- DC 환경에 Server JAR 올리면 플러그인이 비활성화되거나 경고 상태로 뜸

### 리소스 구조
```
src/main/
├── resources/           # 공통 (JS, CSS, 이미지, VM 템플릿)
├── resources-server/    # atlassian-plugin.xml (Server용, DC 선언 없음)
└── resources-dc/        # atlassian-plugin.xml (DC용, data-center-compatible=true)
```

### 업로드 전 검증

```bash
# DC 플래그 포함 여부 확인 (아래 두 줄이 출력되면 정상)
unzip -p target\wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar atlassian-plugin.xml | grep data-center

# java.* import 없음 확인 (java.로 시작하는 항목 없어야 함)
unzip -p target\wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar META-INF/MANIFEST.MF | grep Import-Package
```

### 자주 발생하는 에러

| 증상 | 원인 | 해결 |
|------|------|------|
| DC 설치 후 플러그인 비활성 | DC 플래그 누락 | `-dc.jar`로 재빌드 후 재업로드 |
| OSGi 번들 활성화 실패 | plugin.xml에 없는 클래스 참조 | 선언된 클래스와 실제 클래스 일치 확인 |
| `java.*` import 오류 | MANIFEST.MF에 java.* 포함 | `pom.xml` `<Import-Package>`에 `!java.*,` 추가 |
| `jakarta.inject-api` 버전 오류 | 7.19.8 BOM에 미포함 | `pom.xml`에 `1.0.5` 명시 |
| 매크로 삽입 안 됨 (Save 후) | web-resource context가 `macro-browser`로 설정됨 — Confluence가 인식 못해 JS 자체가 로드 안 됨 | `atlassian-plugin.xml`의 `<context>`를 반드시 `editor`로 설정 |
| 매크로 삽입 안 됨 (Save 후) | `insertMacro()` 사용 — `setMacroJsOverride` 컨텍스트에서 동작 안 함 | `tinymce.confluence.macrobrowser.macroBrowserComplete(macroObj)` 사용 (두 번째 인자 불필요) |
| `setMacroJsOverride` override 무시 | `key` 대신 `name` 사용 | `atlassian-plugin.xml`의 `name` 속성값 사용 (예: `wonui-cards`) |
| `POST /rest/tinymce/1/macro/placeholder` 500 (`Missing storage body` NPE) | RICH_TEXT body 매크로(Panel/BackgroundImage/Tab/TabCollection)에 `bodyHtml` 누락 | `macroBrowserComplete({...,bodyHtml:''})` — NONE body는 생략 가능 (1.1.5 회귀, ADR-019) |

### 매크로 삽입 JS 패턴 (올바른 방법)

새 매크로 편집 JS를 작성할 때 반드시 아래 패턴을 따른다:

```js
// 1. web-resource context는 반드시 editor (atlassian-plugin.xml)
// <context>editor</context>  ← 올바름
// <context>macro-browser</context>  ← 틀림, JS 로드 안 됨

// 2. setMacroJsOverride 등록 시 name 속성값 사용 (key 아님)
AJS.MacroBrowser.setMacroJsOverride("wonui-cards", {  // ← atlassian-plugin.xml의 name 값
    opener: function(macro) {
        // ... 편집 UI 구성 ...

        // 3. Save 시 macroBrowserComplete 사용 (insertMacro 아님)
        tinymce.confluence.macrobrowser.macroBrowserComplete({
            name: "wonui-cards",
            params: { /* 파라미터 */ },
            body: ""
        });
    }
});
```

## Aura 미러링 플러그인 (wonikips-confluence-macro) 핵심 결정사항

- **라이선스 제거 방법**: `atlassian-plugin.xml`에서 `IsPluginLicensedCondition` 조건 참조를 전부 제거하면 라이선스 만료 없이 항상 동작한다.
- **Aura는 V4 에디터에서 무조건 동작한다** — 매크로 편집 패널, 삽입, 저장, 렌더링 모두. 즉 "V4 Compatibility mode enabled" 콘솔 메시지가 떠도 Aura의 `setMacroJsOverride` / `macroBrowserComplete` 경로는 정상 작동한다. 우리 미러링 플러그인이 V4에서 삽입 실패할 때 원인은 V4 호환성 벽이 아니라 **`aura-3.8.0.jar` 원본과의 미세한 차이**다. 디버깅 기준 원본은 항상 `C:\Users\ohjih\confluence\aura-3.8.0.jar`. `mine.jar`와 `mine/` 디렉토리는 사용자가 wonui로 부분 편집해놓은 상태라 신뢰할 수 없으니 비교 기준으로 사용하지 않는다.
- **매크로 식별자는 `aura-*` 그대로 유지한다** — `name`과 `key` 모두 `aura-cards`, `aura-button`, ... (main.js 하드코딩과 매칭). 서블릿 URL도 `/aura/macro-preview`, `/aura/config`, `/aura/admin`. CSS 클래스(`aura-card`, `aura-panel-wrapper`, `aura-tab-active` 등)도 그대로. "WonikIPS"로 보여주고 싶으면 i18n 파일(`uiux-macro.properties`)에서 `com.uiux.confluence-macro.aura-{macro}.label=WonikIPS - {Macro}` 형태로 라벨만 바꾼다.
- **main.js의 UI 라벨 텍스트는 안전하게 패치 가능** — 식별자/URL/CSS는 절대 금지지만, `"Aura Cards"`, `"Aura Card"`, `"Aura Button"`, `"Aura Title"` 같은 **사용자 노출 라벨 문자열**은 1회 등장 검증 후 Python 바이트-레벨 치환으로 안전하게 변경 가능. 1.0.13(Aura Cards), 1.0.14(Aura Card), 1.1.3(Aura Title → Wonik Title) 빌드에서 실증 완료. **반드시 `main.js` + `main-min.js` 둘 다 패치할 것** — Confluence 런타임은 minified 버전을 로드하고 빌드는 main-min.js를 자동 생성하지 않는다. src에 `main-min.js`가 없으면 `target/classes/client/static/js/`에서 복사한 뒤 같이 치환. 1.1.2에서 main.js만 패치하고 화면 미반영된 회귀 사례 있음. 절차는 `docs/AURA_3.8.0_ANALYSIS.md` §17 참조.
- **미러링 plugin은 원본 JAR과 파일 단위 정합성을 맞춰야 한다** — `previews/*.vm`(매크로 미리보기), `webfonts/`(FontAwesome), `composition/`(자산) 디렉토리를 `aura-3.8.0.jar`에서 그대로 복사한다. 특히 `previews/Cards.vm`이 누락되면 `EditorImagePlaceholder` 메커니즘이 깨져서 V4 매크로 브라우저가 placeholder를 못 받고 → 편집 패널은 뜨지만 Insert 시 삽입 실패. 빌드 후 `unzip -l target/*.jar`로 이 세 디렉토리 존재를 확인한다. 디핑 절차는 `docs/AURA_3.8.0_ANALYSIS.md` §14 참조.
- **분석 기준 문서**: `docs/AURA_3.8.0_ANALYSIS.md`가 원본 JAR(`aura-3.8.0.jar`)의 정밀 분석. 신규 매크로 추가/디버깅/리팩터링 시 가장 먼저 참고. 옛 `docs/AURA_ANALYSIS.md`는 mine/ 기반(왜곡된 상태) 분석이라 신뢰도 낮음.

## 자체 React 매크로 편집 패널 (Cards + Button + Divider + Title + Panel, 1.1.7에서 동작 검증)

Aura main.js 대체용 자체 React 패널 (`src/main/resources/client-custom/`). **Cards (1.0.23) + Button (1.0.26) + Divider + Title (1.1.1) + Panel (1.1.7)** 우리 자체 패널로 동작. 1.0.24에서 registry 패턴 인프라 완료 — 새 매크로는 `src/macros/{name}.ts` + `src/editors/{Name}Editor/` + `src/schema/{name}*.ts` + `src/macros/index.ts` 한 줄 추가만으로 등록 (host/v4-adapter, main.tsx 무수정). 다른 매크로(Tab/TabCollection/BackgroundImage)는 여전히 Aura main.js 사용 — 같은 패턴으로 점진 전환. 다음 = Phase 15 BackgroundImage.

### 매크로 식별자 정확히 (atlassian-plugin.xml의 xhtml-macro name 기준)
새 매크로 추가 시 `MACRO_NAME` 상수는 반드시 `atlassian-plugin.xml`의 `<xhtml-macro name="...">` 값과 일치. 안 그러면 monkey-patch가 매칭 못해 Aura 패널이 그대로 뜸. 1.1.0에서 Title을 `aura-title`로 등록했다가 동작 안 해서 1.1.1에서 `aura-pretty-title`로 수정한 회귀 사례 있음.

전체 매크로 식별자 목록:
- `aura-cards`, `aura-button`, `aura-divider`, `aura-pretty-title` (Title), `aura-panel`, `aura-tab`, `aura-tab-collection`, `aura-background-image`

### 빌드 파이프라인
- **Vite 5 + React 18 + TypeScript** (lib mode IIFE)
- `frontend-maven-plugin`: Node 20.11 자동 설치 + npm install + npm run build
- `maven-resources-plugin`: `dist/` → `client-custom-built/` 복사
- `atlas-package -P server -Dmaven.test.skip=true` 한 줄로 끝
- `pom.xml`에 `<compressResources>false</compressResources>` 필수 (Closure Compiler가 ES2019+ 문법 파싱 실패하는 문제 회피)
- `vite.config.ts`의 `target: 'es2019'` 필수 (1.0.26에서 도입). `es2015`로 두면 esbuild이 object spread를 lower하면서 `var $=(a,b)=>defineProperties(a,getOwnPropertyDescriptors(b))` helper를 IIFE 바깥 전역에 hoist → jQuery `$`를 덮어쓰며 `$.extend is not a function`/`Cannot convert undefined or null to object` 연쇄로 batch.js init 줄줄이 깨지고 편집 페이지 dead. Confluence 7.19.8 지원 브라우저는 모두 ES2019 native라 안전.

### 빌드 시 정적 치환 필수
- `vite.config.ts`의 `define: { 'process.env.NODE_ENV': JSON.stringify('production') }` — 안 하면 React 번들이 `process is not defined`로 batch.js 통째로 깨짐 (1.0.20에서 수정)
- 번들 사이즈: 547KB → 215KB (production 모드 + dev 코드 제거)

### web-resource 등록 (atlassian-plugin.xml)
**JS와 CSS 둘 다 명시 필수** (1.0.22에서 발견):
```xml
<web-resource key="wonikips-editor-resources" name="WonikIPS Editor (React)">
    <dependency>com.atlassian.auiplugin:ajs</dependency>
    <resource type="download" name="wonikips-editor.js" location="/client-custom-built/wonikips-editor.js"/>
    <resource type="download" name="wonikips-editor.css" location="/client-custom-built/wonikips-editor.css"/>
    <context>atl.general</context>
</web-resource>
```
CSS Modules는 hash 클래스명을 JS에 임베드하지만 실제 CSS 규칙은 별도 `.css` 파일로 추출됨. CSS 누락 시 모달이 DOM엔 있지만 0×0 invisible.

### V4 매크로 브라우저 통합 (`setMacroJsOverride` monkey-patch + registry)
Aura main.js가 `setMacroJsOverride('aura-cards', ...)`로 자기 핸들러 등록 → 우리 등록을 후속에 덮어씀. 단순한 재등록이나 이벤트 바인딩으로는 부족. **함수 자체를 monkey-patch + macro registry 조회**로 등록된 모든 매크로에 대한 호출을 우리 opener로 강제 (1.0.21 monkey-patch + 1.0.24 registry):
```ts
// host/v4-adapter.ts
const original = AJS.MacroBrowser.setMacroJsOverride.bind(AJS.MacroBrowser);
AJS.MacroBrowser.setMacroJsOverride = function (name, override) {
  const entry = getMacro(name);  // host/macro-registry.ts의 Map<name, opener> 조회
  if (entry) return original(name, { opener: entry.opener });  // 우리 매크로 강제
  return original(name, override);                              // 그 외는 통과
};
// 등록된 모든 매크로(aura-cards, aura-button, ...)를 한 번씩 등록
listMacros().forEach(name => original(name, { opener: getMacro(name)!.opener }));
```
새 매크로는 `src/macros/{name}.ts`에서 `registerMacro('aura-{name}', { opener })` 한 줄로 추가 → barrel(`src/macros/index.ts`)에 import 한 줄 → host/v4-adapter는 무수정. 다른 매크로(Aura가 처리하는)는 영향 없음.

### icondata는 fetch로 동적 로드 + macro-registry 통합 provider (1.1.4부터)
1.1MB icondata.json을 번들에 임베딩하면 페이지 로드 시 부담. 매크로 패널 처음 열릴 때 `fetch('/download/resources/com.uiux.confluence-macro/templates/icondata.json')`로 가져옴. `atlassian-plugin.xml`에 `<resource type="download" name="templates/" location="/templates"/>` 추가 필수.

**iconData 주입 패턴 (1.1.4에서 통합)**: per-매크로 `setIconDataProvider`를 main.tsx에서 매크로별로 호출하는 옛 방식은 main.tsx 무수정 원칙을 깨고, Cards 외 매크로 IconPicker가 빈 grid로 노출되는 회귀를 만들었다(1.0.26~1.1.3 동안 잠복). 현재는 `host/macro-registry.ts`의 `setGlobalIconDataProvider` / `getGlobalIconData`로 단일화. 새 매크로는 `import { registerMacro, getGlobalIconData } from '../host/macro-registry'`만 사용. main.tsx는 `setGlobalIconDataProvider(() => iconDataCache)` 한 번만 호출. ADR-020.

### RICH_TEXT body 매크로 처리 (Panel/BackgroundImage/Tab/TabCollection)
`getBodyType() == RICH_TEXT`인 매크로 opener에서 `macroBrowserComplete` 호출 시 **`bodyHtml: ''`을 반드시 명시 전달**. 누락 시 Confluence가 `MacroResource.getMacroBody`에서 `Missing storage body` NPE → `POST /rest/tinymce/1/macro/placeholder` 500 응답 → placeholder 못 받고 매크로 삽입 실패. NONE body(Cards/Button/Divider)는 생략 가능. PLAIN_TEXT(Title)는 `bodyHtml: escapeHtml(text)`로 사용자 입력 텍스트 전달. ADR-019 (1.1.5 회귀에서 발견).

### Panel은 단일 `styles` JSON 직렬화 (다른 매크로의 평탄 K=V map과 다름)
Panel의 모든 스타일 옵션은 macro param `styles`(JSON.stringify된 string) 한 키에 nested로 직렬화. `Panel.java`가 `Gson.fromJson(styles, PanelStyles.class)`로 deserialize. Schema는 nested Zod, mapper는 `JSON.stringify(stripNulls(params))`. 4섹션(`base`/`headline`/`header`/`body`) 중 headline/header는 nullable(toggle off → null → mapper가 strip). Aura 원본 default JSON과 byte-level 호환 유지 — 특히 `body.text.texAlign` 오타(textAlign 아님) 그대로 보존. Divider도 비슷한 `serializedStyles` 키 패턴이지만 Schema 평탄화 + mapper에서 nested 조립. ADR-021.

### Dialog level state lifting + 한국어 footer
CardsEditor 사이드바의 자체 footer는 nested scroll에 묻혀 가려질 수 있음. 그래서 **Dialog 레벨에 state lifting** (`v4-adapter`의 `CardsDialogShell`) + 항상 보이는 footer에 "취소"/"삽입" 버튼 (1.0.23). CardsEditor는 controlled mode(`value`/`onChange`) + `hideFooter` prop 지원.

### 디버깅 시 의심 우선순위 (실증)
1. CSS 등록 누락 → 모달 invisible
2. `process.env.NODE_ENV` 정적 치환 누락 → batch.js 깨짐
3. `compressResources=false` 누락 → Closure Compiler 빌드 실패
4. monkey-patch 미적용 → Aura가 우리 등록 덮어씀
5. URL 패턴 매칭 가드(isEditPage 등) → `resumedraft.action` 등 누락 시 등록 안 됨 → 가드 자체 제거 권장 (1.0.19)
6. **`target: 'es2015'`** → esbuild helper(`var $=...`) 전역 누수 → jQuery `$` 덮어씀 → `$.extend is not a function` + `Cannot convert undefined or null to object` 줄줄이 → 편집 페이지 dead (1.0.25 회귀, 1.0.26에서 `target: 'es2019'`로 수정)
7. side-effect import 누락 → `src/macros/{name}.ts`의 `registerMacro()` 호출이 tree-shaking으로 제거되어 매크로가 registry에 없음 → vite `treeshake.moduleSideEffects: id => /src[\\/]macros[\\/]/.test(id)` 보호 필수
8. **매크로 식별자 불일치** → 우리 패널이 안 뜨고 Aura 기본 패널이 뜸 → `MACRO_NAME` 상수와 `atlassian-plugin.xml`의 `<xhtml-macro name="...">` 비교 (Title 케이스: `aura-title` ≠ `aura-pretty-title`, 1.1.0 회귀)
9. **PrettyTitle만 EditorImagePlaceholder 미구현** → 편집 모드에서 H1 본문이 inline 렌더되며 "Aura Title" chrome 라벨 노출. 다른 매크로(Cards/Button/Divider)는 `EditorImagePlaceholder` 구현해서 작은 미리보기 이미지로 표시. View 모드는 정상. 1.1.2/1.1.3에서 Java 수정 완료.
10. **RICH_TEXT body 매크로(Panel)** `bodyHtml` 누락 → `/rest/tinymce/1/macro/placeholder` 500 (`Missing storage body` NPE) → 매크로 삽입 실패. opener에 `bodyHtml: ''` 명시 (1.1.5에서 발견, ADR-019).
11. **iconData provider** main.tsx에서 cards만 호출하는 옛 패턴 → 다른 매크로 IconPicker 빈 grid. macro-registry의 global provider로 통합 (1.1.4, ADR-020).
12. **Panel chrome 라벨** main.js에 `\"Aura Panel\"`이 escape된 형태로 박혀있음(`:before { content: ... }`). docs §17.4 byte-level 패치 절차 — main.js + main-min.js 둘 다 (1.1.6에서 처리).

### 새 매크로 추가 절차
`docs/PARALLEL_DEV_GUIDE.md` §2.2 참조. 5개 파일만:
- `src/schema/{name}.ts` (Zod) + `src/schema/{name}-mapper.ts` (UI ↔ Java)
- `src/editors/{Name}Editor/{Name}Editor.tsx` (+ `.module.css`)
- `src/macros/{name}.ts` (Dialog shell + opener + `registerMacro`)
- `src/macros/index.ts`에 `import './{name}';` 한 줄 추가

`host/v4-adapter.ts`, `main.tsx`, Java 매크로 클래스 무수정. 1.0.26 Button + 1.1.4 Panel 추가가 이 패턴 실증. RICH_TEXT body 매크로는 `bodyHtml: ''` 추가 한 줄(ADR-019). 단일 `styles` JSON 직렬화가 필요한 매크로(Panel류)는 mapper에서 `JSON.stringify(stripNulls(params))`(ADR-021).

### 상세 계획 + 회귀 기록
`docs/CUSTOM_PANEL_PLAN.md` (4주 일정 + 검증 결과), `docs/PARALLEL_DEV_GUIDE.md` (worktree 병렬 작업), `docs/MACRO_EXPANSION_PLAN.md` (Phase 11~18, 현재 14 완료), `docs/ADR.md` (ADR-015~021), `docs/DEVELOPMENT_GUIDE.md` (전체 가이드), `docs/AURA_3.8.0_ANALYSIS.md` §17.7 (라벨 패치 회귀 표).

## 주의사항
- DC 7.19는 PostgreSQL 12–14 지원 (15 이상 미지원)
- `docker-compose.yml`에서 `ATL_CLUSTER_TYPE`, `CONFLUENCE_SHARED_HOME` 제거 — 단일 노드에서 ClusterJoinType 오류 유발
- suffix 없는 `*-SNAPSHOT.jar`는 사용하지 않는다 — DC 플래그 누락 위험
- 상세 내용 → `docs/07-build-dc-jar.md`, `docs/05-dc-plugin-guide.md`, `docs/ADR.md`

## docs 업데이트 규칙
- **docs/ 폴더는 테스트 완료 후에만 업데이트한다.**
- 코드 수정 → 빌드 → Confluence에서 실제 동작 확인 → docs 업데이트 순서를 반드시 지킨다.
- 테스트 전에 마음대로 docs를 수정하지 않는다.
