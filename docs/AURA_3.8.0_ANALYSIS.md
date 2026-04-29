# Aura 3.8.0 정밀 분석

> **출처**: `C:\Users\ohjih\confluence\aura-3.8.0.jar` (5,810,818 bytes)
> **분석 일자**: 2026-04-28
> **목적**: 우리 미러링 플러그인(`wonikips-confluence-macro`) 디버깅 시 비교 기준

---

## 0. 빌드 메타데이터

| 항목 | 값 |
|------|------|
| Plugin Key | `com.appanvil.aura.aura` |
| Bundle Symbolic Name | `com.appanvil.aura` |
| Bundle Version | 3.8.0 |
| Built-By | philip |
| Build Date | 2023-01-11T16:44:51+0100 |
| Build JDK | 1.8.0_352 |
| Bundle Tool | Bnd-3.5.0.201709291849 |
| Spring Scanner | 2.2.5 |
| AMPS | 8.6.0 |
| 빌드 대상 Confluence | 8.0.1 (`<confluence.version>` in pom) |
| 의존 라이브러리 | jsoup 1.14.3, gson 2.8.5, javax.servlet-api 4.0.1 (provided), javax.inject 1 (provided) |

**중요**: 빌드 시 Confluence 8.0.1 BOM에 맞춰 컴파일됐지만, 설치 대상은 7.19.8도 가능 (`atlassian-plugin.xml`의 `atlassian-data-center-status: compatible`).

---

## 1. JAR 인벤토리 (총 167 파일)

### 1.1 카테고리별 파일 분포

| 카테고리 | 개수 | 비고 |
|----------|------|------|
| `.class` (Java) | 62 | `com/appanvil/aura/**` |
| `.properties` (i18n + precache) | 10 | `aura.properties` + service-worker용 9개 |
| `.vm` (Velocity) | 11 | `templates/` 8개, `previews/` 3개 |
| `.png/.jpg/.svg/.ico` | 30 | `images/`, `composition/`, `client/` |
| 웹폰트 | 16 | FontAwesome 5 (brands/regular/solid × eot/svg/ttf/woff/woff2) + webfonts.css |
| JS | 12 | `client/static/js/main.js` (2.84MB), `js/tabs.js`, `js/license-expired.js`, precache 9개 |
| CSS | 2 | `client/static/css/main.css` (51 bytes), `css/tabs.css` |
| 기타 | 24 | atlassian-plugin.xml, MANIFEST.MF, Spring DI 메타, JSON, HTML |

### 1.2 전체 디렉토리 구조

```
aura-3.8.0.jar
├── atlassian-plugin.xml           (단일 진실 소스)
├── aura.properties                (i18n)
│
├── com/appanvil/aura/             (62 .class 파일)
│   ├── api/MyPluginComponent
│   ├── impl/MyPluginComponentImpl
│   ├── conditions/IsPluginLicensedCondition
│   ├── macros/                    (14 클래스 — 매크로 핵심)
│   │   ├── AbstractMultiOutputMacro      ← 모든 매크로 부모
│   │   ├── Button, Panel, Divider, Tab, TabCollection
│   │   ├── BackgroundImage, BackgroundFill, PrettyTitle
│   │   ├── Icon, HideElement, Composition
│   │   └── cards/Cards, CardRenderer, CardStyle
│   │   └── styleconverters/       (11 클래스 — 파라미터 → CSS 변환)
│   ├── servlets/                  (9 클래스)
│   │   ├── AdminConfig, AdminUI, MacroPreviewRenderer
│   │   ├── IconRenderer, LicenseServlet
│   ├── jobs/analytics/AuraAnalyticsJobRunner + 3 데이터 클래스
│   ├── utility/
│   │   ├── ClassNameCreator (인터페이스), MD5ClassNameCreator
│   │   ├── ConfluenceLinkBuilder, AuraLicense
│   │   └── aurastyles/            (12 CSS 빌더 클래스)
│
├── templates/                     (Velocity .vm)
│   ├── Admin.vm                   (관리 페이지)
│   ├── Button.vm, Panel.vm, Panel2.vm
│   ├── Card.vm, CardCollection.vm
│   ├── Divider.vm, Icon.vm, TabCollection.vm
│   └── icondata.json              (1.1MB FontAwesome 메타)
│
├── previews/                      (편집기 SVG 미리보기)
│   ├── Button.vm, Cards.vm, Divider.vm
│
├── client/                        (React 빌드 결과물)
│   ├── static/js/main.js          (2.84MB minified React 번들)
│   ├── static/css/main.css        (51 bytes — 거의 비어있음)
│   ├── service-worker.js, precache-manifest.*.js
│   ├── manifest.json, asset-manifest.json
│   ├── index.html, robots.txt
│   ├── favicon.ico, logo192.png, logo512.png
│   └── static/media/logo.svg
│
├── js/
│   ├── tabs.js                    (탭 클라이언트 인터랙션)
│   └── license-expired.js         (라이선스 만료 다이얼로그)
│
├── css/tabs.css
│
├── images/                        (15 PNG — 매크로 아이콘)
├── webfonts/                      (FontAwesome 5)
├── composition/                   (Composition 매크로 프리셋 이미지)
│
└── META-INF/
    ├── MANIFEST.MF
    ├── maven/com.appanvil.aura/aura/{pom.xml, pom.properties}
    ├── plugin-components/{component, exports, imports, imports-confluence}
    └── spring/plugin-context.xml
```

---

## 2. atlassian-plugin.xml — 전체 구조

### 2.1 plugin-info

```xml
<plugin-info>
  <description>Aura introduces an intuitive suite of content...</description>
  <version>3.8.0</version>
  <vendor name="//SEIBERT/MEDIA - appanvil" url="http://www.appanvil.de"/>
  <param name="plugin-banner">images/app-banner.png</param>
  <param name="plugin-logo">images/app-logo.png</param>
  <param name="plugin-icon">images/app-icon.png</param>
  <param name="vendor-logo">images/vendor-logo.png</param>
  <param name="vendor-icon">images/vendor-icon.png</param>
  <param name="atlassian-licensing-enabled">true</param>     ← UPM 라이선스 게이트
  <param name="configure.url">/plugins/servlet/aura/admin</param>
  <param name="atlassian-data-center-status">compatible</param>
  <param name="atlassian-data-center-compatible">true</param>
  <param name="plugin-type">both</param>                     ← Server + DC 단일 빌드
</plugin-info>
```

### 2.2 i18n / 정적 리소스

```xml
<resource type="i18n" name="i18n" location="aura"/>          ← aura.properties
<resource type="download" name="images/" location="/images"/>
```

### 2.3 web-resource 5종 (라이선스 게이팅 핵심)

