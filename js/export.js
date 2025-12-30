// ============================================================
// SellingForm v3.8 - Export Module
// 이미지 Export + HTML Export 통합 버전
// ============================================================

(function() {
    'use strict';

    // CDN 라이브러리 로드
    const scripts = [
        '[cdnjs.cloudflare.com](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js&#39;)
        '[cdnjs.cloudflare.com](https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js&#39;)
    ];

    let scriptsLoaded = 0;
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            scriptsLoaded++;
            if (scriptsLoaded === scripts.length) {
                console.log('Export 라이브러리 로드 완료');
            }
        };
        document.head.appendChild(script);
    });

    // ============================================================
    // 전역 Export 객체
    // ============================================================
    
    window.SellingForm = window.SellingForm || {};
    window.SellingForm.Export = {
        // 이미지 Export (기존)
        exportToZip: exportToZip,
        
        // HTML Export (신규)
        exportAsHTML: exportAsHTML,
        
        // 통합 Export (모달에서 호출)
        startExport: startExport
    };

    // ============================================================
    // 통합 Export 시작
    // ============================================================
    
    async function startExport(exportType, projectData, options) {
        if (!window.JSZip || !window.saveAs) {
            alert('Export 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.');
            return false;
        }

        try {
            if (exportType === 'image') {
                // 이미지 Export
                const canvas = document.getElementById('previewCanvas');
                return await exportToZip(canvas, options.projectName, {
                    sliceHeight: options.sliceHeight || 1200,
                    format: options.format || 'png'
                });
                
            } else if (exportType === 'html') {
                // HTML Export
                return await exportAsHTML(projectData, options.projectName);
                
            } else if (exportType === 'both') {
                // 둘 다 Export
                const canvas = document.getElementById('previewCanvas');
                await exportToZip(canvas, options.projectName + '_images', {
                    sliceHeight: options.sliceHeight || 1200,
                    format: options.format || 'png'
                });
                await exportAsHTML(projectData, options.projectName + '_html');
                return true;
            }
            
        } catch (error) {
            console.error('Export 실패:', error);
            alert('Export 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    }

    // ============================================================
    // 이미지 Export (기존 기능 유지)
    // ============================================================
    
    async function exportToZip(canvas, projectName, options = {}) {
        const {
            sliceHeight = 1200,
            format = 'png',
            quality = 0.9
        } = options;

        if (!canvas) {
            alert('캔버스를 찾을 수 없습니다.');
            return false;
        }

        const zip = new JSZip();
        const totalHeight = canvas.height;
        const width = canvas.width;
        const sliceCount = Math.ceil(totalHeight / sliceHeight);

        for (let i = 0; i < sliceCount; i++) {
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = width;
            
            const currentSliceHeight = Math.min(sliceHeight, totalHeight - (i * sliceHeight));
            sliceCanvas.height = currentSliceHeight;

            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(
                canvas,
                0, i * sliceHeight,
                width, currentSliceHeight,
                0, 0,
                width, currentSliceHeight
            );

            const blob = await new Promise(resolve => {
                sliceCanvas.toBlob(resolve, `image/${format}`, quality);
            });

            const fileName = `slice_${String(i + 1).padStart(2, '0')}.${format}`;
            zip.file(fileName, blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${projectName}.zip`);
        
        return true;
    }

    // ============================================================
    // HTML Export (신규 기능)
    // ============================================================
    
    async function exportAsHTML(projectData, projectName) {
        if (!projectData || !projectData.data) {
            alert('프로젝트 데이터가 없습니다.');
            return false;
        }

        const zip = new JSZip();
        
        // 1. HTML 생성
        const html = generateHTML(projectData);
        zip.file('index.html', html);
        
        // 2. CSS 생성
        const css = generateCSS(projectData.template);
        zip.file('style.css', css);
        
        // 3. 이미지 추출
        const images = extractImages(projectData.data);
        if (images.length > 0) {
            const imgFolder = zip.folder('images');
            for (const img of images) {
                const blob = base64ToBlob(img.data);
                imgFolder.file(`${img.name}.${img.ext}`, blob);
            }
        }
        
        // 4. README 파일 추가
        const readme = generateReadme(projectData);
        zip.file('README.txt', readme);
        
        // 5. ZIP 다운로드
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${projectName}.zip`);
        
        return true;
    }

    // ============================================================
    // HTML 생성
    // ============================================================
    
    function generateHTML(projectData) {
        const data = projectData.data;
        const productName = (data.hero && data.hero.productName) || '상품명';
        
        let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productName} - 상세페이지</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="detail-page-container">
`;

        // 각 섹션별 HTML 생성
        for (const [sectionKey, sectionData] of Object.entries(data)) {
            if (sectionData && Object.keys(sectionData).length > 0) {
                html += renderSectionHTML(sectionKey, sectionData);
            }
        }

        html += `
    </div>
</body>
</html>`;

        return html;
    }

    // ============================================================
    // 섹션별 HTML 렌더링
    // ============================================================
    
    function renderSectionHTML(sectionKey, sectionData) {
        switch (sectionKey) {
            case 'hero':
                return renderHeroSection(sectionData);
            case 'usp':
                return renderUSPSection(sectionData);
            case 'price':
                return renderPriceSection(sectionData);
            case 'proof':
                return renderProofSection(sectionData);
            case 'detail':
                return renderDetailSection(sectionData);
            case 'howto':
                return renderHowtoSection(sectionData);
            case 'faq':
                return renderFAQSection(sectionData);
            case 'shipping':
                return renderShippingSection(sectionData);
            case 'brand':
                return renderBrandSection(sectionData);
            default:
                return '';
        }
    }

    function renderHeroSection(data) {
        return `
    <section class="hero-section">
        ${data.mainImage ? '<div class="hero-image"><img src="images/hero_main.jpg" alt="' + (data.productName || '') + '"></div>' : ''}
        <div class="hero-content">
            <h1 class="product-name">${data.productName || ''}</h1>
            ${data.mainCopy ? `<p class="main-copy">${data.mainCopy}</p>` : ''}
            ${data.subCopy ? `<p class="sub-copy">${data.subCopy}</p>` : ''}
            ${data.gallery1 || data.gallery2 || data.gallery3 ? `
            <div class="hero-gallery">
                ${data.gallery1 ? `<img src="images/gallery1.jpg" alt="갤러리 1">` : ''}
                ${data.gallery2 ? `<img src="images/gallery2.jpg" alt="갤러리 2">` : ''}
                ${data.gallery3 ? `<img src="images/gallery3.jpg" alt="갤러리 3">` : ''}
            </div>` : ''}
        </div>
    </section>
`;
    }

    function renderUSPSection(data) {
        return `
    <section class="usp-section">
        <div class="usp-container">
            ${data.title1 ? `
            <div class="usp-item">
                ${data.icon1 ? `<div class="usp-icon"><img src="images/usp_icon1.png" alt="USP 1"></div>` : ''}
                <h3 class="usp-title">${data.title1}</h3>
                ${data.desc1 ? `<p class="usp-desc">${data.desc1}</p>` : ''}
            </div>` : ''}
            ${data.title2 ? `
            <div class="usp-item">
                ${data.icon2 ? `<div class="usp-icon"><img src="images/usp_icon2.png" alt="USP 2"></div>` : ''}
                <h3 class="usp-title">${data.title2}</h3>
                ${data.desc2 ? `<p class="usp-desc">${data.desc2}</p>` : ''}
            </div>` : ''}
            ${data.title3 ? `
            <div class="usp-item">
                ${data.icon3 ? `<div class="usp-icon"><img src="images/usp_icon3.png" alt="USP 3"></div>` : ''}
                <h3 class="usp-title">${data.title3}</h3>
                ${data.desc3 ? `<p class="usp-desc">${data.desc3}</p>` : ''}
            </div>` : ''}
        </div>
    </section>
`;
    }

    function renderPriceSection(data) {
        if (!data.priceText) return '';
        return `
    <section class="price-section">
        <div class="price-content">
            <pre class="price-text">${data.priceText}</pre>
        </div>
    </section>
`;
    }

    function renderProofSection(data) {
        if (!data.review1 && !data.review2 && !data.review3 && !data.certification) return '';
        return `
    <section class="proof-section">
        <h2 class="section-title">고객 후기 & 인증</h2>
        <div class="proof-container">
            ${data.review1 ? `<div class="review-item">"${data.review1}"</div>` : ''}
            ${data.review2 ? `<div class="review-item">"${data.review2}"</div>` : ''}
            ${data.review3 ? `<div class="review-item">"${data.review3}"</div>` : ''}
            ${data.certification ? `<div class="certification">${data.certification}</div>` : ''}
        </div>
    </section>
`;
    }

    function renderDetailSection(data) {
        if (!data.detailImage && !data.detailText) return '';
        return `
    <section class="detail-section">
        ${data.detailImage ? `<img src="images/detail_main.jpg" alt="상세 이미지" class="detail-image">` : ''}
        ${data.detailText ? `<div class="detail-text">${data.detailText}</div>` : ''}
    </section>
`;
    }

    function renderHowtoSection(data) {
        return `
    <section class="howto-section">
        <h2 class="section-title">사용 방법</h2>
        <div class="howto-steps">
            ${data.step1Title ? `
            <div class="step">
                <div class="step-number">1</div>
                <h3>${data.step1Title}</h3>
                ${data.step1Desc ? `<p>${data.step1Desc}</p>` : ''}
            </div>` : ''}
            ${data.step2Title ? `
            <div class="step">
                <div class="step-number">2</div>
                <h3>${data.step2Title}</h3>
                ${data.step2Desc ? `<p>${data.step2Desc}</p>` : ''}
            </div>` : ''}
            ${data.step3Title ? `
            <div class="step">
                <div class="step-number">3</div>
                <h3>${data.step3Title}</h3>
                ${data.step3Desc ? `<p>${data.step3Desc}</p>` : ''}
            </div>` : ''}
            ${data.step4Title ? `
            <div class="step">
                <div class="step-number">4</div>
                <h3>${data.step4Title}</h3>
                ${data.step4Desc ? `<p>${data.step4Desc}</p>` : ''}
            </div>` : ''}
        </div>
    </section>
`;
    }

    function renderFAQSection(data) {
        if (!data.q1 && !data.q2 && !data.q3) return '';
        return `
    <section class="faq-section">
        <h2 class="section-title">자주 묻는 질문</h2>
        <div class="faq-list">
            ${data.q1 ? `
            <div class="faq-item">
                <h3 class="faq-question">Q. ${data.q1}</h3>
                ${data.a1 ? `<p class="faq-answer">A. ${data.a1}</p>` : ''}
            </div>` : ''}
            ${data.q2 ? `
            <div class="faq-item">
                <h3 class="faq-question">Q. ${data.q2}</h3>
                ${data.a2 ? `<p class="faq-answer">A. ${data.a2}</p>` : ''}
            </div>` : ''}
            ${data.q3 ? `
            <div class="faq-item">
                <h3 class="faq-question">Q. ${data.q3}</h3>
                ${data.a3 ? `<p class="faq-answer">A. ${data.a3}</p>` : ''}
            </div>` : ''}
        </div>
    </section>
`;
    }

    function renderShippingSection(data) {
        if (!data.shipping && !data.exchange && !data.refund && !data.contact) return '';
        return `
    <section class="shipping-section">
        <h2 class="section-title">배송 & 고객센터</h2>
        <div class="shipping-info">
            ${data.shipping ? `<div class="info-box"><h4>배송 안내</h4><pre>${data.shipping}</pre></div>` : ''}
            ${data.exchange ? `<div class="info-box"><h4>교환 안내</h4><pre>${data.exchange}</pre></div>` : ''}
            ${data.refund ? `<div class="info-box"><h4>환불 안내</h4><pre>${data.refund}</pre></div>` : ''}
            ${data.contact ? `<div class="info-box"><h4>문의</h4><p>${data.contact}</p></div>` : ''}
        </div>
    </section>
`;
    }

    function renderBrandSection(data) {
        return `
    <section class="brand-section">
        ${data.logo ? `<div class="brand-logo"><img src="images/brand_logo.png" alt="브랜드 로고"></div>` : ''}
        ${data.intro1 ? `<p class="brand-intro">${data.intro1}</p>` : ''}
        ${data.intro2 ? `<p class="brand-intro">${data.intro2}</p>` : ''}
        ${data.brandImage ? `<img src="images/brand_main.jpg" alt="브랜드 이미지" class="brand-image">` : ''}
        ${data.motto ? `<p class="brand-motto">${data.motto}</p>` : ''}
    </section>
`;
    }

    // ============================================================
    // CSS 생성
    // ============================================================
    
    function generateCSS(templateId) {
        return `/* ============================================================
   SellingForm - Generated CSS
   Template: ${templateId || 'default'}
============================================================ */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
}

.detail-page-container {
    max-width: 860px;
    margin: 0 auto;
    background: #fff;
}

/* Hero Section */
.hero-section {
    padding: 60px 40px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.hero-image img {
    max-width: 100%;
    height: auto;
    margin-bottom: 30px;
    border-radius: 12px;
}

.product-name {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 20px;
}

.main-copy {
    font-size: 24px;
    margin-bottom: 15px;
    opacity: 0.95;
}

.sub-copy {
    font-size: 18px;
    opacity: 0.9;
}

.hero-gallery {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
}

.hero-gallery img {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
}

/* USP Section */
.usp-section {
    padding: 80px 40px;
    background: #f9fafb;
}

.usp-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
}

.usp-item {
    text-align: center;
}

.usp-icon img {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
}

.usp-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #1a202c;
}

.usp-desc {
    font-size: 15px;
    color: #4a5568;
    line-height: 1.7;
}

/* Price Section */
.price-section {
    padding: 60px 40px;
    background: #fff3cd;
    text-align: center;
}

.price-text {
    font-size: 18px;
    white-space: pre-wrap;
    font-family: inherit;
}

/* Proof Section */
.proof-section {
    padding: 80px 40px;
}

.section-title {
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 40px;
}

.proof-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.review-item {
    padding: 20px;
    background: #f7fafc;
    border-radius: 8px;
    font-style: italic;
}

.certification {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
    background: #e6fffa;
    border-radius: 8px;
    font-weight: 600;
}

/* Detail Section */
.detail-section {
    padding: 60px 40px;
}

.detail-image {
    width: 100%;
    height: auto;
    margin-bottom: 30px;
}

.detail-text {
    font-size: 16px;
    line-height: 1.8;
    white-space: pre-wrap;
}

/* Howto Section */
.howto-section {
    padding: 80px 40px;
    background: #f9fafb;
}

.howto-steps {
    display: grid;
    gap: 30px;
}

.step {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.step-number {
    width: 50px;
    height: 50px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    flex-shrink: 0;
}

.step h3 {
    font-size: 20px;
    margin-bottom: 8px;
}

.step p {
    color: #4a5568;
}

/* FAQ Section */
.faq-section {
    padding: 80px 40px;
}

.faq-list {
    max-width: 700px;
    margin: 0 auto;
}

.faq-item {
    margin-bottom: 30px;
    padding-bottom: 30px;
    border-bottom: 1px solid #e2e8f0;
}

.faq-question {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #1a202c;
}

.faq-answer {
    font-size: 16px;
    color: #4a5568;
    line-height: 1.7;
}

/* Shipping Section */
.shipping-section {
    padding: 80px 40px;
    background: #f7fafc;
}

.shipping-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
}

.info-box {
    padding: 30px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.info-box h4 {
    font-size: 18px;
    margin-bottom: 15px;
    color: #1a202c;
}

.info-box pre {
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 14px;
    color: #4a5568;
}

/* Brand Section */
.brand-section {
    padding: 80px 40px;
    text-align: center;
}

.brand-logo img {
    width: 150px;
    height: auto;
    margin-bottom: 30px;
}

.brand-intro {
    font-size: 18px;
    margin-bottom: 15px;
    color: #1a202c;
}

.brand-image {
    width: 100%;
    max-width: 600px;
    height: auto;
    margin: 30px auto;
    border-radius: 12px;
}

.brand-motto {
    font-size: 20px;
    font-weight: 600;
    color: #667eea;
    margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
    .usp-container,
    .proof-container,
    .shipping-info {
        grid-template-columns: 1fr;
    }
    
    .hero-gallery {
        flex-wrap: wrap;
    }
    
    .product-name {
        font-size: 28px;
    }
    
    .main-copy {
        font-size: 18px;
    }
}
`;
    }

    // ============================================================
    // 이미지 추출
    // ============================================================
    
    function extractImages(data) {
        const images = [];
        let imageCounter = 0;

        for (const [sectionKey, sectionData] of Object.entries(data)) {
            for (const [slotKey, value] of Object.entries(sectionData)) {
                if (value && typeof value === 'string' && value.startsWith('data:image/')) {
                    // Base64 이미지 감지
                    const ext = value.split(';')[0].split('/')[1]; // png, jpg, etc
                    const name = generateImageName(sectionKey, slotKey, imageCounter++);
                // ✅ 수정
                images.push({
                    name: name,
                    ext: ext,
                    data: value  // '' 로 수정
                });

                }
            }
        }

        return images;
    }

    function generateImageName(section, slot, index) {
        // 섹션별 이미지 이름 매핑
        const nameMap = {
            'hero_mainImage': 'hero_main',
            'hero_gallery1': 'gallery1',
            'hero_gallery2': 'gallery2',
            'hero_gallery3': 'gallery3',
            'usp_icon1': 'usp_icon1',
            'usp_icon2': 'usp_icon2',
            'usp_icon3': 'usp_icon3',
            'detail_detailImage': 'detail_main',
            'brand_logo': 'brand_logo',
            'brand_brandImage': 'brand_main'
        };

        const key = `${section}_${slot}`;
        return nameMap[key] || `image_${index}`;
    }

    // ============================================================
    // Base64 → Blob 변환
    // ============================================================
    
    function base64ToBlob(base64) {
        const parts = base64.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    }

    // ============================================================
    // README 생성
    // ============================================================
    
    function generateReadme(projectData) {
        return `SellingForm - Generated Product Detail Page
============================================

프로젝트명: ${(projectData.data.hero && projectData.data.hero.productName) || '제목 없음'}
템플릿: ${projectData.template || 'beauty_01'}
생성일: ${new Date().toLocaleString('ko-KR')}

파일 구조:
- index.html : 메인 HTML 파일
- style.css : 스타일시트
- images/ : 이미지 파일들

사용 방법:
1. index.html을 브라우저에서 열어 확인
2. 웹 서버에 업로드하여 실제 사용
3. 필요 시 HTML/CSS 커스터마이징

주의사항:
- 이미지는 Base64에서 변환되었습니다
- 반응형 디자인이 적용되어 있습니다
- 필요 시 style.css를 수정하여 디자인 변경 가능

Generated by SellingForm v3.8
`;
    }

})();
