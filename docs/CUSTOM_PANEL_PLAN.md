# 자체 매크로 편집 패널 개발 계획

> **상태**: 계획 단계 (구현 전)
> **작성일**: 2026-04-28
> **타겟 데모**: 2026-05-26 (4주 후)

---

## 0. Executive Summary

| 항목 | 결정 |
|------|------|
| 기술 스택 | React 18 + TypeScript + Vite |
| 코딩 | Claude 주도, 사용자는 디자인/검수 |
| 타임라인 | **4주** (급함 — 데모 필요) |
| 첫 매크로 | **Cards** (사내 도입 검토 임팩트 큼) |
| 배포 환경 | DC 7.19.8 우선, Cloud Forge 이전 고려 아키텍처 |

**MVP 범위 (4주 내 끝낼 것)**:
- Cards 매크로 1개의 React 편집 패널
- 핵심 필드만 (theme, columns, gutter, cards 배열의 title/body/link/icon)
- WonikIPS 브랜드 색 + 한국어 라벨
- V4 매크로 브라우저 통합 동작 (Insert → 본문 삽입 → 저장 → 렌더링)
- Aura와 시각 60~70% 동등 (디테일은 데모 후 점진 개선)

**MVP에서 빼는 것 (포스트-MVP)**:
- 다른 매크로(Button/Panel/Tab/...) — 4주 안엔 못 함
- 색상 팔레트 관리자 페이지 (Aura의 admin 기능)
- 카드 reorder (드래그앤드롭) — 화살표 버튼으로 대체
- Composition 매크로 (프리셋 picker)
- Cloud Forge 실제 이전 (아키텍처만 준비, 실제 작업은 별도)

---

## 1. 목표 / 비목표

### 1.1 목표

1. **자체 통제권 확보** — Aura React 번들에 의존하지 않고 WonikIPS 디자인 시스템으로 매크로 편집 UI 제공
2. **사내 도입 데모** — 4주 내 "WonikIPS 자체 솔루션" 보여줄 수 있는 동작하는 Cards 패널
3. **확장 기반** — 다른 매크로로 확장할 때 재활용 가능한 컴포넌트 구조
4. **Cloud 이전 가능성** — DC에서 시작하지만 Forge로 옮길 때 React UI 부분은 이식 가능하도록 설계

### 1.2 비목표

1. ~~Aura 픽셀 단위 100% 복제~~ — 시각 70% + 기능 100%면 충분
2. ~~main.js 자체 분석/리버스 엔지니어링~~ — 캡처와 동작 관찰만
3. ~~모든 8개 매크로 동시 진행~~ — Cards 하나 끝낸 후에 검토
4. ~~Forge 직접 포팅~~ — 4주 내엔 DC 한정

---

## 2. 기술 스택

| 레이어 | 선택 | 이유 |
|--------|------|------|
| UI 프레임워크 | **React 18** | Aura와 동일, 학습자료 풍부, Cloud Forge Custom UI도 React 기반 |
| 타입 시스템 | **TypeScript** | 매크로 파라미터 schema 강제로 안전성 ↑ |
| 빌드 도구 | **Vite** | 빠른 dev server, ES 모듈, 단일 .js 번들 출력 |
| 컴포넌트 라이브러리 | **AUI 6.x** + 자체 컴포넌트 | DC 7.19.8 native, 다이얼로그/드롭다운 재활용 |
| 스타일링 | **CSS Modules** + 디자인 토큰 | scoped 스타일, WonikIPS 토큰 시스템과 정합 |
| 상태관리 | React `useState` + Context | 작은 패널이라 Redux/Zustand 불필요 |
| 검증 | **Zod** | 매크로 파라미터 schema 검증 |
| Confluence 통합 | **AJS.MacroBrowser API** | V4 호환 셰임으로 동작 확인됨 (Aura와 동일 경로) |