| key | 조건 | 로드 | context |
|-----|------|------|---------|
| `aura-resources` | (없음 — 항상 로드) | `main.css`, `webfonts.css`, `fa-solid-900.woff` (`allow-public-use=true`) | `atl.general` |
| `aura-resources-with-license` | **`IsPluginLicensedCondition`** | `main.js` (React 번들) | `atl.general` |
| `aura-admin-resources` | **`IsPluginLicensedCondition`** | `main.css`, `main.js`, `images/`, `fontawesome.ttf` | `atl.admin` |
| `aura-no-license-resources` | **`IsPluginLicensedCondition` invert=true** | `license-expired.js` | `atl.general` |
| `aura-tabs-resources` | (없음) | `tabs.js`, `tabs.css` | `atl.general` |

모든 web-resource는 `<dependency>com.atlassian.auiplugin:ajs</dependency>` 의존.

### 2.4 매크로 8개 등록

원본은 모두 **`name`과 `key`가 같음** (`aura-*`).

| name = key | class | 카테고리 | device-type | 파라미터 |
|------------|-------|---------|-------------|----------|
| `aura-divider` | `Divider` | formatting | mobile | `aura-license-expired` (string, 숨김) |
| `aura-button` | `Button` | formatting | mobile | `aura-license-expired` (string, 숨김) |
| `aura-panel` | `Panel` | formatting | mobile | (없음) |
| `aura-cards` | `cards.Cards` | formatting | mobile | (없음) |
| `aura-tab` | `Tab` | formatting | (없음) | `title` (string) |
| `aura-tab-collection` | `TabCollection` | formatting | (없음) | (없음) |
| `aura-background-image` | `BackgroundImage` | formatting | mobile | (없음) |
| `aura-pretty-title` | `PrettyTitle` | formatting | mobile | (없음) |

**중요**: `Composition.class`는 **xhtml-macro로 등록 안 됨**. 그러나 `main.js`와 `license-expired.js`에는 `aura-composition` 이름이 등장 — 내부적으로 다른 메커니즘(템플릿 picker 등)으로 사용되거나 deprecated 흔적.

**아이콘 path 규칙**: 모든 매크로 icon이 `/download/resources/com.appanvil.aura.aura/images/aura-{macro}.png` — 즉 plugin key 기반.

### 2.5 서블릿 4개

| URL 패턴 | 클래스 | 역할 |
|---------|--------|------|
| `/aura/macro-preview` | `MacroPreviewRenderer` | 편집기 미리보기 SVG 렌더링 (Cards/Button/Divider 분기) |
| `/aura/config` | `AdminConfig` | 색상 팔레트 설정 GET/POST JSON API |
| `/aura/admin` | `AdminUI` | 관리 페이지 HTML (Admin.vm + main.js iframe) |
| (없음) | `LicenseServlet` | 라이선스 상태 API (등록 안 된 듯, 클래스만 존재) |

`IconRenderer`도 `.class`로 존재하지만 atlassian-plugin.xml에 `<servlet>`으로는 등록 안 됨 → **Spring Bean으로 다른 클래스에 주입**(`MacroPreviewRenderer`, `Button`, `Panel`이 Autowire).

### 2.6 작업 + 메뉴

```xml
<job-config name="Aura Analytics Job" key="auraAnalyticsJob">
  <job key="auraAnalyticsJobRunner" perClusterJob="true" clusteredOnly="false"/>
  <schedule repeat-interval="86400000"/>  <!-- 24시간 -->
  <managed editable="false" keepingHistory="false" canRunAdhoc="true" canDisable="true"/>
</job-config>

<web-section key="aura-admin-section" location="system.admin" weight="290">
  <label key="aura.admin.section"/>
</web-section>

<web-item key="aura-admin-section-colors" section="system.admin/aura-admin-section">
  <label key="aura.admin.colors"/>
  <link linkId="aura-admin-link">/plugins/servlet/aura/admin</link>
</web-item>
```

---

## 3. OSGi 메타데이터 (MANIFEST.MF)

### 3.1 Bundle 식별

```
Bundle-SymbolicName: com.appanvil.aura
Bundle-Version: 3.8.0
Atlassian-Plugin-Key: com.appanvil.aura.aura
Spring-Context: *
```

### 3.2 Import-Package (정적 의존성)

전부 `com.atlassian.*` + 표준 javax/google/jsoup/joda/spring:

- `com.appanvil.aura.api;version="[3.7,4)"` (자기 자신 export)
- `com.atlassian.bandana`
- `com.atlassian.confluence.api.model.{,content,content.id,link}`
- `com.atlassian.confluence.api.service.{content,search}`
- `com.atlassian.confluence.content.render.{image,xhtml,xhtml.storage.macro}`
- `com.atlassian.confluence.macro`
- `com.atlassian.confluence.setup.{bandana,settings}`
- `com.atlassian.confluence.user`
- `com.atlassian.confluence.util{,velocity}`
- `com.atlassian.confluence.xhtml.api`
- `com.atlassian.fugue`
- `com.atlassian.plugin{,spring.scanner.annotation.{export,imports},webresource.condition}`
- `com.atlassian.sal.api{,auth,component,user}`
- `com.atlassian.scheduler`
- `com.atlassian.spring.container`
- **`com.atlassian.upm.api.license{,entity}`**
- `com.atlassian.upm.api.util`
- `com.atlassian.user`
- `com.google.gson{,reflect}`
- `javax.inject`, `javax.servlet{,http}`
- `org.joda.time`, `org.jsoup{,nodes,select}`
- `org.springframework.beans.factory.annotation`
- `org.springframework.core.io`, `org.springframework.stereotype`, `org.springframework.web.util`

### 3.3 DynamicImport-Package (UPM 라이선스 동적 로드)

```
com.atlassian.upm.api.license.entity;version="2.0.1"
com.atlassian.upm.api.license;version="2.0.1"
com.atlassian.upm.api.util;version="2.0.1"
com.atlassian.upm.license.storage.plugin;version="2.4.1"
```

### 3.4 Export-Package

```
com.appanvil.aura.api;version="3.7.6"
```

`MyPluginComponent` 인터페이스만 export — 다른 플러그인이 의존 가능하도록 (실용적 사용은 보이지 않음).

---

## 4. Spring DI 메타 (`META-INF/plugin-components/*`)

### 4.1 component (atlassian-spring-scanner가 발견한 Bean)

```
com.appanvil.aura.impl.MyPluginComponentImpl#myPluginComponent
com.appanvil.aura.jobs.analytics.AuraAnalyticsJobRunner
com.appanvil.aura.macros.cards.CardRenderer
com.appanvil.aura.servlets.IconRenderer#IconRenderer
com.appanvil.aura.utility.AuraLicense#AuraLicense
com.appanvil.aura.utility.ConfluenceLinkBuilder
com.appanvil.aura.utility.MD5ClassNameCreator#ClassNameCreator
```

