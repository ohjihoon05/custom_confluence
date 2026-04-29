# WonikIPS Confluence Macro — 개발 가이드

이 문서는 Confluence DC 7.19.8 환경에서 자체 React 기반 매크로 편집 패널을 만드는 방법을 설명한다. Aura 플러그인의 Cards 매크로를 자체 React 패널로 대체한 실증 사례 기반.

---

## 0. 한 줄 요약

**Confluence DC plugin** + **Vite/React 18 IIFE 번들** + **Aura `setMacroJsOverride` monkey-patch + macro registry** = V4 매크로 브라우저에서 자체 편집 UI 동작 + 새 매크로 5개 파일 추가만으로 확장.

---

## 1. 무엇을 만들었나

- **대상**: Confluence DC 7.19.8 (V4/Fabric 에디터)
- **목적**: Aura 플러그인의 매크로 편집 패널을 WonikIPS 자체 React UI로 대체
- **현재 자체 패널화된 매크로**: Cards (1.0.23), Button (1.0.26)
- **결과**: 매크로 클릭 → 풀스크린 React 모달 → 삽입 → 페이지 저장 시 Aura 백엔드 그대로 사용해 렌더링 (storage XML / Java macro 무수정)
- **인프라 (1.0.24)**: registry 패턴으로 새 매크로 추가는 5개 파일만 — host/v4-adapter, main.tsx 무수정. 다른 매크로(Panel/Tab/Title/...)는 같은 패턴으로 점진 전환.

다른 매크로(Button, Panel, Tab 등)는 여전히 Aura 그대로 — 점진 전환 가능.

---

## 2. 사전 준비

### 2.1 시스템 요구사항

| 항목 | 버전 |
|------|------|
| Confluence | DC 7.19.8 (LTS) |
| PostgreSQL | 14 (12~14 지원, 15+ 미지원) |
| JDK | 11 (Eclipse Adoptium) |
| Maven | 3.9.6 |
| Atlassian Plugin SDK | 9.1.1 |
| Node.js | 20.11.0 (Maven 빌드 시 자동 설치) |
| Docker / Docker Compose | (Confluence 로컬 환경용) |

### 2.2 로컬 Confluence 환경

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: confluencedb
      POSTGRES_USER: confluenceuser
      POSTGRES_PASSWORD: confluencepass

  confluence:
    image: atlassian/confluence:7.19.8
    depends_on:
      postgres: { condition: service_healthy }
    environment:
      JVM_MINIMUM_MEMORY: 1024m
      JVM_MAXIMUM_MEMORY: 2048m
    ports:
      - "8090:8090"
```

```bash
docker-compose up -d
# http://localhost:8090 접속, Setup Wizard 진행
# Timebomb 라이선스 (3시간) 발급:
# https://developer.atlassian.com/platform/marketplace/timebomb-licenses-for-testing-server-apps/
```

### 2.3 Atlassian SDK 설치

다운로드: https://developer.atlassian.com/server/framework/atlassian-sdk/install-the-atlassian-sdk-on-a-windows-system/

설치 후 `atlas-package` 명령 사용 가능 (`mvn package` 직접 사용 금지).

---

## 3. 프로젝트 구조

```
confluence/
├── docker-compose.yml
├── aura-3.8.0.jar               # Aura 원본 (분석/리소스 추출용, gitignore)
├── docs/                         # 모든 분석/계획/ADR 문서
└── macros/wonikips-confluence-macro/
    ├── pom.xml                   # Maven 설정 (frontend-maven-plugin 통합)
    ├── src/main/
    │   ├── java/com/uiux/macro/  # Java 매크로 클래스 (Aura 디컴파일 + 일부 수정)
    │   ├── resources/
    │   │   ├── templates/        # Velocity 템플릿 (.vm) + icondata.json
    │   │   ├── previews/         # 매크로 placeholder SVG 템플릿
    │   │   ├── images/, css/, js/, webfonts/, composition/  # Aura 자산
    │   │   ├── client/           # Aura main.js (다른 매크로용)
    │   │   ├── client-custom/    # ★ 우리 React 프로젝트
    │   │   │   ├── package.json
    │   │   │   ├── vite.config.ts
    │   │   │   ├── tsconfig.json
    │   │   │   ├── index.html    # Vite dev server entry
    │   │   │   └── src/
    │   │   │       ├── main.tsx
    │   │   │       ├── components/   # Slider, TextInput, ColorPicker, IconPicker, ...
    │   │   │       ├── editors/CardsEditor/
    │   │   │       ├── host/v4-adapter.ts    # V4 매크로 브라우저 통합
    │   │   │       ├── schema/cards.ts        # Zod schema + UI↔Java mapper
    │   │   │       └── i18n/
    │   │   └── client-custom-built/  # 빌드 결과물 (Maven이 채움)
    │   ├── resources-server/atlassian-plugin.xml  # Server 빌드용
    │   └── resources-dc/atlassian-plugin.xml      # DC 빌드용
    └── target/                   # 빌드 산출물 (gitignore)
