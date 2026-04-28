# Aura 플러그인 구조 분석 (mine.jar)

> **출처**: `mine.jar` = Aura v3.8.0 by //SEIBERT/MEDIA - appanvil  
> **목적**: 동일 기능의 자체 플러그인을 처음부터 개발하기 위한 참조 문서

---

## 1. 플러그인 개요

| 항목 | 값 |
|------|-----|
| Plugin Key | `com.appanvil.aura.aura` |
| 버전 | 3.8.0 |
| Plugins API | v2 |
| DC 호환 | `atlassian-data-center-compatible: true` |
| 라이선싱 | Atlassian UPM 기반 (`atlassian-licensing-enabled: true`) |
| 관리 페이지 | `/plugins/servlet/aura/admin` |

**제공 매크로 목록** (총 8개):

| 매크로 키 | 클래스 | 설명 |
|-----------|--------|------|
| `aura-button` | `Button` | 커스터마이즈 가능한 링크 버튼 |
| `aura-panel` | `Panel` | Tip/Note/Warning 스타일 패널 |
| `aura-cards` | `Cards` | 링크 카드 그리드 |
| `aura-tab-collection` | `TabCollection` | 탭 컨테이너 |
| `aura-tab` | `Tab` | 탭 개별 아이템 (Tab Collection 내부) |
| `aura-divider` | `Divider` | 커스텀 구분선 |
| `aura-background-image` | `BackgroundImage` | 배경 이미지/색상 컨테이너 |
| `aura-pretty-title` | `PrettyTitle` | 커스터마이즈 가능한 제목 |

---

## 2. JAR 파일 구조

```
mine.jar
├── atlassian-plugin.xml          # 플러그인 선언 (매크로, 서블릿, 웹 리소스 등록)
├── aura.properties               # i18n 문자열 (매크로 이름/설명, 라이선스 메시지)
│
├── com/appanvil/aura/            # Java 클래스 (.class)
│   ├── api/
│   │   └── MyPluginComponent     # 플러그인 컴포넌트 인터페이스
│   ├── impl/
│   │   └── MyPluginComponentImpl # 구현체 (Spring Bean)
│   ├── conditions/
│   │   └── IsPluginLicensedCondition  # 라이선스 유효 여부 조건
│   ├── macros/                   # 각 매크로 Java 클래스
│   │   ├── AbstractMultiOutputMacro   # 기반 추상 클래스
│   │   ├── Button, Panel, Divider, Tab, TabCollection
│   │   ├── BackgroundImage, BackgroundFill, PrettyTitle, Icon, HideElement
│   │   ├── Composition           # 프리셋 템플릿 삽입 매크로
│   │   └── cards/
│   │       ├── Cards, CardRenderer, CardStyle
│   │   └── styleconverters/      # 스타일 변환 유틸리티
│   │       ├── PanelStyles, DividerStyles, TabCollectionStyles
│   ├── servlets/
│   │   ├── AdminConfig           # GET/POST /aura/config (JSON API)
│   │   ├── AdminUI               # GET /aura/admin (HTML 렌더링)
│   │   ├── MacroPreviewRenderer  # GET /aura/macro-preview (편집기 미리보기)
│   │   ├── IconRenderer          # 아이콘 SVG 렌더링
│   │   └── LicenseServlet        # 라이선스 상태 API
│   ├── jobs/analytics/
│   │   └── AuraAnalyticsJobRunner  # 24시간 주기 분석 데이터 수집
│   └── utility/
│       ├── AuraLicense           # 라이선스 검증 유틸
│       ├── ClassNameCreator (인터페이스)
│       ├── MD5ClassNameCreator   # 매크로별 고유 CSS 클래스명 생성 (MD5 해시)
│       ├── ConfluenceLinkBuilder # Confluence 내부 링크 빌더
│       └── aurastyles/           # CSS 스타일 빌더 클래스들
│           ├── Alignment, BackgroundColor, Border, BorderRadius
│           ├── BoxShadow, Icon, Padding, Size, Text
│           ├── CssConvertable (인터페이스)
│           └── SvgStylesConvertable (인터페이스)
│
├── templates/                    # Velocity 템플릿 (매크로 렌더링 출력)
│   ├── Button.vm
│   ├── Card.vm, CardCollection.vm
│   ├── Divider.vm
│   ├── Icon.vm
│   ├── Panel.vm, Panel2.vm
│   ├── TabCollection.vm
│   ├── Admin.vm                  # 관리자 페이지 HTML
│   └── icondata.json             # 사용 가능한 아이콘 데이터
│
├── previews/                     # 편집기 미리보기용 SVG 템플릿
│   ├── Button.vm                 # SVG로 버튼 모양 렌더링
│   ├── Cards.vm                  # SVG로 카드 레이아웃 렌더링
│   └── Divider.vm                # SVG로 구분선 렌더링
│
├── client/                       # React 앱 빌드 결과물
│   └── static/
│       ├── css/main.css          # 전역 스타일
│       └── js/main.js            # 편집 UI (매크로 파라미터 설정 패널)
│
├── css/tabs.css                  # 탭 활성/비활성 상태 CSS
├── js/tabs.js                    # 탭 인터랙션 JavaScript
├── images/                       # 매크로 아이콘 이미지 (PNG)
├── webfonts/                     # FontAwesome 5 웹폰트
├── composition/                  # Composition 매크로용 프리셋 이미지/썸네일
│
├── META-INF/
│   ├── MANIFEST.MF
│   ├── spring/plugin-context.xml # Spring DI 설정 (atlassian-scanner 자동 스캔)
│   ├── plugin-components/
│   │   ├── component             # Spring Bean 목록
│   │   ├── exports               # OSGi export 목록
│   │   ├── imports               # OSGi import 목록
│   │   └── imports-confluence    # Confluence API import 목록
│   └── maven/com.appanvil.aura/aura/
│       ├── pom.xml
│       └── pom.properties
```

