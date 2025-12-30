// ============================================================
// SellingForm v3.10 - Module A: Product Detail Builder
// 버튼 상태 표시 + 중복 제거 버전
// ============================================================

(function() {
    'use strict';

    const State = {
        currentTemplate: 'beauty_01',
        currentSection: 'hero',
        projectData: null,
        projectId: null,
        isModified: false
    };

   const TemplateSpec = {
    beauty_01: {
        name: 'Beauty Template 01',
        sections: {
            hero: {
                name: 'HERO',
                icon: '🎯',
                slots: {
                    productName: { type: 'text', label: '제품명', required: true, maxLength: 30 },
                    mainCopy: { type: 'text', label: '한줄 USP', required: true, maxLength: 50 },
                    subCopy: { type: 'text', label: '서브 카피', required: true, maxLength: 60 },
                    mainImage: { type: 'image', label: '메인 이미지', required: true }
                }
            },
            usp: {
                name: 'USP-3',
                icon: '⭐',
                slots: {
                    title1: { type: 'text', label: '제목 1', required: true, maxLength: 20 },
                    desc1: { type: 'textarea', label: '설명 1', required: true, maxLength: 50 },
                    title2: { type: 'text', label: '제목 2', required: true, maxLength: 20 },
                    desc2: { type: 'textarea', label: '설명 2', required: true, maxLength: 50 },
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
                    step1Title: { type: 'text', label: '1단계', required: true, maxLength: 20 },
                    step2Title: { type: 'text', label: '2단계', required: true, maxLength: 20 },
                    step3Title: { type: 'text', label: '3단계', required: true, maxLength: 20 }
                }
            },
            faq: {
                name: 'FAQ',
                icon: '❓',
                slots: {
                    q1: { type: 'text', label: '질문 1', required: false, maxLength: 50 },
                    a1: { type: 'textarea', label: '답변 1', required: false, maxLength: 100 }
                }
            },
            shipping: {
                name: '배송·CS',
                icon: '🚚',
                slots: {
                    shipping: { type: 'textarea', label: '배송 안내', required: false, maxLength: 100 }
                }
            },
            brand: {
                name: 'BRAND',
                icon: '🏢',
                slots: {
                    intro1: { type: 'text', label: '브랜드 소개', required: true, maxLength: 50 },
                    brandImage: { type: 'image', label: '대표 이미지', required: true }
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
        for (const [sectionKey, sectionSpec] of Object.entries(template.sections)) {
            data[sectionKey] = {};
            for (const [slotKey, slotSpec] of Object.entries(sectionSpec.slots)) {
                data[sectionKey][slotKey] = slotSpec.type === 'image' ? null : '';
            }
        }

        return {
            template: State.currentTemplate,
            title: `새 상세페이지 - ${template.name}`,
            data
        };
    }

    document.addEventListener('DOMContentLoaded', async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get('template');
        const projectId = urlParams.get('id');

        if (templateId && TemplateSpec[templateId]) {
            State.currentTemplate = templateId;
        }

        if (projectId) {
            await loadProject(parseInt(projectId));
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
        
        for (const [sectionKey, sectionSpec] of Object.entries(template.sections)) {
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
            
            btn.innerHTML = `${sectionSpec.icon} ${sectionSpec.name}${statusIcon}`;
            
            if (sectionKey === State.currentSection) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', () => selectSection(sectionKey));
            sectionNav.appendChild(btn);
        }
    }

    function checkSectionCompleted(sectionKey, sectionSpec) {
        const sectionData = State.projectData.data[sectionKey];
        if (!sectionData) return false;
        
        for (const [slotKey, slotSpec] of Object.entries(sectionSpec.slots)) {
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
        for (const slotSpec of Object.values(sectionSpec.slots)) {
            if (slotSpec.required) return true;
        }
        return false;
    }

    function initUI() {
        const btnSave = document.getElementById('btnSave');
        if (btnSave) btnSave.addEventListener('click', saveProject);

        const btnGenerateAi = document.getElementById('btnGenerateAi');
        if (btnGenerateAi) btnGenerateAi.addEventListener('click', generateAICopy);
    }

    function selectSection(sectionKey) {
        State.currentSection = sectionKey;

        document.querySelectorAll('.section-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-section="${sectionKey}"]`);
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
        sectionTitle.textContent = `${sectionSpec.icon} ${sectionSpec.name}`;
        editorContainer.appendChild(sectionTitle);

        for (const [slotKey, slotSpec] of Object.entries(sectionSpec.slots)) {
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
        labelText.textContent = slotSpec.label;
        slotLabel.appendChild(labelText);

        if (slotSpec.required) {
            const badge = document.createElement('span');
            badge.className = 'slot-required';
            badge.textContent = '필수';
            slotLabel.appendChild(badge);
        }

        slotItem.appendChild(slotLabel);

        let inputElement;

        if (slotSpec.type === 'text') {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'slot-input';
            inputElement.value = currentValue || '';
            inputElement.placeholder = slotSpec.label;
            if (slotSpec.maxLength) inputElement.maxLength = slotSpec.maxLength;
            inputElement.addEventListener('input', () => updateSlotData(sectionKey, slotKey, inputElement.value));

        } else if (slotSpec.type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.className = 'slot-input slot-textarea';
            inputElement.value = currentValue || '';
            inputElement.placeholder = slotSpec.label;
            if (slotSpec.maxLength) inputElement.maxLength = slotSpec.maxLength;
            inputElement.addEventListener('input', () => updateSlotData(sectionKey, slotKey, inputElement.value));

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
            btn.textContent = '이미지 변경';
            btn.className = 'btn-secondary';
            btn.addEventListener('click', () => triggerImageUpload(sectionKey, slotKey));
            container.appendChild(btn);
        } else {
            const uploadBox = document.createElement('div');
            uploadBox.className = 'image-upload-box';
            uploadBox.innerHTML = '<div style="color: #999; font-size: 2rem;">📷</div><p style="color: #666;">클릭하여 이미지 업로드</p>';
            uploadBox.addEventListener('click', () => triggerImageUpload(sectionKey, slotKey));
            container.appendChild(uploadBox);
        }

        return container;
    }

    function triggerImageUpload(sectionKey, slotKey) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
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
        reader.onload = (e) => {
            updateSlotData(sectionKey, slotKey, e.target.result);
            renderSectionEditor(sectionKey);
            renderPreview();
        };
        reader.readAsDataURL(file);
    }

    function updateSlotData(sectionKey, slotKey, value) {
        State.projectData.data[sectionKey][slotKey] = value;
        State.isModified = true;
        renderPreview();
        renderSectionButtons();
    }

    function renderPreview() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.height = 5000;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 860, 5000);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';

        const heroData = State.projectData.data.hero;
        if (heroData?.productName) {
            ctx.fillText(heroData.productName, 430, 50);
        }
        if (heroData?.mainCopy) {
            ctx.font = '24px Arial';
            ctx.fillText(heroData.mainCopy, 430, 110);
        }
    }

    async function saveProject() {
        const title = State.projectData.data.hero?.productName || '제목 없음';
        
        const itemData = {
            type: 'detail',
            title: title,
            thumbnail: null,
            data: State.projectData
        };

        try {
            if (State.projectId) {
                await window.SellingForm.DB.updateItem(State.projectId, itemData);
                alert('저장되었습니다!');
            } else {
                const id = await window.SellingForm.DB.addItem(itemData);
                State.projectId = id;
                alert('프로젝트가 생성되었습니다!');
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

    window.addEventListener('beforeunload', (e) => {
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

    window.closeAiModal = () => {
        const modal = document.getElementById('aiModal');
        if (modal) modal.classList.remove('active');
    };

    function generateAICopy() {
        alert('AI 생성 기능은 준비 중입니다.');
    }

})();