```

---

## 4. 빌드 + 배포

### 4.1 한 번에 끝내는 빌드

```bash
cd macros/wonikips-confluence-macro
C:/Users/ohjih/atlassian-sdk/bin/atlas-package.bat -P server -Dmaven.test.skip=true
```

이 한 줄이 다음을 모두 수행:
1. `frontend-maven-plugin`이 Node 20.11 자동 설치 (첫 실행 시만)
2. `npm install` (zod, react, vite 등)
3. `npm run build` (TypeScript 컴파일 + Vite IIFE 번들링)
4. `maven-resources-plugin`이 `dist/` → `client-custom-built/` 복사
5. Java 컴파일 + Spring scanner + OSGi 매니페스트 생성
6. JAR 패키징

산출물: `target/wonikips-confluence-macro-X.Y.Z-SNAPSHOT-server.jar` (~31MB)

### 4.2 DC 빌드

```bash
atlas-package -P dc -Dmaven.test.skip=true
# → target/wonikips-confluence-macro-X.Y.Z-SNAPSHOT-dc.jar
```

차이: `atlassian-plugin.xml`에 `<param name="atlassian-data-center-compatible">true</param>` 포함. DC 환경에 server JAR 올리면 비활성화 또는 경고로 뜸.

### 4.3 빌드 검증 (4가지)

```bash
JAR=target/wonikips-confluence-macro-1.0.23-SNAPSHOT-server.jar

# 1. JS + CSS 둘 다 패키징됐는지
unzip -l "$JAR" | grep "client-custom-built/wonikips-editor"

# 2. atlassian-plugin.xml에 JS + CSS 둘 다 등록됐는지
unzip -p "$JAR" atlassian-plugin.xml | grep -c "wonikips-editor.css"   # 1

# 3. process.env.NODE_ENV가 정적 치환됐는지 (남아있으면 batch.js 깨짐)
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "process\."   # 0

# 4. monkey-patch 코드 포함됐는지
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "Monkey-patched"   # 1
```

### 4.4 Confluence에 배포

1. `http://localhost:8090/plugins/servlet/upm` 접속
2. "앱 업로드" → JAR 선택
3. **Ctrl+Shift+R** (브라우저 캐시 강제 갱신)
4. 페이지 편집 → 매크로 → "Cards" 클릭 → 우리 React 모달 표시

---

## 5. 빌드 파이프라인 핵심

### 5.1 `pom.xml`의 결정적 설정

```xml
<plugin>
    <groupId>com.atlassian.maven.plugins</groupId>
    <artifactId>confluence-maven-plugin</artifactId>
    <configuration>
        <productVersion>${confluence.version}</productVersion>
        <enableQuickReload>true</enableQuickReload>
        <compressResources>false</compressResources>  <!-- ★ 필수 -->
        ...
    </configuration>
</plugin>
```

**`<compressResources>false</compressResources>` 없으면 빌드 실패.** Confluence 내장 Closure Compiler가 ES2019+ 문법(`} catch {`, optional chaining 등) 파싱 실패. 어차피 Vite가 minify하니 Closure 우회 OK.

