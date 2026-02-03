/**
 * SellingForm v3.9 - Module L: Landing Page Builder
 * Premium Redesign + Unified I18n
 */

(function () {
    'use strict';

    // 템플릿 데이터
    const TEMPLATES = [
        {
            id: 'startup',
            name: '스타트업 런칭',
            description: 'SaaS, 앱, 서비스 런칭에 최적화된 모던한 원페이지',
            icon: '🚀',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            tags: ['서비스', 'SaaS', '앱'],
            fields: [
                { key: 'title', label: '서비스명', default: 'ProductName', type: 'text' },
                { key: 'tagline', label: '슬로건', default: '더 스마트한 방법으로 일하세요', type: 'text' },
                { key: 'description', label: '설명', default: '우리 서비스는 당신의 업무를 혁신합니다.', type: 'textarea' },
                { key: 'cta', label: 'CTA 버튼', default: '무료로 시작하기', type: 'text' },
                { key: 'feature1', label: '특징 1', default: '빠른 속도', type: 'text' },
                { key: 'feature2', label: '특징 2', default: '쉬운 사용', type: 'text' },
                { key: 'feature3', label: '특징 3', default: '안전한 보안', type: 'text' }
            ]
        },
        {
            id: 'portfolio',
            name: '포트폴리오',
            description: '디자이너, 개발자를 위한 깔끔한 포트폴리오 페이지',
            icon: '🎨',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            tags: ['디자이너', '개발자', '크리에이터'],
            fields: [
                { key: 'name', label: '이름', default: '홍길동', type: 'text' },
                { key: 'title', label: '직함', default: 'UI/UX 디자이너', type: 'text' },
                { key: 'bio', label: '소개', default: '5년차 디자이너로 다양한 프로젝트를 수행했습니다.', type: 'textarea' },
                { key: 'email', label: '이메일', default: 'hello@example.com', type: 'text' },
                { key: 'skill1', label: '스킬 1', default: 'Figma', type: 'text' },
                { key: 'skill2', label: '스킬 2', default: 'Photoshop', type: 'text' },
                { key: 'skill3', label: '스킬 3', default: 'Illustrator', type: 'text' }
            ]
        },
        {
            id: 'company',
            name: '회사 소개',
            description: '기업, 에이전시를 위한 신뢰감 있는 회사 소개 페이지',
            icon: '🏢',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            tags: ['기업', '에이전시', 'B2B'],
            fields: [
                { key: 'company', label: '회사명', default: '(주)테크스타트', type: 'text' },
                { key: 'slogan', label: '슬로건', default: '기술로 세상을 바꿉니다', type: 'text' },
                { key: 'about', label: '회사 소개', default: '2015년 설립된 IT 솔루션 기업입니다.', type: 'textarea' },
                { key: 'service1', label: '서비스 1', default: '웹 개발', type: 'text' },
                { key: 'service2', label: '서비스 2', default: '앱 개발', type: 'text' },
                { key: 'service3', label: '서비스 3', default: '컨설팅', type: 'text' },
                { key: 'contact', label: '연락처', default: '02-1234-5678', type: 'text' }
            ]
        },
        {
            id: 'freelancer',
            name: '프리랜서',
            description: '1인 사업자, 전문가를 위한 개인 브랜딩 페이지',
            icon: '💼',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            tags: ['1인 사업', '전문가', '컨설턴트'],
            fields: [
                { key: 'name', label: '이름', default: '김프리', type: 'text' },
                { key: 'specialty', label: '전문 분야', default: '마케팅 컨설턴트', type: 'text' },
                { key: 'intro', label: '자기 소개', default: '10년 경력의 마케팅 전문가입니다.', type: 'textarea' },
                { key: 'price', label: '상담 비용', default: '시간당 10만원', type: 'text' },
                { key: 'cta', label: 'CTA 버튼', default: '상담 예약하기', type: 'text' },
                { key: 'email', label: '이메일', default: 'contact@example.com', type: 'text' }
            ]
        }
    ];

    const TEMPLATE_GENERATORS = {
        startup: (data) => `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - ${data.tagline}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap">
    <style>
        :root { --primary: #6366f1; --primary-dark: #4f46e5; --text-main: #111827; --text-sub: #4b5563; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--text-main); line-height: 1.5; overflow-x: hidden; }
        .bg-glow { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #fff; z-index: -1; }
        .bg-glow::before { content: ''; position: absolute; top: -10%; left: -10%; width: 50%; height: 50%; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%); filter: blur(60px); }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .hero { padding: 120px 0 80px; text-align: center; }
        .hero h1 { font-size: clamp(40px, 8vw, 72px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 24px; }
        .hero h1 span { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .desc { font-size: 20px; color: var(--text-sub); max-width: 640px; margin: 0 auto 48px; }
        .btn { display: inline-block; padding: 16px 36px; border-radius: 12px; font-size: 18px; font-weight: 700; text-decoration: none; color: white; background: var(--primary); }
        .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; padding: 80px 0; }
        .feature-card { background: white; border: 1px solid #E5E7EB; padding: 40px; border-radius: 24px; }
        .feature-icon { font-size: 40px; margin-bottom: 20px; display: block; }
        @media (max-width: 768px) { .features { grid-template-columns: 1fr; } .hero h1 { font-size: 48px; } }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="container">
        <section class="hero">
            <h1>${data.title} <span>Innovated.</span></h1>
            <p class="desc">${data.description}</p>
            <a href="#" class="btn">${data.cta}</a>
        </section>
        <section class="features">
            <div class="feature-card"><span class="feature-icon">⚡</span><h3>${data.feature1}</h3><p>Fast and reliable service for your business.</p></div>
            <div class="feature-card"><span class="icon">🎯</span><h3>${data.feature2}</h3><p>Focused on user experience and simplicity.</p></div>
            <div class="feature-card"><span class="icon">🔒</span><h3>${data.feature3}</h3><p>Secure and robust infrastructure for data.</p></div>
        </section>
    </div>
</body>
</html>`
    };

    const State = {
        currentTemplate: null,
        editData: {}
    };

    function init() {
        renderGallery();
        initEventListeners();
    }

    function initEventListeners() {
        const btnBack = document.getElementById('btnBackToGallery');
        const btnDownload = document.getElementById('btnDownloadZip');

        if (btnBack) btnBack.onclick = showGallery;
        if (btnDownload) btnDownload.onclick = downloadZip;

        // Preview Mode Switching
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preview-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const panel = document.getElementById('previewPanel');
                if (btn.dataset.size === 'mobile') {
                    panel.classList.add('mobile-mode');
                } else {
                    panel.classList.remove('mobile-mode');
                }
            });
        });

        // Listen for I18n language change
        window.addEventListener('languageChanged', (e) => {
            console.log('Language changed to:', e.detail.lang);
            // Re-render if in gallery to update descriptions
            if (!State.currentTemplate) renderGallery();
        });
    }

    function renderGallery() {
        const grid = document.getElementById('templateGrid');
        if (!grid) return;

        grid.innerHTML = TEMPLATES.map(t => `
            <div class="template-card" onclick="window.SellingForm.Landing.selectTemplate('${t.id}')">
                <div class="template-thumb" style="background: ${t.gradient}">
                    <span>${t.icon}</span>
                </div>
                <div class="template-info">
                    <h3>${t.name}</h3>
                    <p>${t.description}</p>
                </div>
            </div>
        `).join('');
    }

    function selectTemplate(id) {
        const template = TEMPLATES.find(t => t.id === id);
        if (!template) return;

        State.currentTemplate = template;
        State.editData = {};
        template.fields.forEach(f => {
            State.editData[f.key] = f.default;
        });

        showEditMode();
    }

    function showEditMode() {
        document.getElementById('galleryMode').style.display = 'none';
        document.getElementById('editMode').style.display = 'block';
        document.getElementById('btnBackToGallery').style.display = 'inline-block';
        document.getElementById('btnDownloadZip').style.display = 'inline-block';

        renderEditFields();
        updatePreview();
    }

    function showGallery() {
        document.getElementById('galleryMode').style.display = 'block';
        document.getElementById('editMode').style.display = 'none';
        document.getElementById('btnBackToGallery').style.display = 'none';
        document.getElementById('btnDownloadZip').style.display = 'none';

        State.currentTemplate = null;
        State.editData = {};
    }

    function renderEditFields() {
        const container = document.getElementById('editFields');
        if (!container || !State.currentTemplate) return;

        container.innerHTML = State.currentTemplate.fields.map(f => `
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display:block; font-size:13px; font-weight:700; color:#64748B; margin-bottom:8px;">${f.label}</label>
                ${f.type === 'textarea'
                ? `<textarea class="premium-input" style="width:100%; height:120px; padding:12px; border:1px solid #E2E8F0; border-radius:12px;" data-key="${f.key}">${State.editData[f.key]}</textarea>`
                : `<input type="text" class="premium-input" style="width:100%; padding:12px; border:1px solid #E2E8F0; border-radius:12px;" data-key="${f.key}" value="${State.editData[f.key]}">`
            }
            </div>
        `).join('');

        // Attach events
        container.querySelectorAll('.premium-input').forEach(input => {
            input.oninput = (e) => {
                const key = e.target.dataset.key;
                State.editData[key] = e.target.value;
                updatePreview();
            };
        });
    }

    function updatePreview() {
        const generator = TEMPLATE_GENERATORS[State.currentTemplate.id] || TEMPLATE_GENERATORS.startup;
        const html = generator(State.editData);
        const frame = document.getElementById('previewFrame');
        if (frame) {
            frame.srcdoc = html;
        }
    }

    async function downloadZip() {
        if (!window.JSZip || !State.currentTemplate) return;

        const generator = TEMPLATE_GENERATORS[State.currentTemplate.id] || TEMPLATE_GENERATORS.startup;
        const html = generator(State.editData);

        const zip = new JSZip();
        zip.file('index.html', html);
        zip.file('README.md', `# ${State.editData.title || State.editData.name || 'My Landing Page'}\n\nGenerated by SellingForm v3.9`);

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `landing_${State.currentTemplate.id}_${Date.now()}.zip`;
        a.click();

        if (window.SellingForm && window.SellingForm.Toast) {
            window.SellingForm.Toast.show('ZIP 파일이 성공적으로 생성되었습니다.', 3000);
        }
    }

    // Expose selectTemplate
    window.SellingForm = window.SellingForm || {};
    window.SellingForm.Landing = {
        selectTemplate: selectTemplate
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
