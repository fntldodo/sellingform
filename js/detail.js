// ============================================================
// SellingForm v3.13 - Module A: Product Detail Builder
// 한/영 전환 완전 지원 (섹션 + 입력 필드)
// ============================================================

(function () {
    'use strict';

    const State = {
        currentTemplate: 'beauty_01',
        currentSection: 'hero',
        projectData: null,
        projectId: null,
        isModified: false,
        currentLang: 'ko',

        // Preview UI
        previewScale: 1,

        // Auto-save (safe: only after first manual save / projectId exists)
        modifiedSeq: 0,
        lastAutosaveAt: 0
    };

    const TemplateSpec = {
        beauty_01: {
            name: 'Beauty Template 01',
            sections: {
                hero: {
                    name: '히어로',
                    nameEn: 'HERO',
                    icon: '🎯',
                    slots: {
                        productName: {
                            type: 'text',
                            label: '제품명',
                            labelEn: 'Product Name',
                            required: true,
                            maxLength: 30
                        },
                        mainCopy: {
                            type: 'text',
                            label: '한줄 USP',
                            labelEn: 'Main Copy',
                            required: true,
                            maxLength: 50
                        },
                        subCopy: {
                            type: 'text',
                            label: '서브 카피',
                            labelEn: 'Sub Copy',
                            required: true,
                            maxLength: 60
                        },
                        mainImage: {
                            type: 'image',
                            label: '메인 이미지',
                            labelEn: 'Main Image',
                            required: true
                        }
                    }
                },
                usp: {
                    name: '핵심 특징',
                    nameEn: 'USP-3',
                    icon: '⭐',
                    slots: {
                        title1: { type: 'text', label: '제목 1', labelEn: 'Title 1', required: true, maxLength: 20 },
                        desc1: { type: 'textarea', label: '설명 1', labelEn: 'Description 1', required: true, maxLength: 50 },
                        title2: { type: 'text', label: '제목 2', labelEn: 'Title 2', required: true, maxLength: 20 },
                        desc2: { type: 'textarea', label: '설명 2', labelEn: 'Description 2', required: true, maxLength: 50 },
                        title3: { type: 'text', label: '제목 3', labelEn: 'Title 3', required: true, maxLength: 20 },
                        desc3: { type: 'textarea', label: '설명 3', labelEn: 'Description 3', required: true, maxLength: 50 }
                    }
                },
                price: {
                    name: '가격',
                    nameEn: 'PRICE',
                    icon: '💰',
                    slots: {
                        priceText: { type: 'textarea', label: '가격 안내', labelEn: 'Price Info', required: false, maxLength: 100 }
                    }
                },
                proof: {
                    name: '증거·후기',
                    nameEn: 'PROOF',
                    icon: '✅',
                    slots: {
                        review1: { type: 'text', label: '후기 요약 1', labelEn: 'Review 1', required: false, maxLength: 40 },
                        review2: { type: 'text', label: '후기 요약 2', labelEn: 'Review 2', required: false, maxLength: 40 },
                        certification: { type: 'text', label: '인증/테스트', labelEn: 'Certification', required: false, maxLength: 50 }
                    }
                },
                detail: {
                    name: '상세 설명',
                    nameEn: 'DETAIL',
                    icon: '📋',
                    slots: {
                        detailImage: { type: 'image', label: '상세 이미지', labelEn: 'Detail Image', required: false },
                        detailText: { type: 'textarea', label: '설명 텍스트', labelEn: 'Description', required: false, maxLength: 200 }
                    }
                },
                howto: {
                    name: '사용 방법',
                    nameEn: 'HOW-TO',
                    icon: '📝',
                    slots: {
                        step1Title: { type: 'text', label: '1단계', labelEn: 'Step 1', required: true, maxLength: 20 },
                        step2Title: { type: 'text', label: '2단계', labelEn: 'Step 2', required: true, maxLength: 20 },
                        step3Title: { type: 'text', label: '3단계', labelEn: 'Step 3', required: true, maxLength: 20 }
                    }
                },
                faq: {
                    name: '자주 묻는 질문',
                    nameEn: 'FAQ',
                    icon: '❓',
                    slots: {
                        q1: { type: 'text', label: '질문 1', labelEn: 'Question 1', required: false, maxLength: 50 },
                        a1: { type: 'textarea', label: '답변 1', labelEn: 'Answer 1', required: false, maxLength: 100 }
                    }
                },
                shipping: {
                    name: '배송·교환',
                    nameEn: 'SHIPPING',
                    icon: '🚚',
                    slots: {
                        shipping: { type: 'textarea', label: '배송 안내', labelEn: 'Shipping Info', required: false, maxLength: 100 }
                    }
                },
                brand: {
                    name: '브랜드 소개',
                    nameEn: 'BRAND',
                    icon: '🏢',
                    slots: {
                        intro1: { type: 'text', label: '브랜드 소개', labelEn: 'Brand Intro', required: true, maxLength: 50 },
                        brandImage: { type: 'image', label: '대표 이미지', labelEn: 'Brand Image', required: true }
                    }
                }
            }
        }
    };

    function createEmptyProject() {
        const template = TemplateSpec[State.currentTemplate];
        if (!template) {
            State.currentTemplate = 'beauty_01';
            return createEmptyProject();
        }

        const data = {};
        for (const sectionKey in template.sections) {
            data[sectionKey] = {};
            for (const slotKey in template.sections[sectionKey].slots) {
                const slotSpec = template.sections[sectionKey].slots[slotKey];
                data[sectionKey][slotKey] = slotSpec.type === 'image' ? null : '';
            }
        }

        return {
            template: State.currentTemplate,
            title: '새 상세페이지 - ' + template.name,
            data: data
        };
    }

    document.addEventListener('DOMContentLoaded', function () {
        var urlParams = new URLSearchParams(window.location.search);
        var templateId = urlParams.get('template');
        var projectId = urlParams.get('id');

        if (templateId && TemplateSpec[templateId]) {
            State.currentTemplate = templateId;
        }

        if (projectId) {
            loadProject(parseInt(projectId));
        } else {
            State.projectData = createEmptyProject();
        }

        initUI();
        renderSectionButtons();
        renderSectionEditor(State.currentSection);
        renderPreview();
    });

    function renderSectionButtons() {
        const template = TemplateSpec[State.currentTemplate];
        const sectionNav = document.querySelector('.section-nav');

        if (!sectionNav) return;

        sectionNav.innerHTML = '';

        for (const sectionKey in template.sections) {
            const sectionSpec = template.sections[sectionKey];
            const btn = document.createElement('button');
            btn.className = 'section-btn';
            btn.dataset.section = sectionKey;

            const isCompleted = checkSectionCompleted(sectionKey, sectionSpec);
            const hasRequired = checkSectionHasRequired(sectionSpec);

            let statusIcon = '';
            if (isCompleted) {
                statusIcon = ' ✓';
                btn.classList.add('completed');
            } else if (hasRequired) {
                statusIcon = ' !';
                btn.classList.add('required');
            }

            const displayName = State.currentLang === 'ko' ? sectionSpec.name : sectionSpec.nameEn;
            btn.innerHTML = sectionSpec.icon + ' ' + displayName + statusIcon;

            if (sectionKey === State.currentSection) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', function () {
                selectSection(sectionKey);
            });
            sectionNav.appendChild(btn);
        }
    }

    function checkSectionCompleted(sectionKey, sectionSpec) {
        if (!State.projectData || !State.projectData.data) return false;

        const sectionData = State.projectData.data[sectionKey];
        if (!sectionData) return false;

        const hasRequiredSlots = checkSectionHasRequired(sectionSpec);
        if (!hasRequiredSlots) return false;

        for (const slotKey in sectionSpec.slots) {
            const slotSpec = sectionSpec.slots[slotKey];
            if (slotSpec.required) {
                const value = sectionData[slotKey];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return false;
                }
            }
        }
        return true;
    }

    function checkSectionHasRequired(sectionSpec) {
        for (const slotKey in sectionSpec.slots) {
            if (sectionSpec.slots[slotKey].required) return true;
        }
        return false;
    }

    function initUI() {
        const btnSave = document.getElementById('btnSave');
        if (btnSave) btnSave.addEventListener('click', saveProject);

        const btnGenerateAi = document.getElementById('btnGenerateAi');
        if (btnGenerateAi) btnGenerateAi.addEventListener('click', generateAICopy);

        const btnToggleLang = document.getElementById('btnToggleLang');
        if (btnToggleLang) {
            btnToggleLang.addEventListener('click', function () {
                State.currentLang = State.currentLang === 'ko' ? 'en' : 'ko';
                btnToggleLang.classList.remove('active-ko', 'active-en');
                btnToggleLang.classList.add(State.currentLang === 'ko' ? 'active-ko' : 'active-en');

                renderSectionButtons();
                renderSectionEditor(State.currentSection);
                renderPreview(); // ✅ 언어 토글 시 미리보기 즉시 반영

                if (window.SellingForm && window.SellingForm.Toast) {
                    window.SellingForm.Toast.show(
                        State.currentLang === 'ko' ? '한글 모드로 전환됨' : 'English mode activated',
                        1500
                    );
                }
            });
            btnToggleLang.classList.add('active-ko');
        }

        // Preview zoom UI (buttons + Ctrl/Cmd wheel)
        setupPreviewZoomUI();
    }

    // ============================================================
    // Auto-save (Debounce)
    // - Safe default: only runs after first manual save (projectId exists)
    // - Never shows blocking alerts (toast only)
    // ============================================================

    const AutoSave = (function () {
        const DEBOUNCE_MS = 900;
        const MIN_INTERVAL_MS = 2500;
        let timer = null;
        let isSaving = false;

        function canUseDB() {
            return !!(window.SellingForm && window.SellingForm.DB);
        }

        /** Schedule a debounced auto-save. */
        function schedule() {
            if (!State.projectId) return; // ✅ only after first save
            if (!canUseDB()) return;

            if (timer) clearTimeout(timer);
            const seq = State.modifiedSeq;
            timer = setTimeout(function () {
                flush(seq);
            }, DEBOUNCE_MS);
        }

        /**
         * Flush auto-save immediately (internal).
         * @param {number} seq
         */
        function flush(seq) {
            timer = null;
            if (!State.projectId) return;
            if (!State.isModified) return;
            if (!canUseDB()) return;
            if (isSaving) return; // another save is in progress

            const now = Date.now();
            if (State.lastAutosaveAt && (now - State.lastAutosaveAt) < MIN_INTERVAL_MS) {
                schedule();
                return;
            }

            isSaving = true;

            const title = (State.projectData && State.projectData.data && State.projectData.data.hero && State.projectData.data.hero.productName)
                ? State.projectData.data.hero.productName
                : '제목 없음';

            const itemData = {
                type: 'detail',
                title: title,
                thumbnail: null,
                data: State.projectData
            };

            window.SellingForm.DB.updateItem(State.projectId, itemData).then(function () {
                State.lastAutosaveAt = Date.now();
                if (State.modifiedSeq === seq) {
                    State.isModified = false;
                }
                if (window.SellingForm && window.SellingForm.Toast) {
                    window.SellingForm.Toast.show(State.currentLang === 'ko' ? '자동 저장됨' : 'Autosaved', 1200);
                }
            }).catch(function (err) {
                console.warn('AutoSave failed:', err);
            }).finally(function () {
                isSaving = false;
            });
        }

        return { schedule: schedule };
    })();

    // ============================================================
    // Preview zoom helpers
    // - Uses CSS width/height scaling (layout-aware; scroll works)
    // ============================================================

    function clampNumber(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function updateZoomLabel() {
        const el = document.getElementById('zoomLabel');
        if (!el) return;
        el.textContent = Math.round((State.previewScale || 1) * 100) + '%';
    }

    function syncPreviewCanvasCssSize() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;

        const s = (typeof State.previewScale === 'number') ? State.previewScale : 1;
        const w = canvas.width || 860;
        const h = canvas.height || 1000;
        canvas.style.width = Math.round(w * s) + 'px';
        canvas.style.height = Math.round(h * s) + 'px';
        updateZoomLabel();
    }

    function setPreviewScale(nextScale) {
        const s = clampNumber(nextScale, 0.5, 2.0);
        State.previewScale = s;
        syncPreviewCanvasCssSize();
    }

    function setupPreviewZoomUI() {
        const btnIn = document.getElementById('btnZoomIn');
        const btnOut = document.getElementById('btnZoomOut');
        const btnReset = document.getElementById('btnZoomReset');

        if (btnIn) btnIn.addEventListener('click', function () {
            setPreviewScale((State.previewScale || 1) + 0.1);
        });
        if (btnOut) btnOut.addEventListener('click', function () {
            setPreviewScale((State.previewScale || 1) - 0.1);
        });
        if (btnReset) btnReset.addEventListener('click', function () {
            setPreviewScale(1);
        });

        // Ctrl/Cmd + wheel zoom (Chrome/Edge/Safari)
        // .canvas-wrapper가 없던 레거시 마크업에서도 동작하도록 fallback 추가
        const wrap = document.querySelector('.canvas-wrapper') || document.querySelector('.preview-canvas-container');
        if (wrap) {
            wrap.addEventListener('wheel', function (e) {
                if (!(e.ctrlKey || e.metaKey)) return;
                e.preventDefault();

                const step = 0.08;
                const dir = (e.deltaY > 0) ? -1 : 1; // down = zoom out
                const next = (State.previewScale || 1) * (1 + dir * step);
                setPreviewScale(next);
            }, { passive: false });
        }

        updateZoomLabel();
        syncPreviewCanvasCssSize();
    }

    function selectSection(sectionKey) {
        State.currentSection = sectionKey;

        document.querySelectorAll('.section-btn').forEach(function (btn) {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector('[data-section="' + sectionKey + '"]');
        if (activeBtn) activeBtn.classList.add('active');

        renderSectionEditor(sectionKey);
    }

    function renderSectionEditor(sectionKey) {
        const template = TemplateSpec[State.currentTemplate];
        const sectionSpec = template.sections[sectionKey];
        if (!sectionSpec) return;

        const sectionData = State.projectData.data[sectionKey];
        const editorContainer = document.getElementById('slotEditor');
        if (!editorContainer) return;

        editorContainer.innerHTML = '';

        const sectionTitle = document.createElement('h3');
        const displayName = State.currentLang === 'ko' ? sectionSpec.name : sectionSpec.nameEn;
        sectionTitle.textContent = sectionSpec.icon + ' ' + displayName;
        editorContainer.appendChild(sectionTitle);

        for (const slotKey in sectionSpec.slots) {
            const slotSpec = sectionSpec.slots[slotKey];
            const slotItem = createSlotItem(slotKey, slotSpec, sectionData[slotKey], sectionKey);
            editorContainer.appendChild(slotItem);
        }
    }

    function createSlotItem(slotKey, slotSpec, currentValue, sectionKey) {
        const slotItem = document.createElement('div');
        slotItem.className = 'slot-item';

        const slotLabel = document.createElement('div');
        slotLabel.className = 'slot-label';

        const labelText = document.createElement('span');
        const displayLabel = State.currentLang === 'ko' ? slotSpec.label : slotSpec.labelEn;
        labelText.textContent = displayLabel;
        slotLabel.appendChild(labelText);

        if (slotSpec.required) {
            const badge = document.createElement('span');
            badge.className = 'slot-required';
            badge.textContent = (State.currentLang === 'ko') ? '필수' : 'Required';
            slotLabel.appendChild(badge);
        }

        slotItem.appendChild(slotLabel);

        let inputElement;

        if (slotSpec.type === 'text') {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'slot-input';
            inputElement.value = currentValue || '';
            const placeholderText = State.currentLang === 'ko'
                ? slotSpec.label + ' 입력'
                : 'Enter ' + slotSpec.labelEn;
            inputElement.placeholder = placeholderText;
            if (slotSpec.maxLength) inputElement.maxLength = slotSpec.maxLength;
            inputElement.addEventListener('input', function () {
                updateSlotData(sectionKey, slotKey, inputElement.value);
            });

        } else if (slotSpec.type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.className = 'slot-input slot-textarea';
            inputElement.value = currentValue || '';
            const placeholderText = State.currentLang === 'ko'
                ? slotSpec.label + ' 입력'
                : 'Enter ' + slotSpec.labelEn;
            inputElement.placeholder = placeholderText;
            if (slotSpec.maxLength) inputElement.maxLength = slotSpec.maxLength;
            inputElement.addEventListener('input', function () {
                updateSlotData(sectionKey, slotKey, inputElement.value);
            });

        } else if (slotSpec.type === 'image') {
            inputElement = createImageUploadBox(slotKey, currentValue, sectionKey);
        }

        slotItem.appendChild(inputElement);
        return slotItem;
    }

    function createImageUploadBox(slotKey, currentValue, sectionKey) {
        const container = document.createElement('div');
        container.className = 'image-upload-container';

        if (currentValue) {
            const img = document.createElement('img');
            img.src = currentValue;
            img.className = 'image-preview';
            container.appendChild(img);

            const btn = document.createElement('button');
            btn.textContent = State.currentLang === 'ko' ? '이미지 변경' : 'Change Image';
            btn.className = 'btn-secondary';
            btn.addEventListener('click', function () {
                triggerImageUpload(sectionKey, slotKey);
            });
            container.appendChild(btn);
        } else {
            const uploadBox = document.createElement('div');
            uploadBox.className = 'image-upload-box';
            const uploadText = State.currentLang === 'ko' ? '클릭하여 이미지 업로드' : 'Click to Upload Image';
            uploadBox.innerHTML = '<div style="color: #999; font-size: 2rem;">📷</div><p style="color: #666;">' + uploadText + '</p>';
            uploadBox.addEventListener('click', function () {
                triggerImageUpload(sectionKey, slotKey);
            });
            container.appendChild(uploadBox);
        }

        return container;
    }

    function triggerImageUpload(sectionKey, slotKey) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) handleImageUpload(file, sectionKey, slotKey);
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    function handleImageUpload(file, sectionKey, slotKey) {
        if (file.size > 5 * 1024 * 1024) {
            alert('이미지 크기는 5MB 이하여야 합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            updateSlotData(sectionKey, slotKey, e.target.result);
            renderSectionEditor(sectionKey);
            renderPreview();
        };
        reader.readAsDataURL(file);
    }

    function updateSlotData(sectionKey, slotKey, value) {
        State.projectData.data[sectionKey][slotKey] = value;
        State.isModified = true;
        State.modifiedSeq += 1;

        // Update UI states
        renderPreview();
        renderSectionButtons();

        // Export button state check (optional visual hint can be added)
        const missing = checkMissingRequired();
        const btnExport = document.getElementById('btnExport');
        if (btnExport) {
            if (missing.length > 0) {
                btnExport.title = (State.currentLang === 'ko')
                    ? `필수 항목 누락: ${missing.join(', ')}`
                    : `Missing required: ${missing.join(', ')}`;
            } else {
                btnExport.title = '';
            }
        }

        // ✅ Auto-save (after first manual save only)
        AutoSave.schedule();
    }

    // ============================================================
    // Preview Renderer (Codex-style)
    // - 2-pass: measure -> render
    // - image cache + async rerender (stale render guard)
    // - defensive: never crash UI
    // - current: HERO + USP-3 + PRICE + PROOF
    // ============================================================

    const PreviewRenderer = (function () {
        /** @type {number} */
        const CANVAS_WIDTH = 860;

        /** @type {Map<string, Promise<HTMLImageElement|null>>} */
        const IMAGE_PROMISE_CACHE = new Map();

        /** @type {number} */
        let renderSeq = 0;

        /** @type {boolean} */
        let rerenderQueued = false;

        function getMeasureCtx() {
            const c = document.createElement('canvas');
            c.width = CANVAS_WIDTH;
            c.height = 10;
            return c.getContext('2d');
        }

        /**
         * @param {string|null} src
         * @returns {Promise<HTMLImageElement|null>}
         */
        function loadImage(src) {
            const key = (typeof src === 'string') ? src : '';
            if (!key) return Promise.resolve(null);

            const cached = IMAGE_PROMISE_CACHE.get(key);
            if (cached) return cached;

            const p = new Promise((resolve) => {
                try {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = key;
                } catch (e) {
                    resolve(null);
                }
            });

            IMAGE_PROMISE_CACHE.set(key, p);
            return p;
        }

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {string} text
         * @param {number} maxWidth
         * @param {number} maxLines
         * @returns {string[]}
         */
        function wrapLines(ctx, text, maxWidth, maxLines) {
            const raw = (text == null) ? '' : String(text);
            const t = raw.replace(/\s+/g, ' ').trim();
            if (!t) return [];

            const words = t.split(' ');
            const useWordWrap = words.length > 1;

            /** @type {string[]} */
            const lines = [];
            let current = '';

            const pushLine = (line) => {
                if (!line) return;
                lines.push(line);
            };

            if (useWordWrap) {
                for (let i = 0; i < words.length; i++) {
                    const w = words[i];
                    const candidate = current ? (current + ' ' + w) : w;
                    if (ctx.measureText(candidate).width <= maxWidth) {
                        current = candidate;
                    } else {
                        pushLine(current);
                        current = w;
                        if (lines.length >= maxLines) break;
                    }
                }
                if (lines.length < maxLines) pushLine(current);
            } else {
                for (let i = 0; i < t.length; i++) {
                    const ch = t[i];
                    const candidate = current + ch;
                    if (ctx.measureText(candidate).width <= maxWidth) {
                        current = candidate;
                    } else {
                        pushLine(current);
                        current = ch;
                        if (lines.length >= maxLines) break;
                    }
                }
                if (lines.length < maxLines) pushLine(current);
            }

            if (lines.length > maxLines) lines.length = maxLines;
            if (lines.length === maxLines) {
                const lastIdx = maxLines - 1;
                lines[lastIdx] = ellipsisToFit(ctx, lines[lastIdx], maxWidth);
            }
            return lines;
        }

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {string} text
         * @param {number} maxWidth
         * @returns {string}
         */
        function ellipsisToFit(ctx, text, maxWidth) {
            const base = (text == null) ? '' : String(text);
            if (ctx.measureText(base).width <= maxWidth) return base;

            const ell = '…';
            let s = base;
            while (s.length > 0 && ctx.measureText(s + ell).width > maxWidth) {
                s = s.slice(0, -1);
            }
            return s ? (s + ell) : ell;
        }

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} r
         */
        function pathRoundRect(ctx, x, y, w, h, r) {
            const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
            ctx.beginPath();
            ctx.moveTo(x + rr, y);
            ctx.lineTo(x + w - rr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
            ctx.lineTo(x + w, y + h - rr);
            ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
            ctx.lineTo(x + rr, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
            ctx.lineTo(x, y + rr);
            ctx.quadraticCurveTo(x, y, x + rr, y);
            ctx.closePath();
        }

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {HTMLImageElement} img
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        function drawImageCover(ctx, img, x, y, w, h) {
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (!iw || !ih) return;

            const boxRatio = w / h;
            const imgRatio = iw / ih;

            if (imgRatio > boxRatio) {
                const sH = ih;
                const sW = sH * boxRatio;
                const sx = (iw - sW) / 2;
                ctx.drawImage(img, sx, 0, sW, sH, x, y, w, h);
            } else {
                const sW = iw;
                const sH = sW / boxRatio;
                const sy = (ih - sH) / 2;
                ctx.drawImage(img, 0, sy, sW, sH, x, y, w, h);
            }
        }

        /**
         * @param {'ko'|'en'} lang
         */
        function i18n(lang) {
            return {
                heroImagePlaceholder: (lang === 'en')
                    ? 'Upload an image to display here'
                    : '이미지를 업로드하면 여기에 표시됩니다',

                uspTitle: '핵심 특징',
                uspTitleEn: 'Key Benefits',

                priceTitle: '가격',
                priceTitleEn: 'Price',

                proofTitle: '증거·후기',
                proofTitleEn: 'Proof',

                detailTitle: '상세 설명',
                detailTitleEn: 'Details',

                howtoTitle: '사용 방법',
                howtoTitleEn: 'How to Use',

                faqTitle: '자주 묻는 질문',
                faqTitleEn: 'FAQ',

                shippingTitle: '배송·교환',
                shippingTitleEn: 'Shipping & Returns',

                brandTitle: '브랜드 소개',
                brandTitleEn: 'Brand',

                cardTitleFallback: (lang === 'en') ? 'Title' : '제목',
                cardDescFallback: (lang === 'en') ? 'Description' : '설명',

                priceTextPlaceholder: (lang === 'en')
                    ? 'Add price information (optional)'
                    : '가격 안내를 입력하세요(선택)',

                reviewPlaceholder: (lang === 'en')
                    ? 'Review'
                    : '후기',

                certPlaceholder: (lang === 'en')
                    ? 'Certification / Test (optional)'
                    : '인증/테스트(선택)',

                detailTextPlaceholder: (lang === 'en')
                    ? 'Add details (optional)'
                    : '상세 설명을 입력하세요(선택)',

                shippingPlaceholder: (lang === 'en')
                    ? 'Add shipping/return policy (optional)'
                    : '배송/교환 안내를 입력하세요(선택)',

                faqQPlaceholder: (lang === 'en') ? 'Question' : '질문',
                faqAPlaceholder: (lang === 'en') ? 'Answer' : '답변',

                brandIntroPlaceholder: (lang === 'en') ? 'Brand introduction' : '브랜드 소개 문구',
                brandImagePlaceholder: (lang === 'en') ? 'Upload a brand image' : '브랜드 이미지를 업로드하세요',

                emptySectionPlaceholder: (lang === 'en') ? 'No content yet' : '아직 입력된 내용이 없습니다'
            };
        }

        // ============================================================
        // MEASURE PASS
        // ============================================================

        function measureHero(mctx, heroData) {
            const padTop = 26;
            const padBottom = 34;

            const imgPadX = 24;
            const imgY = padTop;
            const imgW = CANVAS_WIDTH - imgPadX * 2;
            const imgH = 420;
            const imgR = 16;

            const gapAfterImage = 22;

            const textMaxW = CANVAS_WIDTH - 64;
            const xCenter = CANVAS_WIDTH / 2;

            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            mctx.font = `800 34px ${fontBase}`;
            const nameLines = wrapLines(mctx, heroData && heroData.productName, textMaxW, 2);
            const nameLH = 42;

            mctx.font = `700 24px ${fontBase}`;
            const mainLines = wrapLines(mctx, heroData && heroData.mainCopy, textMaxW, 2);
            const mainLH = 32;

            mctx.font = `500 18px ${fontBase}`;
            const subLines = wrapLines(mctx, heroData && heroData.subCopy, textMaxW, 2);
            const subLH = 26;

            const textYStart = imgY + imgH + gapAfterImage;

            const textHeight =
                (nameLines.length * nameLH) +
                (mainLines.length * mainLH) +
                (subLines.length * subLH) +
                12;

            const height = textYStart + textHeight + padBottom;

            return {
                height,
                imageBox: { x: imgPadX, y: imgY, w: imgW, h: imgH, r: imgR },
                text: {
                    xCenter,
                    yStart: textYStart,
                    maxW: textMaxW,
                    lineHeights: { name: nameLH, main: mainLH, sub: subLH },
                    lines: { name: nameLines, main: mainLines, sub: subLines }
                }
            };
        }

        function measureUSP(mctx, uspData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;

            const cardGap = 16;
            const cardR = 14;

            const cardW = (CANVAS_WIDTH - padX * 2 - cardGap * 2) / 3;
            const cardX1 = padX;
            const cardX2 = padX + cardW + cardGap;
            const cardX3 = padX + (cardW + cardGap) * 2;

            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.uspTitleEn : t.uspTitle;
            const headerH = 30;

            const cardsY = headerY + headerH + headerGap;

            const innerPad = 16;
            const titleMaxW = cardW - innerPad * 2;
            const descMaxW = cardW - innerPad * 2;

            /** @type {Array<{titleLines:string[], descLines:string[], h:number}>} */
            const measured = [];

            for (let i = 1; i <= 3; i++) {
                const titleKey = `title${i}`;
                const descKey = `desc${i}`;
                const titleVal = (uspData && uspData[titleKey]) ? uspData[titleKey] : `${t.cardTitleFallback} ${i}`;
                const descVal = (uspData && uspData[descKey]) ? uspData[descKey] : `${t.cardDescFallback} ${i}`;

                mctx.font = `800 18px ${fontBase}`;
                const titleLines = wrapLines(mctx, titleVal, titleMaxW, 2);
                const titleLH = 26;

                mctx.font = `500 15px ${fontBase}`;
                const descLines = wrapLines(mctx, descVal, descMaxW, 4);
                const descLH = 22;

                const h = (titleLines.length * titleLH) + 8 + (descLines.length * descLH) + innerPad * 2;
                measured.push({ titleLines, descLines, h });
            }

            const maxCardH = Math.max(140, ...measured.map(m => m.h));
            const blockHeight = (cardsY - startY) + maxCardH + 26;

            const cards = [
                { x: cardX1, y: cardsY, w: cardW, h: maxCardH, r: cardR, titleLines: measured[0].titleLines, descLines: measured[0].descLines },
                { x: cardX2, y: cardsY, w: cardW, h: maxCardH, r: cardR, titleLines: measured[1].titleLines, descLines: measured[1].descLines },
                { x: cardX3, y: cardsY, w: cardW, h: maxCardH, r: cardR, titleLines: measured[2].titleLines, descLines: measured[2].descLines }
            ];

            const blockBottom = startY + blockHeight;

            return {
                y: startY,
                height: blockHeight,
                header: { x: padX, y: headerY, text: headerText },
                cards,
                blockBottom
            };
        }

        function measurePrice(mctx, priceData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.priceTitleEn : t.priceTitle;
            const headerH = 30;

            const boxY = headerY + headerH + headerGap;
            const boxW = CANVAS_WIDTH - padX * 2;
            const boxR = 14;
            const innerPad = 22; // 패딩 약간 확대

            const textVal = (priceData && priceData.priceText) ? priceData.priceText : '';

            // 스마트 레이아웃 감지: "정가 -> 할인가" (예: "50,000 -> 35,000")
            let priceMode = 'normal';
            let originalPrice = '';
            let discountPrice = '';
            let discountRate = '';

            if (textVal.includes('->')) {
                const parts = textVal.split('->');
                originalPrice = parts[0].trim();
                discountPrice = parts[1].trim();

                // 할인율 계산 시도 (숫자만 추출)
                const op = parseInt(originalPrice.replace(/[^0-9]/g, ''));
                const dp = parseInt(discountPrice.replace(/[^0-9]/g, ''));
                if (!isNaN(op) && !isNaN(dp) && op > dp) {
                    discountRate = Math.round((op - dp) / op * 100) + '%';
                    priceMode = 'discount';
                }
            }

            mctx.font = `500 16px ${fontBase}`;
            const lines = textVal ? wrapLines(mctx, textVal, boxW - innerPad * 2, 6) : [t.priceTextPlaceholder];
            const lh = 26;

            const textH = Math.max(1, lines.length) * lh;
            const boxH = priceMode === 'discount' ? 140 : Math.max(120, innerPad * 2 + textH + 6);

            const blockHeight = (boxY - startY) + boxH + 26;
            const blockBottom = startY + blockHeight;

            return {
                y: startY,
                height: blockHeight,
                header: { x: padX, y: headerY, text: headerText },
                box: {
                    x: padX, y: boxY, w: boxW, h: boxH, r: boxR,
                    innerPad, lines, lh, isPlaceholder: !textVal,
                    priceMode, originalPrice, discountPrice, discountRate
                },
                blockBottom
            };
        }

        function measureProof(mctx, proofData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.proofTitleEn : t.proofTitle;
            const headerH = 30;

            const cardY = headerY + headerH + headerGap;
            const cardW = CANVAS_WIDTH - padX * 2;
            const cardR = 14;
            const innerPad = 18;

            const review1 = (proofData && proofData.review1) ? proofData.review1 : '';
            const review2 = (proofData && proofData.review2) ? proofData.review2 : '';
            const cert = (proofData && proofData.certification) ? proofData.certification : '';

            mctx.font = `700 16px ${fontBase}`;
            const r1 = review1 ? wrapLines(mctx, review1, cardW - innerPad * 2, 2) : [t.reviewPlaceholder + ' 1'];
            const r2 = review2 ? wrapLines(mctx, review2, cardW - innerPad * 2, 2) : [t.reviewPlaceholder + ' 2'];

            mctx.font = `500 15px ${fontBase}`;
            const cLines = cert ? wrapLines(mctx, cert, cardW - innerPad * 2, 2) : [t.certPlaceholder];

            const lh1 = 24;
            const lh2 = 22;

            const contentH =
                (r1.length * lh1) +
                10 +
                (r2.length * lh1) +
                16 +
                (cLines.length * lh2);

            const cardH = Math.max(160, innerPad * 2 + contentH + 10);
            const blockHeight = (cardY - startY) + cardH + 26;
            const blockBottom = startY + blockHeight;

            return {
                y: startY,
                height: blockHeight,
                header: { x: padX, y: headerY, text: headerText },
                card: { x: padX, y: cardY, w: cardW, h: cardH, r: cardR, innerPad, r1, r2, cLines, lh1, lh2, hasReal: !!(review1 || review2 || cert) },
                blockBottom
            };
        }

        function measureDetail(mctx, detailData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.detailTitleEn : t.detailTitle;
            const headerH = 30;

            let y = headerY + headerH + headerGap;

            const boxW = CANVAS_WIDTH - padX * 2;

            const hasImg = !!(detailData && detailData.detailImage);
            const hasText = !!(detailData && detailData.detailText && String(detailData.detailText).trim());

            const imageBoxH = hasImg ? 380 : 0;
            const imageBox = hasImg ? { x: padX, y, w: boxW, h: imageBoxH, r: 16 } : null;
            if (hasImg) y += imageBoxH + 18;

            const textInnerPad = 18;
            mctx.font = `500 16px ${fontBase}`;
            const textVal = hasText ? String(detailData.detailText) : '';
            const textLines = textVal ? wrapLines(mctx, textVal, boxW - textInnerPad * 2, 10) : (hasImg ? [] : [t.detailTextPlaceholder]);
            const lh = 24;

            let textBox = null;
            if (textLines.length) {
                const textH = Math.max(1, textLines.length) * lh;
                const boxH = Math.max(120, textInnerPad * 2 + textH + 6);
                textBox = { x: padX, y, w: boxW, h: boxH, r: 14, innerPad: textInnerPad, lines: textLines, lh, isPlaceholder: !textVal };
                y += boxH + 18;
            } else if (!hasImg) {
                // Empty placeholder card
                const boxH = 150;
                textBox = { x: padX, y, w: boxW, h: boxH, r: 14, innerPad: textInnerPad, lines: [t.emptySectionPlaceholder], lh, isPlaceholder: true };
                y += boxH + 18;
            }

            const blockBottom = y + 8;

            return {
                y: startY,
                header: { x: padX, y: headerY, text: headerText },
                imageBox,
                textBox,
                blockBottom,
                height: (blockBottom - startY)
            };
        }

        function measureHowto(mctx, howtoData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.howtoTitleEn : t.howtoTitle;
            const headerH = 30;

            const listY = headerY + headerH + headerGap;
            const boxW = CANVAS_WIDTH - padX * 2;

            const steps = [];
            for (let i = 1; i <= 3; i++) {
                const key = `step${i}Title`;
                const val = (howtoData && howtoData[key]) ? String(howtoData[key]).trim() : '';
                steps.push(val);
            }

            mctx.font = `700 16px ${fontBase}`;
            const itemMaxW = boxW - 22 - 18 - 18; // number badge + paddings
            const items = steps.map((s, idx) => {
                const text = s || `${t.cardTitleFallback} ${idx + 1}`;
                const lines = wrapLines(mctx, text, itemMaxW, 2);
                return { idx: idx + 1, lines, isPlaceholder: !s };
            });

            const lh = 24;
            const padY = 14;
            const gap = 12;

            let y = listY;
            const itemRects = items.map((it) => {
                const contentH = it.lines.length * lh;
                const h = Math.max(56, padY * 2 + contentH);
                const rect = { x: padX, y, w: boxW, h, r: 14, padY, lh, ...it };
                y += h + gap;
                return rect;
            });

            const blockBottom = y + 8;

            return {
                y: startY,
                header: { x: padX, y: headerY, text: headerText },
                items: itemRects,
                blockBottom,
                height: (blockBottom - startY)
            };
        }

        function measureFAQ(mctx, faqData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.faqTitleEn : t.faqTitle;
            const headerH = 30;

            const cardY = headerY + headerH + headerGap;
            const cardW = CANVAS_WIDTH - padX * 2;
            const innerPad = 18;

            const qVal = (faqData && faqData.q1) ? String(faqData.q1).trim() : '';
            const aVal = (faqData && faqData.a1) ? String(faqData.a1).trim() : '';

            mctx.font = `800 16px ${fontBase}`;
            const qLines = qVal ? wrapLines(mctx, qVal, cardW - innerPad * 2, 2) : [t.faqQPlaceholder + ' 1'];

            mctx.font = `500 15px ${fontBase}`;
            const aLines = aVal ? wrapLines(mctx, aVal, cardW - innerPad * 2, 6) : [t.faqAPlaceholder + ' 1'];

            const qLH = 24;
            const aLH = 22;

            const h = Math.max(150, innerPad * 2 + (qLines.length * qLH) + 10 + (aLines.length * aLH) + 6);
            const blockBottom = cardY + h + 26;

            return {
                y: startY,
                header: { x: padX, y: headerY, text: headerText },
                card: { x: padX, y: cardY, w: cardW, h, r: 14, innerPad, qLines, aLines, qLH, aLH, hasReal: !!(qVal || aVal) },
                blockBottom,
                height: (blockBottom - startY)
            };
        }

        function measureShipping(mctx, shippingData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.shippingTitleEn : t.shippingTitle;
            const headerH = 30;

            const boxY = headerY + headerH + headerGap;
            const boxW = CANVAS_WIDTH - padX * 2;
            const innerPad = 18;

            const textVal = (shippingData && shippingData.shipping) ? String(shippingData.shipping).trim() : '';
            mctx.font = `500 16px ${fontBase}`;
            const lines = textVal ? wrapLines(mctx, textVal, boxW - innerPad * 2, 10) : [t.shippingPlaceholder];
            const lh = 24;

            const textH = Math.max(1, lines.length) * lh;
            const boxH = Math.max(140, innerPad * 2 + textH + 6);

            const blockBottom = boxY + boxH + 26;

            return {
                y: startY,
                header: { x: padX, y: headerY, text: headerText },
                box: { x: padX, y: boxY, w: boxW, h: boxH, r: 14, innerPad, lines, lh, isPlaceholder: !textVal },
                blockBottom,
                height: (blockBottom - startY)
            };
        }

        function measureBrand(mctx, brandData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const headerTopPad = 18;
            const headerGap = 14;
            const headerY = startY + headerTopPad;

            mctx.font = `800 22px ${fontBase}`;
            const headerText = (lang === 'en') ? t.brandTitleEn : t.brandTitle;
            const headerH = 30;

            let y = headerY + headerH + headerGap;

            const boxW = CANVAS_WIDTH - padX * 2;

            const hasImg = !!(brandData && brandData.brandImage);
            const hasIntro = !!(brandData && brandData.intro1 && String(brandData.intro1).trim());

            const imageH = 320;
            const imageBox = { x: padX, y, w: boxW, h: imageH, r: 16, isPlaceholder: !hasImg };
            y += imageH + 18;

            const innerPad = 18;
            mctx.font = `600 16px ${fontBase}`;
            const introVal = hasIntro ? String(brandData.intro1) : '';
            const introLines = introVal ? wrapLines(mctx, introVal, boxW - innerPad * 2, 4) : [t.brandIntroPlaceholder];
            const lh = 24;

            const textH = Math.max(1, introLines.length) * lh;
            const textBoxH = Math.max(120, innerPad * 2 + textH + 6);

            const textBox = { x: padX, y, w: boxW, h: textBoxH, r: 14, innerPad, lines: introLines, lh, isPlaceholder: !introVal };
            y += textBoxH + 18;

            const blockBottom = y + 8;

            return {
                y: startY,
                header: { x: padX, y: headerY, text: headerText },
                imageBox,
                textBox,
                blockBottom,
                height: (blockBottom - startY)
            };
        }

        // ============================================================
        // RENDER PASS
        // ============================================================

        function drawSectionDivider(ctx, y) {
            ctx.save();
            ctx.strokeStyle = '#F1F5F9';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
            ctx.restore();
        }

        function drawSectionHeader(ctx, header) {
            const fontBase = "Pretendard, -apple-system, sans-serif";
            ctx.save();
            // Accent bar
            ctx.fillStyle = '#6366F1';
            pathRoundRect(ctx, header.x, header.y + 4, 4, 18, 2);
            ctx.fill();

            ctx.fillStyle = '#0F172A';
            ctx.font = `800 22px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(header.text, header.x + 12, header.y);
            ctx.restore();
        }

        function drawCardBox(ctx, x, y, w, h, r) {
            ctx.save();
            pathRoundRect(ctx, x, y, w, h, r);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(0,0,0,0.03)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
            ctx.fill();
            ctx.strokeStyle = '#F1F5F9';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        function drawHero(ctx, heroData, heroLayout, lang, seq, requestRerender) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, sans-serif";
            const { imageBox, text } = heroLayout;

            // Gradient Background for Hero area
            const grad = ctx.createLinearGradient(0, 0, 0, heroLayout.height);
            grad.addColorStop(0, '#F8FAFC');
            grad.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, heroLayout.height);

            ctx.save();
            pathRoundRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, imageBox.r);
            ctx.fillStyle = '#F1F5F9';
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#94A3B8';
            ctx.font = `600 16px ${fontBase}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.heroImagePlaceholder, imageBox.x + imageBox.w / 2, imageBox.y + imageBox.h / 2);

            const src = heroData && heroData.mainImage ? heroData.mainImage : null;
            if (src) {
                loadImage(src).then((img) => {
                    if (!img) return;
                    if (seq !== renderSeq) return;
                    requestRerender();
                });
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            let y = text.yStart;

            ctx.fillStyle = '#0F172A';
            ctx.font = `800 38px ${fontBase}`;
            ctx.letterSpacing = '-1px';
            for (const line of text.lines.name) {
                ctx.fillText(line, text.xCenter, y);
                y += text.lineHeights.name;
            }

            y += 4;
            ctx.fillStyle = '#475569';
            ctx.font = `700 24px ${fontBase}`;
            ctx.letterSpacing = '-0.5px';
            for (const line of text.lines.main) {
                ctx.fillText(line, text.xCenter, y);
                y += text.lineHeights.main;
            }

            y += 8;
            ctx.fillStyle = '#64748B';
            ctx.font = `500 19px ${fontBase}`;
            ctx.letterSpacing = '0px';
            for (const line of text.lines.sub) {
                ctx.fillText(line, text.xCenter, y);
                y += text.lineHeights.sub;
            }
            ctx.letterSpacing = '0px'; // reset

            if (src) {
                const cachedPromise = IMAGE_PROMISE_CACHE.get(src);
                if (cachedPromise) {
                    cachedPromise.then((img) => {
                        if (!img) return;
                        if (seq !== renderSeq) return;

                        ctx.save();
                        pathRoundRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, imageBox.r);
                        ctx.clip();
                        drawImageCover(ctx, img, imageBox.x, imageBox.y, imageBox.w, imageBox.h);
                        ctx.restore();

                        ctx.save();
                        pathRoundRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, imageBox.r);
                        ctx.strokeStyle = '#E5E7EB';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.restore();
                    });
                }
            }
        }

        function drawUSP(ctx, uspLayout, lang) {
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            drawSectionHeader(ctx, uspLayout.header);

            for (let i = 0; i < uspLayout.cards.length; i++) {
                const card = uspLayout.cards[i];

                ctx.save();
                pathRoundRect(ctx, card.x, card.y, card.w, card.h, card.r);
                ctx.fillStyle = '#FFFFFF';
                // Subtle card shadow for USP cards
                ctx.shadowColor = 'rgba(100, 116, 139, 0.08)';
                ctx.shadowBlur = 12;
                ctx.shadowOffsetY = 4;
                ctx.fill();
                ctx.strokeStyle = '#F1F5F9';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                const innerPad = 18;
                let y = card.y + innerPad + 8;

                // Icon/Badge placeholder
                ctx.save();
                ctx.beginPath();
                ctx.arc(card.x + innerPad + 12, card.y + innerPad + 12, 16, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                ctx.fill();

                // Draw a small icon dot
                ctx.beginPath();
                ctx.arc(card.x + innerPad + 12, card.y + innerPad + 12, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#6366F1';
                ctx.fill();
                ctx.restore();

                y = card.y + innerPad + 45;

                ctx.save();
                ctx.fillStyle = '#0F172A';
                ctx.font = `800 19px ${fontBase}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const titleLH = 28;
                for (const line of card.titleLines) {
                    ctx.fillText(line, card.x + innerPad, y);
                    y += titleLH;
                }
                y += 6;
                ctx.restore();

                ctx.save();
                ctx.fillStyle = '#64748B';
                ctx.font = `500 15px ${fontBase}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const descLH = 22;
                for (const line of card.descLines) {
                    ctx.fillText(line, card.x + innerPad, y);
                    y += descLH;
                }
                ctx.restore();
            }
        }

        function drawPrice(ctx, priceLayout, lang) {
            const fontBase = "Pretendard, -apple-system, sans-serif";
            drawSectionHeader(ctx, priceLayout.header);

            const b = priceLayout.box;
            drawCardBox(ctx, b.x, b.y, b.w, b.h, b.r);

            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            if (b.priceMode === 'discount') {
                // 할인 레이아웃
                let y = b.y + b.innerPad + 5;

                // 할인율 배지
                if (b.discountRate) {
                    ctx.save();
                    ctx.fillStyle = '#EF4444';
                    pathRoundRect(ctx, b.x + b.innerPad, y, 60, 26, 6);
                    ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = `800 15px ${fontBase}`;
                    ctx.textAlign = 'center';
                    ctx.fillText(b.discountRate, b.x + b.innerPad + 30, y + 4);
                    ctx.restore();
                    y += 35;
                }

                // 정가 (취소선)
                ctx.fillStyle = '#94A3B8';
                ctx.font = `500 18px ${fontBase}`;
                ctx.fillText(b.originalPrice, b.x + b.innerPad, y);

                const textWidth = ctx.measureText(b.originalPrice).width;
                ctx.strokeStyle = '#94A3B8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(b.x + b.innerPad, y + 12);
                ctx.lineTo(b.x + b.innerPad + textWidth, y + 12);
                ctx.stroke();

                y += 28;

                // 할인가 (크고 강조)
                ctx.fillStyle = '#0F172A';
                ctx.font = `800 32px ${fontBase}`;
                ctx.fillText(b.discountPrice, b.x + b.innerPad, y);

            } else {
                // 일반 레이아웃
                ctx.fillStyle = b.isPlaceholder ? '#94A3B8' : '#334155';
                ctx.font = `800 18px ${fontBase}`;
                ctx.fillText('￦', b.x + b.innerPad, b.y + b.innerPad);

                ctx.fillStyle = b.isPlaceholder ? '#94A3B8' : '#334155';
                ctx.font = `600 18px ${fontBase}`;
                let y = b.y + b.innerPad;
                for (const line of b.lines) {
                    ctx.fillText(line, b.x + b.innerPad + 28, y);
                    y += b.lh;
                }
            }
            ctx.restore();
        }

        function drawProof(ctx, proofLayout, lang) {
            const fontBase = "Pretendard, -apple-system, sans-serif";
            drawSectionHeader(ctx, proofLayout.header);

            const c = proofLayout.card;
            drawCardBox(ctx, c.x, c.y, c.w, c.h, c.r);

            let y = c.y + c.innerPad;

            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Review dots accent
            ctx.fillStyle = '#6366F1';
            for (const line of c.r1) {
                ctx.font = `800 16px ${fontBase}`;
                ctx.fillText('•', c.x + c.innerPad, y);
                ctx.fillStyle = '#0F172A';
                ctx.font = `700 16px ${fontBase}`;
                ctx.fillText(line, c.x + c.innerPad + 16, y);
                y += c.lh1;
                ctx.fillStyle = '#6366F1';
            }
            y += 10;
            for (const line of c.r2) {
                ctx.font = `800 16px ${fontBase}`;
                ctx.fillText('•', c.x + c.innerPad, y);
                ctx.fillStyle = '#0F172A';
                ctx.font = `700 16px ${fontBase}`;
                ctx.fillText(line, c.x + c.innerPad + 16, y);
                y += c.lh1;
                ctx.fillStyle = '#6366F1';
            }
            y += 16;

            // Certification
            ctx.fillStyle = '#6366F1';
            ctx.font = `800 15px ${fontBase}`;
            for (const line of c.cLines) {
                ctx.fillText('✓', c.x + c.innerPad, y);
                ctx.fillStyle = c.hasReal ? '#475569' : '#94A3B8';
                ctx.font = `500 15px ${fontBase}`;
                ctx.fillText(line, c.x + c.innerPad + 20, y);
                y += c.lh2;
                ctx.fillStyle = '#6366F1';
            }
            ctx.restore();
        }

        function drawDetail(ctx, detailData, detailLayout, lang, seq, requestRerender) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            drawSectionHeader(ctx, detailLayout.header);

            // image
            if (detailLayout.imageBox) {
                const b = detailLayout.imageBox;
                ctx.save();
                pathRoundRect(ctx, b.x, b.y, b.w, b.h, b.r);
                ctx.fillStyle = '#F1F5F9';
                ctx.fill();
                ctx.strokeStyle = '#E2E8F0';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.fillStyle = '#94A3B8';
                ctx.font = `600 16px ${fontBase}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(t.heroImagePlaceholder, b.x + b.w / 2, b.y + b.h / 2);
                ctx.restore();

                const src = detailData && detailData.detailImage ? detailData.detailImage : null;
                if (src) {
                    loadImage(src).then((img) => {
                        if (!img) return;
                        if (seq !== renderSeq) return;
                        requestRerender();
                    });

                    const cached = IMAGE_PROMISE_CACHE.get(src);
                    if (cached) {
                        cached.then((img) => {
                            if (!img) return;
                            if (seq !== renderSeq) return;

                            ctx.save();
                            pathRoundRect(ctx, b.x, b.y, b.w, b.h, b.r);
                            ctx.clip();
                            drawImageCover(ctx, img, b.x, b.y, b.w, b.h);
                            ctx.restore();

                            ctx.save();
                            pathRoundRect(ctx, b.x, b.y, b.w, b.h, b.r);
                            ctx.strokeStyle = '#F1F5F9';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                            ctx.restore();
                        });
                    }
                }
            }

            // text
            if (detailLayout.textBox) {
                const b = detailLayout.textBox;
                drawCardBox(ctx, b.x, b.y, b.w, b.h, b.r);

                ctx.save();
                ctx.fillStyle = b.isPlaceholder ? '#94A3B8' : '#334155';
                ctx.font = `500 16px ${fontBase}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                let y = b.y + b.innerPad;
                for (const line of b.lines) {
                    ctx.fillText(line, b.x + b.innerPad, y);
                    y += b.lh;
                }
                ctx.restore();
            }
        }

        function drawHowto(ctx, howtoLayout, lang) {
            const fontBase = "Pretendard, -apple-system, sans-serif";

            drawSectionHeader(ctx, howtoLayout.header);

            for (const item of howtoLayout.items) {
                drawCardBox(ctx, item.x, item.y, item.w, item.h, item.r);

                // number badge (Circle)
                const badgeX = item.x + 20;
                const badgeY = item.y + (item.h - 32) / 2;
                ctx.save();
                ctx.beginPath();
                ctx.arc(badgeX + 16, badgeY + 16, 16, 0, Math.PI * 2);
                ctx.fillStyle = '#6366F1';
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `800 15px ${fontBase}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(item.idx), badgeX + 16, badgeY + 16);
                ctx.restore();

                // text
                ctx.save();
                ctx.fillStyle = item.isPlaceholder ? '#94A3B8' : '#0F172A';
                ctx.font = `700 17px ${fontBase}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                let y = item.y + (item.h - (item.lines.length * item.lh)) / 2;
                const x = item.x + 20 + 32 + 16;
                for (const line of item.lines) {
                    ctx.fillText(line, x, y);
                    y += item.lh;
                }
                ctx.restore();
            }
        }

        function drawFAQ(ctx, faqLayout, lang) {
            const fontBase = "Pretendard, -apple-system, sans-serif";
            drawSectionHeader(ctx, faqLayout.header);

            const c = faqLayout.card;
            drawCardBox(ctx, c.x, c.y, c.w, c.h, c.r);

            let y = c.y + c.innerPad;

            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Question
            ctx.fillStyle = '#6366F1';
            ctx.font = `800 18px ${fontBase}`;
            ctx.fillText('Q.', c.x + c.innerPad, y);

            ctx.fillStyle = '#0F172A';
            ctx.font = `800 17px ${fontBase}`;
            for (const line of c.qLines) {
                ctx.fillText(line, c.x + c.innerPad + 28, y);
                y += c.qLH;
            }
            y += 12;

            // Answer
            ctx.fillStyle = '#6366F1';
            ctx.font = `800 17px ${fontBase}`;
            ctx.fillText('A.', c.x + c.innerPad, y);

            ctx.fillStyle = c.hasReal ? '#475569' : '#94A3B8';
            ctx.font = `500 16px ${fontBase}`;
            for (const line of c.aLines) {
                ctx.fillText(line, c.x + c.innerPad + 28, y);
                y += c.aLH;
            }
            ctx.restore();
        }

        function drawShipping(ctx, shippingLayout, lang) {
            const fontBase = "Pretendard, -apple-system, sans-serif";
            drawSectionHeader(ctx, shippingLayout.header);

            const b = shippingLayout.box;
            drawCardBox(ctx, b.x, b.y, b.w, b.h, b.r);

            ctx.save();
            ctx.fillStyle = b.isPlaceholder ? '#94A3B8' : '#334155';
            ctx.font = `500 16px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            let y = b.y + b.innerPad;
            for (const line of b.lines) {
                ctx.fillText(line, b.x + b.innerPad, y);
                y += b.lh;
            }
            ctx.restore();
        }

        function drawBrand(ctx, brandData, brandLayout, lang, seq, requestRerender) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, sans-serif";

            drawSectionHeader(ctx, brandLayout.header);

            const imgB = brandLayout.imageBox;

            // image placeholder
            ctx.save();
            pathRoundRect(ctx, imgB.x, imgB.y, imgB.w, imgB.h, imgB.r);
            ctx.fillStyle = '#F1F5F9';
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#94A3B8';
            ctx.font = `600 16px ${fontBase}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const placeholder = (brandData && brandData.brandImage) ? '' : t.brandImagePlaceholder;
            if (placeholder) ctx.fillText(placeholder, imgB.x + imgB.w / 2, imgB.y + imgB.h / 2);
            ctx.restore();

            const src = brandData && brandData.brandImage ? brandData.brandImage : null;
            if (src) {
                loadImage(src).then((img) => {
                    if (!img) return;
                    if (seq !== renderSeq) return;
                    requestRerender();
                });

                const cached = IMAGE_PROMISE_CACHE.get(src);
                if (cached) {
                    cached.then((img) => {
                        if (!img) return;
                        if (seq !== renderSeq) return;

                        ctx.save();
                        pathRoundRect(ctx, imgB.x, imgB.y, imgB.w, imgB.h, imgB.r);
                        ctx.clip();
                        drawImageCover(ctx, img, imgB.x, imgB.y, imgB.w, imgB.h);
                        ctx.restore();

                        ctx.save();
                        pathRoundRect(ctx, imgB.x, imgB.y, imgB.w, imgB.h, imgB.r);
                        ctx.strokeStyle = '#F1F5F9';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.restore();
                    });
                }
            }

            // text
            const tb = brandLayout.textBox;
            drawCardBox(ctx, tb.x, tb.y, tb.w, tb.h, tb.r);

            ctx.save();
            ctx.fillStyle = tb.isPlaceholder ? '#94A3B8' : '#334155';
            ctx.font = `600 17px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            let y = tb.y + tb.innerPad;
            for (const line of tb.lines) {
                ctx.fillText(line, tb.x + tb.innerPad, y);
                y += tb.lh;
            }
            ctx.restore();
        }

        function render(canvas, projectData, templateId, lang) {
            if (!canvas || !projectData || !projectData.data) return;

            const mctx = getMeasureCtx();
            if (!mctx) return;

            const heroData = projectData.data.hero || {};
            const uspData = projectData.data.usp || {};
            const priceData = projectData.data.price || {};
            const proofData = projectData.data.proof || {};
            const detailData = projectData.data.detail || {};
            const howtoData = projectData.data.howto || {};
            const faqData = projectData.data.faq || {};
            const shippingData = projectData.data.shipping || {};
            const brandData = projectData.data.brand || {};

            const heroLayout = measureHero(mctx, heroData);

            const gapAfterHero = 26;
            const uspStartY = heroLayout.height + gapAfterHero;
            const uspLayout = measureUSP(mctx, uspData, uspStartY, lang);

            const gapAfterUSP = 34;
            const priceStartY = uspLayout.blockBottom + gapAfterUSP;
            const priceLayout = measurePrice(mctx, priceData, priceStartY, lang);

            const gapAfterPrice = 30;
            const proofStartY = priceLayout.blockBottom + gapAfterPrice;
            const proofLayout = measureProof(mctx, proofData, proofStartY, lang);

            const gapAfterProof = 30;
            const detailStartY = proofLayout.blockBottom + gapAfterProof;
            const detailLayout = measureDetail(mctx, detailData, detailStartY, lang);

            const gapAfterDetail = 30;
            const howtoStartY = detailLayout.blockBottom + gapAfterDetail;
            const howtoLayout = measureHowto(mctx, howtoData, howtoStartY, lang);

            const gapAfterHowto = 30;
            const faqStartY = howtoLayout.blockBottom + gapAfterHowto;
            const faqLayout = measureFAQ(mctx, faqData, faqStartY, lang);

            const gapAfterFAQ = 30;
            const shippingStartY = faqLayout.blockBottom + gapAfterFAQ;
            const shippingLayout = measureShipping(mctx, shippingData, shippingStartY, lang);

            const gapAfterShipping = 30;
            const brandStartY = shippingLayout.blockBottom + gapAfterShipping;
            const brandLayout = measureBrand(mctx, brandData, brandStartY, lang);

            const bottomPad = 30;
            const totalHeight = Math.max(1300, Math.ceil(brandLayout.blockBottom + bottomPad));

            canvas.width = CANVAS_WIDTH;
            canvas.height = totalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            renderSeq += 1;
            const seq = renderSeq;

            const requestRerender = () => {
                if (rerenderQueued) return;
                rerenderQueued = true;
                requestAnimationFrame(() => {
                    rerenderQueued = false;
                    try {
                        render(canvas, projectData, templateId, lang);
                    } catch (e) {
                        console.error('Preview rerender failed:', e);
                    }
                });
            };

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);

            drawHero(ctx, heroData, heroLayout, lang, seq, requestRerender);
            drawSectionDivider(ctx, heroLayout.height + 10);

            drawUSP(ctx, uspLayout, lang);
            drawSectionDivider(ctx, uspLayout.blockBottom + 10);

            drawPrice(ctx, priceLayout, lang);
            drawSectionDivider(ctx, priceLayout.blockBottom + 10);

            drawProof(ctx, proofLayout, lang);
            drawSectionDivider(ctx, proofLayout.blockBottom + 10);

            drawDetail(ctx, detailData, detailLayout, lang, seq, requestRerender);
            drawSectionDivider(ctx, detailLayout.blockBottom + 10);

            drawHowto(ctx, howtoLayout, lang);
            drawSectionDivider(ctx, howtoLayout.blockBottom + 10);

            drawFAQ(ctx, faqLayout, lang);
            drawSectionDivider(ctx, faqLayout.blockBottom + 10);

            drawShipping(ctx, shippingLayout, lang);
            drawSectionDivider(ctx, shippingLayout.blockBottom + 10);

            drawBrand(ctx, brandData, brandLayout, lang, seq, requestRerender);
        }

        return { render };
    })();


    function renderPreview() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;

        // 방어: 데이터가 없으면 레거시라도 안전하게 종료
        if (!State.projectData || !State.projectData.data) {
            renderPreviewLegacy();
            return;
        }

        try {
            PreviewRenderer.render(canvas, State.projectData, State.currentTemplate, State.currentLang);
            syncPreviewCanvasCssSize();
        } catch (err) {
            console.error('renderPreview failed. fallback to legacy:', err);
            renderPreviewLegacy();
        }
    }

    // ✅ 레거시 렌더러 보존(롤백/디버깅용)
    function renderPreviewLegacy() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height = 5000;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 860, 5000);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';

        const heroData = State.projectData && State.projectData.data ? State.projectData.data.hero : null;
        if (heroData && heroData.productName) {
            ctx.fillText(heroData.productName, 430, 50);
        }
        if (heroData && heroData.mainCopy) {
            ctx.font = '24px Arial';
            ctx.fillText(heroData.mainCopy, 430, 110);
        }

        syncPreviewCanvasCssSize();
    }

    function saveProject() {
        const title = (State.projectData.data.hero && State.projectData.data.hero.productName) || '제목 없음';

        const itemData = {
            type: 'detail',
            title: title,
            thumbnail: null,
            data: State.projectData
        };

        if (window.SellingForm && window.SellingForm.DB) {
            if (State.projectId) {
                window.SellingForm.DB.updateItem(State.projectId, itemData).then(function () {
                    alert('저장되었습니다!');
                    State.isModified = false;
                    State.lastAutosaveAt = Date.now();
                }).catch(function (error) {
                    alert('저장 실패: ' + error.message);
                });
            } else {
                window.SellingForm.DB.addItem(itemData).then(function (id) {
                    State.projectId = id;
                    alert('프로젝트가 생성되었습니다!');
                    State.isModified = false;
                    State.lastAutosaveAt = Date.now();
                }).catch(function (error) {
                    alert('저장 실패: ' + error.message);
                });
            }
        }
    }

    function loadProject(id) {
        if (window.SellingForm && window.SellingForm.DB) {
            window.SellingForm.DB.getItem(id).then(function (item) {
                if (!item) {
                    alert('프로젝트를 찾을 수 없습니다.');
                    return;
                }
                State.projectId = id;
                State.projectData = item.data;
                State.currentTemplate = item.data.template;
                State.isModified = false;

                renderSectionButtons();
                renderSectionEditor(State.currentSection);
                renderPreview();
            }).catch(function (error) {
                alert('불러오기 실패: ' + error.message);
            });
        }
    }

    window.addEventListener('beforeunload', function (e) {
        if (State.isModified) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    window.detailBuilderState = {
        get projectData() { return State.projectData; },
        get currentTemplate() { return State.currentTemplate; },
        render: renderPreview,
        checkMissingRequired: checkMissingRequired
    };

    /**
     * @returns {string[]} List of missing section names
     */
    function checkMissingRequired() {
        const template = TemplateSpec[State.currentTemplate];
        if (!template || !State.projectData || !State.projectData.data) return [];

        const missingSections = [];

        for (const sectionKey in template.sections) {
            const sectionSpec = template.sections[sectionKey];
            const sectionData = State.projectData.data[sectionKey];

            let sectionMissing = false;
            for (const slotKey in sectionSpec.slots) {
                const slotSpec = sectionSpec.slots[slotKey];
                if (slotSpec.required) {
                    const value = sectionData ? sectionData[slotKey] : null;
                    if (!value || (typeof value === 'string' && value.trim() === '')) {
                        sectionMissing = true;
                        break;
                    }
                }
            }

            if (sectionMissing) {
                const displayName = State.currentLang === 'ko' ? sectionSpec.name : sectionSpec.nameEn;
                missingSections.push(displayName);
            }
        }

        return missingSections;
    }

    window.closeAiModal = function () {
        const modal = document.getElementById('aiModal');
        if (modal) modal.classList.remove('active');
    };

    function generateAICopy() {
        if (!window.SellingForm || !window.SellingForm.AIGuards) {
            alert('AI 가드레일 모듈을 찾을 수 없습니다.');
            return;
        }

        const product = document.getElementById('aiProductName')?.value;
        const keywordsRaw = document.getElementById('aiKeywords')?.value;
        const tone = document.getElementById('aiTone')?.value || 'smartstore';

        if (!product || !keywordsRaw) {
            alert('제품명과 키워드를 입력해주세요.');
            return;
        }

        const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(k => k);
        if (keywords.length < 3) {
            alert('키워드를 3개 이상 입력해주세요.');
            return;
        }

        try {
            const results = window.SellingForm.AIGuards.generateCopy({
                section: State.currentSection,
                product,
                keywords,
                tone
            });

            renderAiResults(results);
        } catch (err) {
            alert('AI 생성 실패: ' + err.message);
        }
    }

    function renderAiResults(results) {
        const container = document.getElementById('aiResults');
        if (!container) return;

        container.style.display = 'block';
        container.innerHTML = '<h4>생성 결과 (클릭하여 적용)</h4>';

        results.forEach((res, idx) => {
            const div = document.createElement('div');
            div.className = 'ai-variant-card';
            div.style.border = '1px solid #e2e8f0';
            div.style.padding = '12px';
            div.style.borderRadius = '8px';
            div.style.marginBottom = '10px';
            div.style.cursor = 'pointer';

            let riskContent = '';
            if (res.hasWarning) {
                riskContent = `<div style="color: #fbbf24; font-size: 12px; margin-top: 4px;">⚠️ ${res.risks[0].message}</div>`;
            }

            div.innerHTML = `
                <div style="font-size: 14px;">${res.text}</div>
                ${riskContent}
            `;

            div.addEventListener('click', () => {
                applyAiCopy(res.text);
                closeAiModal();
            });

            container.appendChild(div);
        });
    }

    function applyAiCopy(text) {
        const sectionSpec = TemplateSpec[State.currentTemplate].sections[State.currentSection];
        // Apply to the first text/textarea slot by default for simplicity in MVP
        for (const slotKey in sectionSpec.slots) {
            const slot = sectionSpec.slots[slotKey];
            if (slot.type === 'text' || slot.type === 'textarea') {
                updateSlotData(State.currentSection, slotKey, text);
                renderSectionEditor(State.currentSection);
                break;
            }
        }
    }

})();
