# custom-page-title 사용자 매크로

## 등록 정보

| 항목 | 값 |
|---|---|
| 매크로 이름 | `custom-page-title` |
| 설명 | 현재 페이지 제목을 커스텀 스타일로 표시 (Aura Title 스타일) |
| 카테고리 | Formatting |
| 매크로 본문 | 없음 |

## 파라미터

| 파라미터 | 타입 | 기본값 | 옵션 |
|---|---|---|---|
| FontWeight | enum | `Bold` | `Normal`, `Bold` |
| TextAlignment | enum | `left` | `left`, `center`, `right` |
| FontSize | int | `48` | 숫자 입력 |
| LineHeight | string | `1.2` | 숫자 입력 (예: 1.2, 1.5) |
| Color | string | `#000000` | HEX 색상값 |
| HtmlTag | enum | `h1` | `h1`, `h2`, `h3`, `h4`, `h5`, `h6` |

## 템플릿 코드

```velocity
## @param FontWeight|title=Font Weight|type=enum|enumValues=Normal,Bold|default=Bold
## @param TextAlignment|title=Text Alignment|type=enum|enumValues=left,center,right|default=left
## @param FontSize|title=Font Size|type=int|default=48
## @param LineHeight|title=Line Height|type=string|default=1.2
## @param Color|title=Color|type=string|default=#000000
## @param HtmlTag|title=HTML Tag|type=enum|enumValues=h1,h2,h3,h4,h5,h6|default=h1

#set($title = $page.title)

#if($paramFontWeight == "Bold")
  #set($fontWeight = "700")
#else
  #set($fontWeight = "400")
#end

<${paramHtmlTag} style="
  font-size: ${paramFontSize}px;
  font-weight: ${fontWeight};
  text-align: ${paramTextAlignment};
  line-height: ${paramLineHeight};
  color: ${paramColor};
  margin: 0;
  padding: 0;
">$title</${paramHtmlTag}>
```

## 등록 방법

1. ⚙️ → **일반 구성** → **사용자 매크로** → **매크로 만들기**
2. 위 템플릿 코드 전체 복사 후 붙여넣기
3. 저장

## 사용 방법

페이지 편집 중 `/custom-page-title` 입력 후 파라미터 설정
