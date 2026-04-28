# UI 디자인 가이드 — 매크로 편집 UI

## 디자인 원칙

1. **Confluence에 녹아들 것** — 독자적인 디자인이 아니라 Atlassian Design System에 맞춘 UI
2. **편집기는 도구다** — 화려함보다 즉각적인 피드백과 조작 편의성 우선
3. **Aura를 참조하되 단순화** — 슬라이더, 정렬 버튼, 컬러 스와치 구조는 유지. 불필요한 옵션 제거

## 편집 UI 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 매크로 이름                    Tutorial  Feedback    │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│  Font Weight     │                                  │
│  [Bold      ▼]   │         미리보기 영역             │
│                  │                                  │
│  Text Alignment  │         Demo Title               │
│  [≡] [≡] [≡]    │                                  │
│                  │                                  │
│  Font Size       │                                  │
│  [48] ────────   │                                  │
│                  │                                  │
│  Color           │                                  │
│  [Default   ▼]   │                                  │
│  ⬤ ⬤ ⬤ ⬤       │                                  │
│                  │                                  │
│  Advanced        │                                  │
│  HTML Tag        │                                  │
│  [Headline 1 ▼]  │                                  │
│                  │                                  │
├──────────────────┴──────────────────────────────────┤
│                              [Close]    [Save]       │
└─────────────────────────────────────────────────────┘
```

## 색상 (Atlassian Design System 기준)

| 용도 | 값 |
|---|---|
| Primary Button | `#0052CC` |
| Primary Button Hover | `#0747A6` |
| 텍스트 기본 | `#172B4D` |
| 텍스트 보조 | `#6B778C` |
| 배경 | `#FFFFFF` |
| 구분선 | `#DFE1E6` |
| 입력 필드 테두리 | `#DFE1E6` |
| 입력 필드 테두리 (포커스) | `#0052CC` |

## 컴포넌트

### 드롭다운
```css
border: 1px solid #DFE1E6;
border-radius: 3px;
padding: 6px 8px;
font-size: 14px;
color: #172B4D;
```

### 정렬 버튼 (3종)
```css
/* 기본 */
border: 1px solid #DFE1E6;
border-radius: 3px;
width: 32px; height: 32px;

/* 선택됨 */
background: #0052CC;
border-color: #0052CC;
color: white;
```

### 슬라이더 (Font Size)
```css
/* 숫자 입력 + range 슬라이더 조합 */
input[type="number"]: width 48px, border 1px solid #DFE1E6
input[type="range"]: accent-color #0052CC
```

### 컬러 피커
네이티브 `<input type="color">` + HEX 텍스트 입력 조합.  
스와치 방식 대신 자유 색상 선택 방식으로 확정.
```css
/* 컬러 피커 */
input[type="color"]: width 40px, height 36px, border 2px solid #DFE1E6
/* HEX 텍스트 입력 */
font-family: monospace; text-transform: uppercase;
/* 두 컨트롤은 양방향 동기화 — 한쪽 변경 시 나머지 자동 반영 */
```

### Save 버튼
```css
background: #0052CC;
color: white;
border-radius: 3px;
padding: 6px 12px;
font-weight: 500;
```

## 미리보기 영역

- 체커보드 패턴 배경 (투명도 확인용, CSS linear-gradient 4중 조합)
- 실시간 반영 — 파라미터 변경 즉시 미리보기 업데이트 (debounce 없음)
- 미리보기 텍스트 소스: DOM `.page-title` → `document.title` → "Demo Title" 순 fallback
- 흰색 카드 박스 위에 텍스트 렌더링 (box-shadow 포함)
- 높이: 다이얼로그 전체 520px 중 패널 전체 사용

## 구현 파일 위치

| 파일 | 경로 |
|------|------|
| 편집 UI JS | `macros/wonikips-confluence-macro/src/main/resources/js/page-title-editor.js` |
| 편집 UI CSS | `macros/wonikips-confluence-macro/src/main/resources/css/page-title-editor.css` |
| 렌더링 템플릿 | `macros/wonikips-confluence-macro/src/main/resources/templates/page-title.vm` |
| Java 매크로 | `macros/wonikips-confluence-macro/src/main/java/com/ohjih/macro/PageTitleMacro.java` |

## 타이포그래피

| 용도 | 스타일 |
|---|---|
| 라벨 | `font-size: 12px; font-weight: 600; color: #6B778C` |
| 입력값 | `font-size: 14px; color: #172B4D` |
| 섹션 제목 (Advanced) | `font-size: 14px; font-weight: 600; color: #172B4D` |