```xml
<!-- frontend-maven-plugin: Node 자동 설치 + npm install + npm run build -->
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <version>1.15.0</version>
    <configuration>
        <workingDirectory>src/main/resources/client-custom</workingDirectory>
        <installDirectory>target/node</installDirectory>
        <nodeVersion>v20.11.0</nodeVersion>
    </configuration>
    <executions>
        <execution><id>install-node-and-npm</id><goals><goal>install-node-and-npm</goal></goals><phase>generate-resources</phase></execution>
        <execution><id>npm-install</id><goals><goal>npm</goal></goals><phase>generate-resources</phase>
            <configuration><arguments>install</arguments></configuration></execution>
        <execution><id>npm-build</id><goals><goal>npm</goal></goals><phase>generate-resources</phase>
            <configuration><arguments>run build</arguments></configuration></execution>
    </executions>
</plugin>

<!-- Vite dist/ → client-custom-built/ 복사 -->
<plugin>
    <artifactId>maven-resources-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-react-bundle</id>
            <phase>process-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
                <outputDirectory>${project.build.outputDirectory}/client-custom-built</outputDirectory>
                <resources>
                    <resource><directory>src/main/resources/client-custom/dist</directory></resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 5.2 `vite.config.ts`의 결정적 설정

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),  // ★ 필수
  },
  server: {
    fs: { allow: [resolve(__dirname, '..')] },  // dev 모드에서 ../templates/ 접근
  },
  build: {
    outDir: 'dist',
    target: 'es2019',  // ★ 필수 — es2015 두면 esbuild helper(var $=...)가 전역에 누수
    minify: 'esbuild',
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],         // ★ Confluence 통합용 단일 IIFE 번들
      name: 'WonikIPSEditor',
      fileName: () => 'wonikips-editor.js',
    },
    rollupOptions: {
      external: ['jquery', 'AJS'],  // Confluence가 이미 제공
      // src/macros/* 는 side-effect import (registerMacro 호출). tree-shaking 보호.
      treeshake: {
        moduleSideEffects: (id) => /[\\/]src[\\/]macros[\\/]/.test(id),
      },
      output: {
        globals: { jquery: 'jQuery', AJS: 'AJS' },
        assetFileNames: (asset) => asset.name === 'style.css' ? 'wonikips-editor.css' : '[name][extname]',
        // 런타임 process 폴리필 (Vite define으로 못 잡은 dynamic 참조 방어)
        banner: 'if(typeof process==="undefined"){window.process={env:{NODE_ENV:"production"}};}',
      },
    },
    cssCodeSplit: false,
  },
});
```

**`define: { 'process.env.NODE_ENV': JSON.stringify('production') }`이 없으면** React 18 번들이 `process.env.NODE_ENV`를 dynamic 참조 → 브라우저에서 `ReferenceError: process is not defined` → batch.js 통째로 깨짐 → 페이지 비활성화.

**`target: 'es2019'`가 없으면** (1.0.25 회귀): esbuild이 object spread를 ES2015 호환으로 lower하면서 `var $=(a,b)=>defineProperties(a,getOwnPropertyDescriptors(b))` helper를 IIFE 바깥에 hoist → `window.$`(jQuery)를 덮어씀 → `$.extend is not a function` + `Cannot convert undefined or null to object` 연쇄로 Confluence batch.js init이 줄줄이 실패 → 편집 페이지 dead. 1.0.26에서 ADR-018로 수정.

**`treeshake.moduleSideEffects`가 없으면**: `src/macros/{name}.ts`의 `registerMacro()` 호출이 unused로 판단되어 tree-shake 제거 → 매크로가 registry에 등록되지 않아 편집 패널 안 뜸 (Aura 패널이 그대로 표시됨).

치환 후 번들 사이즈 547KB → 222KB (production 모드, dev 코드 제거 + Cards + Button + registry 인프라).

### 5.3 `atlassian-plugin.xml`의 결정적 web-resource 등록

```xml
<!-- JS와 CSS 둘 다 명시 필수! -->
<web-resource key="wonikips-editor-resources" name="WonikIPS Editor (React)">
    <dependency>com.atlassian.auiplugin:ajs</dependency>
    <resource type="download" name="wonikips-editor.js" location="/client-custom-built/wonikips-editor.js"/>
    <resource type="download" name="wonikips-editor.css" location="/client-custom-built/wonikips-editor.css"/>
    <context>atl.general</context>
</web-resource>

<!-- icondata.json fetch 가능하게 -->
<resource type="download" name="templates/" location="/templates"/>
```