### 2.1 의존성 최소화 원칙
- `@atlaskit/*` 사용 안 함 — Cloud 전용, DC 호환 안 됨
- jQuery 직접 import 안 함 — `window.AJS.$` 만 macro browser 통합 시점에 사용
- 외부 CDN 의존 금지 — 사내망에서 동작해야 함

---

## 3. 아키텍처

### 3.1 전체 그림

```
┌──────────────────────────────────────────────────┐
│ Confluence V4 매크로 브라우저 (Confluence 자체)  │
│  ┌────────────────────────────────────────────┐  │
│  │ 우리 React 패널 (단일 .js 번들로 주입)     │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ App (CardsEditor)                    │  │  │
│  │  │  ├ <Header/>                         │  │  │
│  │  │  ├ <ParamForm>                       │  │  │
│  │  │  │   ├ <ThemeSelector/>              │  │  │
│  │  │  │   ├ <ColumnsSlider/>              │  │  │
│  │  │  │   ├ <GutterSlider/>               │  │  │
│  │  │  │   └ <CardList>                    │  │  │
│  │  │  │       └ <CardEditor/> × N         │  │  │
│  │  │  ├ <Preview/>                        │  │  │
│  │  │  └ <Footer SaveCancel/>              │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │       ↓ macroBrowserComplete()             │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
            ↓ params (cardsCollection JSON)
   ┌────────────────────────────────────────┐
   │ 기존 Java Cards.java + CardCollection.vm │
   │ → 페이지 저장 → 렌더링                  │
   └────────────────────────────────────────┘
```

### 3.2 Host 통합 레이어 (포팅 가능성 키)

**핵심 원칙**: React 컴포넌트는 Confluence를 모르게 하고, 통합은 얇은 어댑터 레이어가 담당.

```ts
// src/host/v4-adapter.ts (DC 7.19용)
export interface MacroEditorHost {
  open(opener: (currentParams: Params) => void): void;
  complete(name: string, params: Params, bodyHtml: string): void;
  cancel(): void;
}

export const v4Host: MacroEditorHost = {
  open: (opener) => {
    AJS.MacroBrowser.setMacroJsOverride('aura-cards', { opener });
  },
  complete: (name, params, bodyHtml) => {
    tinymce.confluence.macrobrowser.macroBrowserComplete({ name, params, bodyHtml });
  },
  cancel: () => {
    AJS.dialog2('#macro-browser-dialog').hide();
  },
};
```

**Cloud Forge 이전 시**: 동일 인터페이스 구현체를 `forge-adapter.ts`로 만들고 `@forge/bridge` 사용. React 컴포넌트는 한 줄도 안 바뀜.

### 3.3 데이터 흐름

```
1. 사용자가 매크로 브라우저에서 Cards 클릭
   → V4 → opener(currentParams) 호출
   → 우리 React 패널 마운트
   
2. 사용자 입력 → React state 업데이트 → 미리보기 갱신
   (Java 호출 없이 React 안에서 미리보기 렌더 — 빠른 반응)

3. Save 클릭
   → params 검증 (Zod)
   → host.complete('aura-cards', params, bodyHtml)
   → V4가 본문에 placeholder 삽입
   → 페이지 저장 시 storage XML로 변환
   
4. 페이지 뷰
   → Java Cards.java.executeWeb() 호출
   → CardCollection.vm 렌더링 → 최종 HTML
```

### 3.4 디렉토리 구조

