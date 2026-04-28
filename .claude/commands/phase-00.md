---
description: Phase 00 — Vite + React + Maven 빌드 파이프라인 PoC. atlas-package로 React 번들 포함 JAR 생성.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Phase 00: Vite + React + Maven 빌드 파이프라인 PoC

## 너의 역할

너는 Confluence DC plugin 빌드 파이프라인 셋업 작업자다. 이 phase는 **자동 실행 가능**해야 하므로 사용자에게 묻지 않고 끝까지 진행한다. 막히면 진단 로그 남기고 명확히 escalate.

## 컨텍스트 (반드시 먼저 읽기)

다음 파일을 순서대로 읽어 프로젝트 상태를 파악:
1. `CLAUDE.md` — 환경, 빌드 규칙, 절대 금지 사항
2. `docs/CUSTOM_PANEL_PLAN.md` §3 (아키텍처), §5 (빌드 파이프라인) — 이번 phase가 따라야 할 설계
3. `docs/AURA_3.8.0_ANALYSIS.md` §13 (정합성 체크리스트) — 깨면 안 되는 것들
4. `macros/wonikips-confluence-macro/pom.xml` — 현재 빌드 설정
5. `macros/wonikips-confluence-macro/src/main/resources-server/atlassian-plugin.xml` — 현재 web-resource 등록

이전 phase: 없음 (시작 phase)
현재 plugin 버전: `pom.xml`에서 확인 (1.0.15-SNAPSHOT 가정)

## 목표

`atlas-package -P server -Dmaven.test.skip=true` 한 번 실행하면 **React 번들 포함 JAR**이 생성되도록 빌드 파이프라인 셋업.

성공 기준:
- 빌드된 JAR(`target/*-server.jar`) 안에 `client-custom-built/wonikips-editor.js` 존재
- 그 번들 안에 "Hello WonikIPS" 출력 코드 포함
- 기존 동작(매크로 삽입/렌더링) 회귀 없음

## 작업 단계

### 1. React 프로젝트 디렉토리 생성

`macros/wonikips-confluence-macro/src/main/resources/client-custom/` 디렉토리 아래 다음 파일 작성:

**`package.json`**:
```json
{
  "name": "wonikips-editor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

**`vite.config.ts`**:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'WonikIPSEditor',
      fileName: () => 'wonikips-editor.js',
    },
    rollupOptions: {
      external: ['jquery', 'AJS'],
      output: {
        globals: { jquery: 'jQuery', AJS: 'AJS' },
        assetFileNames: (asset) => asset.name === 'style.css' ? 'wonikips-editor.css' : '[name][extname]',
      },
    },
    cssCodeSplit: false,
  },
});
```

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**`src/main.tsx`**:
```tsx
console.log('[WonikIPS Editor] bundle loaded');

// PoC: window 전역에 마커 박아 web-resource 로드 검증
declare global {
  interface Window {
    __wonikipsEditor?: { version: string; loadedAt: number };
  }
}

window.__wonikipsEditor = {
  version: '0.1.0-poc',
  loadedAt: Date.now(),
};

console.log('[WonikIPS Editor] Hello WonikIPS', window.__wonikipsEditor);
```

**`.gitignore`** (해당 디렉토리에):
```
node_modules/
dist/
```

### 2. pom.xml 빌드 통합

`macros/wonikips-confluence-macro/pom.xml`의 `<build><plugins>` 섹션에 다음 추가:

```xml
<!-- Frontend build (Vite + React) -->
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
        <execution>
            <id>install-node-and-npm</id>
            <goals><goal>install-node-and-npm</goal></goals>
            <phase>generate-resources</phase>
        </execution>
        <execution>
            <id>npm-install</id>
            <goals><goal>npm</goal></goals>
            <phase>generate-resources</phase>
            <configuration><arguments>install</arguments></configuration>
        </execution>
        <execution>
            <id>npm-build</id>
            <goals><goal>npm</goal></goals>
            <phase>generate-resources</phase>
            <configuration><arguments>run build</arguments></configuration>
        </execution>
    </executions>
</plugin>

<!-- React 번들을 web-resource 위치로 복사 -->
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
                    <resource>
                        <directory>src/main/resources/client-custom/dist</directory>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 3. atlassian-plugin.xml에 web-resource 등록

`resources-server/atlassian-plugin.xml`과 `resources-dc/atlassian-plugin.xml` **둘 다**에 다음 web-resource 추가 (기존 `aura-resources-with-license` 옆에):

```xml
<!-- WonikIPS 자체 React 편집 UI (PoC) -->
<web-resource key="wonikips-editor-resources" name="WonikIPS Editor (React)">
    <dependency>com.atlassian.auiplugin:ajs</dependency>
    <resource type="download" name="wonikips-editor.js" location="/client-custom-built/wonikips-editor.js"/>
    <context>atl.general</context>
