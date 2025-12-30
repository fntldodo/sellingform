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
    exportToZip: exportToZip,
    exportAsHTML: exportAsHTML,
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
            const canvas = document.getElementById('previewCanvas');
            return await exportToZip(canvas, options.projectName, {
                sliceHeight: options.sliceHeight || 1200,
                format: options.format || 'png'
            });
            
        } else if (exportType === 'html') {
            return await exportAsHTML(projectData, options.projectName);
            
        } else if (exportType === 'both') {
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
            sliceCanvas.toBlob(resolve, 'image/' + format, quality);
        });

        const fileName = 'slice_' + String(i + 1).padStart(2, '0') + '.' + format;
        zip.file(fileName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, projectName + '.zip');
    
    return true;
}

async function exportAsHTML(projectData, projectName) {
    if (!projectData || !projectData.data) {
        alert('프로젝트 데이터가 없습니다.');
        return false;
    }

    const zip = new JSZip();
    
    const html = generateHTML(projectData);
    zip.file('index.html', html);
    
    const css = generateCSS(projectData.template);
    zip.file('style.css', css);
    
    const images = extractImages(projectData.data);
    if (images.length > 0) {
        const imgFolder = zip.folder('images');
        for (const img of images) {
            const blob = base64ToBlob(img.data);
            imgFolder.file(img.name + '.' + img.ext, blob);
        }
    }
    
    const readme = generateReadme(projectData);
    zip.file('README.txt', readme);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, projectName + '.zip');
    
    return true;
}

function generateHTML(projectData) {
    const data = projectData.data;
    const productName = (data.hero && data.hero.productName) || '상품명';
    
    let html = '<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>' + productName + ' - 상세페이지</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="detail-page-container">\n';

    for (const sectionKey in data) {
        const sectionData = data[sectionKey];
        if (sectionData && Object.keys(sectionData).length > 0) {
            html += renderSectionHTML(sectionKey, sectionData);
        }
    }

    html += '    </div>\n</body>\n</html>';

    return html;
}

function renderSectionHTML(sectionKey, sectionData) {
    return '';
}

function generateCSS(templateId) {
    return '/* CSS */';
}

function extractImages(data) {
    const images = [];
    let imageCounter = 0;

    for (const sectionKey in data) {
        const sectionData = data[sectionKey];
        for (const slotKey in sectionData) {
            const value = sectionData[slotKey];
            if (value && typeof value === 'string' && value.startsWith('data:image/')) {
                const ext = value.split(';')[0].split('/')[1];
                const name = generateImageName(sectionKey, slotKey, imageCounter++);
                images.push({
                    name: name,
                    ext: ext,
                    data: value
                });

            }
        }
    }

    return images;
}

function generateImageName(section, slot, index) {
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

    const key = section + '_' + slot;
    return nameMap[key] || 'image_' + index;
}

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

function generateReadme(projectData) {
    const productName = (projectData.data.hero && projectData.data.hero.productName) || '제목 없음';
    return 'SellingForm - Generated Product Detail Page\n============================================\n\n프로젝트명: ' + productName + '\n템플릿: ' + (projectData.template || 'beauty_01') + '\n생성일: ' + new Date().toLocaleString('ko-KR') + '\n\nGenerated by SellingForm v3.8\n';
}

})();

