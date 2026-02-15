/**
 * SellingForm v3.8 - Module E: Amazon Listing Generator
 * Hybrid AI: Chrome Built-in AI (Gemini Nano) + Smart Template Fallback
 */

console.log("SellingForm 아마존 리스팅 모듈 로드");

const State = {
    generatedList: {
        bullets: [],
        description: ''
    },
    projectId: new URLSearchParams(window.location.search).get('id') || null,
    isModified: false,
    aiSession: null,
    aiAvailable: false
};

// Initialize
async function init() {
    console.log("SellingForm 아마존 리스팅 초기화");

    // Check Chrome Built-in AI availability
    await checkChromeAI();

    initEventListeners();
    updateAIStatus();
}

async function checkChromeAI() {
    try {
        // Check if Chrome AI is available (window.ai or self.ai)
        const ai = window.ai || self.ai;

        if (ai && ai.languageModel) {
            const capabilities = await ai.languageModel.capabilities();
            console.log("Chrome AI capabilities:", capabilities);

            if (capabilities.available === 'readily' || capabilities.available === 'after-download') {
                State.aiAvailable = true;
                console.log("✅ Chrome 내장 AI (Gemini Nano) 사용 가능!");
                return;
            }
        }
    } catch (err) {
        console.log("Chrome AI 체크 실패:", err.message);
    }

    State.aiAvailable = false;
    console.log("⚠️ Chrome 내장 AI 미지원 - 스마트 템플릿 모드로 전환");
}