매크로 클래스(Button, Panel, Cards 등)는 여기 없음 — Confluence가 매크로 인스턴스를 직접 인스턴스화할 때 생성자 매개변수를 Spring에서 주입한다.

### 4.2 exports (다른 플러그인에 노출)

```
com.appanvil.aura.impl.MyPluginComponentImpl#com.appanvil.aura.api.MyPluginComponent
com.appanvil.aura.servlets.IconRenderer#com.appanvil.aura.servlets.IconRenderer
com.appanvil.aura.utility.AuraLicense#com.appanvil.aura.utility.AuraLicense
com.appanvil.aura.utility.MD5ClassNameCreator#com.appanvil.aura.utility.ClassNameCreator
```

### 4.3 imports (Confluence/SAL/UPM에서 주입받음)

```
com.atlassian.confluence.api.service.content.ContentService
com.atlassian.confluence.api.service.search.CQLSearchService
com.atlassian.sal.api.ApplicationProperties
com.atlassian.sal.api.auth.LoginUriProvider
com.atlassian.sal.api.user.UserManager
com.atlassian.upm.api.license.PluginLicenseManager
```

### 4.4 imports-confluence

```
com.atlassian.bandana.BandanaManager
```

### 4.5 spring/plugin-context.xml

```xml
<beans ...>
  <atlassian-scanner:scan-indexes/>   <!-- spring-scanner가 자동 처리 -->
</beans>
```

---

## 5. Java 클래스 상세

### 5.1 매크로 클래스 (14개)

```
com/appanvil/aura/macros/
├── AbstractMultiOutputMacro            ← 추상 부모. execute() → executeWeb/PDF 분기
├── Button         (extends Abstract, implements EditorImagePlaceholder)
├── Panel          (extends Abstract, renderLegacyMacro + renderPanel 분기)
├── Divider        (extends Abstract)
├── BackgroundImage, BackgroundFill
├── PrettyTitle
├── Icon, HideElement
├── Composition    (implements Macro 직접 — Abstract 상속 안 함, xhtml-macro 등록도 안 됨)
├── Tab, TabCollection (TabCollection.Tab inner class)
└── cards/
    ├── Cards          (extends Abstract, implements EditorImagePlaceholder)
    ├── CardRenderer   (Spring Bean, 카드 단위 렌더링 책임)
    └── CardStyle
```

#### `AbstractMultiOutputMacro` 시그니처
```java
public abstract class AbstractMultiOutputMacro implements Macro {
    public String execute(Map<String,String>, String, ConversionContext);   // PDF/Web 분기
    public String executePDF(...);                                           // PDF 모드
    public String executeWeb(...);                                           // 일반 페이지
}
```

#### `Cards` 의존성
```java
class Cards extends AbstractMultiOutputMacro implements EditorImagePlaceholder {
    final ClassNameCreator classNameCreator;     // MD5 className 생성
    final CardRenderer cardRenderer;             // Spring Bean
    final SettingsManager settingsManager;       // baseUrl 조회 (placeholder URL 생성)

    public Cards(ClassNameCreator, CardRenderer);   // settingsManager는 ContainerManager로 조회
    String executeWeb(...) → CardCollection.vm 렌더링
    String executePDF(...) → 단순 <h5><p> 출력
    Macro.BodyType getBodyType() → NONE
    Macro.OutputType getOutputType() → BLOCK
    ImagePlaceholder getImagePlaceholder(...) → /aura/macro-preview?templateName=Cards&params={base64}
}
```

#### `Button` 의존성
```java
class Button extends AbstractMultiOutputMacro implements EditorImagePlaceholder {
    final ClassNameCreator classNameCreator;
    final IconRenderer iconRenderer;             // SVG 아이콘 렌더링
    final ConfluenceLinkBuilder linkBuilder;     // 링크 URL 변환
    final SettingsManager settingsManager;
}
```

#### `Panel` 의존성 (Cards/Button과 다른 점)
```java
class Panel extends AbstractMultiOutputMacro {  // EditorImagePlaceholder 구현 X
    // → 편집기 미리보기 placeholder를 별도로 제공하지 않고
    //   Confluence가 자체 placeholder를 생성하는 매크로
    private String renderLegacyMacro(...);       // 구버전 호환
    private String renderPanel(...);              // 신버전 (Panel2.vm 사용 추정)
}
```

### 5.2 라이선스 관련

```java
// SimpleUrlReadingCondition을 상속 → web-resource <condition>으로 사용 가능
public class IsPluginLicensedCondition extends SimpleUrlReadingCondition {
    private final PluginLicenseManager pluginLicenseManager;
    public IsPluginLicensedCondition(PluginLicenseManager);  // Spring 주입
    protected boolean isConditionTrue();   // 라이선스 유효 검사
    protected String queryKey();           // 캐시 키
}

public class AuraLicense {                 // 빈 헬퍼 클래스 (현재 메서드 없음)
    public AuraLicense();
}

public class LicenseServlet extends HttpServlet {
    private final PluginLicenseManager pluginLicenseManager;
    protected void doGet(...);             // 라이선스 상태 응답
}
```

**중요**: `IsPluginLicensedCondition`만 web-resource에서 참조됨. `LicenseServlet`은 atlassian-plugin.xml에 등록 안 됨 → 죽은 코드.

### 5.3 서블릿 (5개 .class, 등록 4개)

```
servlets/
├── AdminConfig          (+ ColorPaletteOption, Config inner classes)
│                          GET/POST /aura/config — 색상 팔레트 JSON 저장/조회 (Bandana)
├── AdminUI              GET /aura/admin — Admin.vm + main.js 로드한 HTML
├── MacroPreviewRenderer GET /aura/macro-preview — Cards/Button/Divider별 SVG/HTML 분기
│                          private renderButton/renderCards/renderDivider 메서드
├── IconRenderer         (Spring Bean, 서블릿 미등록)
│                          renderIconByName(name, color), renderIconByName(name, color, Dimension)
│                          init() — icondata.json 로드
└── LicenseServlet       (등록 안 됨 — 죽은 코드)
```

### 5.4 분석/통계 작업

```java
public class AuraAnalyticsJobRunner implements JobRunner {
    final PluginLicenseManager pluginLicenseManager;
    final CQLSearchService searchService;     // 매크로 사용 페이지 검색
    final PluginAccessor pluginAccessor;      // 플러그인 메타

    private void sendMetrics();                // 외부 분석 서버로 전송
    private AnalyticsTenant receiveAnalytics();
    public JobRunnerResponse runJob(JobRunnerRequest);
}

// 데이터 클래스
class AnalyticsMacroCount   // 매크로별 사용 횟수
class AnalyticsMeta         // 플러그인 메타 정보
class AnalyticsTenant       // Confluence 인스턴스 정보 (해시)
```