```
macros/wonikips-confluence-macro/
└── src/main/
    ├── java/com/uiux/macro/...        # 기존 Java (변경 최소)
    ├── resources/
    │   ├── client-custom/             # ★ 새로 추가
    │   │   ├── package.json
    │   │   ├── vite.config.ts
    │   │   ├── tsconfig.json
    │   │   ├── src/
    │   │   │   ├── main.tsx           # 진입점
    │   │   │   ├── App.tsx
    │   │   │   ├── editors/
    │   │   │   │   └── CardsEditor/
    │   │   │   │       ├── index.tsx
    │   │   │   │       ├── CardsEditor.module.css
    │   │   │   │       ├── ThemeSelector.tsx
    │   │   │   │       ├── ColumnsSlider.tsx
    │   │   │   │       ├── CardList.tsx
    │   │   │   │       ├── CardEditor.tsx
    │   │   │   │       └── Preview.tsx
    │   │   │   ├── components/        # 재사용 컴포넌트
    │   │   │   │   ├── Slider.tsx
    │   │   │   │   ├── ColorPicker.tsx
    │   │   │   │   ├── IconPicker.tsx
    │   │   │   │   └── TextInput.tsx
    │   │   │   ├── host/
    │   │   │   │   ├── adapter.ts     # 인터페이스
    │   │   │   │   └── v4-adapter.ts  # DC 구현
    │   │   │   ├── schema/
    │   │   │   │   └── cards.ts       # Zod schema
    │   │   │   ├── theme/
    │   │   │   │   ├── tokens.css     # WonikIPS 토큰
    │   │   │   │   └── globals.css
    │   │   │   └── i18n/
    │   │   │       └── ko.ts
    │   │   └── dist/                  # 빌드 결과물 (gitignore)
    │   │       └── wonikips-editor.js
    │   ├── client/static/js/main.js   # ★ 향후 제거 (Aura 번들)
    │   └── client-custom-built/       # ★ Vite 출력을 여기로 복사
    │       └── wonikips-editor.js
    └── resources-{server,dc}/
        └── atlassian-plugin.xml       # web-resource 추가
```

### 3.5 atlassian-plugin.xml 추가

```xml
<!-- 자체 React 편집 UI — Aura main.js 대신 -->
<web-resource key="wonikips-editor-resources" name="WonikIPS Editor (React)">
    <dependency>com.atlassian.auiplugin:ajs</dependency>
    <resource type="download" name="wonikips-editor.js"
              location="/client-custom-built/wonikips-editor.js"/>
    <resource type="download" name="wonikips-editor.css"
              location="/client-custom-built/wonikips-editor.css"/>
    <context>atl.general</context>
</web-resource>
```

마이그레이션 시: 기존 `aura-resources-with-license` (Aura main.js) 비활성화 → 우리 `wonikips-editor-resources` 활성화. 단계적 전환 위해 일정 기간 두 개 공존도 가능 (서로 다른 매크로 키 처리).

---

## 4. 4주 정밀 일정

> 각 주의 끝에 **데모 가능한 산출물**이 있어야 함 (사내 보고 시점에 그 주차까지의 결과물 제시 가능).

### Week 1 (5/2 ~ 5/8): 환경 + 분석 + 첫 컴포넌트

| 일 | 작업 | 산출물 |
|----|------|--------|
| 월 | Vite + React + TS 프로젝트 셋업 | `client-custom/` 빌드 가능, "Hello World" |
| 화 | atlas-package 빌드와 통합 (maven-resources-plugin으로 dist 복사) | `atlas-package` 한 번 돌리면 React 번들 포함 JAR 생성 |
| 수 | **사용자**: Aura 라이선스 활성화 + 정밀 캡처 (Cards 패널 모든 화면) | 스크린샷 50+ + 인터랙션 영상 3~5개 |
| 목 | Cards 파라미터 schema 정의 (Zod) — 캡처 기반 | `schema/cards.ts` — 모든 필드 타입 명시 |
| 금 | 가장 단순한 컴포넌트(`TextInput`, `Slider`) + Storybook(또는 단독 dev page) | 디자인 토큰 적용된 input/slider 동작 |

**Week 1 데모**: dev server에서 `<Slider />` 컴포넌트가 WonikIPS 색상으로 동작하는 모습.

**리스크**: Vite 출력을 Confluence web-resource로 통합하는 빌드 파이프라인이 첫 주에 안 끝나면 Week 2 일정 1~2일 밀림.

### Week 2 (5/9 ~ 5/15): 핵심 패널 + 카드 편집

