/* ============================================================
   🟣 SellingForm Export Module
   - 모달 UI로 Export 옵션(채널/포맷/슬라이스 높이/프로젝트명) 입력
   - 캔버스 렌더(샘플) + ZIP 생성(샘플)
   - JSZip + FileSaver CDN 로드 포함
   ============================================================ */

(function () {
  "use strict";

  // ------------------------------
  // 0) 간단 CDN 로더 (중복 로드 방지)
  // ------------------------------
  const CDN = {
    jszip: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
    filesaver:
      "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js",
  };

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const exist = Array.from(document.scripts || []).some((s) => s.src === src);
      if (exist) return resolve(true);

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load: " + src));
      document.head.appendChild(script);
    });
  }

  async function ensureDeps() {
    await loadScriptOnce(CDN.jszip);
    await loadScriptOnce(CDN.filesaver);
    if (!window.JSZip) throw new Error("JSZip 로드 실패");
    if (!window.saveAs) throw new Error("FileSaver(saveAs) 로드 실패");
  }

  // ------------------------------
  // 1) 모달 UI 생성
  // ------------------------------
  function ensureModal() {
    let modal = document.getElementById("sfExportModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "sfExportModal";
    modal.className = "sf-modal-backdrop";
    modal.innerHTML = `
      <div class="sf-modal">
        <div class="sf-modal-head">
          <div class="sf-modal-title">내보내기</div>
          <button class="sf-modal-close" id="sfExportClose" aria-label="close">×</button>
        </div>

        <div class="sf-modal-body">
          <div class="sf-grid">
            <label class="sf-field">
              <div class="sf-label">프로젝트 파일명(필수)</div>
              <input class="sf-input" id="sfExportProjectName" placeholder="예: my_product" />
              <div class="sf-help">ZIP 파일명 및 이미지 파일명 {project} 값으로 사용됩니다.</div>
            </label>

            <label class="sf-field">
              <div class="sf-label">채널</div>
              <select class="sf-input" id="sfExportChannel">
                <option value="smartstore">Smartstore (860)</option>
                <option value="coupang">Coupang (780)</option>
              </select>
              <div class="sf-help">Coupang 780은 860 마스터를 비율 축소하여 생성됩니다(정책).</div>
            </label>

            <label class="sf-field">
              <div class="sf-label">포맷</div>
              <select class="sf-input" id="sfExportFormat">
                <option value="png">PNG (기본)</option>
                <option value="jpg">JPG</option>
              </select>
            </label>

            <label class="sf-field">
              <div class="sf-label">Slice Height(px)</div>
              <input class="sf-input" id="sfExportSliceHeight" type="number" min="200" step="10" value="860" />
              <div class="sf-help">템플릿별 추천값이 있을 경우 자동 제안될 수 있습니다.</div>
            </label>

            <label class="sf-field">
              <div class="sf-label">다운로드 크기(미리보기)</div>
              <div class="sf-help" id="sfExportSizeHint">860 x (auto)</div>
            </label>
          </div>

          <div class="sf-preview">
            <div class="sf-preview-head">
              <div class="sf-preview-title">Export Preview (샘플)</div>
              <button class="sf-btn ghost" id="sfExportRender">렌더</button>
            </div>
            <div class="sf-preview-body">
              <canvas id="sfExportCanvas" width="860" height="1200" style="max-width:100%;border-radius:12px;"></canvas>
              <div class="sf-help">현재는 데모 렌더입니다. 실제는 “워크벤치 렌더러”로 교체/연동하세요.</div>
            </div>
          </div>
        </div>

        <div class="sf-modal-foot">
          <button class="sf-btn ghost" id="sfExportCancel">취소</button>
          <button class="sf-btn" id="sfExportDownload">ZIP 다운로드</button>
        </div>
      </div>
    `;

    // 최소 스타일(없으면 적용)
    if (!document.getElementById("sfExportModalStyle")) {
      const st = document.createElement("style");
      st.id = "sfExportModalStyle";
      st.textContent = `
        .sf-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);display:none;align-items:center;justify-content:center;z-index:9999;padding:18px;}
        .sf-modal-backdrop.show{display:flex;}
        .sf-modal{width:min(820px,100%);background:#fff;border-radius:16px;box-shadow:0 10px 32px rgba(0,0,0,.2);overflow:hidden;font-family:Pretendard,system-ui,-apple-system,Segoe UI,Roboto,Arial;}
        .sf-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee;}
        .sf-modal-title{font-weight:800;font-size:16px;}
        .sf-modal-close{border:none;background:transparent;font-size:22px;cursor:pointer;line-height:1;}
        .sf-modal-body{padding:14px 16px;max-height:min(70vh,760px);overflow:auto;}
        .sf-modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee;}
        .sf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .sf-field{display:flex;flex-direction:column;gap:6px;}
        .sf-label{font-weight:700;font-size:13px;color:#333;}
        .sf-input{border:1px solid #ddd;border-radius:12px;padding:10px 12px;font-size:14px;outline:none;}
        .sf-input:focus{border-color:#9aa7ff;box-shadow:0 0 0 3px rgba(154,167,255,.25);}
        .sf-help{font-size:12px;color:#666;line-height:1.4;}
        .sf-btn{border:none;border-radius:12px;padding:10px 12px;font-weight:800;cursor:pointer;background:#4d6bff;color:#fff;}
        .sf-btn.ghost{background:#f2f4ff;color:#2c3a8c;}
        .sf-preview{margin-top:14px;border:1px solid #eee;border-radius:14px;overflow:hidden;}
        .sf-preview-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#fafafa;}
        .sf-preview-title{font-weight:800;font-size:13px;}
        .sf-preview-body{padding:12px;}
        @media (max-width:720px){.sf-grid{grid-template-columns:1fr;}}
      `;
      document.head.appendChild(st);
    }

    document.body.appendChild(modal);

    // 닫기 이벤트
    modal.querySelector("#sfExportClose").addEventListener("click", hideModal);
    modal.querySelector("#sfExportCancel").addEventListener("click", hideModal);

    // 렌더
    modal.querySelector("#sfExportRender").addEventListener("click", () => {
      const channel = modal.querySelector("#sfExportChannel").value;
      const sliceHeight = Number(modal.querySelector("#sfExportSliceHeight").value || 860);
      applySizeHint(channel, sliceHeight);
      renderDemoCanvas();
    });

    // 다운로드
    modal.querySelector("#sfExportDownload").addEventListener("click", async () => {
      try {
        await downloadZip();
      } catch (e) {
        console.error(e);
        alert(e.message || String(e));
      }
    });

    // 채널 변경 시 힌트
    modal.querySelector("#sfExportChannel").addEventListener("change", () => {
      const channel = modal.querySelector("#sfExportChannel").value;
      const sliceHeight = Number(modal.querySelector("#sfExportSliceHeight").value || 860);
      applySizeHint(channel, sliceHeight);
    });

    modal.querySelector("#sfExportSliceHeight").addEventListener("input", () => {
      const channel = modal.querySelector("#sfExportChannel").value;
      const sliceHeight = Number(modal.querySelector("#sfExportSliceHeight").value || 860);
      applySizeHint(channel, sliceHeight);
    });

    return modal;
  }

  function showModal() {
    const m = ensureModal();
    m.classList.add("show");
  }

  function hideModal() {
    const m = document.getElementById("sfExportModal");
    if (m) m.classList.remove("show");
  }

  function applySizeHint(channel, sliceHeight) {
    const hint = document.getElementById("sfExportSizeHint");
    const canvas = document.getElementById("sfExportCanvas");
    if (!hint || !canvas) return;

    const w = channel === "coupang" ? 780 : 860;
    hint.textContent = `${w} x (auto), slice ${sliceHeight}px`;
    canvas.width = 860; // 마스터 기준
    canvas.height = Math.max(1200, sliceHeight * 2);
  }

  // ------------------------------
  // 2) 데모 캔버스 렌더 (실제는 렌더러 연결)
  // ------------------------------
  let _currentProject = null;
  let _currentTemplate = null;

  function renderDemoCanvas() {
    const canvas = document.getElementById("sfExportCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 배경
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 상단 타이틀
    ctx.fillStyle = "#222";
    ctx.font = "700 34px Pretendard, system-ui";
    ctx.fillText("SellingForm Export Preview", 40, 80);

    // 프로젝트 정보
    ctx.fillStyle = "#555";
    ctx.font = "500 18px Pretendard, system-ui";
    const name = (_currentTemplate?.name || "Template") + " / " + (_currentProject?.id || "project");
    ctx.fillText(name, 40, 120);

    // 섹션 요약(데모)
    ctx.fillStyle = "#f5f6ff";
    ctx.fillRect(40, 160, 780, 170);

    ctx.fillStyle = "#2c3a8c";
    ctx.font = "700 20px Pretendard, system-ui";
    ctx.fillText("Content Snapshot (demo)", 60, 200);

    ctx.fillStyle = "#333";
    ctx.font = "500 16px Pretendard, system-ui";
    const sections = Object.keys(_currentProject?.content