---

## 3. 동작 방식 — 매크로 렌더링 파이프라인

### 3-1. 전체 흐름

```
사용자가 Confluence 페이지 조회
        ↓
Confluence가 매크로 태그 감지 (예: {aura-button})
        ↓
매크로 클래스 호출 (예: Button.java)
        ↓
파라미터 파싱 → StyleConverter로 인라인 CSS 문자열 생성
        ↓
MD5ClassNameCreator → 고유 CSS 클래스명 생성 (CSS 충돌 방지)
        ↓
IconRenderer → 아이콘 SVG 렌더링
        ↓
ConfluenceLinkBuilder → 링크 URL 변환
        ↓
Velocity 템플릿(.vm)에 변수 바인딩 → HTML 생성
        ↓
IsPluginLicensedCondition → 라이선스 유효시 JS 로드 허용
        ↓
최종 HTML + <style> 블록이 페이지에 삽입됨
```

### 3-2. CSS 클래스명 고유화 전략

매크로가 한 페이지에 여러 번 사용될 때 스타일 충돌을 막기 위해 `MD5ClassNameCreator`를 사용한다. 파라미터 조합을 MD5 해싱해서 `aura-xxxxx` 형태의 고유 클래스명을 생성하고, 각 매크로 인스턴스의 `<style>` 블록과 HTML 엘리먼트에 동일하게 적용한다.

```velocity
## 예: Button.vm
<style>
  .$className {
    background: $computedBackground;
    color: $computedForeground;
    border-radius: ${borderRadius}px;
    font-size: ${fontSize}px;
  }
</style>
<a class="$className" href="$computedLink">...</a>
```

### 3-3. 편집 UI (매크로 파라미터 설정)

편집기에서 매크로를 삽입하거나 설정할 때:

1. `MacroPreviewRenderer` 서블릿 (`/aura/macro-preview`) 이 호출됨
2. **React 앱** (`client/static/js/main.js`)이 iframe 내에서 실행됨
3. React 앱이 현재 파라미터를 읽어 커스텀 UI 렌더링 (슬라이더, 컬러 피커 등)
4. 사용자가 설정을 바꾸면 React → Confluence 에디터로 파라미터 전달
5. 미리보기는 `previews/*.vm` (SVG 기반)으로 빠르게 렌더링