CSS 누락 시: CSS Modules가 hash 클래스명을 JS에 임베드하지만 실제 CSS 규칙은 별도 `.css` 파일에 있음 → 모달이 DOM엔 있지만 0×0 invisible.

---

## 6. V4 매크로 브라우저 통합 (핵심 패턴)

### 6.1 문제

Aura main.js가 `setMacroJsOverride('aura-cards', auraHandler)`로 자기 핸들러 등록. 우리도 같은 함수로 등록하지만, Aura가 `page-edit-loaded` 이벤트에서 후속 재등록하며 우리를 덮어씀.

### 6.2 해결: monkey-patch

`AJS.MacroBrowser.setMacroJsOverride` 함수 자체를 가로채서, 'aura-cards' 호출은 **무조건** 우리 핸들러로 강제:

```ts
// src/host/v4-adapter.ts
function installMonkeyPatch(getIcons: () => Record<string, IconMeta>) {
  const cw = window as ConfluenceWindow;
  const original = cw.AJS.MacroBrowser.setMacroJsOverride.bind(cw.AJS.MacroBrowser);

  const patched = function (name: string, override: { opener: Function }): void {
    if (name === 'aura-cards') {
      // 누가 호출하든 우리 opener로 강제
      return original(name, { opener: (macro) => openCardsDialog(macro, getIcons()) });
    }
    return original(name, override);  // 다른 매크로는 통과
  };
  (patched as any).__wonikipsPatched = true;

  cw.AJS.MacroBrowser.setMacroJsOverride = patched;
  // 즉시 한 번 등록
  original('aura-cards', { opener: (macro) => openCardsDialog(macro, getIcons()) });
}
```

이렇게 하면 Aura가 어느 시점에 호출하든, `name === 'aura-cards'`면 우리 opener로 강제 변환.

### 6.3 매크로 삽입 (`macroBrowserComplete`)

사용자가 "삽입" 클릭 시:

```ts
function handleInsert(params: CardsParams): void {
  const javaMap = paramsToJavaMap(params);     // UI form → Aura Java Map
  const bodyHtml = buildBodyHtml(params);       // 편집기 placeholder HTML
  destroyOverlay(root, overlay);
  window.tinymce.confluence.macrobrowser.macroBrowserComplete({
    name: 'aura-cards',
    params: javaMap,
    bodyHtml,
  });
}
```

V4가 본문에 placeholder 삽입 → 페이지 저장 시 storage XML(`<ac:structured-macro ac:name="aura-cards">...`)로 변환 → 페이지 뷰 시 Java 매크로 클래스가 렌더링.

---

## 7. 매크로 파라미터 schema (Zod) + UI↔Java mapper

```ts
// src/schema/cards.ts
import { z } from 'zod';

export const CardSchema = z.object({
  title: z.string().default('WonikIPS Card'),
  body: z.string().default('Replace this text with your own content'),
  href: z.string().default(''),
  hrefType: z.enum(['external', 'attachment', 'page']).default('external'),
  hrefTarget: z.enum(['_blank', '_self']).default('_blank'),
  color: z.string().default('default'),
  icon: z.string().default('faPaperPlane'),
});

export const CardsParamsSchema = z.object({
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  cardType: z.enum(['text', 'icon', 'image']).default('icon'),
  columns: z.number().int().min(1).max(6).default(3),
  // ...
  cards: z.array(CardSchema).default([]),
});

export type CardsParams = z.infer<typeof CardsParamsSchema>;
```

UI 필드명(`alignment`, `cardType`)과 Aura Java가 받는 키(`layout`, `decoration`)가 다르므로 mapper로 양방향 변환:

```ts
// src/schema/cards-mapper.ts
export function paramsToJavaMap(params: CardsParams): Record<string, string> {
  return {
    theme: designToTheme(params.design),
    columns: String(params.columns),
    gutter: String(params.marginBetween),
    layout: `icon-${params.alignment}`,
    decoration: params.cardType === 'image' ? 'image' : 'icon',
    cardsCollection: JSON.stringify(params.cards),
    // ...
  };
}

export function javaMapToParams(map: Record<string, string>): CardsParams {
  // 역변환 — 매크로 재편집 시 사용
  return CardsParamsSchema.parse({ /* ... */ });
}
```

