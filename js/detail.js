// ============================================================
// SellingForm - Detail Page Editor
// - 섹션/슬롯 편집 UI
// - 미리보기 렌더
// - 저장(IndexedDB)
// - Export 연동
// ============================================================

(function () {
  "use strict";

  /* ------------------------------
   * Constants & State
   * ------------------------------ */
  const VERSION = "2025.12.31";
  const QS = new URLSearchParams(location.search);
  const PROJECT_ID = QS.get("project") || "default_project";

  const State = {
    projectId: PROJECT_ID,
    templateKey: null,
    project: null,
    templateSpec: null,
    selectedSectionKey: null,
    currentLang: "ko",
  };

  // 템플릿 스펙(예시)
  // 실제 프로젝트에서는 template-gallery/workbench에서 넘어온 spec을 기반으로 확장 가능
  const TEMPLATE_LIBRARY = {
    beauty_01: {
      name: "Beauty Template 01",
      sections: [
        { key: "HERO", label: "HERO" },
        { key: "USP-3", label: "USP-3" },
        { key: "PRICE", label: "PRICE" },
        { key: "PROOF", label: "PROOF" },
        { key: "DETAIL", label: "DETAIL" },
        { key: "HOWTO", label: "HOWTO" },
        { key: "FAQ", label: "FAQ" },
        { key: "SHIPPING-CS", label: "SHIPPING·CS" },
        { key: "BRAND", label: "BRAND" },
      ],
      slots: {
        HERO: {
          required: ["productName", "usp", "subcopy"],
          fields: [
            { key: "productName", type: "text", label: "제품명" },
            { key: "usp", type: "text", label: "USP 한 줄" },
            { key: "subcopy", type: "text", label: "서브 카피" },
            { key: "imageMain", type: "image", label: "메인 이미지" },
            { key: "gallery", type: "images", label: "갤러리(최대 3)", max: 3 },
          ],
        },
        "USP-3": {
          required: ["items"],
          fields: [
            {
              key: "items",
              type: "list",
              label: "USP 3개",
              min: 3,
              max: 3,
              itemFields: [
                { key: "icon", type: "image", label: "아이콘" },
                { key: "title", type: "text", label: "제목" },
                { key: "desc", type: "text", label: "설명" },
              ],
            },
          ],
        },
        PRICE: {
          required: ["priceTitle", "priceValue", "priceNote"],
          fields: [
            { key: "priceTitle", type: "text", label: "가격 타이틀" },
            { key: "priceValue", type: "text", label: "가격 표기" },
            { key: "priceNote", type: "text", label: "가격 안내" },
          ],
        },
        PROOF: {
          required: [],
          fields: [
            { key: "reviewSummary", type: "textarea", label: "리뷰 요약(3줄)" },
            { key: "certOneLine", type: "text", label: "인증/테스트 1줄(선택)" },
            { key: "image", type: "image", label: "증빙 이미지(선택)" },
          ],
        },
        DETAIL: {
          required: ["image"],
          fields: [
            { key: "image", type: "image", label: "상세 이미지(필수)" },
            { key: "text", type: "textarea", label: "설명(선택)" },
          ],
        },
        HOWTO: {
          required: ["steps"],
          fields: [
            {
              key: "steps",
              type: "list",
              label: "사용 방법(4단계 권장)",
              min: 1,
              max: 7,
              itemFields: [
                { key: "title", type: "text", label: "단계 제목" },
                { key: "desc", type: "text", label: "설명" },
                { key: "image", type: "image", label: "이미지(선택)" },
              ],
            },
          ],
        },
        FAQ: {
          required: ["items"],
          fields: [
            {
              key: "items",
              type: "list",
              label: "FAQ(3개)",
              min: 1,
              max: 10,
              itemFields: [
                { key: "q", type: "text", label: "질문" },
                { key: "a", type: "textarea", label: "답변" },
              ],
            },
          ],
        },
        "SHIPPING-CS": {
          required: ["items"],
          fields: [
            {
              key: "items",
              type: "list",
              label: "배송/교환/환불/문의",
              min: 1,
              max: 10,
              itemFields: [
                { key: "title", type: "text", label: "항목" },
                { key: "desc", type: "textarea", label: "내용" },
              ],
            },
          ],
        },
        BRAND: {
          required: ["brandIntro"],
          fields: [
            { key: "brandIntro", type: "textarea", label: "브랜드 소개(2줄)" },
            { key: "logo", type: "image", label: "로고(선택)" },
            { key: "image", type: "image", label: "브랜드 이미지(선택)" },
            { key: "motto", type: "text", label: "슬로건(선택)" },
          ],
        },
      },
      presets: {
        HERO: [
          ["짧고 명확한 USP", "하루 5분, 피부가 편안해지는 루틴"],
          ["부담 낮추기", "자극은 줄이고, 수분은 채우는 케어"],
          ["신뢰 강조", "성분은 단순하게, 효과는 분명하게"],
        ],
        "USP-3": [
          ["핵심 3가지", "보습 · 진정 · 밀착"],
          ["사용감", "끈적임 없이 산뜻"],
          ["마무리", "메이크업 전에도 OK"],
        ],
        PRICE: [
          ["합리적 가격", "필요한 것만 담아 가격은 가볍게"],
          ["구성 안내", "본품 1 + 추가 구성(선택)"],
          ["혜택", "첫 구매 쿠폰 적용 가능"],
        ],
      },
    },
  };

  /* ------------------------------
   * Helpers
   * ------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureProjectShape(project) {
    if (!project) project = {};
    if (!project.meta) project.meta = {};
    if (!project.content) project.content = {};
    if (!project.content.sections) project.content.sections = {};
    return project;
  }

  function getSectionData(sectionKey) {
    const p = ensureProjectShape(State.project);
    if (!p.content.sections[sectionKey]) p.content.sections[sectionKey] = {};
    return p.content.sections[sectionKey];
  }

  function setSectionData(sectionKey, data) {
    const p = ensureProjectShape(State.project);
    p.content.sections[sectionKey] = data;
  }

  function showToast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1600);
  }

  /* ------------------------------
   * DB bindings (db.js)
   * ------------------------------ */
  async function loadProject() {
    if (!window.SF_DB) throw new Error("SF_DB not found. db.js 로드 확인 필요.");
    const p = await window.SF_DB.getProject(State.projectId);
    State.project = ensureProjectShape(p || { id: State.projectId });

    // templateKey 추정(없으면 기본)
    State.templateKey =
      State.project.meta.templateKey ||
      QS.get("template") ||
      "beauty_01";

    State.templateSpec = TEMPLATE_LIBRARY[State.templateKey] || TEMPLATE_LIBRARY.beauty_01;
    State.project.meta.templateKey = State.templateKey;

    // 섹션 기본값(없으면 생성)
    State.templateSpec.sections.forEach((s) => {
      const cur = getSectionData(s.key);
      setSectionData(s.key, cur);
    });

    await window.SF_DB.upsertProject(State.projectId, State.project);
  }

  async function saveProject() {
    if (!window.SF_DB) throw new Error("SF_DB not found. db.js 로드 확인 필요.");
    State.project.meta.updatedAt = Date.now();
    await window.SF_DB.upsertProject(State.projectId, State.project);
    showToast("저장 완료");
  }

  /* ------------------------------
   * UI Render
   * ------------------------------ */
  function renderHeader() {
    const title = $("#pageTitle");
    if (title) title.textContent = "상세페이지 편집";

    const badge = $("#templateBadge");
    if (badge) badge.textContent = State.templateSpec?.name || "Template";
  }

  function renderSectionButtons() {
    const box = $("#sectionTabs");
    if (!box) return;

    const secs = State.templateSpec.sections || [];
    box.innerHTML = secs
      .map((s) => {
        const active = s.key === State.selectedSectionKey ? "active" : "";
        return `<button class="tab ${active}" data-section="${escapeHtml(
          s.key
        )}">${escapeHtml(s.label)}</button>`;
      })
      .join("");

    box.querySelectorAll("button[data-section]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-section");
        selectSection(key);
      });
    });
  }

  function renderEditor() {
    const editor = $("#editorArea");
    if (!editor) return;

    const secKey = State.selectedSectionKey;
    if (!secKey) {
      editor.innerHTML = `<div class="empty">섹션을 선택해 주세요.</div>`;
      return;
    }

    const spec = State.templateSpec.slots[secKey];
    if (!spec) {
      editor.innerHTML = `<div class="empty">섹션 스펙이 없습니다: ${escapeHtml(
        secKey
      )}</div>`;
      return;
    }

    const data = getSectionData(secKey);

    const fieldsHtml = (spec.fields || [])
      .map((f) => renderField(secKey, f, data))
      .join("");

    editor.innerHTML = `
      <div class="editor-head">
        <div class="editor-title">${escapeHtml(secKey)}</div>
        <div class="editor-actions">
          <button class="btn" id="btnSaveNow">저장</button>
          <button class="btn ghost" id="btnPreviewNow">미리보기</button>
        </div>
      </div>
      <div class="editor-body">${fieldsHtml}</div>
    `;

    const btnSaveNow = $("#btnSaveNow");
    if (btnSaveNow) btnSaveNow.addEventListener("click", saveProject);

    const btnPreviewNow = $("#btnPreviewNow");
    if (btnPreviewNow) btnPreviewNow.addEventListener("click", renderPreview);
  }

  function renderField(sectionKey, fieldSpec, sectionData) {
    const k = fieldSpec.key;
    const label = fieldSpec.label || k;
    const type = fieldSpec.type || "text";
    const value = sectionData?.[k];

    if (type === "text") {
      return `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <input class="input" type="text" data-field="${escapeHtml(
            k
          )}" value="${escapeHtml(value || "")}" />
        </div>`;
    }

    if (type === "textarea") {
      return `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <textarea class="textarea" data-field="${escapeHtml(
            k
          )}">${escapeHtml(value || "")}</textarea>
        </div>`;
    }

    if (type === "image") {
      const src = value || "";
      return `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <div class="image-field">
            <input class="input" type="text" placeholder="이미지 URL 또는 dataURL" data-field="${escapeHtml(
              k
            )}" value="${escapeHtml(src)}" />
            <div class="image-preview">
              ${src ? `<img src="${escapeHtml(src)}" alt="" />` : `<div class="hint">이미지 없음</div>`}
            </div>
          </div>
        </div>`;
    }

    if (type === "images") {
      const max = fieldSpec.max || 3;
      const arr = Array.isArray(value) ? value : [];
      const rows = new Array(max).fill(0).map((_, i) => {
        const v = arr[i] || "";
        return `
          <div class="row">
            <input class="input" type="text" data-field="${escapeHtml(
              k
            )}" data-idx="${i}" value="${escapeHtml(v)}" placeholder="이미지 URL 또는 dataURL" />
          </div>`;
      });

      return `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <div class="stack">
            ${rows.join("")}
          </div>
        </div>`;
    }

    if (type === "list") {
      const list = Array.isArray(value) ? value : [];
      const min = fieldSpec.min || 0;
      const max = fieldSpec.max || 10;

      const itemsHtml = list.map((it, idx) => renderListItem(sectionKey, fieldSpec, it, idx)).join("");

      return `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <div class="list-wrap" data-list="${escapeHtml(k)}">
            <div class="list-items">
              ${itemsHtml || `<div class="hint">항목이 없습니다.</div>`}
            </div>
            <div class="list-actions">
              <button class="btn ghost" data-list-add="${escapeHtml(k)}">+ 추가</button>
              <button class="btn ghost" data-list-remove="${escapeHtml(k)}">- 삭제</button>
              <span class="small">min ${min}, max ${max}</span>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="field">
        <div class="label">${escapeHtml(label)}</div>
        <div class="hint">지원하지 않는 필드 타입: ${escapeHtml(type)}</div>
      </div>`;
  }

  function renderListItem(sectionKey, listSpec, itemData, idx) {
    const itemFields = listSpec.itemFields || [];
    const rows = itemFields
      .map((f) => {
        const k = f.key;
        const label = f.label || k;
        const type = f.type || "text";
        const v = itemData?.[k] || "";

        if (type === "text") {
          return `
            <div class="subfield">
              <div class="slabel">${escapeHtml(label)}</div>
              <input class="input" type="text"
                data-list-field="${escapeHtml(listSpec.key)}"
                data-idx="${idx}"
                data-subkey="${escapeHtml(k)}"
                value="${escapeHtml(v)}"/>
            </div>`;
        }

        if (type === "textarea") {
          return `
            <div class="subfield">
              <div class="slabel">${escapeHtml(label)}</div>
              <textarea class="textarea"
                data-list-field="${escapeHtml(listSpec.key)}"
                data-idx="${idx}"
                data-subkey="${escapeHtml(k)}">${escapeHtml(v)}</textarea>
            </div>`;
        }

        if (type === "image") {
          return `
            <div class="subfield">
              <div class="slabel">${escapeHtml(label)}</div>
              <input class="input" type="text"
                data-list-field="${escapeHtml(listSpec.key)}"
                data-idx="${idx}"
                data-subkey="${escapeHtml(k)}"
                value="${escapeHtml(v)}" placeholder="이미지 URL 또는 dataURL"/>
            </div>`;
        }

        return `
          <div class="subfield">
            <div class="slabel">${escapeHtml(label)}</div>
            <div class="hint">지원하지 않는 타입: ${escapeHtml(type)}</div>
          </div>`;
      })
      .join("");

    return `
      <div class="list-item" data-item-idx="${idx}">
        <div class="list-item-head">
          <div class="small">#${idx + 1}</div>
        </div>
        <div class="list-item-body">${rows}</div>
      </div>`;
  }

  function bindEditorEvents() {
    const editor = $("#editorArea");
    if (!editor) return;

    // 단일 필드 변경
    editor.addEventListener("input", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      const fieldKey = t.getAttribute("data-field");
      if (fieldKey) {
        const secKey = State.selectedSectionKey;
        if (!secKey) return;
        const data = getSectionData(secKey);

        // images 타입(갤러리) 처리
        const idx = t.getAttribute("data-idx");
        if (idx !== null && idx !== undefined) {
          const i = Number(idx);
          const arr = Array.isArray(data[fieldKey]) ? data[fieldKey] : [];
          arr[i] = t.value;
          data[fieldKey] = arr;
        } else {
          data[fieldKey] = t.value;
        }
        setSectionData(secKey, data);
      }

      // list item 변경
      const listKey = t.getAttribute("data-list-field");
      if (listKey) {
        const secKey = State.selectedSectionKey;
        if (!secKey) return;
        const data = getSectionData(secKey);

        const idx = Number(t.getAttribute("data-idx") || "0");
        const subkey = t.getAttribute("data-subkey");
        if (!subkey) return;

        const arr = Array.isArray(data[listKey]) ? data[listKey] : [];
        if (!arr[idx]) arr[idx] = {};
        arr[idx][subkey] = t.value;
        data[listKey] = arr;
        setSectionData(secKey, data);
      }
    });

    // list add/remove
    editor.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      const addKey = t.getAttribute("data-list-add");
      const rmKey = t.getAttribute("data-list-remove");

      if (addKey || rmKey) {
        const secKey = State.selectedSectionKey;
        if (!secKey) return;
        const spec = State.templateSpec.slots[secKey];
        if (!spec) return;

        const listSpec = (spec.fields || []).find((f) => f.key === (addKey || rmKey));
        if (!listSpec) return;

        const min = listSpec.min || 0;
        const max = listSpec.max || 10;
        const data = getSectionData(secKey);

        const arr = Array.isArray(data[listSpec.key]) ? data[listSpec.key] : [];

        if (addKey) {
          if (arr.length >= max) return showToast(`최대 ${max}개까지 추가 가능`);
          const item = {};
          (listSpec.itemFields || []).forEach((f) => (item[f.key] = ""));
          arr.push(item);
          data[listSpec.key] = arr;
          setSectionData(secKey, data);
          renderEditor();
        }

        if (rmKey) {
          if (arr.length <= min) return showToast(`최소 ${min}개는 유지해야 합니다`);
          arr.pop();
          data[listSpec.key] = arr;
          setSectionData(secKey, data);
          renderEditor();
        }
      }
    });
  }

  /* ------------------------------
   * Preview Render
   * ------------------------------ */
  function renderPreview() {
    const panel = $("#previewArea");
    if (!panel) return;

    const secs = State.templateSpec.sections || [];
    const html = secs
      .map((s) => {
        const data = getSectionData(s.key);
        return `
          <div class="pv-section">
            <div class="pv-head">${escapeHtml(s.label)}</div>
            <pre class="pv-json">${escapeHtml(JSON.stringify(data || {}, null, 2))}</pre>
          </div>`;
      })
      .join("");

    panel.innerHTML = html;
    showToast("미리보기 갱신");
  }

  /* ------------------------------
   * Section selection
   * ------------------------------ */
  function selectSection(key) {
    State.selectedSectionKey = key;
    renderSectionButtons();
    renderEditor();
    renderPreview();
  }

  /* ------------------------------
   * AI copy generation placeholder
   * (실제 AI 연결은 추후)
   * ------------------------------ */
  function generateAICopy() {
    showToast("AI 카피 생성(데모): 추후 연결 예정");
  }

  /* ------------------------------
   * Export hooks
   * ------------------------------ */
  async function exportNow() {
    try {
      if (!window.SF_EXPORT) throw new Error("SF_EXPORT not found. export.js 로드 확인 필요.");
      await saveProject();
      await window.SF_EXPORT.openExportModal(State.project, State.templateSpec);
    } catch (err) {
      console.error(err);
      alert(err.message || String(err));
    }
  }

  /* ------------------------------
   * Init
   * ------------------------------ */
  function bindTopButtons() {
    const btnHome = $("#btnHome");
    if (btnHome) btnHome.addEventListener("click", () => (location.href = "../index.html"));

    const btnPreview = $("#btnPreview");
    if (btnPreview) btnPreview.addEventListener("click", renderPreview);

    const btnExport = $("#btnExport");
    if (btnExport) btnExport.addEventListener("click", exportNow);

    const btnSave = $("#btnSave");
    if (btnSave) btnSave.addEventListener("click", saveProject);

    const btnGenerateAi = $("#btnGenerateAi");
    if (btnGenerateAi) btnGenerateAi.addEventListener("click", generateAICopy);

    const btnToggleLang = document.getElementById("btnToggleLang");
    if (btnToggleLang) {
      btnToggleLang.addEventListener("click", () => {
        State.currentLang = State.currentLang === "ko" ? "en" : "ko";

        // 버튼 색상 변경
        btnToggleLang.classList.remove("active-ko", "active-en");
        if (State.currentLang === "ko") {
          btnToggleLang.classList.add("active-ko");
        } else {
          btnToggleLang.classList.add("active-en");
        }

        renderSectionButtons();
      });

      // 초기 상태 설정
      btnToggleLang.classList.add("active-ko");
    }

    // ✅ initUI() 닫힘(누락되어 전체 스크립트 파싱이 실패했음)
  }

  async function init() {
    renderHeader();
    await loadProject();

    // 기본 섹션 선택
    State.selectedSectionKey = State.templateSpec.sections?.[0]?.key || "HERO";

    renderSectionButtons();
    renderEditor();
    bindEditorEvents();
    bindTopButtons();
    renderPreview();

    console.log("SellingForm Detail Editor initialized", { projectId: State.projectId, version: VERSION });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((e) => {
      console.error(e);
      alert(e.message || String(e));
    });
  });
})();