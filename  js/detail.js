// ============================================================
// SellingForm v3.8 - Module A: Product Detail Builder
// Part 1: 초기화 및 데이터 구조
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 전역 상태
    // ============================================================
    
    const State = {
        currentTemplate: 'beauty_01',
        currentSection: 'hero',
        projectData: null,
        projectId: null,
        isModified: false
    };

    // ============================================================
    // beauty_01 템플릿 슬롯 스펙
    // ============================================================
    
    const TemplateSpec = {
        beauty_01: {
            sections: {
                hero: {
                    name: 'HERO',
                    icon: '🎯',
                    slots: {
                        productName: { type: 'text', label: '제품명', required: true, maxLength: 30 },
                        mainCopy: { type: 'text', label: '한줄 USP', required: true, maxLength: 50 },
                        subCopy: { type: 'text', label: '서브 카피', required: true, maxLength: 60 },
                        mainImage: { type: 'image', label: '메인 이미지', required: true },
                        gallery1: { type: 'image', label: '갤러리 1', required: false },
                        gallery2: { type: 'image', label: '갤러리 2', required: false },
                        gallery3: { type: 'image', label: '갤러리 3', required: false }
                    }
                },
                usp: {
                    name: 'USP-3',
                    icon: '⭐',
                    slots: {
                        icon1: { type: 'image', label: '아이콘 1', required: true },
                        title1: { type: 'text', label: '제목 1', required: true, maxLength: 20 },
                        desc1: { type: 'textarea', label: '설명 1', required: true, maxLength: 50 },
                        icon2: { type: 'image', label: '아이콘 2', required: true },
                        title2: { type: 'text', label: '제목 2', required: true, maxLength: 20 },
                        desc2: { type: 'textarea', label: '설명 2', required: true, maxLength: 50 },
                        icon3: { type: 'image', label: '아이콘 3', required: true },
                        title3: { type: 'text', label: '제목 3', required: true, maxLength: 20 },
                        desc3: { type: 'textarea', label: '설명 3', required: true, maxLength: 50 }
                    }
                },
                price: {
                    name: 'PRICE',
                    icon: '💰',
                    slots: {
                        priceText: { type: 'textarea', label: '가격 안내', required: false, maxLength: 100 }
                    }
                },
                proof: {
                    name: 'PROOF',
                    icon: '✅',
                    slots: {
                        review1: { type: 'text', label: '후기 요약 1', required: false, maxLength: 40 },
                        review2: { type: 'text', label: '후기 요약 2', required: false, maxLength: 40 },
                        review3: { type: 'text', label: '후기 요약 3', required: false, maxLength: 40 },
                        certification: { type: 'text', label: '인증/테스트', required: false, maxLength: 50 }
                    }
                },
                detail: {
                    name: 'DETAIL',
                    icon: '📋',
                    slots: {
                        detailImage: { type: 'image', label: '상세 이미지', required: false },
                        detailText: { type: 'textarea', label: '설명 텍스트', required: false, maxLength: 200 }
                    }
                },
                howto: {
                    name: 'HOWTO',
                    icon: '📝',
                    slots: {
                        step1Title: { type: 'text', label: '1단계 제목', required: true, maxLength: 20 },
                        step1Desc: { type: 'text', label: '1단계 설명', required: false, maxLength: 40 },
                        step2Title: { type: 'text', label: '2단계 제목', required: true, maxLength: 20 },
                        step2Desc: { type: 'text', label: '2단계 설명', required: false, maxLength: 40 },
                        step3Title: { type: 'text', label: '3단계 제목', required: true, maxLength: 20 },
                        step3Desc: { type: 'text', label: '3단계 설명', required: false, maxLength: 40 },
                        step4Title: { type: 'text', label: '4단계 제목', required: true, maxLength: 20 },
                        step4Desc: { type: 'text', label: '4단계 설명', required: false, maxLength: 40 }
                    }
                },
                faq: {
                    name: 'FAQ',
                    icon: '❓',
                    slots: {
                        q1: { type: 'text', label: '질문 1', required: false, maxLength: 50 },
                        a1: { type: 'textarea', label: '답변 1', required: false, maxLength: 100 },
                        q2: { type: 'text', label: '질문 2', required: false, maxLength: 50 },
                        a2: { type: 'textarea', label: '답변 2', required: false, maxLength: 100 },
                        q3: { type: 'text', label: '질문 3', required: false, maxLength: 50 },
                        a3: { type: 'textarea', label: '답변 3', required: false, maxLength: 100 }
                    }
                },
                shipping: {
                    name: '배송·CS',
                    icon: '🚚',
                    slots: {
                        shipping: { type: 'textarea', label: '배송 안내', required: false, maxLength: 100 },
                        exchange: { type: 'textarea', label: '교환 안내', required: false, maxLength: 100 },
                        refund: { type: 'textarea', label: '환불 안내', required: false, maxLength: 100 },
                        contact: { type: 'text', label: '문의', required: false, maxLength: 50 }
                    }
                },
                brand: {
                    name: 'BRAND',
                    icon: '🏢',
                    slots: {
                        intro1: { type: 'text', label: '소개 1줄', required: true, maxLength: 50 },
                        intro2: { type: 'text', label: '소개 2줄', required: true, maxLength: 50 },
                        logo: { type: 'image', label: '로고', required: false },
                        brandImage: { type: 'image', label: '대표 이미지', required: true },
                        motto: { type: 'text', label: '모토', required: false, maxLength: 40 }
                    }
                }
            }
        }
    };

    // ============================================================
    // 빈 프로젝트 데이터 생성
    // ============================================================
    
    function createEmptyProject() {
        const template = TemplateSpec[State.currentTemplate];
        const data = {};

        for (const [sectionKey, sectionSpec] of Object.entries(template.sections)) {
            data[sectionKey] = {};
            for (const [slotKey, slotSpec] of Object.entries(sectionSpec.slots)) {
                data[sectionKey][slotKey] = slotSpec.type === 'image' ? null : '';
            }
        }

        return {
            template: State.currentTemplate,
            title: '새 상세페이지',
             data
        };
    }

    // ============================================================
    // 페이지 초기화
    // ============================================================
    
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('Detail Builder 초기화 시작');

        // URL에서 프로젝트 ID 확인 (편집 모드)
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (projectId) {
            // 기존 프로젝트 로드
            await loadProject(parseInt(projectId));
        } else {
            // 새 프로젝트
            State.projectData = createEmptyProject();
        }

        // UI 초기화
        initUI();
        renderSectionEditor(State.currentSection);
        renderPreview();

        console.log('Detail Builder 초기화 완료');
    });

    // ============================================================
    // UI 초기화
    // ============================================================
    
    function initUI() {
        // 섹션 버튼 클릭 이벤트
        document.querySelectorAll('.section-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const section = this.dataset.section;
                selectSection(section);
            });
        });

        // 저장 버튼
        document.getElementById('btnSave').addEventListener('click', saveProject);

        // Export 버튼
        document.getElementById('btnExport').addEventListener('click', openExportModal);

        // AI 문구 생성 버튼 (모달 내)
        const btnGenerateAi = document.getElementById('btnGenerateAi');
        if (btnGenerateAi) {
            btnGenerateAi.addEventListener('click', generateAICopy);
        }

        // Export 시작 버튼 (모달 내)
        const btnStartExport = document.getElementById('btnStartExport');
        if (btnStartExport) {
            btnStartExport.addEventListener('click', startExport);
        }
    }

    // ============================================================
    // 섹션 선택
    // ============================================================
    
    function selectSection(sectionKey) {
        State.currentSection = sectionKey;

        // 버튼 active 상태 변경
        document.querySelectorAll('.section-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-section="${sectionKey}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // 슬롯 편집기 렌더링
        renderSectionEditor(sectionKey);
    }

    // ============================================================
    // 섹션 편집기 렌더링
    // ============================================================
    
    function renderSectionEditor(sectionKey) {
        const template = TemplateSpec[State.currentTemplate];
        const sectionSpec = template.sections[sectionKey];
        const sectionData = State.projectData.data[sectionKey];

        const editorContainer = document.getElementById('slotEditor');
        editorContainer.innerHTML = '';

        // 섹션 제목
        const sectionTitle = document.createElement('h3');
        sectionTitle.className = 'section-editor-title';
        sectionTitle.textContent = `${sectionSpec.icon} ${sectionSpec.name}`;
        editorContainer.appendChild(sectionTitle);

        // 각 슬롯 렌더링
        for (const [slotKey, slotSpec] of Object.entries(sectionSpec.slots)) {
            const slotItem = createSlotItem(slotKey, slotSpec, sectionData[slotKey], sectionKey);
            editorContainer.appendChild(slotItem);
        }
    }

    // ============================================================
    // 슬롯 아이템 생성
    // ============================================================
    
    function createSlotItem(slotKey, slotSpec, currentValue, sectionKey) {
        const slotItem = document.createElement('div');
        slotItem.className = 'slot-item';

        // 레이블
        const slotLabel = document.createElement('div');
        slotLabel.className = 'slot-label';
        
        const labelText = document.createElement('span');
        labelText.textContent = slotSpec.label;
        slotLabel.appendChild(labelText);

        if (slotSpec.required) {
            const requiredBadge = document.createElement('span');
            requiredBadge.className = 'slot-required';
            requiredBadge.textContent = '필수';
            slotLabel.appendChild(requiredBadge);
        }

        slotItem.appendChild(slotLabel);

        // 입력 필드
        let inputElement;

        if (slotSpec.type === 'text') {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'slot-input';
            inputElement.value = currentValue || '';
            inputElement.placeholder = slotSpec.label;
            if (slotSpec.maxLength) {
                inputElement.maxLength = slotSpec.maxLength;
            }
            inputElement.addEventListener('input', function() {
                updateSlotData(sectionKey, slotKey, this.value);
            });

        } else if (slotSpec.type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.className = 'slot-input slot-textarea';
            inputElement.value = currentValue || '';
            inputElement.placeholder = slotSpec.label;
            if (slotSpec.maxLength) {
                inputElement.maxLength = slotSpec.maxLength;
            }
            inputElement.addEventListener('input', function() {
                updateSlotData(sectionKey, slotKey, this.value);
            });

        } else if (slotSpec.type === 'image') {
            inputElement = createImageUploadBox(slotKey, currentValue, sectionKey);
        }

        slotItem.appendChild(inputElement);

        // 프리셋/AI 버튼 (텍스트 필드만)
        if (slotSpec.type === 'text' || slotSpec.type === 'textarea') {
            const presetButtons = createPresetButtons(sectionKey, slotKey);
            slotItem.appendChild(presetButtons);
        }

        return slotItem;
    }

    // ============================================================
    // Part 2: 이미지 업로드 및 상호작용
    // ============================================================

    // 이미지 업로드 박스 생성
    function createImageUploadBox(slotKey, currentValue, sectionKey) {
        const container = document.createElement('div');
        container.className = 'image-upload-container';

        if (currentValue) {
            // 이미 이미지가 있는 경우
            const img = document.createElement('img');
            img.src = currentValue;
            img.className = 'image-preview';
            img.alt = slotKey;
            container.appendChild(img);

            // 변경 버튼
            const changeBtn = document.createElement('button');
            changeBtn.textContent = '이미지 변경';
            changeBtn.className = 'btn-secondary';
            changeBtn.addEventListener('click', () => triggerImageUpload(sectionKey, slotKey));
            container.appendChild(changeBtn);

        } else {
            // 이미지 없는 경우 - 업로드 박스
            const uploadBox = document.createElement('div');
            uploadBox.className = 'image-upload-box';
            uploadBox.innerHTML = `
                <div style="color: var(--gray-400); font-size: 2rem;">📷</div>
                <p style="color: var(--gray-500); margin-top: 8px;">클릭하여 이미지 업로드</p>
            `;
            uploadBox.addEventListener('click', () => triggerImageUpload(sectionKey, slotKey));
            container.appendChild(uploadBox);
        }

        return container;
    }

    // 이미지 업로드 트리거
    function triggerImageUpload(sectionKey, slotKey) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file, sectionKey, slotKey);
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    // 이미지 업로드 처리 (Base64 변환)
    function handleImageUpload(file, sectionKey, slotKey) {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            alert('이미지 크기는 5MB 이하여야 합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            updateSlotData(sectionKey, slotKey, base64);
            renderSectionEditor(sectionKey);
            renderPreview();
        };
        reader.onerror = function() {
            alert('이미지 업로드에 실패했습니다.');
        };
        reader.readAsDataURL(file);
    }

    // ============================================================
    // 프리셋/AI 버튼 생성
    // ============================================================
    
    function createPresetButtons(sectionKey, slotKey) {
        const container = document.createElement('div');
        container.className = 'preset-buttons';

        // 프리셋 버튼 3개
        const presets = window.SellingForm.AIGuards.getPresetButtons(sectionKey);
        presets.forEach((presetText, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn-preset';
            btn.textContent = presetText;
            btn.addEventListener('click', () => {
                applyPreset(sectionKey, slotKey, presetText);
            });
            container.appendChild(btn);
        });

        // AI 생성 버튼
        const aiBtn = document.createElement('button');
        aiBtn.className = 'btn-preset btn-ai';
        aiBtn.textContent = '✨ AI 생성';
        aiBtn.addEventListener('click', () => {
            openAiModal(sectionKey, slotKey);
        });
        container.appendChild(aiBtn);

        return container;
    }

    // 프리셋 적용
    function applyPreset(sectionKey, slotKey, presetText) {
        updateSlotData(sectionKey, slotKey, presetText);
        renderSectionEditor(sectionKey);
        renderPreview();
    }

    // ============================================================
    // 데이터 업데이트
    // ============================================================
    
    function updateSlotData(sectionKey, slotKey, value) {
        State.projectData.data[sectionKey][slotKey] = value;
        State.isModified = true;
        renderPreview();
    }

    // ============================================================
    // 캔버스 미리보기 렌더링 (간단 버전)
    // ============================================================
    
    function renderPreview() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = 860;
        const estimatedHeight = 5000;
        canvas.height = estimatedHeight;

        // 배경
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, estimatedHeight);

        // 간단한 미리보기 (실제로는 복잡한 레이아웃)
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';

        let yOffset = 50;

        // HERO 섹션
        const heroData = State.projectData.data.hero;
        if (heroData.productName) {
            ctx.font = 'bold 36px Arial';
            ctx.fillText(heroData.productName, width / 2, yOffset);
            yOffset += 60;
        }
        if (heroData.mainCopy) {
            ctx.font = '24px Arial';
            ctx.fillText(heroData.mainCopy, width / 2, yOffset);
            yOffset += 50;
        }

        // 나머지 섹션 표시 (단순 텍스트)
        yOffset += 100;
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('미리보기는 Export 시 완성됩니다', width / 2, yOffset);
    }

    // ============================================================
    // AI 모달 열기
    // ============================================================
    
    let currentAiTarget = null;

    function openAiModal(sectionKey, slotKey) {
        currentAiTarget = { sectionKey, slotKey };
        
        if (window.SellingForm && window.SellingForm.Modal) {
            window.SellingForm.Modal.open('aiModal');
        }
    }

    function closeAiModal() {
        if (window.SellingForm && window.SellingForm.Modal) {
            window.SellingForm.Modal.close('aiModal');
        }
        currentAiTarget = null;
    }

    // AI 문구 생성
    function generateAICopy() {
        const productName = document.getElementById('aiProductName').value;
        const keywords = document.getElementById('aiKeywords').value;
        const tone = document.getElementById('aiTone').value;

        if (!productName || !keywords) {
            alert('제품명과 키워드는 필수입니다.');
            return;
        }

        const keywordArray = keywords.split(',').map(k => k.trim());
        if (keywordArray.length < 3) {
            alert('키워드를 3개 이상 입력해주세요. (쉼표로 구분)');
            return;
        }

        try {
            const variants = window.SellingForm.AIGuards.generateCopy({
                section: currentAiTarget.sectionKey,
                product: productName,
                keywords: keywordArray,
                tone: tone
            });

            displayAiResults(variants);
        } catch (error) {
            alert('AI 생성 실패: ' + error.message);
        }
    }

    // AI 결과 표시
    function displayAiResults(variants) {
        const resultsContainer = document.getElementById('aiResults');
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'block';

        variants.forEach((variant, index) => {
            const card = document.createElement('div');
            card.className = 'ai-result-card';

            const text = document.createElement('div');
            text.className = 'result-text';
            text.textContent = variant.text;
            card.appendChild(text);

            // 경고 표시
            if (variant.hasWarning) {
                const warning = document.createElement('div');
                warning.className = 'ai-warning';
                warning.innerHTML = `⚠️ ${variant.risks[0].message}`;
                card.appendChild(warning);
            }

            // 적용 버튼
            const applyBtn = document.createElement('button');
            applyBtn.className = 'btn-apply';
            applyBtn.textContent = '이 문구 사용';
            applyBtn.addEventListener('click', () => {
                applyAiCopy(variant.text);
            });
            card.appendChild(applyBtn);

            resultsContainer.appendChild(card);
        });
    }

    // AI 문구 적용
    function applyAiCopy(text) {
        updateSlotData(currentAiTarget.sectionKey, currentAiTarget.slotKey, text);
        renderSectionEditor(currentAiTarget.sectionKey);
        renderPreview();
        closeAiModal();
    }

    // ============================================================
    // Export 모달
    // ============================================================
    
    function openExportModal() {
        if (window.SellingForm && window.SellingForm.Modal) {
            window.SellingForm.Modal.open('exportModal');
        }
    }

    function closeExportModal() {
        if (window.SellingForm && window.SellingForm.Modal) {
            window.SellingForm.Modal.close('exportModal');
        }
    }

    async function startExport() {
        const projectName = document.getElementById('exportProjectName').value || 'untitled';
        const sliceHeight = parseInt(document.getElementById('exportSliceHeight').value) || 1200;
        const format = document.getElementById('exportFormat').value || 'png';

        const canvas = document.getElementById('previewCanvas');
        if (!canvas) {
            alert('미리보기 캔버스를 찾을 수 없습니다.');
            return;
        }

        closeExportModal();

        const success = await window.SellingForm.Export.exportToZip(canvas, projectName, {
            sliceHeight: sliceHeight,
            format: format
        });

        if (success) {
            console.log('Export 완료');
        }
    }

    // ============================================================
    // 저장/불러오기
    // ============================================================
    
    async function saveProject() {
        const title = State.projectData.data.hero.productName || '제목 없음';
        
        // 썸네일 생성 (간단히 캔버스 상단 일부)
        const canvas = document.getElementById('previewCanvas');
        let thumbnail = null;
        if (canvas) {
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 200;
            thumbCanvas.height = 150;
            const ctx = thumbCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, 860, 645, 0, 0, 200, 150);
            thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);
        }

        const itemData = {
            type: 'detail',
            title: title,
            thumbnail: thumbnail,
            data: State.projectData
        };

        try {
            if (State.projectId) {
                // 수정
                await window.SellingForm.DB.updateItem(State.projectId, itemData);
                if (window.SellingForm.Toast) {
                    window.SellingForm.Toast.show('저장되었습니다!', 2000);
                }
            } else {
                // 신규
                const id = await window.SellingForm.DB.addItem(itemData);
                State.projectId = id;
                if (window.SellingForm.Toast) {
                    window.SellingForm.Toast.show('프로젝트가 생성되었습니다!', 2000);
                }
            }
            State.isModified = false;
        } catch (error) {
            alert('저장 실패: ' + error.message);
        }
    }

    async function loadProject(id) {
        try {
            const item = await window.SellingForm.DB.getItem(id);
            if (!item) {
                alert('프로젝트를 찾을 수 없습니다.');
                return;
            }
            State.projectId = id;
            State.projectData = item.data;
            State.currentTemplate = item.data.template;
            State.isModified = false;
        } catch (error) {
            alert('불러오기 실패: ' + error.message);
        }
    }

    // ============================================================
    // 페이지 이탈 시 경고
    // ============================================================
    
    window.addEventListener('beforeunload', function(e) {
        if (State.isModified) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // ============================================================
    // 전역 함수 노출 (HTML onclick 등에서 사용)
    // ============================================================
    
    window.closeAiModal = closeAiModal;
    window.closeExportModal = closeExportModal;

})();


