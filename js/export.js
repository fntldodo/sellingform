/* ============================================================
   🟣 SellingForm Export (ZIP/Image/HTML)
   - GitHub Pages(정적) 환경에서 동작하도록 CDN 로더 포함
   - JSZip + FileSaver.js(saveAs) 의존
   - detail.html / workbench.html 에서 공통 사용
   ============================================================ */

(function () {
  'use strict';

  // 네임스페이스 보장
  window.SellingForm = window.SellingForm || {};

  // ------------------------------
  // CDN 로더 (중복 로드 방지)
  // ------------------------------
  const CDN = {
    JSZIP: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    FILESAVER: 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
  };

  const _loadCache = new Map();

  function loadScriptOnce(src) {
    if (_loadCache.has(src)) return _loadCache.get(src);

    const p = new Promise((resolve, reject) => {
      // 이미 동일 src가 DOM에 있으면 onload를 기다림
      const existing = Array.from(document.scripts || []).find((s) => s.src === src);
      if (existing) {
        // 이미 로드 완료되었을 수도 있으니 microtask에서 검사
        Promise.resolve().then(resolve);
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('스크립트 로드 실패: ' + src));
      document.head.appendChild(script);
    });

    _loadCache.set(src, p);
    return p;
  }

  async function ensureExportLibs() {
    // JSZip, saveAs(FileSaver) 둘 다 필요
    if (window.JSZip && typeof window.saveAs === 'function') return true;

    await loadScriptOnce(CDN.JSZIP);
    await loadScriptOnce(CDN.FILESAVER);

    return !!(window.JSZip && typeof window.saveAs === 'function');
  }

  // ------------------------------
  // 공개 API
  // ------------------------------
  window.SellingForm.Export = {
    startExport,
    exportToZip,
    exportAsHTML
  };

  /**
   * exportType: 'image' | 'html' | 'both'
   * projectData: { template, data }
   * options: { projectName, sliceHeight, format, quality }
   */
  async function startExport(exportType, projectData, options) {
    options = options || {};

    const ok = await ensureExportLibs();
    if (!ok) {
      alert('Export 라이브러리 로딩에 실패했습니다. (JSZip/FileSaver)');
      return false;
    }

    try {
      if (exportType === 'image') {
        const canvas = document.getElementById('previewCanvas');
        return await exportToZip(canvas, options.projectName || 'sellingform', {
          sliceHeight: options.sliceHeight || 1200,
          format: options.format || 'png',
          quality: typeof options.quality === 'number' ? options.quality : 0.92
        });
      }

      if (exportType === 'html') {
        return await exportAsHTML(projectData, options.projectName || 'sellingform_html');
      }

      if (exportType === 'both') {
        const canvas = document.getElementById('previewCanvas');
        await exportToZip(canvas, (options.projectName || 'sellingform') + '_images', {
          sliceHeight: options.sliceHeight || 1200,
          format: options.format || 'png',
          quality: typeof options.quality === 'number' ? options.quality : 0.92
        });
        return await exportAsHTML(projectData, (options.projectName || 'sellingform') + '_html');
      }

      alert('알 수 없는 exportType: ' + exportType);
      return false;
    } catch (err) {
      console.error('Export 실패:', err);
      alert('Export 중 오류가 발생했습니다: ' + (err && err.message ? err.message : err));
      return false;
    }
  }

  // ------------------------------
  // 이미지 슬라이스 ZIP 내보내기
  // ------------------------------
  function exportToZip(canvas, projectName, options) {
    return new Promise((resolve) => {
      options = options || {};
      const sliceHeight = Math.max(200, Number(options.sliceHeight || 1200));
      const format = (options.format || 'png').toLowerCase();
      const quality = typeof options.quality === 'number' ? options.quality : 0.92;

      if (!canvas) {
        alert('캔버스를 찾을 수 없습니다. (previewCanvas)');
        resolve(false);
        return;
      }

      try {
        const zip = new window.JSZip();
        const totalHeight = canvas.height;
        const width = canvas.width;
        const sliceCount = Math.ceil(totalHeight / sliceHeight);
        const jobs = [];

        for (let i = 0; i < sliceCount; i++) {
          const index = i;
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = width;
          const currentSliceHeight = Math.min(sliceHeight, totalHeight - index * sliceHeight);
          sliceCanvas.height = currentSliceHeight;

          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0,
            index * sliceHeight,
            width,
            currentSliceHeight,
            0,
            0,
            width,
            currentSliceHeight
          );

          const fileName = `slice_${String(index + 1).padStart(3, '0')}.${format}`;
          jobs.push(
            new Promise((res) => {
              sliceCanvas.toBlob(
                (blob) => {
                  if (blob) zip.file(fileName, blob);
                  res();
                },
                `image/${format}`,
                quality
              );
            })
          );
        }

        Promise.all(jobs)
          .then(() => zip.generateAsync({ type: 'blob' }))
          .then((zipBlob) => {
            window.saveAs(zipBlob, `${projectName}.zip`);
            resolve(true);
          })
          .catch((e) => {
            console.error('ZIP 생성 실패:', e);
            alert('ZIP 생성 실패: ' + e.message);
            resolve(false);
          });
      } catch (e) {
        console.error('exportToZip 실패:', e);
        alert('이미지 Export 실패: ' + e.message);
        resolve(false);
      }
    });
  }

  // ------------------------------
  // HTML/CSS/이미지 ZIP 내보내기
  // ------------------------------
  function exportAsHTML(projectData, projectName) {
    return new Promise((resolve) => {
      try {
        if (!projectData || !projectData.data) {
          alert('프로젝트 데이터가 없습니다.');
          resolve(false);
          return;
        }

        const zip = new window.JSZip();

        const html = generateHTML(projectData);
        zip.file('index.html', html);

        const css = generateCSS(projectData.template || 'beauty_01');
        zip.file('style.css', css);

        const images = extractImages(projectData.data);
        if (images.length > 0) {
          const imgFolder = zip.folder('images');
          images.forEach((img) => {
            const blob = base64ToBlob(img.data);
            imgFolder.file(`${img.name}.${img.ext}`, blob);
          });
        }

        zip.file('README.txt', generateReadme(projectData));

        zip
          .generateAsync({ type: 'blob' })
          .then((zipBlob) => {
            window.saveAs(zipBlob, `${projectName}.zip`);
            resolve(true);
          })
          .catch((e) => {
            console.error('HTML ZIP 생성 실패:', e);
            alert('HTML ZIP 생성 실패: ' + e.message);
            resolve(false);
          });
      } catch (e) {
        console.error('exportAsHTML 실패:', e);
        alert('HTML Export 실패: ' + e.message);
        resolve(false);
      }
    });
  }

  // ------------------------------
  // Export 템플릿 생성기(최소 안전 구현)
  // ------------------------------
  function generateHTML(projectData) {
    const data = projectData.data || {};
    const productName = (data.hero && data.hero.productName) || '상품명';

    let html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html lang="ko">\n';
    html += '<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += `  <title>${escapeHtml(productName)}</title>\n`;
    html += '  <link rel="stylesheet" href="style.css">\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '  <div class="detail-page-container">\n';

    // 섹션 순서(beauty_01 기본 9블록)
    const order = ['hero', 'usp', 'price', 'proof', 'detail', 'howto', 'faq', 'shipping', 'brand'];
    order.forEach((key) => {
      const sectionData = data[key];
      if (sectionData && Object.keys(sectionData).length > 0) {
        html += renderSectionHTML(key, sectionData);
      }
    });

    html += '  </div>\n';
    html += '</body>\n';
    html += '</html>\n';
    return html;
  }

  function renderSectionHTML(sectionKey, sectionData) {
    // 최소 렌더러: 텍스트는 p로, 이미지는 images 폴더 참조(파일명 매핑은 generateImageName과 동일)
    let out = '';
    out += `  <section class="sf-section sf-${sectionKey}">\n`;
    out += `    <h2 class="sf-section-title">${escapeHtml(sectionKey.toUpperCase())}</h2>\n`;

    Object.entries(sectionData).forEach(([slotKey, value], idx) => {
      if (!value) return;

      if (typeof value === 'string' && value.startsWith('data:image/')) {
        // 동일 규칙으로 파일명 생성
        const ext = value.split(';')[0].split('/')[1] || 'png';
        const imgName = generateImageName(sectionKey, slotKey, idx);
        out += `    <div class="sf-slot sf-slot-image">\n`;
        out += `      <img src="images/${imgName}.${ext}" alt="${escapeHtml(sectionKey)}" />\n`;
        out += '    </div>\n';
      } else {
        out += `    <div class="sf-slot sf-slot-text">\n`;
        out += `      <p>${escapeHtml(String(value))}</p>\n`;
        out += '    </div>\n';
      }
    });

    out += '  </section>\n';
    return out;
  }

  function generateCSS() {
    // 최소 스타일(내보내기 파일이 깨지지 않게)
    return [
      '*{margin:0;padding:0;box-sizing:border-box;}',
      'body{font-family:system-ui,-apple-system,Segoe UI,Roboto,\"Noto Sans KR\",sans-serif;line-height:1.6;color:#222;background:#fff;}',
      '.detail-page-container{max-width:860px;margin:0 auto;padding:16px;}',
      '.sf-section{padding:18px 14px;border:1px solid #eee;border-radius:14px;margin:14px 0;}',
      '.sf-section-title{font-size:14px;letter-spacing:.06em;color:#666;margin-bottom:10px;}',
      '.sf-slot{margin:10px 0;}',
      '.sf-slot-image img{width:100%;height:auto;display:block;border-radius:12px;border:1px solid #f0f0f0;}'
    ].join('\n');
  }

  function extractImages(data) {
    const images = [];
    let imageCounter = 0;

    for (const sectionKey in data) {
      const sectionData = data[sectionKey] || {};
      for (const slotKey in sectionData) {
        const value = sectionData[slotKey];
        if (value && typeof value === 'string' && value.startsWith('data:image/')) {
          const ext = (value.split(';')[0].split('/')[1] || 'png').toLowerCase();
          const name = generateImageName(sectionKey, slotKey, imageCounter++);
          images.push({ name, ext, data: value });
        }
      }
    }
    return images;
  }

  function generateImageName(section, slot, index) {
    // 기존 코드 호환용(주요 슬롯만 명명)
    const nameMap = {
      hero_mainImage: 'hero_main',
      hero_gallery1: 'gallery1',
      hero_gallery2: 'gallery2',
      hero_gallery3: 'gallery3',
      usp_icon1: 'usp_icon1',
      usp_icon2: 'usp_icon2',
      usp_icon3: 'usp_icon3',
      detail_detailImage: 'detail_main',
      brand_logo: 'brand_logo',
      brand_brandImage: 'brand_main'
    };
    const key = `${section}_${slot}`;
    return nameMap[key] || `image_${index}`;
  }

  function base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = (parts[0] || '').split(':')[1] || 'image/png';
    const raw = window.atob(parts[1] || '');
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; i++) uInt8Array[i] = raw.charCodeAt(i);
    return new Blob([uInt8Array], { type: contentType });
  }

  function generateReadme(projectData) {
    const productName = (projectData.data && projectData.data.hero && projectData.data.hero.productName) || '제목 없음';
    const template = projectData.template || 'beauty_01';
    return [
      'SellingForm Export',
      `Project: ${productName}`,
      `Template: ${template}`,
      `Date: ${new Date().toLocaleString('ko-KR')}`
    ].join('\n');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