| 일 | 작업 | 산출물 |
|----|------|--------|
| 월 | `ColorPicker` 컴포넌트 (HEX 입력 + 팔레트 8색) | 컬러피커 동작 |
| 화 | `IconPicker` 컴포넌트 (FontAwesome icondata.json 재활용, 그리드 표시) | 아이콘피커 동작 |
| 수 | `CardEditor` (제목/본문/링크/아이콘) | 카드 1개 편집 가능 |
| 목 | `CardList` (카드 추가/삭제, 화살표 reorder) | 카드 N개 관리 |
| 금 | `ThemeSelector`, `ColumnsSlider`, `GutterSlider` + 전체 폼 통합 | Cards 매크로 모든 파라미터 입력 가능 |

**Week 2 데모**: Storybook에서 Cards 편집 폼 전체 동작 (V4 통합은 아직, 로컬 미리보기만).

### Week 3 (5/16 ~ 5/22): V4 통합 + Save/Insert

| 일 | 작업 | 산출물 |
|----|------|--------|
| 월 | `host/v4-adapter.ts` 구현 — `setMacroJsOverride` 등록 | 매크로 브라우저 클릭 → 우리 패널 뜸 |
| 화 | `macroBrowserComplete` 호출 — 파라미터 JSON으로 직렬화 | Insert 클릭 → 본문에 placeholder 삽입 |
| 수 | 페이지 저장 → 렌더링 정상 동작 검증 (기존 Java/Velocity와 호환) | E2E 동작 확인: 편집 → 삽입 → 저장 → 페이지 뷰 |
| 목 | 미리보기(Preview) 컴포넌트 — React 안에서 카드 그리드 시각 모사 | 편집 중 실시간 미리보기 |
| 금 | 매크로 재편집 (이미 삽입된 매크로 클릭 → 패널에 기존 값 로드) | edit 흐름 완성 |

**Week 3 데모**: **Aura를 우리 React 패널로 대체.** 매크로 브라우저에서 Cards 클릭 → WonikIPS 패널 → Insert → 본문 정상 삽입 → 저장.

### Week 4 (5/23 ~ 5/26 데모일): 디자인 마감 + 버그 수정 + 데모 준비

| 일 | 작업 | 산출물 |
|----|------|--------|
| 월 | WonikIPS 브랜드 토큰 적용 (색상/타이포/그림자) | 시각 마감 70% |
| 화 | 한국어 i18n 전체 — 라벨/도움말/에러 메시지 | 전부 한국어 |
| 수 | 호버/포커스/disabled 상태, 마이크로 인터랙션 | 시각 마감 90% |
| 목 | 데모 시나리오 리허설 + 버그 픽스 + 데모 자료 | 데모 안정성 확보 |
| 금 | **데모일** | 사내 보고 |

**Week 4 데모**: WonikIPS 디자인 시스템 적용된 Cards 매크로 편집 패널. Aura와 비교 시 시각 70% + 기능 100%.

---

## 5. 빌드 파이프라인

### 5.1 Vite 설정 (단일 .js 번들 출력)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'WonikIPSEditor',
      fileName: () => 'wonikips-editor.js',
    },
    rollupOptions: {
      external: ['jquery', 'AJS'],   // Confluence가 이미 제공
      output: { globals: { jquery: 'jQuery', AJS: 'AJS' } },
    },
    cssCodeSplit: false,             // 단일 CSS 파일로
  },
});
```

### 5.2 Maven 통합 (atlas-package와 연결)

```xml
<!-- pom.xml에 추가 -->
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <version>1.15.0</version>
    <configuration>
        <workingDirectory>src/main/resources/client-custom</workingDirectory>
        <nodeVersion>v20.11.0</nodeVersion>
    </configuration>
    <executions>
        <execution>
            <id>install node and npm</id>
            <goals><goal>install-node-and-npm</goal></goals>
        </execution>
        <execution>
            <id>npm install</id>
            <goals><goal>npm</goal></goals>
            <configuration><arguments>install</arguments></configuration>
        </execution>
        <execution>
            <id>npm build</id>
            <goals><goal>npm</goal></goals>
            <configuration><arguments>run build</arguments></configuration>
        </execution>
    </executions>