function updateAIStatus() {
    const statusEl = document.getElementById('aiStatusBadge');
    if (statusEl) {
        if (State.aiAvailable) {
            statusEl.textContent = '🤖 AI 활성화';
            statusEl.style.background = '#10b981';
        } else {
            statusEl.textContent = '📋 템플릿 모드';
            statusEl.style.background = '#6b7280';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function initEventListeners() {
    const btnGenerate = document.getElementById('btnGenerate');
    const btnSave = document.getElementById('btnSave');
    const btnAddKeyword = document.getElementById('btnAddKeyword');

    if (btnGenerate) {
        btnGenerate.onclick = async () => {
            console.log("리스팅 생성 버튼 클릭됨");
            await generateListing();
        };
    }

    if (btnSave) {
        btnSave.onclick = saveToWorkbench;
    }

    if (btnAddKeyword) {
        btnAddKeyword.onclick = addKeywordField;
    }
}

function addKeywordField() {
    const keywordList = document.getElementById('keywordList');
    const currentCount = keywordList.querySelectorAll('.keyword-input').length;

    if (currentCount >= 10) {
        alert('최대 10개까지만 추가할 수 있습니다.');
        return;
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'keyword-input';
    input.placeholder = `특징 ${currentCount + 1}: 추가 특징을 입력하세요`;
    keywordList.appendChild(input);
    input.focus();
}

// ============================================================
// 메인 생성 함수
// ============================================================
async function generateListing() {
    const { name, cat, outLang, keywords } = getInputValues();

    if (!name || keywords.length === 0) {
        alert(outLang === 'ko' ? '상품명과 핵심 키워드를 입력해주세요.' : 'Please enter product name and keywords.');
        return;
    }

    if (State.aiAvailable) {
        await generateWithChromeAI(name, cat, outLang, keywords);
    } else {
        generateWithTemplate(name, cat, outLang, keywords);
    }
}

// ============================================================
// Chrome Built-in AI (Gemini Nano) 생성
// ============================================================
async function generateWithChromeAI(name, cat, outLang, keywords) {
    try {
        showLoading('AI가 리스팅을 작성하고 있습니다...');

        const ai = window.ai || self.ai;

        // Create session if not exists
        if (!State.aiSession) {
            State.aiSession = await ai.languageModel.create({
                systemPrompt: `You are an Amazon product listing expert. Create compelling, SEO-optimized bullet points and descriptions. Always respond in valid JSON format.`
            });
        }

        const lang = outLang === 'ko' ? 'Korean' : 'English';
        const prompt = `Create an Amazon product listing for:
Product: ${name}
Category: ${cat}
Features: ${keywords.join(', ')}

Respond in ${lang} with this exact JSON format:
{"bullets": ["bullet1", "bullet2", "bullet3", "bullet4", "bullet5"], "description": "product description"}`;

        const response = await State.aiSession.prompt(prompt);
        console.log("AI Response:", response);

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            State.generatedList = {
                bullets: parsed.bullets || [],
                description: parsed.description || ''
            };
            renderResults();
            State.isModified = true;
            console.log("✅ AI 리스팅 생성 완료!");
        } else {
            throw new Error("JSON 파싱 실패");
        }

    } catch (err) {
        console.error("AI 생성 실패:", err);
        alert("AI 생성 중 오류가 발생하여 템플릿으로 대체합니다.");
        generateWithTemplate(name, cat, outLang, keywords);
    } finally {
        hideLoading();
    }
}

// ============================================================
// 스마트 템플릿 기반 생성 (Fallback)
// ============================================================
function generateWithTemplate(name, cat, outLang, keywords) {
    let bullets = [];
    let description = '';

    if (outLang === 'en') {
        bullets = [
            `【PREMIUM QUALITY】: ${keywords[0] || 'High-quality materials'} for durable daily use. ${name} is designed with precision.`,
            `【ADVANCED TECHNOLOGY】: Featuring ${keywords[1] || 'state-of-the-art tech'}, this ${cat} must-have improves your experience.`,
            `【ERGONOMIC DESIGN】: ${keywords[2] || 'Thoughtfully crafted'} to ensure comfort and ease of use everywhere you go.`,
            `【LONG-LASTING PERFORMANCE】: Optimized for ${cat} enthusiasts. ${name} offers reliable performance you can trust.`,
            `【CUSTOMER SATISFACTION】: We stand by our ${name}. Please contact us for any inquiries regarding your purchase.`
        ];
        description = `Upgrade your lifestyle with our ${name}.\n\nThis premium ${cat} solution is specifically designed to meet your needs. Featuring ${keywords.join(', ')}, it provides a seamless and efficient experience like no other.\n\nKey Benefits:\n- Professional Grade Performance\n- Sleek and Modern Aesthetics\n- Easy to Setup and Use\n\nPackage Includes: 1x ${name}, User Manual, and Warranty Card.`;
    } else {
        bullets = [
            `【프리미엄 품질】: 일상적인 사용에도 끄떡없는 ${keywords[0] || '최고급 소재'}를 사용했습니다. ${name}은(는) 정밀하게 설계되었습니다.`,
            `【최신 기술 적용】: ${keywords[1] || '최첨단 기술'}이 적용된 이 ${cat} 필수 아이템으로 더욱 향상된 경험을 누리세요.`,
            `【인체공학적 디자인】: 어디서나 편안하고 간편하게 사용할 수 있도록 ${keywords[2] || '세심하게 설계'}되었습니다.`,
            `【강력한 성능】: ${cat} 전문가 및 애호가들을 위해 최적화되었습니다. 믿을 수 있는 ${name}의 성능을 직접 확인하세요.`,
            `【고객 만족 보장】: 저희는 ${name}의 품질을 자부합니다. 구매 관련 문의사항은 언제든 고객센터로 연락주시기 바랍니다.`
        ];
        description = `${name}으로 일상의 격을 높여보세요.\n\n이 프리미엄 ${cat} 솔루션은 고객님의 니즈를 충족시키기 위해 특별히 제작되었습니다. ${keywords.join(', ')} 등의 핵심 기능을 통해 차원이 다른 편리함을 제공합니다.\n\n주요 장점:\n- 전문가급 성능 구현\n- 세련되고 모던한 디자인\n- 손쉬운 설치 및 사용법\n\n구성품: ${name} 본체, 사용자 매뉴얼, 품질 보증서.`;
    }

    State.generatedList = { bullets, description };
    renderResults();
    State.isModified = true;
    console.log("📋 템플릿 리스팅 생성 완료!");
}

// ============================================================
// 공통 유틸리티
// ============================================================
function showLoading(msg) {
    if (window.SellingForm && window.SellingForm.Utils) {
        window.SellingForm.Utils.showLoading(msg);
    }
}

function hideLoading() {
    if (window.SellingForm && window.SellingForm.Utils) {
        window.SellingForm.Utils.hideLoading();
    }
}

function getInputValues() {
    const nameEl = document.getElementById('productName');
    const catEl = document.getElementById('category');
    const outLangEl = document.querySelector('input[name="outputLang"]:checked');
    const keywordInputs = document.querySelectorAll('.keyword-input');

    return {
        name: nameEl ? nameEl.value : '',
        cat: catEl ? catEl.value : '',
        outLang: outLangEl ? outLangEl.value : 'en',
        keywords: Array.from(keywordInputs).map(i => i.value).filter(v => v.trim() !== '')
    };
}

function renderResults() {
    const container = document.getElementById('bulletContainer');
    const descBox = document.getElementById('productDescription');

    if (container) {
        container.innerHTML = State.generatedList.bullets.map((b, i) => `
            <div class="bullet-card">
                <div class="bullet-num">${i + 1}</div>
                <div class="bullet-content">${escapeHtml(b)}</div>
                <button class="btn-card-copy" onclick="copyText(\`${b.replace(/`/g, '\\`')}\`)">Copy</button>
            </div>
        `).join('');
    }

    if (descBox) descBox.value = State.generatedList.description;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        if (window.SellingForm && window.SellingForm.Toast) {
            window.SellingForm.Toast.show('복사되었습니다.', 2000);
        } else {
            alert('복사되었습니다.');
        }
    });
};

window.copyToClipboard = (id) => {
    const el = document.getElementById(id);
    if (el) copyText(el.value);
};

async function saveToWorkbench() {
    if (!window.SellingForm || !window.SellingForm.DB) return;

    const { name, cat } = getInputValues();

    const itemData = {
        type: 'amazon',
        title: name || '아마존 리스팅',
        updatedAt: Date.now(),
        data: {
            productName: name,
            category: cat,
            bullets: State.generatedList.bullets,
            description: State.generatedList.description
        }
    };

    try {
        if (State.projectId) {
            await window.SellingForm.DB.updateItem(Number(State.projectId), itemData);
        } else {
            State.projectId = await window.SellingForm.DB.addItem(itemData);
        }
        if (window.SellingForm.Toast) {
            window.SellingForm.Toast.show('저장되었습니다.', 2000);
        } else {
            alert('저장되었습니다.');
        }
    } catch (err) {
        console.error(err);
    }
}