24시간마다 실행, 라이선스 상태 + 매크로 사용 통계를 외부로 전송. 우리 미러링 플러그인에선 이걸 비활성화하거나 제거해도 무방.

### 5.5 유틸리티

```java
interface ClassNameCreator {
    String createClassName(String macroName, Map<String,String> params);
}

class MD5ClassNameCreator implements ClassNameCreator {
    // macroName + params를 MD5 해싱 → "aura-xxxxx" 클래스명
    // 한 페이지에 여러 매크로 인스턴스 사용 시 CSS 충돌 방지
}

class ConfluenceLinkBuilder {
    private final ContentService contentService;        // Spring 주입
    private final SettingsManager settingsManager;
    private final Map<String, UnaryOperator<String>> TEMPLATES;            // 링크 타입별 변환
    private final Map<String, UnaryOperator<String>> ATTACHMENT_TEMPLATES; // 첨부파일 링크

    public String getUrl(String type, String value, boolean newWindow);
    public String getUrl(String type, String value);
    public String getAttachment(String contentId, String filename);
}
```

### 5.6 CSS 스타일 빌더 (`utility/aurastyles/`, 12 클래스)

매크로 파라미터(JSON 문자열)를 CSS 인라인 스타일로 변환하는 헬퍼.

```
aurastyles/
├── CssConvertable          (인터페이스 — toCss() 반환)
├── SvgStylesConvertable    (인터페이스 — SVG fill 스타일)
├── Alignment, Padding, Size, Text
├── BackgroundColor, Border, BorderRadius
├── BoxShadow (+ inner Shadow)
├── Icon
```

### 5.7 styleconverters (매크로별 파라미터 → 빌더 매핑)

```
macros/styleconverters/
├── PanelStyles            (+ inner: PanelBase, PanelBody, PanelHeader (+ Link), PanelHeadline)
├── DividerStyles
└── TabCollectionStyles    (+ inner: ContentSettings, GeneralSettings, TabSettings)
```

각 클래스는 매크로 파라미터를 받아 `aurastyles/*` 빌더로 CSS 문자열을 만들어 Velocity 템플릿에 전달.

---

## 6. main.js — React 편집 UI 번들 분석

### 6.1 기본 정보
- 위치: `client/static/js/main.js`
- 크기: 2,843,997 bytes (2.84MB) minified
- 라이선스 정보: `client/static/js/main.js.LICENSE` (별도 파일)

### 6.2 V4 호환성

**main.js는 V4를 인지하지 않는다.** 기존 레거시 V3 매크로 브라우저 API만 사용:
- `AJS.MacroBrowser.setMacroJsOverride(name, {opener: ...})` — 매크로별 커스텀 다이얼로그 등록
- `tinymce.confluence.macrobrowser.macroBrowserComplete({name, bodyHtml, params})` — 삽입 완료 시 호출
- `init.rte`, `page-edit-loaded` 이벤트 바인딩

V4 환경에서도 동작하는 이유: V4가 이 레거시 API를 **호환 셰임으로 진짜 매크로 삽입까지 처리**하기 때문 (단순 stub이 아님 — 실측 확인됨).

`"fabric"` 문자열은 코드 내 5번 등장하지만 모두 **Cards 매크로의 theme 값**이지 V4 fabric editor를 가리키는 게 아님:
```js
{label:"Background Color", value:"fabric"}
{theme:"fabric", hover:"shrink", decoration:"image"}
#if ($theme == "fabric")  // Velocity 분기
```

### 6.3 부트스트랩 패턴

main.js는 다음 두 이벤트에서 매크로 등록을 수행:
- `init.rte`
- `page-edit-loaded`

`bootstrapMacroEditor` 함수가 매크로 목록을 순회하며 각각 `setMacroJsOverride(n.name, {opener: ...})` 등록.

### 6.4 등록되는 매크로 이름 (하드코딩)

```js
name:"aura-background-image"
name:"aura-button"
name:"aura-cards"
name:"aura-composition"      ← atlassian-plugin.xml엔 없음
name:"aura-divider"
name:"aura-panel"
name:"aura-pretty-title"
name:"aura-tab"
name:"aura-tab-collection"
```

### 6.5 매크로 삽입 호출

```js
macroBrowserComplete({
    name: l.name,        // "aura-cards" 등
    bodyHtml: d,         // 편집기 placeholder용 HTML (preview)
    params: g            // 매크로 파라미터 객체
})
```

### 6.6 라이선스 체크

main.js 자체에 라이선스 체크 로직 **없음.** `license`라는 변수/함수도 없음. 라이선스 게이트는 전적으로 `atlassian-plugin.xml`의 web-resource `<condition>`으로 구현 — main.js는 라이선스 유효할 때만 로드되고, 무효일 땐 `license-expired.js`가 대신 로드됨.

### 6.7 호출하는 백엔드 엔드포인트

main.js 안에서 직접 fetch/AJAX로 호출하는 URL:
- `/plugins/servlet/aura/config` (단 1개 명시적 endpoint)

`/aura/macro-preview`, `/aura/admin` 등은 **main.js가 직접 호출하지 않음** — 매크로 인스턴스의 `EditorImagePlaceholder.getImagePlaceholder()` Java 메서드가 반환한 URL을 Confluence가 iframe src로 사용하는 방식.

### 6.8 macroBrowserComplete의 bodyHtml

`bodyHtml`이 매크로 편집 후 본문에 들어가는 placeholder HTML이다. 페이지 저장 시 storage format(`<ac:structured-macro>`)으로 변환되고, 페이지 뷰 시 다시 Java 매크로 클래스의 `executeWeb()`이 실행되어 최종 HTML로 렌더링됨. 즉 편집기에서 보이는 모습 ≠ 페이지 뷰 모습.

---

## 7. js/license-expired.js

### 7.1 동작
라이선스가 무효일 때만 로드되어, 위 매크로 9개에 대해 임시 다이얼로그를 띄움:

```js
var allMacros = [
  "aura-button", "aura-panel", "aura-background-image", "aura-cards",
  "aura-pretty-title", "aura-divider", "aura-tab-collection", "aura-tab",
  "aura-composition"
];

// 각 매크로에 대해 setMacroJsOverride 등록
// opener에서 다이얼로그(license-expired-dialog)만 표시
// 매크로 삽입 자체를 차단

var dialogTemplate = `
  <section id="license-expired-dialog" class="aui-dialog2 ...">
    <h2>Aura License Expired</h2>
    ...
  </section>