</plugin>

<!-- 빌드 결과물을 web-resource 위치로 복사 -->
<plugin>
    <artifactId>maven-resources-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-react-bundle</id>
            <phase>process-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
                <outputDirectory>
                    ${project.build.outputDirectory}/client-custom-built
                </outputDirectory>
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

### 5.3 개발 워크플로우

**개발 중 (빠른 iteration)**:
```bash
# Terminal 1: Vite dev server (storybook-like 단독 페이지)
cd src/main/resources/client-custom && npm run dev
```

**Confluence 통합 테스트**:
```bash
# Terminal 2: 빌드 + 업로드
atlas-package -P server -Dmaven.test.skip=true
# → target/*.jar를 Confluence 앱 관리에 수동 업로드
```

빠른 iteration: Vite dev server에서 컴포넌트 단위 개발/디자인 검수 → 합쳐서 Confluence 통합 테스트.

---

## 6. 핵심 컴포넌트 명세

### 6.1 Cards 매크로 파라미터 schema

```ts
// schema/cards.ts
import { z } from 'zod';

export const CardSchema = z.object({
  title: z.string().default(''),
  body: z.string().default(''),
  href: z.string().default(''),
  hrefType: z.enum(['external', 'attachment', 'page']).default('external'),
  hrefTarget: z.enum(['_blank', '_self']).default('_blank'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#333333'),
  icon: z.string().default('faPaperPlane'),
  image: z.string().default(''),
});

export const CardsParamsSchema = z.object({
  theme: z.enum(['aura', 'aura-accent', 'fabric']).default('aura'),
  columns: z.number().int().min(1).max(6).default(3),
  gutter: z.number().int().min(0).max(50).default(10),
  maxWidth: z.string().default('1200px'),
  decoration: z.enum(['icon', 'image']).default('icon'),
  imagePosition: z.enum(['top', 'left', 'right']).default('top'),
  imageHeight: z.number().int().min(50).max(500).default(150),
  hover: z.enum(['none', 'elevate', 'shrink']).default('elevate'),
  layout: z.enum(['icon-center', 'icon-left', 'icon-right']).default('icon-center'),
  cards: z.array(CardSchema).default([]),
});

export type CardsParams = z.infer<typeof CardsParamsSchema>;
```

### 6.2 컴포넌트 일람

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| `<TextInput>` | `value, onChange, label, placeholder` | 단일 줄 텍스트 |
| `<Textarea>` | `value, onChange, label, rows` | 다중 줄 |
| `<Slider>` | `value, onChange, min, max, step, label, unit` | 숫자 슬라이더 |
| `<ColorPicker>` | `value, onChange, palette?` | HEX + 팔레트 |
| `<IconPicker>` | `value, onChange, library='fa-solid'` | 아이콘 그리드 + 검색 |
| `<EnumSelect>` | `value, onChange, options, label` | 라디오 또는 드롭다운 |
| `<Toggle>` | `value, onChange, label` | on/off |
| `<LinkInput>` | `value, type, target, onChange` | 링크 (external/page/attach) |

### 6.3 Java 백엔드 변경 (최소)

기존 `Cards.java`와 `CardCollection.vm`은 그대로. 우리가 보내는 JSON이 동일 schema면 변경 0.

**확인 필요**: Aura가 보내는 JSON과 우리 schema가 100% 일치하는지 — Week 1에 캡처 본 후 검증. 차이 있으면 우리 schema를 Aura 형식에 맞춤.

---

## 7. Cloud Forge 이전 고려사항

> **Week 4까지는 DC 한정. 아래는 미래 작업.**

