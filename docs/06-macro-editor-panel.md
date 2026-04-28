# 매크로 편집 패널 구조

## 개요

Confluence 편집기에서 Aura 매크로를 클릭하면 나타나는 파라미터 설정 UI.

## 렌더링 구조

```
Confluence 편집기
    └── [매크로 클릭 시]
        └── iframe (Confluence가 띄우는 팝업/패널)
                └── React 앱 (client/static/js/main.js ~2.8MB)
                        └── CSS는 번들 안에 인라인으로 포함
```

## 구성 요소별 역할

| 레이어 | 역할 | 담당 |
|--------|------|------|
| 패널 **컨테이너** (크기, 위치, 테두리) | Confluence 자체 UI | Confluence CSS |
| 패널 **내용물** (입력 필드, 버튼, 프리뷰) | Aura React 앱 | `main.js` 번들 내 CSS-in-JS |
| 파라미터 → 매크로 전달 | `AP.require('confluence/macro/js-override')` | JavaScript |

## 이름(레이블) 변경 방법

편집 패널 내 텍스트는 두 군데서 관리됨:

1. **`aura.properties`** — i18n 문자열 (레이블, 플레이스홀더, 툴팁 등)
2. **`client/static/js/main.js`** — minified React 번들 (하드코딩된 문자열 포함)

### aura.properties 수정 (권장)
- i18n 키로 관리되는 텍스트는 `aura.properties`에서 직접 변경 가능
- JAR 재빌드 후 Confluence에 재업로드 필요

### main.js 수정 (비권장)
- minified 번들이라 직접 수정 어려움
- 원본 React 소스 트리가 있어야 정상적으로 수정 가능
- `mine/` 디렉토리에는 소스 없음 — 재빌드 불가

## 파라미터 전달 흐름

```
사용자 입력 (React UI)
    ↓
AP.require('confluence/macro/js-override') 또는 macroBrowserComplete 콜백
    ↓
Confluence 편집기 → 매크로 파라미터 저장
    ↓
페이지 저장 시 Java Macro.execute() 호출 → Velocity 템플릿 렌더링
```

## 관련 파일

| 파일 | 역할 |
|------|------|
| `client/static/js/main.js` | React 편집 UI 번들 (minified) |
| `aura.properties` | i18n 레이블 문자열 |
| `atlassian-plugin.xml` | 매크로 등록 및 editor context web-resource 연결 |
| `js/tabs.js` | 페이지 뷰 Tab 인터랙션 (편집 패널과 무관) |

## 주의사항

- 패널 **컨테이너** 크기/위치는 Confluence CSS가 제어 — Aura에서 변경 불가
- `main.js`는 ~2.8MB minified 번들 — 텍스트 치환 가능하나 인코딩/난독화 주의
- 원본 React 소스 없이 UI 구조 변경은 사실상 불가