### 3-4. 라이선스 제어

`IsPluginLicensedCondition` 클래스가 UPM 라이선스 유효성을 체크한다.

- **유효**: `aura-resources-with-license` 웹 리소스 로드 → React JS 활성화
- **만료**: `aura-no-license-resources` 로드 → `license-expired.js` 실행 (경고 표시)
- **공통**: `aura-resources`(CSS, 웹폰트)는 라이선스 조건 없이 항상 로드됨

---

## 4. 각 매크로 상세

### Button (`Button.vm`)

**파라미터**:
- `label` — 버튼 텍스트
- `color` — 전경색 (HEX)
- `background` — 배경색 (HEX)
- `size` — `small` / `medium` / `large` (배율: 1.0 / 1.35 / 1.7)
- `outlined` — `regular` / `outlined`
- `borderRadius` — px 값
- `elevation` — `elevated` (box-shadow 추가)
- `icon` — 아이콘 ID
- `iconPosition` — `left` / `right`
- `href`, `hrefType`, `hrefTarget` — 링크 설정
- `className` — MD5 생성 고유 클래스

**렌더링 로직**:
- `outlined` 모드: 배경 transparent, 테두리 색상 = background 값
- hover: outlined이면 배경 채움, regular이면 배경 투명으로 반전
- 레이블 없이 아이콘만: 정사각형 버튼으로 렌더링
- 폰트 사이즈, 패딩, 너비/높이 모두 `size` 배율로 계산

**미리보기**: SVG로 버튼 모양 벡터 렌더링 (실제 HTML 버튼이 아님)

---

### Panel (`Panel.vm`, `Panel2.vm`)

**두 가지 템플릿이 존재** (버전 또는 스타일 변형으로 추정):

**Panel.vm 파라미터**:
- `background` — 헤더 배경색
- `backgroundSecondary` — 바디 배경색
- `color` — 헤더 텍스트 색
- `title` — 헤더 제목
- `titleSize` — `h1`/`h2`/`h3`/`h4`
- `titlePosition` — `top` / `left` / `right`
- `titleAlign` — `center` / `left` / `right`
- `iconPosition` — `left` / `right`
- `margin` — `margin` (마진 추가)
- `rounded` — `rounded` (border-radius: 10px)
- `elevation` — `elevated` (box-shadow)
- `border` — 바디 테두리 두께(px)
- `body` — 매크로 내부 컨텐츠 (Velocity `$body`)

**Panel2.vm 추가 파라미터**:
- `headline` — 새로운 헤더 텍스트
- `href`, `hrefTarget` — 헤더에 링크 연결
- `linkColor` — 링크 hover 색상
- `tag` — h1~h6 중 헤더 태그
- `baseStyle`, `headerStyle`, `headlineStyle`, `bodyStyle` — Java에서 생성된 인라인 스타일

---

### Cards (`CardCollection.vm` + `Card.vm`)

**2계층 구조**: `Cards` 매크로가 외부 컨테이너, 내부 각 카드는 `Card.vm`으로 렌더링

**CardCollection.vm 파라미터**:
- `columns` — 열 수
- `maxWidth` — 최대 너비 (기본 1200px)
- `gutter` — 카드 간격(px)
- `padding` — 카드 내 패딩
- `theme` — `aura` / `aura-accent` / `fabric` (기본값: 기본)
- `layout` — `icon-center` / `icon-left` / `icon-right`
- `decoration` — `icon` / `image`
- `imagePosition` — `top` / `left` / `right`
- `imageHeight` — 이미지 높이
- `hover` — `elevate` (scale 1.05) / `shrink` (scale 0.95)
- `cards` — Java에서 렌더링된 Card.vm HTML 목록

**CSS Grid 로직**:
```css
grid-template-columns: repeat(auto-fit, minmax(calc($maxWidth / $columns), 1fr));
```
모바일(600px 이하)에서 자동으로 1열로 변환