`;
```

### 7.2 우회법
**`aura-no-license-resources` web-resource를 atlassian-plugin.xml에서 제거하면 이 JS가 절대 로드되지 않는다.** → 만료 다이얼로그 안 뜸.

---

## 8. js/tabs.js (탭 매크로 클라이언트)

라이선스와 무관하게 **항상 로드**(조건 없는 `aura-tabs-resources`).

```js
// DOMContentLoaded에서 실행
cleanTabContent()    // data-aura-tab-id 없는 직계 자식 제거
showFirstTabs()      // 첫 탭만 보이게 [hidden] 토글
fixInnerTabStyles()  // 중첩 탭의 &gt; 엔티티를 > 로 복원
```

탭 클릭 → `aria-selected` 토글 + `data-aura-tab-active` 토글
키보드 좌우 화살표 → 탭 포커스 이동

---

## 9. Velocity 템플릿 11종

### 9.1 templates/ (페이지 뷰 모드 — 실 렌더링)

| 템플릿 | 사용처 | 비고 |
|--------|--------|------|
| `Button.vm` | `Button.executeWeb()` | size 배율(1/1.35/1.7), outlined 모드 분기, hover 토글 |
| `Panel.vm` | `Panel.executeWeb()` (renderLegacyMacro) | 구버전 |
| `Panel2.vm` | `Panel.executeWeb()` (renderPanel) | 신버전 — headline + link + linkColor |
| `Card.vm` | `CardRenderer.htmlFromCard()` | 카드 1장 렌더링 |
| `CardCollection.vm` | `Cards.executeWeb()` | 외부 컨테이너 + Card.vm 결과 합침. CSS Grid `auto-fit minmax(...)` |
| `Divider.vm` | `Divider.executeWeb()` | 좌우 라인 + 가운데 텍스트/아이콘 |
| `Icon.vm` | `IconRenderer.renderIconByName()` | FontAwesome SVG path 데이터 직접 렌더 |
| `TabCollection.vm` | `TabCollection.executeWeb()` | 탭 nav + content 영역 |
| `Admin.vm` | `AdminUI.doGet()` | 관리 페이지 부트스트랩 HTML |
| `icondata.json` | `IconRenderer.init()` | 1.1MB FontAwesome 메타 (path 데이터) |

### 9.2 previews/ (편집기 미리보기 — SVG 벡터 모양)

| 템플릿 | 사용처 |
|--------|--------|
| `Button.vm` | `MacroPreviewRenderer.renderButton()` |
| `Cards.vm` | `MacroPreviewRenderer.renderCards()` |
| `Divider.vm` | `MacroPreviewRenderer.renderDivider()` |

→ Cards/Button/Divider 매크로는 `EditorImagePlaceholder`로 이 미리보기 URL을 반환. 편집기에선 SVG, 뷰어에선 실제 HTML 두 단계 분리.

### 9.3 핵심 Velocity 변수

`CardCollection.vm` 시작부:
```velocity
#if(!$maxWidth) #set($maxWidth = "1200px") #end
#if(!$decoration) #set($decoration = "icon") #end

<style>
.${className}.aura-cards-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc($maxWidth / $columns), 1fr));
  max-width: $maxWidth;
}
@media (max-width: 600px) {
  .${className}.aura-cards-wrapper { grid-template-columns: 1fr; }
}
```

`$className` = MD5ClassNameCreator로 매크로 인스턴스마다 고유. 같은 페이지 내 다중 매크로 CSS 충돌 방지.

---

## 10. 정적 자원

### 10.1 CSS

| 파일 | 크기 | 내용 |
|------|------|------|
| `client/static/css/main.css` | 51 bytes | `#macro-aura-background-fill{display:none!important}` (한 줄) |
| `css/tabs.css` | 659 bytes | 탭 활성/비활성 토글 + 스크롤바 숨김 |
| `webfonts/webfonts.css` | (FontAwesome 5) | `.fa, .fas, .far, .fal, .fad, .fab` 사이즈 변형 |

**핵심**: 페이지 뷰의 매크로 스타일은 **CSS 파일이 아니라 Velocity 템플릿이 인라인 `<style>` 블록으로 출력**한다. 외부 CSS 파일은 거의 비어있음.

### 10.2 이미지 (`images/`)

15개 PNG: 매크로별 아이콘 8개 (`aura-button.png`, `aura-cards.png`, ...) + 플러그인/벤더 로고 7개.

### 10.3 webfonts (FontAwesome 5 Free)

3 패밀리 × 5 포맷 = 15 파일 + `webfonts.css`:
- brands, regular, solid × eot/svg/ttf/woff/woff2

`fa-solid-900.woff`만 `aura-resources` web-resource에 명시되어 `allow-public-use=true`. 나머지는 webfonts.css가 참조하는 형태로 간접 로드.

### 10.4 composition/ (Composition 매크로 자산)

- `images/`: city1.jpg, landscape1.jpg, phone.png, pinkcyan.svg, plant1.jpg
- `thumbnails/`: 10개 프리셋 썸네일 (dosdonts, duotone, epicguides, helpcenter, latestnews, onboarding, plant, productlaunch, trendingepisodes, tripplecards)

`Composition.class`는 있지만 atlassian-plugin.xml에 등록 안 된 흔적 — main.js의 React UI에서 "템플릿 picker" 형태로 사용 추정.

---

## 11. i18n (`aura.properties`)

### 11.1 매크로 라벨/설명 (Confluence 매크로 브라우저 표시용)

키 형식: `{plugin-key}.{macro-key}.{label|desc}`
즉 `com.appanvil.aura.aura.aura-cards.label = Aura - Cards`

| 키 | 값 |
|-----|-----|
| `aura-button.label/desc` | Aura - Button / Embed a customizable button... |
| `aura-cards.label/desc` | Aura - Cards / Embed cards that link to other content... |
| `aura-panel.label/desc` | Aura - Panel / ... |
| `aura-background-fill` | Aura - Background Color (실제 매크로 등록은 `aura-background-image`로 통합됨) |
| `aura-background-image` | Aura - Background Content |
| `aura-pretty-title` | Aura - Title |
| `aura-divider` | Aura - Divider |
| `aura-tab-collection` | Aura - Tab Group |
| `aura-tab` | Aura - Tab |
| `aura-composition` | Aura - Composition (등록 안 된 매크로) |

### 11.2 관리 페이지 라벨
```
aura.admin.colors=Aura Colors
aura.admin.section=Aura Configuration
```

### 11.3 라이선스 표시 문자열
`plugin.license.storage.admin.license.*` 50+개 — UPM 라이선스 관리 페이지에서 사용.

---

