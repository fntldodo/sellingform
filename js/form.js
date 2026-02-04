/**
 * SellingForm v3.9 - High Fidelity Dashboard Logic
 * Pixel-Perfect alignment with v3.9 Mockup
 */

(function () {
    'use strict';

    const State = {
        activeTemplateId: null,
        formData: {},
        currentCategory: 'Business',
        zoomLevel: 1.0
    };

    let Elements = {};

    function init() {
        // Collect elements at runtime to ensure DOM is ready
        Elements = {
            templateList: document.getElementById('templateCategoryList'),
            categoryLabel: document.getElementById('categoryLabel'),
            formContainer: document.getElementById('inputFormContainer'),
            dynamicForm: document.getElementById('dynamicForm'),
            paper: document.getElementById('a4Paper'),
            calcCard: document.getElementById('calcCard'),
            rightSidebar: document.getElementById('rightDetailSidebar'),
            calcSubtotal: document.getElementById('calcSubtotal'),
            calcTax: document.getElementById('calcTax'),
            calcTotal: document.getElementById('calcTotal'),
            docTitle: document.getElementById('docTitle'),
            btnCopy: document.getElementById('btnCopySheet'),
            btnPrint: document.getElementById('btnPrint'),
            copyModal: document.getElementById('copyModal'),
            // Zoom Elements
            btnZoomIn: document.getElementById('btnZoomIn'),
            btnZoomOut: document.getElementById('btnZoomOut'),
            zoomVal: document.getElementById('zoomVal')
        };

        renderTemplateList();
        attachEventListeners();
    }

    function renderTemplateList() {
        if (!Elements.templateList || !Elements.categoryLabel) return;
        Elements.templateList.innerHTML = '';

        if (!window.FormTemplates) return;

        // Render all categories and their items
        for (const catKey in window.FormTemplates) {
            const category = window.FormTemplates[catKey];

            // Category Header
            const catHeader = document.createElement('div');
            catHeader.className = 'category-popup-title';
            catHeader.style.marginTop = '20px';
            catHeader.textContent = category.title;
            Elements.templateList.appendChild(catHeader);

            category.items.forEach(item => {
                const el = document.createElement('div');
                el.className = `popup-item ${State.activeTemplateId === item.id ? 'active' : ''}`;
                el.textContent = item.name;
                el.onclick = () => selectTemplate(item.id);
                Elements.templateList.appendChild(el);
            });
        }

        if (Elements.categoryLabel) {
            Elements.categoryLabel.textContent = `All Business Documents`;
        }
    }

    function selectTemplate(templateId) {
        State.activeTemplateId = templateId;
        State.formData = {};
        State.zoomLevel = 1.0; // Reset zoom on new template
        if (Elements.zoomVal) Elements.zoomVal.textContent = '100%';
        if (Elements.paper) Elements.paper.style.transform = 'scale(1)';

        // v3.9 Mockup Logic: Specific templates trigger specific sidebars
        const template = findTemplate(templateId);
        const hasAmountFields = template && template.fields.some(f =>
            f.id.toLowerCase().includes('amount') ||
            f.id.toLowerCase().includes('price') ||
            f.id.toLowerCase().includes('interest') ||
            f.label.includes('금액') ||
            f.label.includes('금 ') // e.g. 금 0원정
        );

        if (hasAmountFields) {
            Elements.rightSidebar.classList.remove('hidden');
        } else {
            Elements.rightSidebar.classList.add('hidden');
        }

        renderTemplateList();

        // Show the Edit Data card progressively
        if (Elements.formContainer) {
            Elements.formContainer.classList.remove('hidden-initial');
            Elements.formContainer.classList.add('show');
            Elements.formContainer.classList.remove('collapsed'); // Expand Edit Data
        }

        // Auto-collapse the template card for focus
        const templateCard = document.getElementById('templateCard');
        if (templateCard) {
            templateCard.classList.add('collapsed');
        }
        Elements.docTitle.textContent = getTemplateName(templateId);

        renderInputs(templateId);
        updatePreview();
    }

    function renderInputs(templateId) {
        let template = findTemplate(templateId);
        if (!template) return;

        Elements.dynamicForm.innerHTML = '';
        template.fields.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-field';

            const label = document.createElement('label');
            label.textContent = field.label;

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.name = field.id;
            input.placeholder = field.placeholder || '';
            input.value = State.formData[field.id] || '';

            input.oninput = (e) => {
                State.formData[field.id] = e.target.value;

                // Sync Smart Calculations
                if (template.calculate) {
                    const updatedData = template.calculate(State.formData);
                    if (updatedData) {
                        updateInputsAndState(updatedData);
                    }
                }

                // Real-time Sidebar Summary Calculation
                updateSidebarSummary();

                updatePreview();
            };

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            Elements.dynamicForm.appendChild(wrapper);
        });
    }

    function updateInputsAndState(updatedData) {
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] !== State.formData[key]) {
                State.formData[key] = updatedData[key];
                const targetInput = Elements.dynamicForm.querySelector(`[name="${key}"]`);
                if (targetInput) targetInput.value = updatedData[key];
            }
        });
    }

    function updateSidebarSummary() {
        // Find amount related fields to aggregate
        let totalAmount = 0;
        const amountKeywords = ['amount', 'price', 'interest', 'total', 'fee', 'charge', 'cost', '금액', '가액', '이자'];

        Object.keys(State.formData).forEach(key => {
            const field = findFieldInCurrentTemplate(key);
            const label = field ? field.label : '';

            if (amountKeywords.some(kw => key.toLowerCase().includes(kw) || label.includes(kw))) {
                const valStr = State.formData[key] || '0';
                // Robust parsing for various currency/number formats
                const val = parseFloat(valStr.replace(/[^0-9.-]+/g, "")) || 0;

                // Avoid double counting if 'total' is already in state
                if (!key.toLowerCase().includes('total') && !label.includes('계')) {
                    totalAmount += val;
                } else if (totalAmount === 0) {
                    // Only use direct total if we haven't aggregated anything yet
                    totalAmount = val;
                }
            }
        });

        if (totalAmount > 0) {
            const subtotal = totalAmount / 1.1;
            const tax = totalAmount - subtotal;

            Elements.calcSubtotal.textContent = `₩${Math.round(subtotal).toLocaleString()}`;
            Elements.calcTax.textContent = `₩${Math.round(tax).toLocaleString()}`;
            Elements.calcTotal.textContent = `₩${Math.round(totalAmount).toLocaleString()}`;
        } else {
            Elements.calcSubtotal.textContent = '₩0';
            Elements.calcTax.textContent = '₩0';
            Elements.calcTotal.textContent = '₩0';
        }
    }

    function findFieldInCurrentTemplate(id) {
        const template = findTemplate(State.activeTemplateId);
        if (!template) return null;
        return template.fields.find(f => f.id === id);
    }

    function updatePreview() {
        const template = findTemplate(State.activeTemplateId);
        if (!template) return;

        // Ensure all numeric strings are formatted for display
        const displayData = { ...State.formData };

        // Final Date Styling for all templates
        if (displayData.submitDate) {
            displayData.submitDate = formatDateKorean(displayData.submitDate);
        }

        Elements.paper.innerHTML = template.render(displayData, 'preview');
    }

    function formatDateKorean(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
    }

    function findTemplate(id) {
        for (const cat in FormTemplates) {
            const t = FormTemplates[cat].items.find(i => i.id === id);
            if (t) return t;
        }
        return null;
    }

    function getTemplateName(id) {
        const t = findTemplate(id);
        return t ? t.name : 'SellingForm';
    }

    function attachEventListeners() {
        // Accordion Toggle
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.onclick = () => {
                header.parentElement.classList.toggle('collapsed');
            };
        });

        // Print Work (Smart Switch to Blank Mode)
        if (Elements.btnPrint) {
            Elements.btnPrint.onclick = () => {
                const template = findTemplate(State.activeTemplateId);
                if (!template) return;

                // 1. Temporarily render blank version for "Su-gi" (Manual) writing
                const originalHTML = Elements.paper.innerHTML;
                Elements.paper.innerHTML = template.render(State.formData, 'print');

                // 2. Trigger Print
                window.print();

                // 3. Restore Preview contents
                Elements.paper.innerHTML = originalHTML;
            };
        }

        // Copy Form (Rich Text Copy)
        if (Elements.btnCopy) {
            Elements.btnCopy.onclick = () => {
                const sheet = Elements.paper;
                if (!sheet || sheet.querySelector('.empty-state')) {
                    alert('먼저 서식을 선택해 주세요!');
                    return;
                }

                // Clean up selection before copying
                window.getSelection().removeAllRanges();
                const range = document.createRange();
                range.selectNode(sheet);
                window.getSelection().addRange(range);

                try {
                    const success = document.execCommand('copy');
                    if (success && Elements.copyModal) {
                        Elements.copyModal.classList.add('show');
                    } else {
                        throw new Error('execCommand failed');
                    }
                } catch (err) {
                    console.error('Copy failed:', err);
                    // Fallback for newer browsers if execCommand fails
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(sheet.innerText);
                        if (Elements.copyModal) Elements.copyModal.classList.add('show');
                    }
                }

                window.getSelection().removeAllRanges();
            };
        }

        // Mockup Search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.oninput = (e) => {
                // Future: Global search logic
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
