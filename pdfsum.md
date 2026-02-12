# 📄 PDF Editor Project Summary & Prompt (Offline Standalone)

이 파일은 다른 환경(다른 AI 또는 새로운 세션)에서 작업을 이어가기 위한 핵심 요약본입니다. 이 내용을 프롬프트로 입력하면 현재까지의 맥락을 완벽히 이해하고 오프라인 작업을 진행할 수 있습니다.

---

## 1. 프로젝트 목표 (Core Objective)
**"인터넷이 차단된 인트라넷 환경에서 작동하는 100% 오프라인 단일 파일 PDF 에디터 제작"**
- **제약 조건**: 외부 CDN 접속 불가, `.exe` 등 실행 파일 금지(보안), 단일 `.html` 파일로 작동해야 함.
- **핵심 기술**: `pdf-lib` (수정/저장), `pdf.js` (렌더링/뷰어), `FileReader API` (로컬 파일 로드).

## 2. 현재 구현된 핵심 기능 (v3.9.50+)
- **안정적인 선택 시스템**: 단일 클릭(단일 선택), `Ctrl+클릭`(다중 추가), `Shift+클릭`(범위 선택) 지원.
- **회전(Rotation)**: 선택한 페이지들을 90도씩 일괄 회전. 썸네일에 `90°`, `180°` 등 회전 각도 배지 표시.
- **페이지 추적성**: 썸네일 아래에 `현재번호 (원본 n)` 형식으로 번호를 상시 노출하여 순서 변경 시에도 추적 가능.
- **도움말(Help) 가이드**: 단축키와 사용법을 안내하는 전용 모달(`?` 버튼).
- **자동 배율(Auto-Scale)**: 창 크기에 맞춰 캔버스 크기 자동 조정.

## 3. 오프라인 단일 파일 빌드 요구사항
- **Inlining**: `head`에 CSS를 내장하고, `body` 하단에 모든 JS 로직과 라이브러리를 내장해야 함.
- **Library Bundle**: 
    - `pdf-lib.min.js`
    - `pdf.min.js`
    - `pdf.worker.min.js` (이 파일은 특히 Blob URL 처리가 필요함)
- **Drag & Drop**: 초기 화면에서 PDF를 드래그 앤 드롭하여 `ArrayBuffer`로 읽어들이는 로직 필수.

## 4. 주요 파일 구조 (Source Files)
- **[HTML]** `/pages/pdf.html`: 기본 구조 및 모달 정의.
- **[JS]** `/js/pdf.js`: 전체 상태 관리(`State`) 및 핵심 로직 (렌더링, 회전, 선택, 저장).
- **[CSS]** `/css/pdf.css`: 에디터 특화 스타일 (사이드바, 툴바, 배지, 드롭존).
- **[JS]** `/js/db.js` / `/js/app.js`: 공통 유틸리티 및 IndexedDB 연동.

## 5. 핵심 로직 요약 (For AI Context)
- `State` 객체: `pdfDoc`(pdf-lib), `pdfjsDoc`(pdfjs), `pages`(배열), `selectedPageIndices` 관리.
- `renderAllPages()`: 전체 썸네일 리스트를 갱신하며 회전값 및 페이지 번호 부여.
- `rotateCurrentPage()`: `State.selectedPageIndices`를 순회하며 회전값을 업데이트하고 `render` 호출.
- `handleFileSelect()`: 드롭된 파일을 `FileReader`로 읽어 `State.originalBytes`에 저장하고 라이브러리 초기화.

---

### [Next Action]
다음 작업을 수행할 때 이 문서를 참조하여, **"모든 소스를 하나로 합치되, 특히 대용량 라이브러리 코드가 누락되지 않도록 주의하며 `PDF-Editor-Standalone.html`을 완성하라"**고 지시하세요.