## 12. 라이선스 흐름 — 끄는 방법

### 12.1 정상 흐름

```
사용자 브라우저 페이지 로드
        ↓
Confluence가 atl.general 컨텍스트의 web-resource 목록 평가
        ↓
각 web-resource의 <condition> 실행
        ↓
IsPluginLicensedCondition.isConditionTrue() → PluginLicenseManager 조회
        ↓
유효하면 → aura-resources-with-license 로드 (main.js 활성화)
무효면 → aura-no-license-resources 로드 (license-expired.js → 다이얼로그)
        ↓ (양쪽 모두 공통)
aura-resources 로드 (CSS, webfonts) — 조건 없음
aura-tabs-resources 로드 — 조건 없음
```

### 12.2 우회 — 우리 plugin에서 적용한 방법

`atlassian-plugin.xml`에서 다음 조치:
1. `aura-resources-with-license`의 `<condition>` 제거 → main.js 항상 로드
2. `aura-admin-resources`의 `<condition>` 제거 → 관리 페이지 항상 동작
3. `aura-no-license-resources` web-resource **통째로 제거** → license-expired.js 절대 로드 안 됨
4. `<param name="atlassian-licensing-enabled">false</param>` 설정 → UPM이 라이선스 관리 페이지 안 띄움
5. 매크로의 `<parameter type="string" name="aura-license-expired"/>` 숨김 파라미터도 제거 (선택)

**결론**: `IsPluginLicensedCondition` 클래스는 안 지워도 되며, 그저 참조만 끊으면 됨.

---

## 13. 우리 미러링 플러그인 정합성 체크리스트

### 13.1 식별자 매핑 (필수)

| 항목 | Aura 원본 | 우리 plugin 적정값 |
|------|----------|------------------|
| Plugin Key | `com.appanvil.aura.aura` | `com.uiux.confluence-macro` (충돌 회피) |
| Bundle SymbolicName | `com.appanvil.aura` | `com.uiux.confluence-macro` |
| 매크로 name | `aura-*` | **`aura-*` 그대로** (main.js 매칭) |
| 매크로 key | `aura-*` | **`aura-*` 그대로** (i18n 매칭) |
| 매크로 class | `com.appanvil.aura.macros.*` | `com.uiux.macro.macros.*` (재컴파일) |
| 서블릿 URL | `/aura/macro-preview`, `/aura/config`, `/aura/admin` | **그대로** (main.js 호출 대상) |
| 아이콘 path | `/download/resources/com.appanvil.aura.aura/images/aura-{macro}.png` | `/download/resources/com.uiux.confluence-macro/images/aura-{macro}.png` (plugin key만 우리 것) |
| i18n location | `aura` | `uiux-macro` (i18n 키 prefix는 `com.uiux.confluence-macro.aura-{macro}.{label,desc}`) |

### 13.2 web-resource 매핑

| 원본 key | 변경 |
|----------|------|
| `aura-resources` | 그대로 또는 우리 prefix. CSS + webfonts 항상 로드 |
| `aura-resources-with-license` | **`<condition>` 제거**. main.js 무조건 로드 |
| `aura-admin-resources` | **`<condition>` 제거**. 관리 페이지 무조건 동작 |
| `aura-no-license-resources` | **통째로 제거** |
| `aura-tabs-resources` | 그대로 |

### 13.3 누락 시 동작 안 하는 핵심 파일

**main.js가 의존하는 것** (없으면 매크로 패널 자체가 안 뜸):
- `client/static/js/main.js` (원본 그대로 — 패치 금지)
- `aura.properties` 또는 동등한 i18n 파일에 `*.aura-{macro}.label/desc`

**Java 매크로 클래스가 의존하는 것** (없으면 페이지 렌더링 깨짐):
- Velocity 템플릿 (`templates/*.vm`, `previews/*.vm`)
- `templates/icondata.json` (IconRenderer 초기화)
- 모든 `aurastyles/*` + `styleconverters/*` 클래스
- `MD5ClassNameCreator`, `ConfluenceLinkBuilder`, `IconRenderer`, `CardRenderer`
- `AbstractMultiOutputMacro`

**Spring DI 메타** (atlas-package가 빌드 시 자동 생성):
- `META-INF/plugin-components/{component, exports, imports, imports-confluence}` — 이 파일들이 누락되면 Spring이 Bean을 못 찾아 OSGi 활성화 실패

### 13.4 OSGi Import-Package 필수 항목

우리 plugin의 `pom.xml`에 다음이 빠지면 활성화 실패:
- `com.atlassian.upm.api.license.*` (조건 클래스 사용 시)
- `com.atlassian.confluence.content.render.image` (`ImagePlaceholder` 사용 시)
- `com.atlassian.confluence.content.render.xhtml.storage.macro`
- `com.google.gson{,reflect}`
- `org.jsoup{,nodes,select}`

`<Import-Package>!java.*,*</Import-Package>` 명시 (CLAUDE.md 빌드 가이드 참고)로 java.* import 충돌 방지.

### 13.5 매크로 미리보기 URL 차이

Aura의 Cards/Button/Divider는 `EditorImagePlaceholder.getImagePlaceholder()`로 다음을 반환:
```java
String src = String.format("%s/plugins/servlet/aura/macro-preview?templateName=Cards&params=%s", baseUrl, base64);
```

우리 plugin도 **`/aura/macro-preview` URL을 그대로 유지**해야 함 (main.js와의 정합성 + 서블릿 URL 일치).

### 13.6 빌드 시 주의

- `<version>` 빌드마다 증가 (Confluence 캐시 우회용)
- `atlas-package -P server`만 빌드하면 server JAR — DC 환경엔 `-P dc` 별도
- `target/wonikips-confluence-macro-X.Y.Z-SNAPSHOT-server.jar` (또는 `-dc.jar`) suffix 필수
- `-Dmaven.test.skip=true` (스켈레톤 테스트 코드 컴파일 회피용)

---

## 14. 우리 plugin 디버깅 시 비교 절차

1. **빌드된 JAR 추출**:
   ```bash
   unzip -d /tmp/our_plugin target/wonikips-confluence-macro-X-server.jar
   ```

2. **atlassian-plugin.xml 디핑**:
   ```bash
   diff /tmp/aura_analysis/atlassian-plugin.xml /tmp/our_plugin/atlassian-plugin.xml
   ```

3. **MANIFEST.MF Import-Package 디핑**:
   ```bash
   diff <(grep -A100 Import-Package /tmp/aura_analysis/META-INF/MANIFEST.MF) \
        <(grep -A100 Import-Package /tmp/our_plugin/META-INF/MANIFEST.MF)
   ```