---

## 8. 컴포넌트 라이브러리

`src/components/` 아래 7개 재사용 컴포넌트 (모두 controlled):

| 컴포넌트 | 용도 | 핵심 props |
|----------|------|-----------|
| `Slider` | 숫자 + 슬라이더 + 단위 | `value, onChange, min, max, step, unit` |
| `TextInput` | input/textarea | `value, onChange, multiline, rows` |
| `ColorPicker` | Default/Custom + 8 swatch + HEX | `value, onChange, palette` |
| `IconPicker` | FontAwesome 검색 + 그리드 | `value, onChange, iconData` |
| `SegmentedControl` | 3-way/N-way 토글 | `value, onChange, options, columns?` |
| `Select` | native dropdown | `value, onChange, options` |
| `Toggle` | on/off switch | `value, onChange, label` |

각 컴포넌트는 자체 CSS Module(`Slider.module.css` 등). 디자인 토큰은 임시 하드코딩 (Atlassian 톤): `#0052CC`(primary), `#DFE1E6`(border), `#172B4D`(text). WonikIPS 토큰 적용은 후속 작업.

---

## 9. 개발 워크플로우

### 9.1 빠른 시각 검수 (Vite dev 서버)

```bash
cd src/main/resources/client-custom
npm run dev
# http://localhost:5173 접속
# index.html이 #wonikips-editor-demo-root에 CardsEditor 마운트
# 코드 수정 → HMR로 즉시 반영
```

`index.html`이 dev 전용 entry. production에선 main.tsx가 직접 V4 host에 등록.

### 9.2 Confluence 통합 테스트

```bash
# 1. 빌드
atlas-package -P server -Dmaven.test.skip=true

# 2. 앱 관리 페이지에서 기존 plugin 제거 후 새 JAR 업로드
# 3. Ctrl+Shift+R (캐시 강제 갱신)
# 4. F12 → Console → 다음 로그 확인:
#    [WonikIPS Editor] bundle loaded
#    [WonikIPS Editor] Hello WonikIPS {version: '0.5.0-registry'}
#    [WonikIPS Editor] Scheduling V4 host registration
#    [WonikIPS Editor] Monkey-patched setMacroJsOverride (via registry): aura-cards, aura-button
#    [WonikIPS Editor] Registered V4 override for aura-cards, aura-button
#    [WonikIPS Editor] iconData loaded 1458
```

### 9.3 버전 관리

`pom.xml`의 `<version>1.0.x-SNAPSHOT</version>`을 빌드마다 +1 증가. Confluence가 캐시를 깨끗하게 리로드하도록.

---

## 10. 새 매크로 추가하는 절차 (1.0.24 registry 패턴 이후)

새 매크로를 자체 React 패널로 만들 때 — **5개 파일 + barrel 한 줄**만 추가, host/v4-adapter / main.tsx / Java 무수정. (Button 1.0.26이 이 절차로 추가된 실증)

1. **Aura 캡처**: `aura_image/{name}/` 폴더에 편집 패널 스크린샷 (Aura 라이선스 활성 후)
2. **Schema 정의**: `src/schema/{name}.ts` (Cards/Button 패턴 참고). Aura `{Name}.java` + `{Name}.vm` 시그니처 분석해서 정확히 정의.
3. **Mapper**: `src/schema/{name}-mapper.ts` (UI ↔ Aura Java Map 양방향 변환)
4. **편집 컴포넌트**: `src/editors/{Name}Editor/{Name}Editor.tsx` (+ `.module.css`)
   - controlled mode 지원 (`value` / `onChange` / `hideFooter` props)
5. **매크로 모듈**: `src/macros/{name}.ts` — Dialog shell + opener + 파일 끝에 `registerMacro('aura-{name}', { opener: open{Name}Dialog })`
6. **Barrel**: `src/macros/index.ts`에 `import './{name}';` 한 줄 추가
7. **빌드 + 검증**: `atlas-package` → 콘솔 로그에 등록된 매크로 이름이 나오는지 확인

`host/v4-adapter.ts`는 registry에서 자동으로 매크로를 가져오므로 **수정 안 함**. `main.tsx`도 barrel `import './macros'`이 모든 매크로를 eager 로드하므로 **수정 안 함**.