**테마별 차이**:
- `aura`: 흰 카드 + 미세 그림자, 제목 색 `#091e42`
- `aura-accent`: 아이콘에 원형 배경 (3.5rem 원)
- `fabric`: 다크 배경 (`#65666D`), 흰색 텍스트

---

### TabCollection (`TabCollection.vm`) + Tab

**구조**: `aura-tab-collection` 안에 여러 `aura-tab`을 중첩

**TabCollection.vm 파라미터** (Java `TabCollectionStyles`로 생성):
- `general.direction` — `horizontal` / `vertical`
- `general.tabWidth` — 탭 너비 (horizontal: %, vertical: px*4)
- `general.tabHeight` — 탭 높이(px)
- `general.tabSpacing` — 탭 간격(px)
- `general.isSticky` — 수직 탭에서 탭 nav를 sticky 처리
- `activeStyles`, `inactiveStyles`, `hoverStyles` — 탭 버튼 CSS
- `iconStylesActive`, `iconStylesInactive`, `iconStylesHover` — 아이콘 SVG fill CSS
- `contentStyles` — 탭 컨텐츠 영역 CSS
- `contentHeight` — 스크롤 가능 고정 높이(px)
- `tabs` — Tab 객체 목록 (id, title, icon, isActive)
- `mode` — `preview` (편집기 미리보기 모드)
- `hasShadow` — 그림자 추가

**탭 전환 JavaScript** (`tabs.js`):
```
DOMContentLoaded → cleanTabContent() + showFirstTabs() + fixInnerTabStyles()
탭 클릭 → aria-selected 토글 → 해당 tabpanel [hidden] 속성 토글
키보드 → 좌/우 화살표로 탭 포커스 이동
```

CSS로 탭 콘텐츠 표시/숨김:
```css
[data-aura-tab-active="false"] { display: none !important; }
[data-aura-tab-active="true"]  { display: block !important; }
```

---

### Divider (`Divider.vm`)

**파라미터**:
- `height` — 구분선 영역 전체 높이(px)
- `text` — 구분선 중앙 텍스트
- `icon` — 아이콘 (텍스트 대신)
- `showFirstBorder`, `showSecondBorder` — 좌우 라인 표시 여부
- `hasContent` — 텍스트/아이콘 유무
- `wrapperStyles`, `dividerStyles`, `borderStyles`, `textStyles` — Java 생성 인라인 스타일

**미리보기** (`Divider.vm`): 라인 스타일(solid/dashed/dotted/double)에 따라 SVG `<line>` 렌더링

---

### Icon (`Icon.vm`)

폰트어섬 아이콘을 SVG path 데이터로 직접 렌더링:
- `icondata.json` — 아이콘명 → SVG path 데이터 매핑
- `IconRenderer` 서블릿이 아이콘 이름을 받아 SVG HTML 반환
- `color`, `width`, `height`, `viewboxWidth`, `viewboxHeight`, `path`, `iconName` 변수로 렌더링

---

## 5. 서블릿 엔드포인트

| URL 패턴 | 클래스 | 역할 |
|----------|--------|------|
| `/aura/admin` | `AdminUI` | 관리자 설정 페이지 HTML (Admin.vm 렌더링) |
| `/aura/config` | `AdminConfig` | 색상 팔레트 설정 JSON API (GET/POST) |
| `/aura/macro-preview` | `MacroPreviewRenderer` | 편집기 매크로 미리보기 렌더링 |
| (내부) | `IconRenderer` | SVG 아이콘 렌더링 |
| (내부) | `LicenseServlet` | 라이선스 상태 반환 |

`AdminConfig`는 `ColorPaletteOption`과 `Config` 내부 클래스를 통해 색상 팔레트 설정을 JSON으로 관리한다.

---

## 6. 웹 리소스 로딩 전략

| 웹 리소스 키 | 조건 | 로드되는 파일 | context |
|-------------|------|--------------|---------|
| `aura-resources` | 없음 (항상) | main.css, webfonts.css, fa-solid-900.woff | `atl.general` |
| `aura-resources-with-license` | 라이선스 유효 | main.js | `atl.general` |
| `aura-no-license-resources` | 라이선스 만료 | license-expired.js | `atl.general` |
| `aura-admin-resources` | 라이선스 유효 | main.css, main.js, images | `atl.admin` |
| `aura-tabs-resources` | 없음 (항상) | tabs.js, tabs.css | `atl.general` |