4. **Spring 컴포넌트 비교**:
   ```bash
   diff /tmp/aura_analysis/META-INF/plugin-components/component \
        /tmp/our_plugin/META-INF/plugin-components/component
   ```

5. **클래스 누락 여부**:
   ```bash
   diff <(find /tmp/aura_analysis/com -name '*.class' | sed 's|/tmp/aura_analysis/||;s|com/appanvil/aura/||') \
        <(find /tmp/our_plugin/com -name '*.class' | sed 's|/tmp/our_plugin/||;s|com/uiux/macro/||')
   ```

6. **main.js 동일성**:
   ```bash
   diff /tmp/aura_analysis/client/static/js/main.js \
        /tmp/our_plugin/client/static/js/main.js
   ```
   → 0 라인이어야 함. 다르면 우리 main.js 패치된 상태 → 원본으로 복원 필요.

7. **Velocity 템플릿 동일성**:
   ```bash
   for f in templates/*.vm previews/*.vm; do
     diff "/tmp/aura_analysis/$f" "/tmp/our_plugin/$f" && echo "$f: OK" || echo "$f: DIFF"
   done
   ```

---

## 15. 결론 — 우리 plugin이 V4에서 매크로 삽입 실패할 때 의심 순서

우선순위 높은 것부터:

1. **main.js가 원본과 다름** → 디핑으로 즉시 발견 가능
2. **매크로 `name` 또는 `key`가 `aura-*`가 아님** → main.js 등록 매칭 실패
3. **서블릿 URL이 `/aura/*`가 아님** → main.js의 `/aura/config` 호출 실패 (관리 콘솔 일부 기능)
4. **Spring 컴포넌트 누락** → OSGi 활성화 자체 실패 (앱 관리 페이지에서 빨간 경고)
5. **OSGi Import-Package 누락** → 동일
6. **`atlassian-licensing-enabled=false` 누락** → UPM이 라이선스 페이지를 띄움 (사용엔 무관)
7. **Velocity 템플릿 누락/오타** → 페이지 렌더 시 빈 출력 (편집기 삽입은 OK)

→ 매크로 **편집 패널은 뜨지만 Insert 시 본문에 안 들어가는** 현 상황은 **1~3번 후보가 가장 유력**. 위 §14의 디핑 절차로 한 번에 확정 가능.

---

## 16. 검증 결과 (2026-04-28)

§14의 디핑 절차를 1.0.11-SNAPSHOT 빌드에 적용한 결과 **§15 의심 항목보다 더 결정적인 누락**이 발견됨:

### 16.1 누락 (CRITICAL)
- `previews/Button.vm`, `previews/Cards.vm`, `previews/Divider.vm` ← 매크로 삽입 실패 직접 원인
- `webfonts/` 16 파일 + `webfonts.css`
- `composition/` 자산 15개

### 16.2 누락 (영향 적음)
- `IsPluginLicensedCondition.class` (web-resource 참조 제거했으니 불필요)
- `AuraLicense.class`, `LicenseServlet.class` (죽은 코드)
- `Composition.class`, `HideElement.class` (xhtml-macro 등록 안 된 매크로)
- `jobs/analytics/*` 4개 (분석 작업 비활성화)

### 16.3 web-resource 정의 차이
- `aura-resources` web-resource에서 `webfonts.css`와 `fa-solid-900.woff` 누락 → 추가
- `aura-no-license-resources` 통째로 제거 (의도적)
- `IconRenderer`를 우리는 `<servlet>` 등록(`/aura/icons`) — 원본은 Spring Bean으로만 사용. 현 시점 등록 자체는 문제 없음.

### 16.4 우리만 있는 잡음 (제거 권장)
- `client/static/js/main.js.bak` (백업 파일)
- `js/cards-editor.{js,css}`, `js/page-title-editor.{js,css}`, `js/wonikips-confluence-macro.{js,css}` (이전 시도 잔재)
- `templates/page-title.vm`
- `images/pluginIcon.png`, `images/pluginLogo.png`

### 16.5 적용한 패치 (1.0.12-SNAPSHOT)
1. `aura-3.8.0.jar` → `previews/`, `webfonts/`, `composition/` 디렉토리 그대로 복사
2. `atlassian-plugin.xml`의 `aura-resources` web-resource에 webfonts 리소스 명시
3. 빌드 → 업로드 → **Cards 매크로 삽입 정상 동작 확인**

### 16.6 결론
§15의 의심 우선순위는 다음과 같이 재정렬해야 함:

1. **`previews/*.vm` 누락** ← 최우선 (가장 흔하면서 가장 안 보이는 누락)
2. main.js가 원본과 다름
3. 매크로 `name`/`key` 불일치
4. 서블릿 URL 불일치
5. Spring 컴포넌트 누락
6. OSGi Import-Package 누락
7. `webfonts/` 누락 (아이콘만 깨짐, 삽입 영향 없음)
8. Velocity 템플릿 누락/오타

---

## 17. main.js UI 라벨 안전 패치 패턴 (검증 완료)

### 17.1 배경

§6 분석에서 "main.js는 절대 패치 금지"가 기본 규칙이었으나, **사용자 노출 UI 라벨**(예: `"Aura Cards"`, `"Aura Card"`)에 한해 1회 등장 검증 후 바이트-레벨 치환이 안전함을 1.0.13/1.0.14 빌드에서 실증.

### 17.2 절대 금지 (정합성 깨짐)

다음은 main.js와 atlassian-plugin.xml/Velocity/Java 간 정합성을 유지해야 하므로 **절대 패치 금지**:

| 카테고리 | 예시 | 근거 |
|----------|------|------|
| 매크로 식별자 | `"aura-cards"`, `"aura-button"` | atlassian-plugin.xml의 macro `name`/`key`와 매칭 |
| 서블릿 URL | `/plugins/servlet/aura/config` | atlassian-plugin.xml `<servlet>` URL과 매칭 |
| CSS 클래스 prefix | `"aura-card"`, `"aura-panel-wrapper"`, `"aura-tab-item"` | Velocity 템플릿 + tabs.css와 매칭 |
| Cards theme 값 | `theme: "aura"`, `theme: "aura-accent"` | CardCollection.vm의 `#if($theme == "aura")` 분기와 매칭 |
| Minified 변수명 | `AuraC...` (예: `AuraComponent`) | 번들 내부 참조 |

### 17.3 안전 패치 후보 (UI 라벨)

매크로 편집 패널 / 매크로 브라우저 / 관리 페이지에 **사용자가 시각적으로 보는** 텍스트:

```
"Aura Cards"            ← 1.0.13 ✓ 패치 완료
"Aura Card"             ← 1.0.14 ✓ 패치 완료 (카드 default title)
"Aura Button"
"Aura Panel"
"Aura Panel Title"
"Aura Tab"
"Aura Tab Group"
"Aura Title"
"Aura Divider"
"Aura Background Content"
"Aura Composition"
```