**병렬 작업** (여러 매크로 동시 진행): `docs/PARALLEL_DEV_GUIDE.md` 참조 — git worktree로 매크로별로 분기.

대부분 코드는 패턴 복사. Schema는 `aura.properties` + `Button.vm` + `Button.java` 시그니처를 보고 정확히 정의.

---

## 11. 디버깅 가이드

### 11.1 자주 만나는 증상 ↔ 원인

| 증상 | 원인 | 해결 |
|------|------|------|
| 매크로 패널이 안 뜸 | CSS web-resource 누락 → invisible | `atlassian-plugin.xml`의 wonikips-editor-resources에 CSS 추가 |
| Aura 패널이 그대로 뜸 | monkey-patch 미적용 | `installMonkeyPatch` 호출 확인, 콘솔 `Monkey-patched...` 로그 |
| Aura 패널이 그대로 뜸 (특정 매크로만) | `src/macros/index.ts`에 `import './{name}';` 누락 또는 tree-shake로 제거 | barrel 확인 + `vite.config.ts` `treeshake.moduleSideEffects` 확인 |
| 모든 페이지 비활성화 (`process is not defined`) | React 번들 dynamic process 참조 | `vite.config.ts`의 `define`으로 정적 치환 |
| 모든 페이지 비활성화 (`$.extend is not a function`, `Cannot convert undefined or null to object`) | esbuild helper(`var $=...`)가 IIFE 바깥에 hoist되어 jQuery `$` 덮어씀 | `vite.config.ts`의 `target: 'es2019'` 설정 (ADR-018, 1.0.26) |
| 빌드 실패 (Closure Compiler 에러) | 우리 번들의 ES2019+ 문법 | `pom.xml`의 `<compressResources>false</compressResources>` |
| 콘솔에 우리 로그 0개 | 옛 plugin key(`com.ohjih.*` 등) 잔재로 batch 깨짐 | 옛 plugin 모두 제거 후 재시작 |
| `wonikips-editor.js` 404 | URL 형식 오해 | `/download/resources/{plugin-key}/{web-resource-key}/{name}` |
| 매크로 삽입 후 본문에 안 나타남 | `previews/*.vm` 누락 → EditorImagePlaceholder 깨짐 | `aura-3.8.0.jar`에서 `previews/` 디렉토리 그대로 복사 |

### 11.2 진단 체크리스트

콘솔에서:
```js
window.__wonikipsEditor                                  // 객체 출력 → 번들 로드됨
typeof AJS.MacroBrowser.setMacroJsOverride               // "function" → API 살아있음
AJS.MacroBrowser.setMacroJsOverride.__wonikipsPatched    // true → monkey-patch 적용됨
typeof window.$                                           // "function" → jQuery 정상 (esbuild helper 안 새어나감)
$.extend.toString()                                       // jQuery extend 함수 출력 → 정상
```

번들 자체 검증 (build 직후):
```bash
# 1. 시작 부분에 helper 변수 누수 없는지 (정상: typeof process 또는 (function 으로 시작)
head -c 80 dist/wonikips-editor.js

# 2. 시작이 'var ' 로 시작하면 esbuild helper 누수 — target 확인
head -c 4 dist/wonikips-editor.js | grep -c "^var "    # 0 이어야 정상
```

### 11.3 회귀 추적 (실제 1.0.16~1.0.26)

| 버전 | 증상 | 수정 |
|------|------|------|
| 1.0.17 | 페이지 비활성화 + 콘솔 무출력 | icondata 1.6MB 임베딩 → fetch 동적 로드로 분리 |
| 1.0.18 | 콘솔 무출력 | `process is not defined` → Vite `define` 추가 |
| 1.0.19 | URL 패턴 매칭 실패 | `isEditPage()` 가드 제거 (모든 페이지 등록) |
| 1.0.20 | Aura 패널 그대로 | (다음으로) |
| 1.0.21 | 패널 자체 안 뜸 | (다음으로) |
| 1.0.22 | 패널 떴지만 invisible | CSS web-resource 등록 |
| 1.0.23 | "삽입" 버튼 안 보임 | Dialog level state lifting + footer |
| 1.0.24 | (인프라) 매크로 추가 시 host/v4-adapter 매번 수정 필요 | registry 패턴 + `src/macros/` 디렉토리 + barrel import (ADR-017) |
| 1.0.25 | 편집 페이지 dead, `$.extend is not a function`, `Cannot convert undefined or null to object` 연쇄 | esbuild이 ES2015 lower 중 `var $=...` helper를 전역에 hoist해 jQuery `$` 덮어씀 (Button 추가로 spread 사용량 늘면서 helper 이름이 `$`로 배정) |
| 1.0.26 | (1.0.25 fix) | `vite.config.ts` `target: 'es2015'` → `'es2019'` (ADR-018). Cards + Button 둘 다 정상 |