`main.js`는 React 빌드 번들로, 편집기에서 커스텀 파라미터 UI를 제공한다.

---

## 7. Analytics Job

`AuraAnalyticsJobRunner`가 24시간마다 실행된다:
- `AnalyticsMacroCount` — 각 매크로 사용 횟수
- `AnalyticsMeta` — 플러그인 메타 정보
- `AnalyticsTenant` — Confluence 인스턴스 정보

Atlassian Job 설정:
```xml
<schedule repeat-interval="86400000"/>  <!-- 24시간 -->
<managed perClusterJob="true" clusteredOnly="false"/>
```

---

## 8. 의존성 (pom.xml)

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| jsoup | 1.14.3 | HTML 파싱/처리 |
| gson | 2.8.5 | JSON 직렬화 (AdminConfig API) |
| javax.servlet-api | 4.0.1 | 서블릿 (provided) |
| confluence | (버전 변수) | Confluence API (provided) |
| atlassian-spring-scanner-annotation | (버전 변수) | Spring DI 어노테이션 (provided) |
| atlassian-plugins-osgi-testrunner | (버전 변수) | 테스트 (test) |

---

## 9. 자체 플러그인 개발 시 핵심 구현 포인트

### 반드시 구현해야 할 것들

1. **`AbstractMultiOutputMacro` 상속** — 미리보기/뷰 모드 분기 처리
2. **MD5 기반 고유 className 생성** — 한 페이지 다중 인스턴스 CSS 충돌 방지
3. **Velocity 템플릿 분리** — 렌더링 HTML을 Java에서 분리
4. **StyleConverter 패턴** — 파라미터 → CSS 문자열 변환을 별도 클래스로 분리
5. **`IsPluginLicensedCondition`** 패턴 — 무료/유료 기능 분기 (timebomb 라이선스 테스트 가능)
6. **React 앱 → iframe 편집 UI** — 커스텀 파라미터 UI (슬라이더, 컬러피커)

### atlassian-plugin.xml 핵심 선언 패턴

```xml
<!-- 매크로 등록 -->
<xhtml-macro name="my-macro" class="com.example.macros.MyMacro" key="my-macro">
  <category name="formatting"/>
  <parameters>
    <parameter type="string" name="color"/>
    <!-- 파라미터는 Java에서 map으로 받음 -->
  </parameters>
</xhtml-macro>

<!-- 서블릿 등록 -->
<servlet name="My Preview" key="my-preview" class="com.example.servlets.MyPreview">
  <url-pattern>/my-plugin/preview</url-pattern>
</servlet>

<!-- 라이선스 조건부 리소스 -->
<web-resource key="my-js">
  <resource type="download" name="main.js" location="/client/main.js"/>
  <context>atl.general</context>
  <condition class="com.example.conditions.IsLicensedCondition"/>
</web-resource>
```

### 디렉토리 구조 권장안 (자체 개발 시)

```
src/main/
├── java/com/wonikips/confluence/
│   ├── api/                    # 인터페이스
│   ├── impl/                   # 구현체
│   ├── macros/                 # 매크로 클래스들
│   │   └── styleconverters/    # CSS 변환 유틸
│   ├── servlets/               # 서블릿
│   ├── conditions/             # UPM 조건
│   └── utility/                # 공통 유틸 (링크빌더, 클래스명 생성 등)
├── resources/
│   ├── templates/              # Velocity .vm 파일
│   ├── previews/               # 편집기 미리보기 .vm
│   ├── js/                     # 탭 등 순수 JS
│   └── css/                    # 순수 CSS
├── resources-server/
│   └── atlassian-plugin.xml    # Server 빌드용
└── resources-dc/
    └── atlassian-plugin.xml    # DC 빌드용 (data-center-compatible=true)
```
