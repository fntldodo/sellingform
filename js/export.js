/* ============================================================
   🟣 SellingForm Export (ZIP / Image / HTML)
   - Static(GitHub Pages) 환경에서 동작
   - JSZip + FileSaver(saveAs) 의존
   - canvas slice export (860px master → coupang 780 downscale)

   v3.14.1
   - HTML Export: beauty_01 섹션별 HTML+CSS 생성
   - Pretendard font 포함
   - 이미지 추출/파일명 정리(jpeg→jpg)
   - 코드 정리 + 방어 처리
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // CDN Loader (GitHub web editor 마크다운 자동변환 회피용)
  // ------------------------------------------------------------

  /** @type {Record<string, Promise<void>>} */
  const _cdnLoadCache = Object.create(null);

  /**
   * @param {string} src
   * @returns {Promise<void>}
   */
  function loadScriptOnce(src) {
    if (_cdnLoadCache[src]) return _cdnLoadCache[src];

    _cdnLoadCache[src] = new Promise((resolve, reject) => {
      try {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load script: ' + src));
        document.head.appendChild(s);
      } catch (e) {
        reject(e);
      }
    });

    return _cdnLoadCache[src];
  }

  async function ensureZipDeps() {
    // JSZip
    if (typeof window.JSZip === 'undefined') {
      await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }

    // FileSaver (saveAs)
    if (typeof window.saveAs === 'undefined') {
      await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
    }

    if (typeof window.JSZip === 'undefined') {
      throw new Error('JSZip 로딩 실패');
    }

    if (typeof window.saveAs === 'undefined') {
      throw new Error('FileSaver(saveAs) 로딩 실패');
    }
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------

  /**
   * @param {object} options
   * @param {'smartstore'|'coupang'|'html'} options.mode
   * @param {string} options.projectName
   * @param {object} options.projectData  // detail builder data wrapper
   * @param {HTMLCanvasElement} [options.canvas]
   * @param {number} [options.sliceHeight]
   */
  async function startExport(options) {
    const mode = options && options.mode;
    if (mode !== 'smartstore' && mode !== 'coupang' && mode !== 'html') {
      throw new Error('Invalid export mode');
    }

    const projectName = sanitizeFileBase((options && options.projectName) || 'project');
    const projectData = (options && options.projectData) || null;

    if (!projectData) {
      throw new Error('projectData is required');
    }

    await ensureZipDeps();

    if (mode === 'html') {
      await exportAsHTML({ projectName, projectData });
      return;
    }

    const canvas = options && options.canvas;
    if (!canvas) throw new Error('canvas is required for image export');

    const sliceHeight = Number(options.sliceHeight || (mode === 'smartstore' ? 1200 : 780));
    if (!Number.isFinite(sliceHeight) || sliceHeight <= 0) throw new Error('sliceHeight invalid');

    await exportCanvasSlices({
      projectName,
      mode,
      canvas,
      sliceHeight
    });
  }

  // ------------------------------------------------------------
  // Image Export (Canvas → slice images → zip)
  // ------------------------------------------------------------

  /**
   * @param {{projectName:string, mode:'smartstore'|'coupang', canvas:HTMLCanvasElement, sliceHeight:number}} args
   */
  async function exportCanvasSlices(args) {
    const { projectName, mode, canvas, sliceHeight } = args;

    const zip = new window.JSZip();
    const folder = zip.folder(mode);

    if (!folder) throw new Error('zip folder 생성 실패');

    const baseW = canvas.width;
    const baseH = canvas.height;

    // smartstore: 860 그대로
    // coupang: 780 (860에서 downscale)
    const targetW = (mode === 'coupang') ? 780 : 860;

    const scale = targetW / baseW;
    const targetSliceH = Math.round(sliceHeight * scale);

    const totalSlices = Math.ceil(baseH / sliceHeight);

    for (let i = 0; i < totalSlices; i++) {
      const sy = i * sliceHeight;
      const sh = Math.min(sliceHeight, baseH - sy);

      const tmp = document.createElement('canvas');
      tmp.width = targetW;
      tmp.height = Math.round(sh * scale);
      const tctx = tmp.getContext('2d');
      if (!tctx) throw new Error('tmp canvas ctx failed');

      // white bg
      tctx.fillStyle = '#FFFFFF';
      tctx.fillRect(0, 0, tmp.width, tmp.height);

      // draw
      tctx.drawImage(
        canvas,
        0,
        sy,
        baseW,
        sh,
        0,
        0,
        tmp.width,
        tmp.height
      );

      const blob = await canvasToBlob(tmp, 'image/png');
      const index = String(i + 1).padStart(3, '0');
      const fileName = `${projectName}_${mode}_${tmp.width}x${tmp.height}_${index}.png`;
      folder.file(fileName, blob);
    }

    const out = await zip.generateAsync({ type: 'blob' });
    window.saveAs(out, `${projectName}_${mode}.zip`);
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string} mime
   * @returns {Promise<Blob>}
   */
  function canvasToBlob(canvas, mime) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((b) => {
          if (!b) return reject(new Error('toBlob failed'));
          resolve(b);
        }, mime);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ------------------------------------------------------------
  // HTML Export (HTML+CSS+images → zip)
  // ------------------------------------------------------------

  /**
   * @param {{projectName:string, projectData:any}} args
   */
  async function exportAsHTML(args) {
    const { projectName, projectData } = args;

    const zip = new window.JSZip();
    const folder = zip.folder('html');
    if (!folder) throw new Error('zip folder 생성 실패');

    const templateId = (projectData && projectData.template) ? projectData.template : 'beauty_01';

    const images = extractImages(projectData);
    // images: Array<{name:string, dataUrl:string, ext:string}>

    // images folder
    const imgFolder = folder.folder('images');
    if (!imgFolder) throw new Error('images folder 생성 실패');

    for (const it of images) {
      const blob = dataUrlToBlobSafe(it.dataUrl);
      if (!blob) continue;
      imgFolder.file(`${it.name}.${it.ext}`, blob);
    }

    const html = generateHTML(projectData, templateId, images);
    const css = generateCSS(templateId);

    folder.file('index.html', html);
    folder.file('styles.css', css);

    const out = await zip.generateAsync({ type: 'blob' });
    window.saveAs(out, `${projectName}_html.zip`);
  }

  /**
   * @param {any} projectData
   * @param {string} templateId
   * @param {Array<{name:string, dataUrl:string, ext:string, slotPath:string}>} images
   */
  function generateHTML(projectData, templateId, images) {
    const data = (projectData && projectData.data) ? projectData.data : {};

    /** @type {Record<string, string>} */
    const imagePathMap = Object.create(null);
    for (const it of images) {
      imagePathMap[it.slotPath] = `images/${it.name}.${it.ext}`;
    }

    const sectionsOrder = [
      'hero',
      'usp',
      'price',
      'proof',
      'detail',
      'howto',
      'faq',
      'shipping',
      'brand'
    ];

    let body = '';
    for (const key of sectionsOrder) {
      const sectionData = data[key] || {};
      body += renderSectionHTML(templateId, key, sectionData, imagePathMap);
    }

    const titleText = safeText((data.hero && data.hero.productName) || 'SellingForm Export');

    return [
      '<!doctype html>',
      '<html lang="ko">',
      '<head>',
      '  <meta charset="utf-8"/>',
      '  <meta name="viewport" content="width=device-width, initial-scale=1"/>',
      `  <title>${escapeHtml(titleText)}</title>`,
      '  <link rel="stylesheet" href="styles.css"/>',
      '  <link rel="preconnect" href="https://cdn.jsdelivr.net"/>',
      '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"/>',
      '</head>',
      '<body>',
      '  <div class="sf-page">',
      body,
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  /**
   * @param {string} templateId
   * @returns {string}
   */
  function generateCSS(templateId) {
    // templateId별 분기 가능. MVP는 beauty_01 중심.
    void templateId;

    return [
      ':root{--sf-max:860px;--sf-pad:24px;--sf-radius:18px;--sf-border:#e5e7eb;--sf-muted:#6b7280;--sf-text:#111827;}',
      '*{box-sizing:border-box;}',
      'html,body{margin:0;padding:0;}',
      'body{font-family:Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color:var(--sf-text); background:#fff;}',
      '.sf-page{max-width:var(--sf-max); margin:0 auto; padding:32px 16px 56px;}',
      '.sf-block{padding:18px var(--sf-pad);}',
      '.sf-divider{height:10px; background:#f3f4f6; border-radius:999px; margin:18px var(--sf-pad);}',
      '.sf-hero-img{width:100%; height:420px; border-radius:16px; border:1px solid var(--sf-border); background:#f3f4f6; overflow:hidden; display:flex; align-items:center; justify-content:center;}',
      '.sf-hero-img img{width:100%; height:100%; object-fit:cover; display:block;}',
      '.sf-hero-title{font-weight:800; font-size:34px; line-height:1.25; text-align:center; margin:22px 0 6px;}',
      '.sf-hero-main{font-weight:700; font-size:24px; line-height:1.35; text-align:center; margin:0 0 6px; color:#1f2937;}',
      '.sf-hero-sub{font-weight:500; font-size:18px; line-height:1.45; text-align:center; margin:0; color:#4b5563;}',
      '.sf-h2{font-weight:800; font-size:22px; margin:0 0 14px;}',
      '.sf-grid-3{display:grid; grid-template-columns:repeat(3,1fr); gap:16px;}',
      '.sf-card{border:1px solid var(--sf-border); border-radius:14px; padding:16px;}',
      '.sf-card-title{font-weight:800; font-size:18px; margin:0 0 8px;}',
      '.sf-card-desc{font-weight:500; font-size:15px; line-height:1.5; color:#4b5563; margin:0; white-space:pre-line;}',
      '.sf-text{font-size:15px; line-height:1.65; color:#374151; white-space:pre-line;}',
      '.sf-proof-list{display:grid; gap:10px;}',
      '.sf-proof-item{border:1px solid var(--sf-border); border-radius:12px; padding:12px 14px; font-size:14px; color:#374151;}',
      '.sf-image{width:100%; border-radius:16px; border:1px solid var(--sf-border); background:#f3f4f6; overflow:hidden;}',
      '.sf-image img{width:100%; display:block;}',
      '.sf-steps{display:grid; gap:10px;}',
      '.sf-step{border-left:4px solid #e5e7eb; padding:10px 12px;}',
      '.sf-step strong{display:block; font-weight:800; margin-bottom:4px;}',
      '.sf-faq{display:grid; gap:12px;}',
      '.sf-faq-q{font-weight:800; margin:0 0 6px;}',
      '.sf-faq-a{margin:0; color:#4b5563; white-space:pre-line;}',
      '.sf-brand{display:grid; gap:12px;}',
      '.sf-note{color:var(--sf-muted); font-size:13px;}',
      '@media (max-width:860px){.sf-page{padding:24px 12px 44px;}.sf-grid-3{grid-template-columns:1fr;}.sf-hero-img{height:360px;}.sf-hero-title{font-size:28px;}.sf-hero-main{font-size:20px;}}'
    ].join('\n');
  }

  /**
   * @param {string} templateId
   * @param {string} sectionKey
   * @param {any} sectionData
   * @param {Record<string,string>} imagePathMap
   */
  function renderSectionHTML(templateId, sectionKey, sectionData, imagePathMap) {
    // templateId별 분기 가능. MVP는 beauty_01 중심.
    void templateId;

    switch (sectionKey) {
      case 'hero':
        return renderHero(sectionData, imagePathMap);
      case 'usp':
        return renderUSP(sectionData);
      case 'price':
        return renderPrice(sectionData);
      case 'proof':
        return renderProof(sectionData);
      case 'detail':
        return renderDetail(sectionData, imagePathMap);
      case 'howto':
        return renderHowTo(sectionData);
      case 'faq':
        return renderFAQ(sectionData);
      case 'shipping':
        return renderShipping(sectionData);
      case 'brand':
        return renderBrand(sectionData, imagePathMap);
      default:
        return '';
    }
  }

  // --------------------
  // Section Renderers
  // --------------------

  function renderHero(d, imagePathMap) {
    const name = safeText(d.productName);
    const main = safeText(d.mainCopy);
    const sub = safeText(d.subCopy);
    const imgPath = imagePathMap['hero.mainImage'] || '';

    return [
      '<section class="sf-block sf-hero">',
      `  <div class="sf-hero-img">${imgPath ? `<img src="${escapeAttr(imgPath)}" alt=""/>` : `<div class="sf-note">이미지가 없습니다</div>`}</div>`,
      `  ${name ? `<h1 class="sf-hero-title">${escapeHtml(name)}</h1>` : ''}`,
      `  ${main ? `<p class="sf-hero-main">${escapeHtml(main)}</p>` : ''}`,
      `  ${sub ? `<p class="sf-hero-sub">${escapeHtml(sub)}</p>` : ''}`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderUSP(d) {
    const cards = [];
    for (let i = 1; i <= 3; i++) {
      const t = safeText(d[`title${i}`]) || `제목 ${i}`;
      const desc = safeText(d[`desc${i}`]) || `설명 ${i}`;
      cards.push([
        '<div class="sf-card">',
        `  <h3 class="sf-card-title">${escapeHtml(t)}</h3>`,
        `  <p class="sf-card-desc">${escapeHtml(desc)}</p>`,
        '</div>'
      ].join('\n'));
    }

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">핵심 특징</h2>',
      `  <div class="sf-grid-3">${cards.join('')} </div>`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderPrice(d) {
    const txt = safeText(d.priceText);
    if (!txt) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">가격</h2>',
      `  <div class="sf-text">${escapeHtml(txt)}</div>`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderProof(d) {
    const list = [];
    const r1 = safeText(d.review1);
    const r2 = safeText(d.review2);
    const c = safeText(d.certification);

    if (r1) list.push(`<div class="sf-proof-item">${escapeHtml(r1)}</div>`);
    if (r2) list.push(`<div class="sf-proof-item">${escapeHtml(r2)}</div>`);
    if (c) list.push(`<div class="sf-proof-item">${escapeHtml(c)}</div>`);

    if (list.length === 0) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">증거·후기</h2>',
      `  <div class="sf-proof-list">${list.join('')}</div>`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderDetail(d, imagePathMap) {
    const imgPath = imagePathMap['detail.detailImage'] || '';
    const txt = safeText(d.detailText);

    if (!imgPath && !txt) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">상세 설명</h2>',
      `  ${imgPath ? `<div class="sf-image"><img src="${escapeAttr(imgPath)}" alt=""/></div>` : ''}`,
      `  ${txt ? `<div class="sf-text" style="margin-top:12px;">${escapeHtml(txt)}</div>` : ''}`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderHowTo(d) {
    const steps = [];
    for (let i = 1; i <= 3; i++) {
      const t = safeText(d[`step${i}Title`]);
      if (!t) continue;
      steps.push([
        '<div class="sf-step">',
        `  <strong>${escapeHtml(i + '단계')}</strong>`,
        `  <div class="sf-text">${escapeHtml(t)}</div>`,
        '</div>'
      ].join('\n'));
    }

    if (steps.length === 0) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">사용 방법</h2>',
      `  <div class="sf-steps">${steps.join('')}</div>`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderFAQ(d) {
    const q1 = safeText(d.q1);
    const a1 = safeText(d.a1);
    if (!q1 && !a1) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">FAQ</h2>',
      '  <div class="sf-faq">',
      '    <div class="sf-card">',
      `      ${q1 ? `<p class="sf-faq-q">${escapeHtml(q1)}</p>` : ''}`,
      `      ${a1 ? `<p class="sf-faq-a">${escapeHtml(a1)}</p>` : ''}`,
      '    </div>',
      '  </div>',
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderShipping(d) {
    const txt = safeText(d.shipping);
    if (!txt) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">배송·교환</h2>',
      `  <div class="sf-text">${escapeHtml(txt)}</div>`,
      '</section>',
      '<div class="sf-divider"></div>'
    ].join('\n');
  }

  function renderBrand(d, imagePathMap) {
    const intro = safeText(d.intro1);
    const imgPath = imagePathMap['brand.brandImage'] || '';

    if (!intro && !imgPath) return '';

    return [
      '<section class="sf-block">',
      '  <h2 class="sf-h2">브랜드 소개</h2>',
      '  <div class="sf-brand">',
      `    ${intro ? `<div class="sf-text">${escapeHtml(intro)}</div>` : ''}`,
      `    ${imgPath ? `<div class="sf-image"><img src="${escapeAttr(imgPath)}" alt=""/></div>` : ''}`,
      '  </div>',
      '</section>'
    ].join('\n');
  }

  // ------------------------------------------------------------
  // Image extraction (dataURL)
  // ------------------------------------------------------------

  /**
   * @param {any} projectData
   * @returns {Array<{name:string,dataUrl:string,ext:string,slotPath:string}>}
   */
  function extractImages(projectData) {
    const out = [];
    if (!projectData || !projectData.data) return out;

    const data = projectData.data;
    for (const sectionKey of Object.keys(data)) {
      const section = data[sectionKey];
      if (!section || typeof section !== 'object') continue;

      for (const slotKey of Object.keys(section)) {
        const v = section[slotKey];
        if (!isImageDataUrl(v)) continue;

        const info = parseImageInfo(v);
        const safeExt = info.ext;
        const safeName = `${sectionKey}_${slotKey}`;
        out.push({
          name: safeName,
          dataUrl: v,
          ext: safeExt,
          slotPath: `${sectionKey}.${slotKey}`
        });
      }
    }

    return out;
  }

  function isImageDataUrl(v) {
    return typeof v === 'string' && v.startsWith('data:image/');
  }

  /**
   * @param {string} dataUrl
   * @returns {{ext:'png'|'jpg'|'webp'}}
   */
  function parseImageInfo(dataUrl) {
    const m = /^data:image\/(png|jpeg|jpg|webp);base64,/i.exec(dataUrl);
    let ext = 'png';
    if (m && m[1]) {
      const t = m[1].toLowerCase();
      ext = (t === 'jpeg') ? 'jpg' : (t === 'jpg' ? 'jpg' : (t === 'webp' ? 'webp' : 'png'));
    }
    return { ext };
  }

  /**
   * @param {string} dataUrl
   * @returns {Blob|null}
   */
  function dataUrlToBlobSafe(dataUrl) {
    if (!isImageDataUrl(dataUrl)) return null;

    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) return null;

      const header = parts[0];
      const base64 = parts[1];
      const mimeMatch = /^data:(.*?);base64$/i.exec(header);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

      const binStr = atob(base64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);

      return new Blob([bytes], { type: mime });
    } catch (e) {
      console.warn('dataUrlToBlobSafe failed', e);
      return null;
    }
  }

  // ------------------------------------------------------------
  // Utils
  // ------------------------------------------------------------

  function safeText(v) {
    if (v == null) return '';
    const s = String(v);
    return s.trim();
  }

  function sanitizeFileBase(s) {
    const base = safeText(s) || 'project';
    return base
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 60);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  // ------------------------------------------------------------
  // Expose
  // ------------------------------------------------------------

  window.SellingForm = window.SellingForm || {};
  window.SellingForm.Export = {
    startExport
  };

})();