</web-resource>
```

### 4. pom.xml 버전 bump

현재 버전을 다음 minor로 올림 (예: `1.0.15-SNAPSHOT` → `1.0.16-SNAPSHOT`).

### 5. 빌드 실행

```bash
cd macros/wonikips-confluence-macro
C:/Users/ohjih/atlassian-sdk/bin/atlas-package.bat -P server -Dmaven.test.skip=true
```

첫 빌드는 Node 다운로드 + npm install로 5~10분 걸릴 수 있다.

### 6. 검증

```bash
# 6.1 빌드 성공 확인
ls macros/wonikips-confluence-macro/target/wonikips-confluence-macro-*-server.jar

# 6.2 JAR 안에 React 번들 존재 확인
unzip -l macros/wonikips-confluence-macro/target/wonikips-confluence-macro-*-server.jar | grep "client-custom-built/wonikips-editor.js"

# 6.3 번들 안에 "Hello WonikIPS" 포함 확인
unzip -p macros/wonikips-confluence-macro/target/wonikips-confluence-macro-*-server.jar client-custom-built/wonikips-editor.js | grep -c "Hello WonikIPS"

# 6.4 atlassian-plugin.xml에 web-resource 등록 확인
unzip -p macros/wonikips-confluence-macro/target/wonikips-confluence-macro-*-server.jar atlassian-plugin.xml | grep "wonikips-editor-resources"
```

위 4개 모두 비어있지 않은 결과여야 한다.

### 7. Git commit

```bash
cd /c/Users/ohjih/confluence
git add macros/wonikips-confluence-macro/src/main/resources/client-custom/ \
        macros/wonikips-confluence-macro/pom.xml \
        macros/wonikips-confluence-macro/src/main/resources-server/atlassian-plugin.xml \
        macros/wonikips-confluence-macro/src/main/resources-dc/atlassian-plugin.xml \
        .claude/commands/phase-00.md
git status  # 의도치 않은 파일 안 들어갔는지 확인
git commit -m "$(cat <<'EOF'
phase 00: vite+react build pipeline PoC

- client-custom/ 디렉토리 (Vite+React 18+TS)
- frontend-maven-plugin: Node 20.11 + npm install + npm run build
- maven-resources-plugin: dist/ → client-custom-built/ 복사
- atlassian-plugin.xml: wonikips-editor-resources 등록
- src/main.tsx: 'Hello WonikIPS' 콘솔 출력 (PoC 검증용)

EOF
)"
```

## 완료 조건 체크리스트

- [ ] `client-custom/package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx` 4개 파일 생성됨
- [ ] `pom.xml`에 frontend-maven-plugin + maven-resources-plugin 추가됨
- [ ] `atlassian-plugin.xml` 두 개 모두에 `wonikips-editor-resources` 등록됨
- [ ] `pom.xml` 버전 1단계 bump
- [ ] `atlas-package` 빌드 성공 (BUILD SUCCESS)
- [ ] JAR 안에 `client-custom-built/wonikips-editor.js` 존재
- [ ] 그 번들 grep "Hello WonikIPS" 결과 ≥ 1
- [ ] JAR atlassian-plugin.xml에 `wonikips-editor-resources` 포함
- [ ] git commit 완료

## 실패 처리

다음 중 하나 발생 시 **즉시 중단**하고 사용자에게 보고:

| 증상 | 가능성 | 권장 escalation 메시지 |
|------|--------|----------------------|
| `npm install` 네트워크 오류 | 사내망 프록시 / Node 버전 | "프록시 설정 필요. `~/.npmrc`에 사내망 registry 등록 후 재시도 권장" |
| `vite build` TypeScript 오류 | 코드 작성 실수 | 정확한 오류 라인 인용 |
| `atlas-package` Maven 의존성 다운로드 실패 | repo 접근 | maven log 캡처 + atlassian-sdk 버전 확인 |
| JAR에 `client-custom-built/` 누락 | maven-resources-plugin 실행 시점 잘못됨 | `<phase>` 값 검토 (`process-resources`여야 함) |

기존 매크로 동작 회귀 (예: 1.0.15에서 동작하던 Cards 매크로 삽입 깨짐)는 발생해선 안 된다 — 이 phase는 추가만 하고 기존 코드는 안 건드림.

## 보고

작업 완료 시 다음 형식으로 한 줄씩 출력:

```
✓ Created: client-custom/{package.json, vite.config.ts, tsconfig.json, src/main.tsx}
✓ Updated: pom.xml (frontend-maven-plugin, maven-resources-plugin, version 1.0.15→1.0.16)
✓ Updated: atlassian-plugin.xml × 2 (wonikips-editor-resources 등록)
✓ Built: target/wonikips-confluence-macro-1.0.16-SNAPSHOT-server.jar
✓ Verified: client-custom-built/wonikips-editor.js (size XXX KB) contains "Hello WonikIPS"
✓ Committed: <commit-hash> "phase 00: vite+react build pipeline PoC"

Next: 사용자가 1.0.16 JAR을 Confluence에 업로드 → 페이지 편집 진입 → DevTools 콘솔에서 "Hello WonikIPS" 확인.
이 검증 통과해야 Phase 01 (Aura 캡처) 또는 Phase 04 (Schema)로 진행.
```