### 7.1 무엇이 호환되는가
- React 컴포넌트 (`src/editors/`, `src/components/`) — 그대로 이식 가능
- 디자인 토큰 (`theme/tokens.css`) — 그대로 이식 가능
- Zod schema (`schema/cards.ts`) — 그대로 이식 가능

### 7.2 무엇이 바뀌어야 하는가
- `host/v4-adapter.ts` → `host/forge-adapter.ts` 신규 작성 (`@forge/bridge` 사용)
- Java 백엔드 → Forge function (Node.js)으로 재작성 또는 외부 API
- Velocity 템플릿 → React 서버 사이드 렌더링 또는 Forge UI Kit
- 빌드 toolchain → Forge CLI 사용

### 7.3 이전 비용 추정
- Custom UI 마이그레이션: 2~3주
- 백엔드(Java → Node) 재작성: 4~6주
- 합계: 1.5~2개월

DC 한정으로 시작했지만 React UI 부분은 변경 없이 가져갈 수 있어서 **Cloud 이전 시점에 바닥부터 다시 쓸 필요 없음.**

---

## 8. 사용자 vs Claude 역할

### 8.1 사용자 (UX 디자이너)

| 단계 | 작업 | 시간 |
|------|------|------|
| Week 1 | Aura 정밀 캡처 (스크린샷 50+, 영상 5개) | 4시간 |
| Week 1 | Cards 파라미터 schema 검수 (Aura와 일치하는지) | 1시간 |
| Week 1~2 | 컴포넌트 디자인 검수 — Vite dev server 띄워보고 피드백 | 매주 2시간 |
| Week 3 | Confluence 통합 동작 검증 (편집/삽입/저장/렌더링) | 2시간 |
| Week 4 | WonikIPS 디자인 토큰 정리 + 적용 검수 | 4시간 |
| Week 4 | 한국어 라벨/도움말 작성 | 2시간 |
| Week 4 | 데모 시나리오/자료 준비 | 4시간 |

**총 사용자 시간**: 약 25~30시간 (4주에 분산)

### 8.2 Claude

| 단계 | 작업 |
|------|------|
| 코드 작성 | 모든 React 컴포넌트, 빌드 파이프라인, host adapter, 빌드/디버깅 |
| 분석 | Aura 캡처본 분석, 인터랙션 모사, main.js 동작 참조 |
| 통합 | V4 매크로 브라우저 통합, 기존 Java와 호환성 검증 |
| 문서화 | 코드 코멘트, 컴포넌트 명세, 사용 가이드 |

---

## 9. 리스크 + 완화책

| # | 리스크 | 가능성 | 영향 | 완화책 |
|---|--------|--------|------|--------|
| 1 | Vite 빌드 → atlas-package 통합이 첫 주에 안 끝남 | 중 | 일정 1~2일 밀림 | Week 0(이번 주) 내 PoC 빌드 한 번 돌려보기 |
| 2 | V4 macroBrowserComplete 호출 시점/페이로드 형식 모사 실패 | 중 | Week 3 정체 | Aura main.js의 실제 호출을 DevTools로 캡처해서 정확히 따라하기 |
| 3 | Cards 파라미터 JSON schema가 Aura와 다르면 기존 페이지 호환성 깨짐 | 낮 | 기존 매크로 깨짐 | Week 1 캡처 시 반드시 storage XML 형태 확인 |
| 4 | 4주 안에 시각 70% 못 맞춤 | 중 | 데모 임팩트 ↓ | MVP 스코프 더 줄임 (예: cards 배열은 화살표 reorder만, 이미지/링크 타입 단순화) |
| 5 | 사용자(디자이너) 시간 확보 안 됨 | 낮 | 결정 지연 | Week 1에 다음 주 디자인 검수 일정 미리 잡음 |
| 6 | 사내 데모 일정 변경 | 낮 | — | 일정 압박 줄어들면 시각 마감을 더 함 |
| 7 | FontAwesome 라이선스 (사내 도입 시) | 중 | 라이선스 검토 필요 | FontAwesome Free(Aura가 쓰는 것)는 SIL OFL/MIT — 사내 사용 OK |
| 8 | Confluence 7.19.8 V4 호환성 셰임이 사라지는 미래 버전 | 낮 | 장기 위험 | Cloud Forge 이전 시 자연스럽게 해결 |

