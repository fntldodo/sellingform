// ============================================================
// SellingForm v3.13 - Module A: Product Detail Builder
// 한/영 전환 완전 지원 (섹션 + 입력 필드)
// ============================================================

(function() {
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

    document.addEventListener('DOMContentLoaded', function() {
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
            
            btn.addEventListener('click', function() {
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
            btnToggleLang.addEventListener('click', function() {
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

    const AutoSave = (function() {
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
            timer = setTimeout(function() {
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

            window.SellingForm.DB.updateItem(State.projectId, itemData).then(function() {
                State.lastAutosaveAt = Date.now();
                if (State.modifiedSeq === seq) {
                    State.isModified = false;
                }
                if (window.SellingForm && window.SellingForm.Toast) {
                    window.SellingForm.Toast.show(State.currentLang === 'ko' ? '자동 저장됨' : 'Autosaved', 1200);
                }
            }).catch(function(err) {
                console.warn('AutoSave failed:', err);
            }).finally(function() {
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

        if (btnIn) btnIn.addEventListener('click', function() {
            setPreviewScale((State.previewScale || 1) + 0.1);
        });
        if (btnOut) btnOut.addEventListener('click', function() {
            setPreviewScale((State.previewScale || 1) - 0.1);
        });
        if (btnReset) btnReset.addEventListener('click', function() {
            setPreviewScale(1);
        });

        // Ctrl/Cmd + wheel zoom (Chrome/Edge/Safari)
        const wrap = document.querySelector('.canvas-wrapper');
        if (wrap) {
            wrap.addEventListener('wheel', function(e) {
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

        document.querySelectorAll('.section-btn').forEach(function(btn) {
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
            inputElement.addEventListener('input', function() {
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
            inputElement.addEventListener('input', function() {
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
            btn.addEventListener('click', function() {
                triggerImageUpload(sectionKey, slotKey);
            });
            container.appendChild(btn);
        } else {
            const uploadBox = document.createElement('div');
            uploadBox.className = 'image-upload-box';
            const uploadText = State.currentLang === 'ko' ? '클릭하여 이미지 업로드' : 'Click to Upload Image';
            uploadBox.innerHTML = '<div style="color: #999; font-size: 2rem;">📷</div><p style="color: #666;">' + uploadText + '</p>';
            uploadBox.addEventListener('click', function() {
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

        input.addEventListener('change', function(e) {
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
        reader.onload = function(e) {
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
        renderPreview();
        renderSectionButtons();

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

    const PreviewRenderer = (function() {
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
                // Korean/no-space fallback: char wrapping
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
                heroImagePlaceholder: (lang === 'en') ? 'Upload an image to display here' : '이미지를 업로드하면 여기에 표시됩니다',
                uspTitle: (lang === 'en') ? 'Key Benefits' : '핵심 특징',
                priceTitle: (lang === 'en') ? 'Price' : '가격',
                proofTitle: (lang === 'en') ? 'Proof' : '증거·후기',
                pricePlaceholder: (lang === 'en') ? 'Enter price info' : '가격 안내를 입력하세요',
                proofPlaceholder: (lang === 'en') ? 'Add reviews / certifications' : '후기 요약 또는 인증 정보를 입력하세요',
                cardTitleFallback: (lang === 'en') ? 'Title' : '제목',
                cardDescFallback: (lang === 'en') ? 'Description' : '설명'
            };
        }

        // ------------------------------------------------------------
        // MEASURE PASS
        // ------------------------------------------------------------

        /**
         * @param {CanvasRenderingContext2D} mctx
         * @param {any} heroData
         */
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

        /**
         * @param {CanvasRenderingContext2D} mctx
         * @param {any} uspData
         * @param {number} startY
         * @param {'ko'|'en'} lang
         */
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
            const headerText = t.uspTitle;
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

        /**
         * @param {CanvasRenderingContext2D} mctx
         * @param {any} priceData
         * @param {number} startY
         * @param {'ko'|'en'} lang
         */
        function measurePrice(mctx, priceData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const topPad = 18;
            const headerGap = 12;
            const boxPad = 16;
            const boxR = 14;

            const headerY = startY + topPad;
            mctx.font = `800 22px ${fontBase}`;
            const headerH = 30;

            const boxY = headerY + headerH + headerGap;
            const boxW = CANVAS_WIDTH - padX * 2;

            const textMaxW = boxW - boxPad * 2;
            mctx.font = `500 16px ${fontBase}`;
            const textVal = (priceData && priceData.priceText) ? priceData.priceText : t.pricePlaceholder;
            const textLines = wrapLines(mctx, textVal, textMaxW, 6);
            const textLH = 24;

            const textH = Math.max(24, textLines.length * textLH);
            const boxH = boxPad * 2 + textH;

            const blockBottom = boxY + boxH + 26;
            const blockHeight = blockBottom - startY;

            return {
                y: startY,
                height: blockHeight,
                header: { x: padX, y: headerY, text: t.priceTitle },
                box: { x: padX, y: boxY, w: boxW, h: boxH, r: boxR, pad: boxPad },
                text: { lines: textLines, lh: textLH, color: (priceData && priceData.priceText) ? '#111827' : '#6B7280' },
                blockBottom
            };
        }

        /**
         * @param {CanvasRenderingContext2D} mctx
         * @param {any} proofData
         * @param {number} startY
         * @param {'ko'|'en'} lang
         */
        function measureProof(mctx, proofData, startY, lang) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            const padX = 24;
            const topPad = 18;
            const headerGap = 12;
            const boxPad = 16;
            const boxR = 14;

            const headerY = startY + topPad;
            mctx.font = `800 22px ${fontBase}`;
            const headerH = 30;

            const boxY = headerY + headerH + headerGap;
            const boxW = CANVAS_WIDTH - padX * 2;
            const textMaxW = boxW - boxPad * 2;

            const rows = [];
            const addRow = (val) => {
                const s = (val == null) ? '' : String(val).trim();
                if (!s) return;
                rows.push(s);
            };

            addRow(proofData && proofData.review1);
            addRow(proofData && proofData.review2);
            addRow(proofData && proofData.certification);

            const hasAny = rows.length > 0;
            if (!hasAny) rows.push(t.proofPlaceholder);

            mctx.font = `500 16px ${fontBase}`;
            /** @type {string[][]} */
            const rowLines = rows.map((r) => wrapLines(mctx, r, textMaxW - 18, 3));
            const lh = 24;

            let contentH = 0;
            for (const lines of rowLines) {
                contentH += (lines.length * lh) + 8;
            }
            contentH = Math.max(24, contentH);
            const boxH = boxPad * 2 + contentH;

            const blockBottom = boxY + boxH + 30;
            const blockHeight = blockBottom - startY;

            return {
                y: startY,
                height: blockHeight,
                header: { x: padX, y: headerY, text: t.proofTitle },
                box: { x: padX, y: boxY, w: boxW, h: boxH, r: boxR, pad: boxPad },
                rows: { rowLines, lh, color: hasAny ? '#111827' : '#6B7280' },
                blockBottom
            };
        }

        // ------------------------------------------------------------
        // RENDER PASS
        // ------------------------------------------------------------

        function drawSectionDivider(ctx, y) {
            ctx.save();
            ctx.strokeStyle = '#F3F4F6';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(24, y);
            ctx.lineTo(CANVAS_WIDTH - 24, y);
            ctx.stroke();
            ctx.restore();
        }

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {any} heroData
         * @param {any} heroLayout
         * @param {'ko'|'en'} lang
         * @param {number} seq
         * @param {Function} requestRerender
         */
        function drawHero(ctx, heroData, heroLayout, lang, seq, requestRerender) {
            const t = i18n(lang);
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
            const { imageBox, text } = heroLayout;

            // Image box bg + border
            ctx.save();
            pathRoundRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, imageBox.r);
            ctx.fillStyle = '#F3F4F6';
            ctx.fill();
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // Placeholder
            ctx.fillStyle = '#6B7280';
            ctx.font = `600 16px ${fontBase}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.heroImagePlaceholder, imageBox.x + imageBox.w / 2, imageBox.y + imageBox.h / 2);

            // preload image + rerender
            const src = heroData && heroData.mainImage ? heroData.mainImage : null;
            if (src) {
                loadImage(src).then((img) => {
                    if (!img) return;
                    if (seq !== renderSeq) return;
                    requestRerender();
                });
            }

            // Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            let y = text.yStart;

            ctx.fillStyle = '#111827';
            ctx.font = `800 34px ${fontBase}`;
            for (const line of text.lines.name) {
                ctx.fillText(line, text.xCenter, y);
                y += text.lineHeights.name;
            }

            ctx.fillStyle = '#1F2937';
            ctx.font = `700 24px ${fontBase}`;
            for (const line of text.lines.main) {
                ctx.fillText(line, text.xCenter, y);
                y += text.lineHeights.main;
            }

            ctx.fillStyle = '#4B5563';
            ctx.font = `500 18px ${fontBase}`;
            for (const line of text.lines.sub) {
                ctx.fillText(line, text.xCenter, y);
                y += text.lineHeights.sub;
            }

            // draw cached image over placeholder
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

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {any} uspData
         * @param {any} uspLayout
         */
        function drawUSP(ctx, uspData, uspLayout) {
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            // header
            ctx.save();
            ctx.fillStyle = '#111827';
            ctx.font = `800 22px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(uspLayout.header.text, uspLayout.header.x, uspLayout.header.y);
            ctx.restore();

            // cards
            for (let i = 0; i < uspLayout.cards.length; i++) {
                const card = uspLayout.cards[i];

                ctx.save();
                pathRoundRect(ctx, card.x, card.y, card.w, card.h, card.r);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = '#E5E7EB';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                const innerPad = 16;
                let y = card.y + innerPad;

                // title
                ctx.save();
                ctx.fillStyle = '#111827';
                ctx.font = `800 18px ${fontBase}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const titleLH = 26;
                for (const line of card.titleLines) {
                    ctx.fillText(line, card.x + innerPad, y);
                    y += titleLH;
                }
                y += 6;
                ctx.restore();

                // desc
                ctx.save();
                ctx.fillStyle = '#4B5563';
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

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {any} priceLayout
         */
        function drawPrice(ctx, priceLayout) {
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            // header
            ctx.save();
            ctx.fillStyle = '#111827';
            ctx.font = `800 22px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(priceLayout.header.text, priceLayout.header.x, priceLayout.header.y);
            ctx.restore();

            // box
            ctx.save();
            pathRoundRect(ctx, priceLayout.box.x, priceLayout.box.y, priceLayout.box.w, priceLayout.box.h, priceLayout.box.r);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // text
            ctx.save();
            ctx.fillStyle = priceLayout.text.color;
            ctx.font = `500 16px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            let y = priceLayout.box.y + priceLayout.box.pad;
            const x = priceLayout.box.x + priceLayout.box.pad;
            for (const line of priceLayout.text.lines) {
                ctx.fillText(line, x, y);
                y += priceLayout.text.lh;
            }
            ctx.restore();
        }

        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {any} proofLayout
         */
        function drawProof(ctx, proofLayout) {
            const fontBase = "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

            // header
            ctx.save();
            ctx.fillStyle = '#111827';
            ctx.font = `800 22px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(proofLayout.header.text, proofLayout.header.x, proofLayout.header.y);
            ctx.restore();

            // box
            ctx.save();
            pathRoundRect(ctx, proofLayout.box.x, proofLayout.box.y, proofLayout.box.w, proofLayout.box.h, proofLayout.box.r);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // rows
            ctx.save();
            ctx.fillStyle = proofLayout.rows.color;
            ctx.font = `500 16px ${fontBase}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            let y = proofLayout.box.y + proofLayout.box.pad;
            const x = proofLayout.box.x + proofLayout.box.pad;
            const lh = proofLayout.rows.lh;

            for (const lines of proofLayout.rows.rowLines) {
                // bullet
                ctx.fillText('•', x, y);
                let ly = y;
                for (const line of lines) {
                    ctx.fillText(line, x + 18, ly);
                    ly += lh;
                }
                y = ly + 8;
            }
            ctx.restore();
        }

        /**
         * Main entry
         * @param {HTMLCanvasElement} canvas
         * @param {{template:string, data:any}} projectData
         * @param {string} templateId
         * @param {'ko'|'en'} lang
         */
        function render(canvas, projectData, templateId, lang) {
            if (!canvas || !projectData || !projectData.data) return;
            if (templateId !== 'beauty_01') templateId = 'beauty_01'; // MVP: only one template for now

            const mctx = getMeasureCtx();
            if (!mctx) return;

            const heroData = projectData.data.hero || {};
            const uspData = projectData.data.usp || {};
            const priceData = projectData.data.price || {};
            const proofData = projectData.data.proof || {};

            // 1) MEASURE
            const heroLayout = measureHero(mctx, heroData);
            const gapAfterHero = 26;
            const uspStartY = heroLayout.height + gapAfterHero;
            const uspLayout = measureUSP(mctx, uspData, uspStartY, lang);

            const gapAfterUSP = 26;
            const priceStartY = uspLayout.blockBottom + gapAfterUSP;
            const priceLayout = measurePrice(mctx, priceData, priceStartY, lang);

            const gapAfterPrice = 26;
            const proofStartY = priceLayout.blockBottom + gapAfterPrice;
            const proofLayout = measureProof(mctx, proofData, proofStartY, lang);

            const bottomPad = 34;
            const totalHeight = Math.max(1100, Math.ceil(proofLayout.blockBottom + bottomPad));

            // 2) RENDER (resize first; resizing clears context)
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

            // background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);

            // HERO
            drawHero(ctx, heroData, heroLayout, lang, seq, requestRerender);
            drawSectionDivider(ctx, heroLayout.height + 10);

            // USP
            drawUSP(ctx, uspData, uspLayout);
            drawSectionDivider(ctx, uspLayout.blockBottom + 10);

            // PRICE
            drawPrice(ctx, priceLayout);
            drawSectionDivider(ctx, priceLayout.blockBottom + 10);

            // PROOF
            drawProof(ctx, proofLayout);
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
                window.SellingForm.DB.updateItem(State.projectId, itemData).then(function() {
                    alert('저장되었습니다!');
                    State.isModified = false;
                    State.lastAutosaveAt = Date.now();
                }).catch(function(error) {
                    alert('저장 실패: ' + error.message);
                });
            } else {
                window.SellingForm.DB.addItem(itemData).then(function(id) {
                    State.projectId = id;
                    alert('프로젝트가 생성되었습니다!');
                    State.isModified = false;
                    State.lastAutosaveAt = Date.now();
                }).catch(function(error) {
                    alert('저장 실패: ' + error.message);
                });
            }
        }
    }

    function loadProject(id) {
        if (window.SellingForm && window.SellingForm.DB) {
            window.SellingForm.DB.getItem(id).then(function(item) {
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
            }).catch(function(error) {
                alert('불러오기 실패: ' + error.message);
            });
        }
    }

    window.addEventListener('beforeunload', function(e) {
        if (State.isModified) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    window.detailBuilderState = {
        get projectData() { return State.projectData; },
        get currentTemplate() { return State.currentTemplate; },
        render: renderPreview
    };

    window.closeAiModal = function() {
        const modal = document.getElementById('aiModal');
        if (modal) modal.classList.remove('active');
    };

    function generateAICopy() {
        alert('AI 생성 기능은 준비 중입니다.');
    }

})();
