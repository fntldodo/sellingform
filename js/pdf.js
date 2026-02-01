/**
 * SellingForm v3.8 - Module B: PDF Quick Editor
 * Local-First PDF processing using pdf-lib and pdf.js
 */

(function () {
    'use strict';

    // PDF.js worker 설정
    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // ============================================================
    // 전역 상태
    // ============================================================
    const State = {
        pdfDoc: null,         // pdf-lib document object
        originalBytes: null,  // Original file bytes
        pages: [],            // Page data { id, thumbnailCanvas, annotations: [] }
        currentPageIdx: 0,
        zoom: 1.0,
        currentTool: 'select',
        isModified: false,
        isDrawing: false,
        selectionStart: null,
        projectId: new URLSearchParams(window.location.search).get('id') || null
    };

    // ============================================================
    async function init() {
        initEventListeners();

        if (State.projectId) {
            console.log('Loading from workbench:', State.projectId);
            await loadFromWorkbench(State.projectId);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function initEventListeners() {
        // 파일 드롭존
        const dropzone = document.getElementById('dropzone');
        const pdfInput = document.getElementById('pdfInput');

        if (dropzone) {
            dropzone.addEventListener('click', () => pdfInput.click());
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('active');
            });
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('active'));
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('active');
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'application/pdf') {
                    handleFileSelect(file);
                }
            });
        }

        if (pdfInput) {
            pdfInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleFileSelect(file);
            });
        }

        // 툴바 버튼
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                State.currentTool = this.dataset.tool;

                // 도구 변경 시 커서 등 반영 위해 현재 페이지 재렌더링 (간소화)
                const overlay = document.getElementById('editorOverlay');
                if (overlay) {
                    overlay.style.cursor = State.currentTool === 'select' ? 'default' : 'crosshair';
                }
            });
        });

        // 줌 컨트롤
        document.getElementById('btnZoomIn')?.addEventListener('click', () => updateZoom(0.1));
        document.getElementById('btnZoomOut')?.addEventListener('click', () => updateZoom(-0.1));

        // 상단 액션
        document.getElementById('btnSave')?.addEventListener('click', saveToWorkbench);
        document.getElementById('btnDownload')?.addEventListener('click', downloadPdf);
        document.getElementById('btnRotatePage')?.addEventListener('click', rotateCurrentPage);
        document.getElementById('btnExportImage')?.addEventListener('click', exportPageAsImage);

        // 페이지 추가 (Append)
        const btnAddPdf = document.getElementById('btnAddPdf');
        const appendPdfInput = document.getElementById('appendPdfInput');
        if (btnAddPdf && appendPdfInput) {
            btnAddPdf.addEventListener('click', () => appendPdfInput.click());
            appendPdfInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) appendPdf(file);
            });
        }
    }

    // ============================================================
    // 파일 처리
    // ============================================================
    async function handleFileSelect(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            State.originalBytes = new Uint8Array(arrayBuffer);

            // Resilient library check
            const PDFLibInstance = window.PDFLib || window.pdfLib;
            if (!PDFLibInstance) {
                throw new Error('PDF-Lib library not loaded. Please check your internet connection or CDN.');
            }

            // Fresh copy to avoid DataCloneError/Detached buffer
            const bytesForPdfLib = State.originalBytes.slice();
            State.pdfDoc = await PDFLibInstance.PDFDocument.load(bytesForPdfLib);

            // Hide dropzone
            const dropzone = document.getElementById('dropzone');
            if (dropzone) dropzone.style.display = 'none';

            // Generate and render pages
            await renderAllPages();

        } catch (err) {
            console.error('PDF 로드 실패:', err);
            alert('PDF 파일을 읽는 중 오류가 발생했습니다: ' + (err.message || 'Unknown error'));
        }
    }

    async function renderAllPages() {
        const thumbnailList = document.getElementById('thumbnailList');
        if (!thumbnailList) return;

        thumbnailList.innerHTML = '';

        // 기존 페이지 데이터 캐시 (어노테이션 보존용)
        const oldPages = State.pages;
        State.pages = [];

        const pdfjsDoc = await pdfjsLib.getDocument({ data: State.originalBytes }).promise;
        const numPages = pdfjsDoc.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdfjsDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 }); // 썸네일용 저해상도

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            if (i === (State.currentPageIdx + 1)) item.classList.add('active');
            item.dataset.index = i - 1;

            item.appendChild(canvas);

            // 삭제 버튼
            const btnDel = document.createElement('button');
            btnDel.className = 'btn-page-del';
            btnDel.textContent = '×';
            btnDel.title = '페이지 삭제';
            btnDel.onclick = (e) => {
                e.stopPropagation();
                deletePage(i - 1);
            };
            item.appendChild(btnDel);

            item.innerHTML += `<span class="page-num">${i}</span>`;

            item.addEventListener('click', () => selectPage(i - 1));
            thumbnailList.appendChild(item);

            State.pages.push({
                id: i,
                thumbnailCanvas: canvas,
                rotation: (oldPages[i - 1] && oldPages[i - 1].rotation) ? oldPages[i - 1].rotation : 0,
                annotations: (oldPages[i - 1] && oldPages[i - 1].annotations) ? oldPages[i - 1].annotations : []
            });
        }

        if (State.currentPageIdx >= numPages) {
            State.currentPageIdx = numPages - 1;
        }
        selectPage(State.currentPageIdx);
    }

    async function selectPage(idx) {
        if (idx < 0) return;
        State.currentPageIdx = idx;

        // 썸네일 활성화 상태 변경
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            item.classList.toggle('active', i === idx);
        });

        // 메인 캔버스에 렌더링
        await renderCurrentPage();
    }

    async function renderCurrentPage() {
        const container = document.getElementById('canvasContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!State.originalBytes) return;

        const pdfjsDoc = await pdfjsLib.getDocument({ data: State.originalBytes }).promise;
        const page = await pdfjsDoc.getPage(State.currentPageIdx + 1);

        const viewport = page.getViewport({
            scale: State.zoom * 1.5,
            rotation: State.pages[State.currentPageIdx]?.rotation || 0
        }); // 고해상도 미리보기

        const canvas = document.createElement('canvas');
        canvas.id = 'previewCanvas';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        container.style.width = canvas.width + 'px';
        container.style.height = canvas.height + 'px';

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        container.appendChild(canvas);

        // 레이어 추가: 마스킹 및 텍스트용 상위 캔버스
        const overlay = document.createElement('canvas');
        overlay.id = 'editorOverlay';
        overlay.className = 'editor-overlay';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.cursor = State.currentTool === 'select' ? 'default' : 'crosshair';

        container.appendChild(overlay);
        initDrawingEvents(overlay);
        renderAnnotations(overlay);
    }

    function initDrawingEvents(canvas) {
        const ctx = canvas.getContext('2d');

        canvas.onmousedown = (e) => {
            if (State.currentTool === 'select') return;
            State.isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            State.selectionStart = {
                x: (e.clientX - rect.left) / State.zoom,
                y: (e.clientY - rect.top) / State.zoom
            };
        };

        canvas.onmousemove = (e) => {
            if (!State.isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const currentX = (e.clientX - rect.left) / State.zoom;
            const currentY = (e.clientY - rect.top) / State.zoom;

            renderAnnotations(canvas); // 기존꺼 그리고

            // 현재 드래그 중인 박스 그리기
            ctx.strokeStyle = State.currentTool === 'mask-red' ? '#ef4444' : '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                State.selectionStart.x * State.zoom,
                State.selectionStart.y * State.zoom,
                (currentX - State.selectionStart.x) * State.zoom,
                (currentY - State.selectionStart.y) * State.zoom
            );
        };

        canvas.onmouseup = (e) => {
            if (!State.isDrawing) return;
            State.isDrawing = false;

            const rect = canvas.getBoundingClientRect();
            const endX = (e.clientX - rect.left) / State.zoom;
            const endY = (e.clientY - rect.top) / State.zoom;

            const x = Math.min(State.selectionStart.x, endX);
            const y = Math.min(State.selectionStart.y, endY);
            const w = Math.abs(endX - State.selectionStart.x);
            const h = Math.abs(endY - State.selectionStart.y);

            if (w > 2 && h > 2) {
                if (!State.pages[State.currentPageIdx].annotations) {
                    State.pages[State.currentPageIdx].annotations = [];
                }
                State.pages[State.currentPageIdx].annotations.push({
                    type: 'mask',
                    color: State.currentTool === 'mask-red' ? 'red' : 'black',
                    x, y, w, h
                });
                State.isModified = true;
            }
            renderAnnotations(canvas);
        };
    }

    function renderAnnotations(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const annotations = State.pages[State.currentPageIdx]?.annotations || [];
        annotations.forEach(ann => {
            if (ann.type === 'mask') {
                ctx.fillStyle = ann.color === 'red' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 0, 0, 1)';
                ctx.fillRect(
                    ann.x * State.zoom,
                    ann.y * State.zoom,
                    ann.w * State.zoom,
                    ann.h * State.zoom
                );
            }
        });
    }

    function updateZoom(delta) {
        State.zoom = Math.max(0.5, Math.min(3.0, State.zoom + delta));
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = `${Math.round(State.zoom * 100)}%`;
        renderCurrentPage();
    }

    // ============================================================
    // 페이지 조작
    // ============================================================
    function rotateCurrentPage() {
        if (!State.pages[State.currentPageIdx]) return;

        let currentRot = State.pages[State.currentPageIdx].rotation || 0;
        State.pages[State.currentPageIdx].rotation = (currentRot + 90) % 360;

        State.isModified = true;
        renderCurrentPage();
    }

    async function deletePage(idx) {
        if (!confirm('이 페이지를 삭제하시겠습니까?')) return;

        try {
            State.pdfDoc.removePage(idx);
            State.pages.splice(idx, 1);

            const pdfBytes = await State.pdfDoc.save();
            State.originalBytes = pdfBytes;
            // Re-load into pdf-lib to keep internal state clean
            State.pdfDoc = await (window.PDFLib || window.pdfLib).PDFDocument.load(State.originalBytes);

            await renderAllPages();
            State.isModified = true;
        } catch (err) {
            console.error('페이지 삭제 실패:', err);
            alert('페이지 삭제 중 오류가 발생했습니다.');
        }
    }

    async function appendPdf(file) {
        // 만약 기본 문서가 없다면, 첫 번째 문서로 업로드 처리
        if (!State.pdfDoc) {
            handleFileSelect(file);
            return;
        }
        try {
            const arrayBuffer = await file.arrayBuffer();
            const sourceBytes = new Uint8Array(arrayBuffer);
            const sourceDoc = await (window.PDFLib || window.pdfLib).PDFDocument.load(sourceBytes);

            const copiedPages = await State.pdfDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
            copiedPages.forEach((page) => State.pdfDoc.addPage(page));

            const pdfBytes = await State.pdfDoc.save();
            State.originalBytes = pdfBytes;
            State.pdfDoc = await (window.PDFLib || window.pdfLib).PDFDocument.load(State.originalBytes);

            await renderAllPages();
            State.isModified = true;
            alert('페이지가 추가되었습니다.');
        } catch (err) {
            console.error('PDF 추가 실패:', err);
            alert('PDF 합치기 중 오류가 발생했습니다.');
        }
    }

    async function exportPageAsImage() {
        const canvas = document.getElementById('previewCanvas');
        const overlay = document.getElementById('editorOverlay');
        if (!canvas || !overlay) return;

        // 임시 캔버스에 병합 (회전 및 어노테이션 상태 포함)
        const mergeCanvas = document.createElement('canvas');
        mergeCanvas.width = canvas.width;
        mergeCanvas.height = canvas.height;
        const ctx = mergeCanvas.getContext('2d');

        // 메인 PDF 렌더링 복사
        ctx.drawImage(canvas, 0, 0);
        // 어노테이션 레이어 복사
        ctx.drawImage(overlay, 0, 0);

        const dataUrl = mergeCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `sellingform_page_${State.currentPageIdx + 1}.png`;
        link.href = dataUrl;
        link.click();
    }

    // ============================================================
    // 워크벤치 연동
    // ============================================================
    async function saveToWorkbench() {
        if (!State.pdfDoc) return;

        const pdfBytes = await State.pdfDoc.save();

        const itemData = {
            type: 'pdf',
            title: '수정된 PDF - ' + new Date().toLocaleTimeString(),
            updatedAt: Date.now(),
            data: {
                bytes: Array.from(pdfBytes),
                annotations: State.pages.map(p => p.annotations),
                rotations: State.pages.map(p => p.rotation)
            }
        };

        if (window.SellingForm && window.SellingForm.DB) {
            try {
                if (State.projectId) {
                    await window.SellingForm.DB.updateItem(parseInt(State.projectId), itemData);
                } else {
                    const newId = await window.SellingForm.DB.addItem(itemData);
                    State.projectId = newId;
                    // Update URL without refreshing to persist the state
                    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + newId;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                }
                showModal('saveCompleteModal');
            } catch (err) {
                console.error(err);
                alert('저장 실패: ' + (err.message || err));
            }
        }
    }

    async function loadFromWorkbench(id) {
        if (!window.SellingForm || !window.SellingForm.DB) return;
        try {
            const item = await window.SellingForm.DB.getItem(parseInt(id));
            if (item && item.data) {
                console.log('PDF data loaded, size:', item.data.bytes.length);
                State.originalBytes = new Uint8Array(item.data.bytes);
                State.pdfDoc = await (window.PDFLib || window.pdfLib).PDFDocument.load(State.originalBytes);

                // 어노테이션 복구
                if (item.data.annotations) {
                    // renderAllPages 에서 사용할 수 있도록 임시 저장
                    State.pages = item.data.annotations.map((ann, i) => ({
                        id: i + 1,
                        annotations: ann,
                        rotation: (item.data.rotations && item.data.rotations[i]) ? item.data.rotations[i] : 0
                    }));
                } else if (item.data.rotations) {
                    State.pages = item.data.rotations.map((rot, i) => ({
                        id: i + 1,
                        annotations: [],
                        rotation: rot
                    }));
                }

                document.getElementById('dropzone').style.display = 'none';
                await renderAllPages();
            }
        } catch (err) {
            console.error('워크벤치 로드 실패:', err);
        }
    }

    async function downloadPdf() {
        if (!State.pdfDoc) return;

        const pages = State.pdfDoc.getPages();

        // 어노테이션(마스크) 적용
        State.pages.forEach((pageData, idx) => {
            const pdfPage = pages[idx];
            if (!pdfPage) return;

            const { height, width } = pdfPage.getSize();
            const pxToPt = 1 / 1.5;

            // Apply rotation to the actual PDF page
            const currentRotation = pageData.rotation || 0;
            pdfPage.setRotation((pdfPage.getRotation().angle + currentRotation) % 360);

            pageData.annotations.forEach(ann => {
                if (ann.type === 'mask') {
                    pdfPage.drawRectangle({
                        x: ann.x * pxToPt,
                        y: height - (ann.y * pxToPt) - (ann.h * pxToPt),
                        width: ann.w * pxToPt,
                        height: ann.h * pxToPt,
                        color: ann.color === 'red' ? PDFLib.rgb(1, 0, 0) : PDFLib.rgb(0, 0, 0),
                    });
                }
            });
        });

        const pdfBytes = await State.pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited_${Date.now()}.pdf`;
        a.click();
    }

    function showModal(id) {
        document.getElementById(id)?.classList.add('active');
    }
    window.closeModal = function (id) {
        document.getElementById(id)?.classList.remove('active');
    };

})();