---

## 10. 결정 포인트 (Week 1 시작 전 확정)

다음 5가지는 Week 1 시작 전에 결정해야 빠르게 진행 가능:

1. **Vite 시작점** — npm 환경(Node 20)을 로컬에 설치 OK? 또는 Maven plugin이 자동 설치하게 둘까? → **추천: Maven plugin 자동**
2. **Aura 라이선스 발급 시점** — Week 1 수요일에 정밀 캡처할 거니까 그 때 timebomb 받기. 이전엔 우리 1.0.15 그대로 사용.
3. **WonikIPS 디자인 토큰 출처** — CLAUDE.md의 글래스모피즘 시스템 그대로 쓸지, 매크로 패널용 별도 토큰 만들지. → **추천: 매크로 패널은 더 차분한 토큰** (글래스 효과는 패널 안에 안 어울림)
4. **데모 청중** — 누구한테 데모? 결재권자? 잠재 사용자? → 청중에 따라 강조점 다름.
5. **데모 후 다음 매크로 우선순위** — Cards 데모 성공 후 어떤 매크로 다음? Button(빠른 두 번째 성공) vs Panel(자주 쓰임).

---

## 11. 즉시 다음 단계

이 plan 승인 후 시작할 첫 작업:

1. **사용자**: 위 §10의 5개 결정 포인트 답변
2. **Claude**: Week 0(이번 주말~다음 주 월) 내 빌드 파이프라인 PoC
   - `client-custom/` 디렉토리 생성
   - `package.json`, `vite.config.ts`, `tsconfig.json`
   - `npm install` + `npm run build` 한 번 성공
   - Maven `frontend-maven-plugin` 통합
   - `atlas-package` 한 번 돌려서 React 번들 포함 JAR 생성 확인
3. **사용자**: 그 JAR 업로드해서 web-resource로 React 번들 로드되는지 확인 (콘솔에 "Hello WonikIPS" 출력)

이 PoC가 끝나면 Week 1 본격 시작.

---

## 12. 참조 문서

- 원본 분석: `docs/AURA_3.8.0_ANALYSIS.md`
- 디버깅 기록: `docs/CARDS_INSERT_DEBUG.md`
- 결정 기록: `docs/ADR.md` (특히 ADR-013, ADR-014, ADR-015, ADR-016)
- 환경 설정: `CLAUDE.md`

---

## 13. 검증 결과 (2026-04-29 — 1.0.23-SNAPSHOT-server.jar)

**Phase 0~10 모두 완료. Cards 매크로 자체 React 패널 동작 확인.**

### 13.1 완료 phase

| Phase | 산출물 | 검증 |
|-------|--------|------|
| 00 | Vite + frontend-maven-plugin 통합 빌드 파이프라인 | `[WonikIPS Editor] Hello WonikIPS` 콘솔 출력 |
| 04 | Cards Zod schema + UI ↔ Java mapper | `npx tsc --noEmit` 통과 + round-trip test |
| 05~08 | Slider, TextInput, ColorPicker, IconPicker | Vite dev 서버 시각 검수 |
| 09 | CardsEditor 통합 폼 (General/Content 탭, 라이브 프리뷰) | dev 서버 demo 모드 동작 |
| 10 | V4 매크로 브라우저 통합 (`setMacroJsOverride` monkey-patch) | Confluence DC에서 Cards 클릭 → 우리 React 모달 표시 |

### 13.2 1.0.16 → 1.0.23 회귀 추적 (8 빌드)