식별 규칙: **공백을 포함한 큰따옴표 문자열** (`"Aura X"` 또는 `"Aura X Y"`) — 식별자/URL/CSS 클래스에는 공백이 안 들어가므로 자연스러운 분리.

### 17.4 안전 패치 절차

> **중요 (1.1.3 회귀 사례)**: Confluence가 런타임에 로드하는 건 `main.js`가 아니라 **`main-min.js`** 다. src에는 `main.js`만 있고 `main-min.js`는 `target/classes/client/static/js/`에 stale 상태로 남아있다(빌드가 재생성하지 않음 — minifier 플러그인 없음). 따라서 **두 파일 모두 패치해야** 라벨 변경이 반영된다. main.js만 패치하면 빌드는 성공하고 JAR도 새 버전으로 뜨지만 화면은 그대로다.

```bash
# 1. 등장 횟수 검증 (반드시 1회여야 함, 2회 이상이면 컨텍스트 분리 필요)
grep -c '"Aura Cards"' src/main/resources/client/static/js/main.js

# 2-a. main-min.js를 src로 복사 (없으면)
SRC=macros/wonikips-confluence-macro/src/main/resources/client/static/js
TGT=macros/wonikips-confluence-macro/target/classes/client/static/js
[ -f "$SRC/main-min.js" ] || cp "$TGT/main-min.js" "$SRC/main-min.js"
[ -f "$SRC/main-min.js.map" ] || cp "$TGT/main-min.js.map" "$SRC/main-min.js.map"

# 2-b. Python 바이트-레벨 치환 — main.js와 main-min.js 둘 다 (sed 금지 — minified는 한 줄이라 sed가 깨질 수 있음)
cd "$SRC" && python -c "
for fname in ['main.js', 'main-min.js']:
    src = open(fname, 'rb').read()
    target = b'\"Aura Cards\"'
    replacement = b'\"WonikIPS Cards\"'
    count = src.count(target)
    assert count == 1, f'{fname}: expected 1 occurrence, got {count}'
    out = src.replace(target, replacement, 1)
    assert out.count(target) == 0
    assert out.count(replacement) == 1
    open(fname, 'wb').write(out)
    print(f'{fname} OK — size delta: {len(out)-len(src)} bytes')
"

# 3. 결과 검증 (둘 다 0/1 이어야 함)
grep -c '"WonikIPS Cards"' main.js main-min.js
grep -c '"Aura Cards"' main.js main-min.js

# 4. pom 버전 bump → atlas-package -P server -Dmaven.test.skip=true → 업로드

# 5. JAR 검증 (반드시 두 파일 모두 패치 확인)
JAR=target/wonikips-confluence-macro-X.Y.Z-SNAPSHOT-server.jar
unzip -p "$JAR" client/static/js/main.js     | grep -c "WonikIPS Cards"   # → 1
unzip -p "$JAR" client/static/js/main-min.js | grep -c "WonikIPS Cards"   # → 1
unzip -p "$JAR" client/static/js/main.js     | grep -c "Aura Cards"       # → 0
unzip -p "$JAR" client/static/js/main-min.js | grep -c "Aura Cards"       # → 0
```

### 17.5 검증 체크리스트 (패치 후 회귀 방지)

빌드된 JAR을 직전 안정 버전과 디핑:

```bash
# 변경 파일이 다음으로 한정되어야 함:
# - client/static/js/main.js (의도된 라벨 변경)
# - client/static/js/main-min.js (의도된 라벨 변경 — 자동 생성 아님, 직접 패치 필요)
# - atlassian-plugin.xml (버전 bump만)
# - META-INF/MANIFEST.MF (버전 bump만)
# - META-INF/maven/.../pom.xml + pom.properties (버전 bump만)

for f in $(find /tmp/new_jar -type f); do
  rel=${f#/tmp/new_jar/}
  cmp -s "/tmp/prev_jar/$rel" "$f" || echo "DIFF: $rel"
done
```

업로드 후 시각 검증:
1. 페이지 편집 → 매크로 삽입 → 패치된 라벨 표시 확인
2. **회귀 검증**: 매크로 삽입 → 본문 진입 → 페이지 저장 → 렌더링 모두 정상

브라우저 main.js 캐시는 고집스럽다 — 패치 안 보이면 `Ctrl+Shift+R` 하드 리프레시 또는 `docker-compose restart confluence` 후 재테스트.

### 17.6 롤백

```bash
# .bak가 원본 main.js 보관 중
cp src/main/resources/client/static/js/main.js.bak src/main/resources/client/static/js/main.js
# main-min.js는 .bak이 없으면 target/classes에서 다시 복사하거나, 원본 aura-3.8.0.jar에서 추출
```

### 17.7 회귀 사례

| 빌드 | 패치 대상 | 결과 |
|------|----------|------|
| 1.0.13 | `"Aura Cards"` → `"WonikIPS Cards"` | 매크로 브라우저 라벨 패치 — 화면 반영 ✓ (당시 main-min.js도 함께 패치된 상태였던 것으로 추정) |
| 1.0.14 | `"Aura Card"` → `"WonikIPS Card"` | 카드 default title 패치 — 화면 반영 ✓ |
| 1.1.2 | `"Aura Title"` → `"Wonik Title"` (main.js만) | **화면 미반영** — Confluence가 main-min.js를 로드하는데 그건 stale 상태 그대로 |
| 1.1.3 | `"Aura Title"` → `"Wonik Title"` (main.js + main-min.js) | 편집 모드 chrome 라벨 패치 — 화면 반영 ✓ |
| 1.1.6 | `\"Aura Panel\"` → `\"Wonik Panel\"` (main.js + main-min.js) | V4 chrome 라벨 패치 — 화면 반영 ✓. byte 패턴은 escape된 `\"Aura Panel\"`로 박혀있음(`:before { content: ... }` CSS-in-string). |
| 1.1.7 | `'Aura Panel Title'` → `'Wonik Panel Title'` (TS) | main.js 미등장. 우리 schema/PanelEditor의 default headline text 두 곳만 수정. main.js 라벨 패치 절차 무관 — 일반 React 빌드 변경. |

**교훈**: src에 `main-min.js`가 없으면 빌드는 성공하고 JAR에도 minified 버전이 들어가지만, 그건 `target/classes`의 stale 파일이다. 라벨 패치 작업은 반드시 src에 `main-min.js`를 두고 양쪽 파일을 같이 byte-level 치환해야 한다. JAR 검증 시 `unzip -p ... main-min.js | grep`로 패치 반영 확인 필수.
