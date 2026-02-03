/**
 * SellingForm v3.8 - Module B: PDF Quick Editor
 * Local-First PDF processing using pdf-lib and pdf.js
 */

(function () {
    'use strict';

    // ============================================================
    // 진단 시스템 (최상단 배치)
    // ============================================================
    function SF_LOG(msg, data = null) {
        const time = new Date().toLocaleTimeString();
        console.log(`[SF_DIAG][${time}] ${msg}`, data || '');
        // 브라우저 얼럿으로도 확인 (최초 1회만, 로직 확인용)
        if (msg === 'Initializing PDF Editor...') {
            console.log('%c PDF EDITOR INITIALIZED ', 'background: #222; color: #bada55');
        }
    }

    // PDF.js worker 설정
    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        SF_LOG('PDF.js worker configured');
    }

    // ============================================================
    // 전역 상태
    // ============================================================
    const State = {
        pdfDoc: null,         // pdf-lib document object
        originalBytes: null,  // Original file bytes
        pdfjsDoc: null,       // pdf.js document object (cached)
        pages: [],            // Page data { id, thumbnailCanvas, annotations: [] }
        currentPageIdx: 0,
        zoom: 1.0,
        currentTool: 'select',
        isModified: false,
        isDrawing: false,
        isDragging: false,    // NEW: 이동 중 상태
        selectedAnnIdx: -1,   // NEW: 선택된 어노테이션 인덱스
        selectionStart: null,
        projectId: new URLSearchParams(window.location.search).get('id') || null
    };

    // ============================================================
    async function init() {
        SF_LOG('Initializing PDF Editor...');
        initEventListeners();

        if (State.projectId) {
            SF_LOG('Loading via projectId:', State.projectId);
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
            dropzone.addEventListener('click', () => {
                SF_LOG('Dropzone clicked, triggering input...');
                if (pdfInput) {
                    pdfInput.click();
                } else {
                    SF_LOG('ERROR: pdfInput not found');
                }
            });
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
                const tool = this.dataset.tool;
                if (tool) {
                    State.currentTool = tool;
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    // 텍스트 추가 도구일 경우 오버레이 커서 변경
                    const overlay = document.getElementById('editorOverlay');
                    if (overlay) {
                        overlay.style.cursor = tool === 'text' ? 'text' : (tool === 'select' ? 'default' : 'crosshair');
                    }
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

        // 되돌리기 / 전체삭제 명시적 바인딩
        document.getElementById('btnUndo')?.addEventListener('click', () => {
            SF_LOG('Undo clicked');
            undoAnnotation();
        });
        document.getElementById('btnClear')?.addEventListener('click', () => {
            SF_LOG('Clear clicked');
            clearAnnotations();
        });
    }

    // ============================================================
    // 파일 처리
    // ============================================================
    async function handleFileSelect(file) {
        SF_LOG('File selected:', file.name);
        try {
            if (!file || file.type !== 'application/pdf') {
                throw new Error('올바른 PDF 파일이 아닙니다.');
            }

            // More resilient buffer loading using FileReader (Fallback for older engines)
            const arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
                reader.readAsArrayBuffer(file);
            });

            SF_LOG('ArrayBuffer loaded, size:', arrayBuffer.byteLength);
            State.originalBytes = new Uint8Array(arrayBuffer);

            // Resilient library check
            const PDFLibInstance = window.PDFLib || window.pdfLib;
            if (!PDFLibInstance) {
                SF_LOG('ERROR: PDF-Lib not found in window');
                throw new Error('PDF-Lib 라이브러리가 로드되지 않았습니다. 인터넷 연결이나 CDN 상태를 확인하세요.');
            }
            SF_LOG('PDFLibInstance found');

            // Fresh copy to avoid DataCloneError/Detached buffer
            const bytesForPdfLib = State.originalBytes.slice();
            State.pdfDoc = await PDFLibInstance.PDFDocument.load(bytesForPdfLib);
            SF_LOG('PDFDocument loaded via PDFLib');

            // Cache pdfjs document once to avoid "Detached Buffer" error on subsequent reads
            // We use a fresh copy for pdfjs too just to be absolutely safe, though pdfjsDoc.destroy()
            // would eventually clean it up.
            SF_LOG('Loading PDF via pdfjsLib...');
            const bytesForPdfJs = State.originalBytes.slice();
            State.pdfjsDoc = await pdfjsLib.getDocument({
                data: bytesForPdfJs,
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            }).promise;
            SF_LOG('pdfjsDoc cached successfully');

            // Hide dropzone
            const dropzone = document.getElementById('dropzone');
            if (dropzone) dropzone.style.display = 'none';

            // Generate and render pages
            SF_LOG('Starting page rendering...');
            await renderAllPages();
            SF_LOG('All pages rendered successfully');

        } catch (err) {
            SF_LOG('FAILURE in handleFileSelect:', err.message);
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

        if (!State.pdfjsDoc) {
            SF_LOG('ERROR: No pdfjsDoc found for rendering');
            return;
        }
        const numPages = State.pdfjsDoc.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await State.pdfjsDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 }); // 썸네일용 저해상도

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            if (i === (State.currentPageIdx + 1)) item.classList.add('active');
            item.dataset.index = i - 1;
            item.draggable = true;

            // Drag and Drop Events
            item.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', i - 1);
                item.style.opacity = '0.4';
            };
            item.ondragend = () => item.style.opacity = '1';
            item.ondragover = (e) => {
                e.preventDefault();
                item.classList.add('drag-over');
            };
            item.ondragleave = () => item.classList.remove('drag-over');
            item.ondrop = async (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx = i - 1;
                if (fromIdx !== toIdx) await movePage(fromIdx, toIdx);
            };

            // 1. Delete Button
            const btnDel = document.createElement('button');
            btnDel.className = 'btn-page-del';
            btnDel.textContent = '×';
            btnDel.onclick = (e) => {
                e.stopPropagation();
                deletePage(i - 1);
            };
            item.appendChild(btnDel);

            // 2. Page Canvas (Preview)
            item.appendChild(canvas);

            // 3. Page Number
            const spanNum = document.createElement('span');
            spanNum.className = 'page-num';
            spanNum.textContent = i;
            item.appendChild(spanNum);

            item.addEventListener('click', () => selectPage(i - 1));
            thumbnailList.appendChild(item);

            State.pages.push({
                id: i,
                thumbnailCanvas: canvas,
                rotation: (oldPages[i - 1] && oldPages[i - 1].rotation) ? oldPages[i - 1].rotation : 0,
                annotations: (oldPages[i - 1] && oldPages[i - 1].annotations) ? oldPages[i - 1].annotations : []
            });
            SF_LOG(`Rendered thumbnail for page ${i}`);
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

        if (!State.originalBytes || !State.pdfjsDoc) return;

        const page = await State.pdfjsDoc.getPage(State.currentPageIdx + 1);

        const viewport = page.getViewport({
            scale: State.zoom * 1.5,
            rotation: State.pages[State.currentPageIdx]?.rotation || 0
        }); // 고해상도 미리보기

        const canvas = document.createElement('canvas');
        canvas.id = 'previewCanvas';
        const context = canvas.getContext('2d', { willReadFrequently: true });
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.onmousedown = (e) => {
            const rect = canvas.getBoundingClientRect();
            // 현재 화면 배율 감안한 좌표 (실제 PDF 포인트 기준)
            const x = (e.clientX - rect.left) / (State.zoom * 1.5);
            const y = (e.clientY - rect.top) / (State.zoom * 1.5);

            if (State.currentTool === 'select') {
                // 히트 테스트: 클릭 지점에 어노테이션이 있는지 확인
                const annotations = State.pages[State.currentPageIdx]?.annotations || [];
                let found = -1;

                // 정확한 텍스트 너비 측정을 위해 임시 컨텍스트 사용
                const tempCtx = canvas.getContext('2d');

                // 뒤에서부터 역순으로 (가장 위에 있는 것 선택)
                for (let i = annotations.length - 1; i >= 0; i--) {
                    const ann = annotations[i];
                    if (ann.type === 'mask') {
                        if (x >= ann.x && x <= ann.x + ann.w && y >= ann.y && y <= ann.y + ann.h) {
                            found = i; break;
                        }
                    } else if (ann.type === 'text') {
                        const fSize = ann.fontSize || 16;
                        tempCtx.font = `bold ${fSize}px Pretendard, Inter, sans-serif`;
                        const metrics = tempCtx.measureText(ann.content);
                        const textW = metrics.width; // PDF 포인트 기준 (canvas 줌 미적용 상태의 x,y와 비교)

                        // 텍스트는 baseline 기준이므로 y-fSize ~ y 범위 체크
                        if (x >= ann.x && x <= ann.x + textW && y >= ann.y - fSize && y <= ann.y) {
                            found = i; break;
                        }
                    }
                }
                State.selectedAnnIdx = found;
                if (found !== -1) {
                    State.isDragging = true;
                    State.selectionStart = { x, y };
                    SF_LOG('Annotation selected for move:', found);
                    canvas.style.cursor = 'move';
                } else {
                    canvas.style.cursor = 'default';
                }
                renderAnnotations(canvas);
                return;
            }

            State.isDrawing = true;
            State.selectionStart = { x, y };
        };

        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const currentX = (e.clientX - rect.left) / (State.zoom * 1.5);
            const currentY = (e.clientY - rect.top) / (State.zoom * 1.5);

            if (State.isDragging && State.selectedAnnIdx !== -1) {
                const ann = State.pages[State.currentPageIdx].annotations[State.selectedAnnIdx];
                const dx = currentX - State.selectionStart.x;
                const dy = currentY - State.selectionStart.y;
                ann.x += dx;
                ann.y += dy;
                State.selectionStart = { x: currentX, y: currentY };
                renderAnnotations(canvas);
                return;
            }

            if (!State.isDrawing) return;

            renderAnnotations(canvas); // 기존 요소 먼저 그리고

            // 현재 드래그 중인 가이드 박스 그리기
            const scale = State.zoom * 1.5;
            ctx.strokeStyle = State.currentTool === 'mask-red' ? '#ef4444' : '#000000';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1;
            ctx.strokeRect(
                State.selectionStart.x * scale,
                State.selectionStart.y * scale,
                (currentX - State.selectionStart.x) * scale,
                (currentY - State.selectionStart.y) * scale
            );
            ctx.setLineDash([]);
        };

        canvas.onmouseup = (e) => {
            if (State.isDragging) {
                State.isDragging = false;
                State.isModified = true;
                canvas.style.cursor = 'default';
                return;
            }

            if (!State.isDrawing) return;
            State.isDrawing = false;

            const rect = canvas.getBoundingClientRect();
            const endX = (e.clientX - rect.left) / (State.zoom * 1.5);
            const endY = (e.clientY - rect.top) / (State.zoom * 1.5);

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
            } else if (State.currentTool === 'text') {
                const text = prompt('추가할 텍스트를 입력하세요:');
                if (text && text.trim()) {
                    if (!State.pages[State.currentPageIdx].annotations) {
                        State.pages[State.currentPageIdx].annotations = [];
                    }
                    State.pages[State.currentPageIdx].annotations.push({
                        type: 'text',
                        content: text,
                        x: endX,
                        y: endY,
                        color: 'black',
                        fontSize: 16
                    });
                    State.isModified = true;
                }
            }
            renderAnnotations(canvas);
        };
    }

    function renderAnnotations(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentScale = State.zoom * 1.5;
        const annotations = State.pages[State.currentPageIdx]?.annotations || [];

        annotations.forEach((ann, idx) => {
            if (ann.type === 'mask') {
                ctx.fillStyle = ann.color === 'red' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 0, 0, 1)';
                ctx.fillRect(
                    ann.x * currentScale,
                    ann.y * currentScale,
                    ann.w * currentScale,
                    ann.h * currentScale
                );
            } else if (ann.type === 'text') {
                ctx.fillStyle = ann.color || 'black';
                const fSize = (ann.fontSize || 16) * currentScale;
                ctx.font = `bold ${fSize}px Pretendard, Inter, sans-serif`;
                // y좌표는 baseline 기준이므로 조정
                ctx.fillText(ann.content, ann.x * currentScale, ann.y * currentScale);
            }

            // 선택된 항목 강조 표시
            if (idx === State.selectedAnnIdx && State.currentTool === 'select') {
                ctx.strokeStyle = '#4F46E5';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                if (ann.type === 'mask') {
                    ctx.strokeRect(ann.x * currentScale - 2, ann.y * currentScale - 2, ann.w * currentScale + 4, ann.h * currentScale + 4);
                } else {
                    const fSize = (ann.fontSize || 16) * currentScale;
                    const approxW = ann.content.length * (fSize * 0.6);
                    ctx.strokeRect(ann.x * currentScale - 2, ann.y * currentScale - (fSize + 2), approxW + 4, fSize + 6);
                }
                ctx.setLineDash([]);
            }
        });
    }

    function undoAnnotation() {
        const currentPage = State.pages[State.currentPageIdx];
        if (currentPage && currentPage.annotations && currentPage.annotations.length > 0) {
            currentPage.annotations.pop();
            State.isModified = true;
            const overlay = document.getElementById('editorOverlay');
            if (overlay) renderAnnotations(overlay);
        }
    }

    function clearAnnotations() {
        const currentPage = State.pages[State.currentPageIdx];
        if (currentPage && confirm('이 페이지의 모든 편집 내용을 지우시겠습니까?')) {
            currentPage.annotations = [];
            State.isModified = true;
            const overlay = document.getElementById('editorOverlay');
            if (overlay) renderAnnotations(overlay);
        }
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

    async function movePage(fromIdx, toIdx) {
        SF_LOG(`Moving page from ${fromIdx} to ${toIdx}`);
        try {
            // 1. pdf-lib state update
            const [movedPage] = await State.pdfDoc.copyPages(State.pdfDoc, [fromIdx]);
            State.pdfDoc.insertPage(toIdx > fromIdx ? toIdx + 1 : toIdx, movedPage);
            State.pdfDoc.removePage(fromIdx > toIdx ? fromIdx + 1 : fromIdx);

            // 2. State.pages update
            const movedData = State.pages.splice(fromIdx, 1)[0];
            State.pages.splice(toIdx, 0, movedData);

            // 3. Sync and Save
            const pdfBytes = await State.pdfDoc.save();
            State.originalBytes = pdfBytes;

            // Re-load pdf-lib doc to keep clean
            State.pdfDoc = await (window.PDFLib || window.pdfLib).PDFDocument.load(State.originalBytes);

            // Also refresh pdfjsDoc
            const bytesForPdfJs = State.originalBytes.slice();
            State.pdfjsDoc = await pdfjsLib.getDocument({
                data: bytesForPdfJs,
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            }).promise;

            // 4. Update index and re-render
            State.currentPageIdx = toIdx;
            await renderAllPages();

            State.isModified = true;
            SF_LOG('Page move successful');
        } catch (err) {
            SF_LOG('FAILURE in movePage:', err.message);
            alert('페이지 이동 중 오류가 발생했습니다: ' + err.message);
        }
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

            // Also refresh pdfjsDoc
            const bytesForPdfJs = State.originalBytes.slice();
            State.pdfjsDoc = await pdfjsLib.getDocument({
                data: bytesForPdfJs,
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            }).promise;

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

            // Also refresh pdfjsDoc
            const bytesForPdfJs = State.originalBytes.slice();
            State.pdfjsDoc = await pdfjsLib.getDocument({
                data: bytesForPdfJs,
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            }).promise;

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

        SF_LOG('Saving to workbench...');
        const pdfBytes = await State.pdfDoc.save();

        // [최적화] Array.from 은 대용량 파일에서 매우 느림. 
        // IndexedDB는 TypedArray(Uint8Array)를 직접 저장 가능하므로 그대로 전달.
        const itemData = {
            type: 'pdf',
            title: '수정된 PDF - ' + new Date().toLocaleTimeString(),
            updatedAt: Date.now(),
            data: {
                bytes: pdfBytes, // TypedArray 직접 저장
                annotations: State.pages.map(p => p.annotations || []),
                rotations: State.pages.map(p => p.rotation || 0)
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
            SF_LOG('Loading item from DB:', item);

            if (item && item.type !== 'pdf') {
                SF_LOG('Item is not a PDF type. Skipping auto-load.', item.type);
                return;
            }

            if (item && item.data && item.data.bytes) {
                SF_LOG('PDF data loaded from DB, size:', item.data.bytes.length);

                // UI에서 bytes가 Array인 경우와 Uint8Array인 경우 모두 대응
                State.originalBytes = item.data.bytes instanceof Uint8Array
                    ? item.data.bytes
                    : new Uint8Array(item.data.bytes);

                const bytesForPdfLib = State.originalBytes.slice();
                State.pdfDoc = await (window.PDFLib || window.pdfLib).PDFDocument.load(bytesForPdfLib);

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

                // Load pdfjs document as well
                SF_LOG('Loading PDF via pdfjsLib (from Workbench)...');
                const bytesForPdfJs = State.originalBytes.slice();
                State.pdfjsDoc = await pdfjsLib.getDocument({
                    data: bytesForPdfJs,
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true
                }).promise;
                SF_LOG('pdfjsDoc cached (Workbench)');

                await renderAllPages();
            }
        } catch (err) {
            console.error('워크벤치 로드 실패:', err);
        }
    }

    async function downloadPdf() {
        SF_LOG('Starting PDF download/export...');
        const lib = window.PDFLib || window.pdfLib;
        if (!lib) {
            alert('PDF-Lib 라이브러리를 찾을 수 없습니다.');
            return;
        }

        if (!State.pdfDoc || !State.originalBytes) {
            SF_LOG('ERROR: No State.pdfDoc or originalBytes to download');
            alert('내보낼 PDF 데이터가 없습니다.');
            return;
        }

        try {
            // [중요] State.pdfDoc를 직접 수정하여 save()하면 반복 호출 시 상태가 엉킴 (예: 회전 중첩)
            // 따라서 엑스포트 시마다 원본으로부터 새로운 문서를 로드하여 어노테이션만 새로 입힘.
            const bytesForExport = State.originalBytes.slice();
            const exportDoc = await lib.PDFDocument.load(bytesForExport);
            const pages = exportDoc.getPages();

            SF_LOG(`Applying annotations to ${pages.length} pages...`);

            // 표준 폰트 임베딩 (한번만 수행)
            const standardFont = await exportDoc.embedFont(lib.StandardFonts.HelveticaBold);

            for (const [idx, pageData] of State.pages.entries()) {
                const pdfPage = pages[idx];
                if (!pdfPage) {
                    SF_LOG(`Skipping page index ${idx} (not found in exportDoc)`);
                    continue;
                }

                const { width, height } = pdfPage.getSize();

                // 회전 적용: State.pages에 기록된 회전값은 화면에서의 "추가" 회전이므로 
                // 원본 PDF의 페이지 회전에 이를 더해서 최종 설정함.
                const originalRot = pdfPage.getRotation().angle || 0;
                const finalRot = (originalRot + (pageData.rotation || 0)) % 360;
                pdfPage.setRotation(lib.degrees(finalRot));

                const annotations = pageData.annotations || [];
                for (const ann of annotations) {
                    try {
                        if (ann.type === 'mask') {
                            pdfPage.drawRectangle({
                                x: ann.x,
                                y: height - ann.y - ann.h,
                                width: ann.w,
                                height: ann.h,
                                color: ann.color === 'red' ? lib.rgb(1, 0, 0) : lib.rgb(0, 0, 0),
                            });
                        } else if (ann.type === 'text') {
                            // Helvetica는 한글 지원 안 함. 유저가 입력한 텍스트에 따라 에러 발생 가능하므로 방어 코드 추가.
                            pdfPage.drawText(ann.content, {
                                x: ann.x,
                                y: height - ann.y,
                                size: ann.fontSize || 16,
                                font: standardFont,
                                color: lib.rgb(0, 0, 0),
                            });
                        }
                    } catch (annErr) {
                        SF_LOG('Warning: Skipping annotation during export:', annErr.message);
                        // 개별 어노테이션 에러(예: 폰트 미지원 문자)로 인해 전체 내보내기가 실패하지 않도록 함.
                    }
                }
            }

            SF_LOG('Saving final PDF bytes...');
            const pdfBytes = await exportDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SellingForm_Edited_${Date.now()}.pdf`;
            a.click();
            SF_LOG('Download triggered successfully');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            SF_LOG('FAILURE in downloadPdf:', err.message);
            console.error(err);
            alert('PDF 내보내기 중 오류가 발생했습니다: ' + err.message);
        }
    }

    function showModal(id) {
        document.getElementById(id)?.classList.add('active');
    }
    window.closeModal = function (id) {
        document.getElementById(id)?.classList.remove('active');
    };

})();