| 버전 | 증상 | 원인 | 수정 |
|------|------|------|------|
| 1.0.17 | 페이지 비활성화 + 콘솔 무출력 | 1.6MB icondata 임베딩 + 모든 페이지 V4 host 등록 | (롤백) |
| 1.0.18 | 페이지 정상 + 콘솔 무출력 | `process.env.NODE_ENV` dynamic 참조 → batch.js throw | Vite `define` 추가 |
| 1.0.19 | URL 패턴 `resumedraft.action` 미매칭 | `isEditPage()` 가드 너무 엄격 | 가드 제거 |
| 1.0.20 | 콘솔 로그 정상 + Aura 패널 표시 | Aura가 page-edit-loaded에서 재등록 → 우리 덮어씀 | (다음 단계로) |
| 1.0.21 | 매크로 클릭 시 패널 자체 안 뜸 | monkey-patch 적용했지만 CSS 누락 | (다음 단계로) |
| 1.0.22 | 모달은 떴지만 "삽입" 버튼이 보이지 않음 | nested scroll에 묻힘 | Dialog level footer + state lifting |
| 1.0.23 | **모든 동작 정상** | — | — |

### 13.3 검증된 빌드 + 배포 절차

```bash
# 빌드 (Vite + Java + JAR)
cd macros/wonikips-confluence-macro
C:/Users/ohjih/atlassian-sdk/bin/atlas-package.bat -P server -Dmaven.test.skip=true
# DC 빌드는 -P dc

# JAR 검증 (4가지)
JAR=target/wonikips-confluence-macro-X.Y.Z-SNAPSHOT-server.jar
unzip -l "$JAR" | grep "client-custom-built/wonikips-editor"   # JS + CSS 2개 행
unzip -p "$JAR" atlassian-plugin.xml | grep -c "wonikips-editor.css"  # 1
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "process\."  # 0 (define 정상)
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "Monkey-patched"  # 1

# Confluence 업로드 후 콘솔 검증 (편집 페이지에서)
[WonikIPS Editor] bundle loaded
[WonikIPS Editor] Hello WonikIPS {version: '0.4.0-safe-boot'}
[WonikIPS Editor] Scheduling V4 host registration
[WonikIPS Editor] Monkey-patched setMacroJsOverride for aura-cards
[WonikIPS Editor] iconData loaded 1458
```

### 13.4 다음 단계 후보

- **다른 매크로 자체 패널화**: Button/Panel/Tab/Title/Divider/BackgroundImage 순차 진행. 이미 검증된 패턴 재사용 가능 — schema → 컴포넌트 → CardsDialogShell 유사 wrapper.
- **WonikIPS 디자인 토큰 적용**: 현재 Atlassian 기본 색(`#0052CC` 등). CLAUDE.md의 글래스모피즘 토큰 또는 별도 patio 적용.
- **시각 디테일 보강**: Aura 캡처 대비 구체적 차이(아이콘 크기, 간격, 애니메이션 타이밍) 한 차례 정렬.
- **에러 처리/검증 UX**: 입력 validation, 에러 메시지, 도움말 툴팁 추가.
- **DC 빌드 + 운영 배포**: 1.0.23이 server 환경에서 검증됐으므로 동일 코드로 `-P dc` 빌드 + 운영 DC 배포 가능.

---

## 14. 빌드 사이즈 + 성능 (1.0.23 기준)

| 항목 | 값 |
|------|------|
| Vite 출력 JS | 215.74 KB (gzip 64.49 KB) |
| Vite 출력 CSS | 9.99 KB (gzip 2.15 KB) |
| 동적 fetch icondata.json | 1.1 MB (압축 없음) — 매크로 패널 처음 열릴 때만 |
| JAR 총 크기 | ~31 MB (Aura 자산 포함) |
| 첫 페이지 로드 영향 | 215 KB JS + 10 KB CSS (atl.general 컨텍스트, batch.js 합쳐짐) |
| 매크로 패널 첫 오픈 | +1.1 MB icondata fetch (캐시됨) |
