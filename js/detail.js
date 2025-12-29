<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>상세페이지 편집 - Selling Form</title>
    <!-- 폰트 로드 -->
    <link rel="stylesheet" as="style" crossorigin href="[cdn.jsdelivr.net](https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css&quot;) />
    <style>
        /* ========================================
           통합 스타일 (detail.css 포함)
           모바일 최적화 & 터치 대응
        ======================================== */
        
        :root {
            --primary: #667eea;
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --text-dark: #1a202c;
            --text-gray: #718096;
            --bg-light: #f7fafc;
            --border: #e2e8f0;
            --white: #ffffff;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
            --header-height: 60px;
            --tab-height: 50px; /* 모바일 탭 높이 */
        }

        * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent; /* 모바일 터치 하이라이트 제거 */
        }

        body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            margin: 0;
            background: var(--bg-light);
            color: var(--text-dark);
            height: 100vh;
            overflow: hidden; /* 스크롤은 내부 패널에서 처리 */
        }

        /* 헤더 */
        .header {
            height: var(--header-height);
            background: var(--white);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .btn-back {
            text-decoration: none;
            color: var(--text-dark);
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            transition: background 0.2s;
        }

        .btn-back:hover { background: var(--bg-light); }

        .page-title {
            font-size: 16px;
            font-weight: 700;
            margin: 0;
        }

        .header-right {
            display: flex;
            gap: 8px;
        }

        .btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }

        .btn-save {
            background: var(--bg-light);
            color: var(--text-dark);
        }

        .btn-export {
            background: var(--primary-gradient);
            color: var(--white);
        }

        /* 메인 레이아웃 */
        .main-container {
            display: flex;
            height: calc(100vh - var(--header-height));
            margin-top: var(--header-height);
            position: relative;
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* 스와이프 애니메이션 */
        }

        /* 패널 공통 */
        .panel {
            flex: 1;
            height: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch; /* iOS 부드러운 스크롤 */
        }

        /* 왼쪽: 에디터 패널 */
        .editor-panel {
            background: var(--bg-light);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            min-width: 320px; /* PC 최소 너비 */
            max-width: 400px; /* PC 최대 너비 */
        }

        /* 섹션 네비게이션 (가로 스크롤) */
        .section-nav {
            padding: 12px 16px;
            background: var(--white);
            border-bottom: 1px solid var(--border);
            overflow-x: auto;
            white-space: nowrap;
            display: flex;
            gap: 8px;
            flex-shrink: 0;
            scrollbar-width: none; /* 파이어폭스 스크롤바 숨김 */
        }
        .section-nav::-webkit-scrollbar { display: none; }

        .nav-item {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-gray);
            background: var(--bg-light);
            border: 1px solid var(--border);
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .nav-item.active {
            background: var(--primary);
            color: var(--white);
            border-color: var(--primary);
        }

        /* 슬롯 에디터 */
        .slot-editor {
            padding: 20px;
            flex: 1;
            overflow-y: auto;
        }

        .input-group {
            background: var(--white);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--border);
            margin-bottom: 16px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .input-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .input-field {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        
        .input-field:focus {
            outline: none;
            border-color: var(--primary);
        }

        textarea.input-field {
            min-height: 80px;
            resize: vertical;
        }

        /* 오른쪽: 미리보기 패널 */
        .preview-panel {
            flex: 1; /* 남은 공간 모두 차지 */
            background: #e9ecef;
            display: flex;
            justify-content: center;
            padding: 40px;
        }

        .canvas-wrapper {
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            /* width는 JS로 제어 */
        }

        /* 모바일 탭 버튼 (기본 숨김) */
        .mobile-tabs {
            display: none;
            position: fixed;
            top: var(--header-height);
            left: 0;
            right: 0;
            height: var(--tab-height);
            background: var(--white);
            border-bottom: 1px solid var(--border);
            z-index: 40;
        }

        .tab-btn {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-gray);
            cursor: pointer;
            position: relative;
        }

        .tab-btn.active {
            color: var(--primary);
        }

        .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--primary);
        }

        /* ========================================
           반응형 (모바일 뷰)
        ======================================== */
        @media (max-width: 968px) {
            .mobile-tabs {
                display: flex; /* 탭 표시 */
            }

            .main-container {
                margin-top: calc(var(--header-height) + var(--tab-height));
                height: calc(100vh - var(--header-height) - var(--tab-height));
                width: 200vw; /* 패널 2개 너비 */
                flex-direction: row; /* 좌우 배치 */
            }

            .editor-panel {
                width: 100vw;
                max-width: none;
                min-width: 100vw;
                border-right: none;
            }

            .preview-panel {
                width: 100vw;
                min-width: 100vw;
                padding: 20px 10px; /* 패딩 축소 */
                background: #f1f5f9;
            }
            
            #previewCanvas {
                max-width: 100%;
                height: auto !important; /* 비율 유지 */
            }
            
            .header {
                padding: 0 12px;
            }
            
            .page-title {
                display: none; /* 공간 확보 */
            }
            
            .btn {
                padding: 6px 12px;
                font-size: 13px;
            }
        }

        /* 모달 스타일 (Export) */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .modal.active { display: flex; opacity: 1; }
        .modal-content {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(20px);
            transition: transform 0.3s;
        }
        .modal.active .modal-content { transform: translateY(0); }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; }
        .form-input { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; }
        
        .radio-option {
            display: flex;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 10px;
            cursor: pointer;
        }
        .radio-option.selected { border-color: var(--primary); background: #f0f4ff; }
        .radio-text { margin-left: 10px; }
        .radio-title { font-weight: 600; font-size: 14px; }
        .radio-desc { font-size: 12px; color: #666; margin-top: 2px; }
    </style>
</head>
<body>
    <!-- 헤더 -->
    <header class="header">
        <div class="header-left">
            <a href="../index.html" class="btn-back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="page-title">상세페이지 편집</h1>
        </div>
        <div class="header-right">
            <button id="btnSave" class="btn btn-save">💾 저장</button>
            <button id="btnExport" class="btn btn-export">📦 Export</button>
        </div>
    </header>

    <!-- 모바일 탭 (화면 작을 때만 보임) -->
    <div class="mobile-tabs">
        <button class="tab-btn active" onclick="switchTab('editor')">📝 편집하기</button>
        <button class="tab-btn" onclick="switchTab('preview')">👁️ 미리보기</button>
    </div>

    <!-- 메인 컨테이너 (스와이프 대상) -->
    <div class="main-container" id="mainContainer">
        <!-- 왼쪽: 에디터 -->
        <aside class="editor-panel">
            <nav class="section-nav" id="sectionNav">
                <!-- JS로 섹션 버튼 생성됨 -->
            </nav>
            <div class="slot-editor" id="slotEditor">
                <!-- JS로 입력 폼 생성됨 -->
                <div style="text-align: center; padding: 40px; color: #999;">
                    로딩 중...
                </div>
            </div>
        </aside>

        <!-- 오른쪽: 미리보기 -->
        <main class="preview-panel">
            <div class="canvas-wrapper">
                <canvas id="previewCanvas"></canvas>
            </div>
        </main>
    </div>

    <!-- Export 모달 -->
    <div class="modal" id="exportModal">
        <div class="modal-content">
            <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <h3 style="margin: 0;">Export 옵션</h3>
                <button onclick="closeModal()" style="border: none; background: none; font-size: 20px;">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">프로젝트 이름</label>
                    <input type="text" id="exportName" class="form-input" placeholder="project_name">
                </div>
                <div class="form-group">
                    <label class="form-label">형식 선택</label>
                    <div class="radio-option selected" onclick="selectExportType(this, 'image')">
                        <input type="radio" name="expType" value="image" checked>
                        <div class="radio-text">
                            <div class="radio-title">이미지 (PNG/JPG)</div>
                            <div class="radio-desc">쇼핑몰 업로드용 이미지 파일</div>
                        </div>
                    </div>
                    <div class="radio-option" onclick="selectExportType(this, 'html')">
                        <input type="radio" name="expType" value="html">
                        <div class="radio-text">
                            <div class="radio-title">HTML 웹페이지</div>
                            <div class="radio-desc">수정 가능한 코드로 다운로드</div>
                        </div>
                    </div>
                    <div class="radio-option" onclick="selectExportType(this, 'both')">
                        <input type="radio" name="expType" value="both">
                        <div class="radio-text">
                            <div class="radio-title">둘 다 다운로드</div>
                            <div class="radio-desc">이미지와 코드 모두 포함</div>
                        </div>
                    </div>
                </div>
                <button onclick="runExport()" class="btn btn-export" style="width: 100%; padding: 12px;">Export 시작</button>
            </div>
        </div>
    </div>

    <!-- 스크립트 로드 -->
    <script src="../js/app.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/guards.js"></script>
    <script src="../js/export.js"></script>
    <!-- detail.js는 마지막에 로드하되, 전역 상태 노출 코드가 포함되어 있어야 함 -->
    <script src="../js/detail.js"></script>

    <script>
        // ========================================
        // 모바일 UI 로직 (탭 & 제스처)
        // ========================================
        
        const container = document.getElementById('mainContainer');
        const tabs = document.querySelectorAll('.tab-btn');
        let currentTab = 'editor';
        let touchStartX = 0;
        let touchEndX = 0;

        // 탭 전환 함수
        function switchTab(tab) {
            currentTab = tab;
            const isMobile = window.innerWidth <= 968;
            
            // 탭 스타일 활성화
            tabs.forEach(t => t.classList.remove('active'));
            if (tab === 'editor') {
                tabs[0].classList.add('active');
                if (isMobile) container.style.transform = 'translateX(0)';
            } else {
                tabs[1].classList.add('active');
                if (isMobile) container.style.transform = 'translateX(-100vw)';
                
                // 미리보기 탭 진입 시 캔버스 다시 그리기 (리사이징 이슈 방지)
                if(window.detailBuilderState && window.detailBuilderState.render) {
                    // detail.js에서 render 함수 노출 필요 (아니면 자동 갱신됨)
                }
            }
        }

        // 터치 제스처 (스와이프)
        container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        container.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            if (window.innerWidth > 968) return; // PC에서는 동작 안함
            
            const threshold = 50; // 50px 이상 움직여야 인식
            if (touchStartX - touchEndX > threshold) {
                // 왼쪽으로 스와이프 -> 미리보기
                switchTab('preview');
            }
            if (touchEndX - touchStartX > threshold) {
                // 오른쪽으로 스와이프 -> 에디터
                switchTab('editor');
            }
        }

        // 화면 리사이즈 시 초기화
        window.addEventListener('resize', () => {
            if (window.innerWidth > 968) {
                container.style.transform = 'none';
            } else {
                switchTab(currentTab);
            }
        });

        // ========================================
        // Export 모달 로직
        // ========================================
        const modal = document.getElementById('exportModal');
        const btnExport = document.getElementById('btnExport');

        btnExport.addEventListener('click', () => {
            modal.classList.add('active');
        });

        function closeModal() {
            modal.classList.remove('active');
        }

        function selectExportType(el, val) {
            document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
            el.querySelector('input').checked = true;
        }

        async function runExport() {
            const name = document.getElementById('exportName').value || 'project';
            const type = document.querySelector('input[name="expType"]:checked').value;
            
            closeModal();
            
            // detail.js에서 노출한 전역 상태 사용
            const projectData = window.detailBuilderState ? window.detailBuilderState.projectData : null;
            
            if (window.SellingForm && window.SellingForm.Export && projectData) {
                window.SellingForm.Utils.showLoading('Export 중...');
                await window.SellingForm.Export.startExport(type, projectData, {
                    projectName: name,
                    sliceHeight: 1200
                });
                window.SellingForm.Utils.hideLoading();
            } else {
                alert('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
            }
        }

        // 모달 배경 클릭 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    </script>
</body>
</html>