---

## 12. 참고 문서

| 파일 | 내용 |
|------|------|
| `CLAUDE.md` | 프로젝트 전반 가이드 + 핵심 결정사항 |
| `docs/AURA_3.8.0_ANALYSIS.md` | Aura 원본 JAR 정밀 분석 (167 파일 인벤토리) |
| `docs/CUSTOM_PANEL_PLAN.md` | 4주 일정 + 검증 결과 |
| `docs/ADR.md` | 아키텍처 결정 기록 (ADR-001~016) |
| `docs/CARDS_INSERT_DEBUG.md` | 매크로 삽입 실패 추적 기록 |

---

## 13. 자주 받는 질문

**Q. Aura 라이선스 만료되면 어떻게?**
A. plugin-info의 `atlassian-licensing-enabled: false` 설정 + atlassian-plugin.xml에서 `IsPluginLicensedCondition` 조건 모두 제거. 라이선스 검사 완전 우회.

**Q. main.js 안의 "Aura" 텍스트를 "WonikIPS"로 바꿔도 돼?**
A. UI 라벨(공백 포함 큰따옴표 문자열, 예: `"Aura Cards"`)은 1회 등장 검증 후 안전하게 patch 가능. 식별자(`"aura-cards"`, `"aura-card"`)와 CSS 클래스(`"aura-panel-wrapper"` 등)는 절대 변경 금지 — Velocity 템플릿 + Java + tabs.js 정합성 깨짐. ADR-014 참조.

**Q. DC 환경 운영 배포는?**
A. Server 환경 검증 후 동일 코드로 `atlas-package -P dc` 빌드 → `*-dc.jar` 업로드. atlassian-plugin.xml만 다름(DC 호환 플래그 추가).

**Q. Cloud(Forge) 이전 가능?**
A. React 컴포넌트(`src/components/`, `src/editors/`)는 그대로 이식 가능. 변경 필요한 부분: `src/host/v4-adapter.ts`를 `forge-adapter.ts`로 (`@forge/bridge` 사용), Java 백엔드를 Forge function(Node.js)으로 재작성. CUSTOM_PANEL_PLAN.md §7 참조.

**Q. 다른 매크로도 같은 방법으로 자체 패널화 가능?**
A. 가능. monkey-patch에 `name === 'aura-{macro}'` 분기 추가 + 해당 매크로용 schema/editor/dialog shell 작성. 패턴 동일.

---

## 14. 라이선스/주의사항

- Aura(`com.appanvil.aura.aura`)는 상용 라이선스. JAR 파일(`aura-3.8.0.jar`)은 repo에 commit 금지(`.gitignore` 등록됨).
- 분석/리소스 추출은 사내 PoC 한정. 외부 배포/재판매 금지.
- FontAwesome Free는 SIL OFL/MIT 라이선스 — 사내 사용 OK.

---

## 15. 빠른 시작 (Cheatsheet)

```bash
# 0. 환경 (한 번만)
docker-compose up -d
# Confluence Setup Wizard + Timebomb 라이선스

# 1. 빌드
cd macros/wonikips-confluence-macro
atlas-package -P server -Dmaven.test.skip=true

# 2. Vite dev (시각 검수)
cd src/main/resources/client-custom
npm run dev    # http://localhost:5173

# 3. Confluence 업로드
# → 앱 관리 → JAR 업로드 → Ctrl+Shift+R

# 4. 콘솔 검증
# F12 → Console → [WonikIPS Editor] 로그 5개 확인

# 5. 매크로 → Cards 클릭 → 모달 → "삽입"
```
