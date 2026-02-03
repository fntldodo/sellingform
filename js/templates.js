/**
 * SellingForm v3.8 - Module C: Form Templates Library
 * Centralized data store for administrative and business forms.
 * 
 * render(data, mode) - mode: 'preview' | 'print'
 * - preview: 입력 데이터 표시
 * - print: 입력 필드 공백 (사용자가 직접 작성)
 */

// 헬퍼 함수: 날짜 출력 로직 (값이 있으면 출력, 없으면 공란 가이드)
const printDate = (val) => val ? val : '20__ . __ . __';

// v3.9 Print Guide: 공란 높이 유지용 헬퍼
const emptyCell = (val, mode) => {
    if (mode === 'print') return '&nbsp;';
    return val || '';
};

const FormTemplates = {
    administrative: {
        title: '행정/민원',
        items: [
            {
                id: 'parking_violation',
                name: '주정차 위반 의견진술서',
                fields: [
                    { id: 'name', label: '진술인 성명', type: 'text', placeholder: '홍길동' },
                    { id: 'carNum', label: '차량 번호', type: 'text', placeholder: '12가 3456' },
                    { id: 'violationTime', label: '위반 일시', type: 'datetime-local' },
                    { id: 'violationPlace', label: '위반 장소', type: 'text', placeholder: 'OO동 OO식당 앞' },
                    { id: 'reason', label: '진술 사유', type: 'textarea', placeholder: '단속 당시 상황을 상세히 기술하세요.' },
                    { id: 'submitDate', label: '제출일', type: 'date' } // 날짜 필드 추가
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    // 인쇄 모드일 때: submitDate 값이 있으면 그 값 사용, 없으면 공란 가이드
                    // 미리보기 모드일 때: submitDate 값이 있으면 그 값, 없으면 오늘 날짜
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })));

                    return `
                    <div class="doc-header"><h1>주정차위반 의견진술서</h1></div>
                    <table class="doc-table">
                        <tr><th>성 명</th><td class="editable">${v('name')}</td><th>차량번호</th><td class="editable">${v('carNum')}</td></tr>
                        <tr><th>위반일시</th><td colspan="3" class="editable">${mode === 'print' ? '&nbsp;' : v('violationTime')}</td></tr>
                        <tr><th>위반장소</th><td colspan="3" class="editable">${v('violationPlace')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <h3>■ 의견진술 내용</h3>
                        <div class="doc-content-box editable">${mode === 'print' ? '&nbsp;' : (v('reason')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="doc-footer">
                        <p>위와 같이 의견을 제출합니다.</p>
                        <div class="date">${d}</div>
                        <div class="signature">제출인: <span class="editable">${mode === 'print' ? '________________ (서명/인)' : (v('name') || '(인/서명)')}</span></div>
                        <div class="target">${mode === 'print' ? '________________________' : 'OOO'} 시장/구청장 귀하</div>
                    </div>
                `;
                }
            },
            {
                id: 'resident_request',
                name: '주민등록표 등·초본 교부 신청서',
                fields: [
                    { id: 'req_name', label: '신청인 성명', type: 'text' },
                    { id: 'req_id', label: '주민번호', type: 'text' },
                    { id: 'req_addr', label: '주소', type: 'text' },
                    { id: 'target_name', label: '대상자 성명', type: 'text' },
                    { id: 'purpose', label: '증명 목적', type: 'text', placeholder: '연말정산용, 은행제출용 등' },
                    { id: 'submitDate', label: '신청일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>주민등록표 등·초본 교부 신청서</h1></div>
                    <table class="doc-table">
                        <tr><th>신청인 성명</th><td class="editable">${v('req_name')}</td><th>주민번호</th><td class="editable">${v('req_id')}</td></tr>
                        <tr><th>주소</th><td colspan="3" class="editable">${v('req_addr')}</td></tr>
                        <tr><th>대상자 성명</th><td class="editable">${v('target_name')}</td><th>증명목적</th><td class="editable">${v('purpose')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <p>위와 같이 주민등록표 등·초본의 교부를 신청합니다.</p>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${d}</div>
                        <div class="signature">신청인: <span class="editable">${mode === 'print' ? '________________ (서명 또는 인)' : (v('req_name') || '(서명 또는 인)')}</span></div>
                        <div class="target">${mode === 'print' ? '________________________' : 'OOO'} 읍·면·동장 귀하</div>
                    </div>
                `;
                }
            },
            {
                id: 'tax_family',
                name: '연말정산 부양가족 등록신청',
                fields: [
                    { id: 'workerName', label: '근로자 성명', type: 'text' },
                    { id: 'dept', label: '부서/직급', type: 'text' },
                    { id: 'f1_rel', label: '가족1 관계', type: 'text', placeholder: '자, 부, 모 등' },
                    { id: 'f1_name', label: '가족1 성명', type: 'text' },
                    { id: 'f1_id', label: '가족1 주민번호', type: 'text' },
                    { id: 'f2_rel', label: '가족2 관계', type: 'text' },
                    { id: 'f2_name', label: '가족2 성명', type: 'text' },
                    { id: 'f2_id', label: '가족2 주민번호', type: 'text' },
                    { id: 'f3_rel', label: '가족3 관계', type: 'text' },
                    { id: 'f3_name', label: '가족3 성명', type: 'text' },
                    { id: 'f3_id', label: '가족3 주민번호', type: 'text' },
                    { id: 'note', label: '변경/추가 사유', type: 'text' },
                    { id: 'submitDate', label: '신청일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    const rows = [1, 2, 3].map(i => {
                        const rel = v(`f${i}_rel`);
                        const name = v(`f${i}_name`);
                        const id = v(`f${i}_id`);
                        if (mode === 'print') return '<tr><td style="height:44px;">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
                        return `<tr><td>${rel}</td><td>${name}</td><td>${id}</td><td></td></tr>`;
                    }).join('');

                    return `
                    <div class="doc-header"><h1>부양가족 등록/변경 신청서</h1><p>(소득공제신고용)</p></div>
                    <div class="doc-info"><p>소속: <span class="editable">${v('dept')}</span> / 성명: <span class="editable">${v('workerName')}</span></p></div>
                    <table class="doc-table">
                        <thead><tr><th>관계</th><th>성명</th><th>주민등록번호</th><th>비고</th></tr></thead>
                        <tbody>
                            ${mode === 'print' ? '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'.repeat(5) : rows}
                        </tbody>
                    </table>
                    <div class="doc-footer" style="margin-top:20px;">
                        <div class="date">${d}</div>
                        <div class="signature">신청인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('workerName') || '(인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'business_reg',
                name: '사업자등록 신청서',
                fields: [
                    { id: 'bizName', label: '상호(법인명)', type: 'text' },
                    { id: 'owner', label: '대표자 성명', type: 'text' },
                    { id: 'ownerId', label: '주민번호', type: 'text' },
                    { id: 'bizType', label: '업태', type: 'text', placeholder: '소매업, 서비스업 등' },
                    { id: 'bizItem', label: '종목', type: 'text', placeholder: '의류, 음식점 등' },
                    { id: 'bizAddr', label: '사업장 소재지', type: 'text' },
                    { id: 'submitDate', label: '신청일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>사업자등록 신청서</h1></div>
                    <table class="doc-table">
                        <tr><th>상호(법인명)</th><td colspan="3" class="editable">${v('bizName') || emptyCell('', mode)}</td></tr>
                        <tr><th>대표자 성명</th><td class="editable" style="height:44px;">${v('owner') || emptyCell('', mode)}</td><th>주민번호</th><td class="editable">${v('ownerId') || emptyCell('', mode)}</td></tr>
                        <tr><th>업태</th><td class="editable" style="height:44px;">${v('bizType') || emptyCell('', mode)}</td><th>종목</th><td class="editable">${v('bizItem') || emptyCell('', mode)}</td></tr>
                        <tr><th>사업장 소재지</th><td colspan="3" class="editable" style="height:64px;">${v('bizAddr') || emptyCell('', mode)}</td></tr>
                    </table>
                    <div class="doc-section">
                        <p>위와 같이 사업자등록을 신청합니다.</p>
                    </div>
                    <div class="doc-footer" style="margin-top:20px;">
                        <div class="date">${d}</div>
                        <div class="signature">신청인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('owner') || '(인)')}</span></div>
                        <div class="target" style="margin-top:20px;">${mode === 'print' ? '________________________' : 'OOO'} 세무서장 귀하</div>
                    </div>
                `;
                }
            }
        ]
    },
    legal: {
        title: '법률/공문서',
        items: [
            {
                id: 'notice_letter',
                name: '내용증명 (표준 양식)',
                fields: [
                    { id: 'sender', label: '발신인 성명', type: 'text' },
                    { id: 'senderAddr', label: '발신인 주소', type: 'text' },
                    { id: 'receiver', label: '수신인 성명', type: 'text' },
                    { id: 'receiverAddr', label: '수신인 주소', type: 'text' },
                    { id: 'subject', label: '제 목', type: 'text', placeholder: '보증금 반환 독촉 등' },
                    { id: 'content', label: '내용', type: 'textarea' },
                    { id: 'submitDate', label: '발송일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>내 용 증 명</h1></div>
                    <div class="doc-section">
                        <div class="doc-address-block"><p><strong>수신인:</strong> <span class="editable">${v('receiver')}</span></p><p>주소: <span class="editable">${v('receiverAddr')}</span></p></div>
                        <div class="doc-address-block"><p><strong>발신인:</strong> <span class="editable">${v('sender')}</span></p><p>주소: <span class="editable">${v('senderAddr')}</span></p></div>
                    </div>
                    <div class="doc-section">
                        <h3>제목: <span class="editable">${v('subject')}</span></h3>
                        <div class="doc-content-box editable">${mode === 'print' ? '&nbsp;' : (v('content')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${d}</div>
                        <div class="signature">발신인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('sender') || '(인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'iou',
                name: '차용증 (금전소비대차계약서)',
                fields: [
                    { id: 'creditor', label: '채권자(빌려준 사람)', type: 'text' },
                    { id: 'debtor', label: '채무자(빌린 사람)', type: 'text' },
                    { id: 'amount', label: '차용 금액', type: 'number' },
                    { id: 'interest', label: '이자율(%)', type: 'text' },
                    { id: 'date', label: '변제 기일', type: 'date' },
                    { id: 'submitDate', label: '작성일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const amt = mode === 'print' ? '' : Number(data.amount || 0).toLocaleString();
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>차 용 증</h1></div>
                    <div class="doc-section">
                        <p><strong>채권자:</strong> <span class="editable">${v('creditor')}</span></p>
                        <p><strong>채무자:</strong> <span class="editable">${v('debtor')}</span></p>
                        <p>채무자는 채권자로부터 다음과 같이 금전을 차용하였음을 확인한다.</p>
                    </div>
                    <table class="doc-table">
                        <tr><th>차용금액</th><td colspan="3" class="editable">금 ${mode === 'print' ? '________________________' : amt} 원 정</td></tr>
                        <tr><th>이자율</th><td class="editable">연 ${mode === 'print' ? '________' : v('interest')} %</td><th>변제기일</th><td class="editable">${mode === 'print' ? '20__ . __ . __' : v('date')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <p>본 계약의 증명으로서 채무자가 기명 날인하여 채권자에게 제출한다.</p>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${d}</div>
                        <div class="signature">채무자: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('debtor') || '(인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'power_of_attorney',
                name: '위임장 (일반)',
                fields: [
                    { id: 'proxy_name', label: '대리인(수임인) 성명', type: 'text' },
                    { id: 'proxy_id', label: '대리인 주민번호', type: 'text' },
                    { id: 'principle_name', label: '본인(위임인) 성명', type: 'text' },
                    { id: 'principle_addr', label: '본인 주소', type: 'text' },
                    { id: 'scope', label: '위임 사항', type: 'textarea', placeholder: '금융거래 일절 등' },
                    { id: 'submitDate', label: '위임일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>위 임 장</h1></div>
                    <div class="doc-section">
                        <h3>대리인(수임인) 인적사항</h3>
                        <p>성명: <span class="editable">${v('proxy_name')}</span> / 주민번호: <span class="editable">${v('proxy_id')}</span></p>
                    </div>
                    <div class="doc-section">
                        <h3>위임할 사항</h3>
                        <div class="doc-content-box editable">${mode === 'print' ? '&nbsp;' : (v('scope')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <p>위 사람에게 위 사항에 관한 권한을 위임합니다.</p>
                    <div class="doc-footer">
                        <div class="date">${d}</div>
                        <div class="signature">위임인(본인): <span class="editable">${mode === 'print' ? '________________ (인)' : (v('principle_name') + ' (인)')}</span></div>
                        <p>주소: <span class="editable">${v('principle_addr')}</span></p>
                    </div>
                `;
                }
            },
            {
                id: 'petition',
                name: '탄원서 (일반)',
                fields: [
                    { id: 'petitioner', label: '탄원인 성명', type: 'text' },
                    { id: 'petitionerId', label: '주민번호', type: 'text' },
                    { id: 'addr', label: '주소', type: 'text' },
                    { id: 'target', label: '피탄원인', type: 'text' },
                    { id: 'content', label: '탄원 이유', type: 'textarea' },
                    { id: 'submitDate', label: '제출일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>탄 원 서</h1></div>
                    <div class="doc-info"><p>피탄원인: <span class="editable">${v('target')}</span></p></div>
                    <div class="doc-section">
                        <h3>[탄원 이유]</h3>
                        <div class="doc-content-box editable" style="min-height: 400px;">${mode === 'print' ? '&nbsp;' : (v('content')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="doc-footer">
                        <div class="signature">탄원인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('petitioner') + ' (인)')}</span></div>
                        <p>주소: <span class="editable">${v('addr')}</span></p>
                        <div class="date">${d}</div>
                        <div class="target">${mode === 'print' ? '________________________' : 'OOO'}지방법원/검찰청 귀중</div>
                    </div>
                `;
                }
            },
            {
                id: 'agreement',
                name: '합의서',
                fields: [
                    { id: 'partyA', label: '갑(甲)', type: 'text' },
                    { id: 'partyB', label: '을(乙)', type: 'text' },
                    { id: 'content', label: '합의 내용', type: 'textarea' },
                    { id: 'amount', label: '합의금', type: 'number' },
                    { id: 'submitDate', label: '합의일', type: 'date' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const amt = mode === 'print' ? '' : Number(data.amount || 0).toLocaleString();
                    const d = mode === 'print'
                        ? (data.submitDate ? data.submitDate : '20__ . __ . __')
                        : (data.submitDate || (data.submitDate || new Date().toLocaleDateString()));

                    return `
                    <div class="doc-header"><h1>합 의 서</h1></div>
                    <div class="doc-section">
                        <p>갑(甲): <span class="editable">${v('partyA')}</span></p>
                        <p>을(乙): <span class="editable">${v('partyB')}</span></p>
                    </div>
                    <div class="doc-section">
                        <h3>합의 내용</h3>
                        <div class="doc-content-box editable">${mode === 'print' ? '&nbsp;' : (v('content')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <table class="doc-table">
                        <tr><th>합의금</th><td colspan="3" class="editable">금 ${mode === 'print' ? '________________________' : amt} 원 정</td></tr>
                    </table>
                    <div class="doc-section">
                        <p>위와 같이 합의하고, 향후 민·형사상 일체의 이의를 제기하지 않을 것을 약속합니다.</p>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${d}</div>
                        <div class="signature">갑(甲): <span class="editable">${mode === 'print' ? '________________ (인)' : (v('partyA') + ' (인)')}</span></div>
                        <div class="signature">을(乙): <span class="editable">${mode === 'print' ? '________________ (인)' : (v('partyB') + ' (인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'pledge',
                name: '각서',
                fields: [
                    { id: 'writer', label: '작성자 성명', type: 'text' },
                    { id: 'writerId', label: '주민번호', type: 'text' },
                    { id: 'addr', label: '주소', type: 'text' },
                    { id: 'content', label: '각서 내용', type: 'textarea' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>각 서</h1></div>
                    <table class="doc-table">
                        <tr><th>성명</th><td class="editable">${v('writer')}</td><th>주민번호</th><td class="editable">${v('writerId')}</td></tr>
                        <tr><th>주소</th><td colspan="3" class="editable">${v('addr')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <h3>본인은 아래와 같이 서약합니다.</h3>
                        <div class="doc-content-box editable">${(v('content')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="doc-section">
                        <p>위 약속을 위반할 시 어떠한 민·형사상 책임도 감수할 것을 서약합니다.</p>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">작성자: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('writer') + ' (인)')}</span></div>
                    </div>
                `;
                }
            }
        ]
    },
    hr: {
        title: '인사/노무',
        items: [
            {
                id: 'employment_cert',
                name: '재직증명서',
                fields: [
                    { id: 'name', label: '성명', type: 'text' },
                    { id: 'id_num', label: '주민번호', type: 'text' },
                    { id: 'dept', label: '소속', type: 'text' },
                    { id: 'pos', label: '직위', type: 'text' },
                    { id: 'period', label: '재직 기간', type: 'text', placeholder: '2020.01.01 ~ 현재' },
                    { id: 'purpose', label: '용도', type: 'text', placeholder: '금융기관 제출용 등' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>재 직 증 명 서</h1></div>
                    <table class="doc-table">
                        <tr><th>성 명</th><td class="editable">${v('name')}</td><th>주민번호</th><td class="editable">${v('id_num')}</td></tr>
                        <tr><th>소 속</th><td class="editable">${v('dept')}</td><th>직 위</th><td class="editable">${v('pos')}</td></tr>
                        <tr><th>재직기간</th><td colspan="3" class="editable">${v('period')}</td></tr>
                        <tr><th>용 도</th><td colspan="3" class="editable">${v('purpose')}</td></tr>
                    </table>
                    <div class="doc-section"><p>위와 같이 재직하고 있음을 증명합니다.</p></div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">주식회사 ${mode === 'print' ? '________' : 'OOO'} 대표이사 <span class="editable">${mode === 'print' ? '________________ (인)' : '(인)'}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'resignation',
                name: '사직서',
                fields: [
                    { id: 'name', label: '성명', type: 'text' },
                    { id: 'date', label: '퇴사 일자', type: 'date' },
                    { id: 'reason', label: '사유', type: 'text' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>사 직 서</h1></div>
                    <table class="doc-table">
                        <tr><th>성 명</th><td class="editable">${v('name')}</td><th>퇴사일자</th><td class="editable">${v('date')}</td></tr>
                        <tr><th>사 유</th><td colspan="3" class="editable">${v('reason')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <p>상기 본인은 위와 같은 사유로 사직하고자 하오니 처리하여 주시기 바랍니다.</p>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">신청인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('name') || '(인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'leave_request',
                name: '휴가신청서',
                fields: [
                    { id: 'name', label: '성명', type: 'text' },
                    { id: 'dept', label: '소속/직급', type: 'text' },
                    { id: 'leaveType', label: '휴가 종류', type: 'text', placeholder: '연차, 병가, 경조사 등' },
                    { id: 'startDate', label: '시작일', type: 'date' },
                    { id: 'endDate', label: '종료일', type: 'date' },
                    { id: 'reason', label: '사유', type: 'textarea' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>휴 가 신 청 서</h1></div>
                    <table class="doc-table">
                        <tr><th>성 명</th><td class="editable">${v('name')}</td><th>소속/직급</th><td class="editable">${v('dept')}</td></tr>
                        <tr><th>휴가종류</th><td colspan="3" class="editable">${v('leaveType')}</td></tr>
                        <tr><th>시작일</th><td class="editable">${v('startDate')}</td><th>종료일</th><td class="editable">${v('endDate')}</td></tr>
                        <tr><th>사 유</th><td colspan="3" class="editable">${(v('reason')).replace(/\n/g, '<br>')}</td></tr>
                    </table>
                    <div class="doc-section"><p>위와 같이 휴가를 신청하오니 허락하여 주시기 바랍니다.</p></div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">신청인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('name') + ' (인)')}</span></div>
                        <div class="target">${mode === 'print' ? '________' : 'OOO'} 대표이사 귀하</div>
                    </div>
                `;
                }
            },
            {
                id: 'career_cert',
                name: '경력증명서',
                fields: [
                    { id: 'name', label: '성명', type: 'text' },
                    { id: 'id_num', label: '주민번호', type: 'text' },
                    { id: 'company', label: '근무회사', type: 'text' },
                    { id: 'dept', label: '부서', type: 'text' },
                    { id: 'position', label: '직위', type: 'text' },
                    { id: 'period', label: '근무기간', type: 'text' },
                    { id: 'duties', label: '담당업무', type: 'textarea' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>경 력 증 명 서</h1></div>
                    <table class="doc-table">
                        <tr><th>성 명</th><td class="editable">${v('name')}</td><th>주민번호</th><td class="editable">${v('id_num')}</td></tr>
                        <tr><th>근무회사</th><td colspan="3" class="editable">${v('company')}</td></tr>
                        <tr><th>부 서</th><td class="editable">${v('dept')}</td><th>직 위</th><td class="editable">${v('position')}</td></tr>
                        <tr><th>근무기간</th><td colspan="3" class="editable">${v('period')}</td></tr>
                        <tr><th>담당업무</th><td colspan="3" class="editable">${(v('duties')).replace(/\n/g, '<br>')}</td></tr>
                    </table>
                    <div class="doc-section"><p>위와 같이 근무하였음을 증명합니다.</p></div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">주식회사 ${mode === 'print' ? '________' : 'OOO'} 대표이사 <span class="editable">${mode === 'print' ? '________________ (인)' : '(인)'}</span></div>
                    </div>
                `;
                }
            }
        ]
    },
    business: {
        title: '비즈니스 실무',
        items: [
            {
                id: 'quote',
                name: '견적서',
                fields: [
                    { id: 'to', label: '수신처', type: 'text' },
                    { id: 'q1_name', label: '품명1', type: 'text' },
                    { id: 'q1_qty', label: '수량1', type: 'number' },
                    { id: 'q1_prc', label: '단가1', type: 'number' },
                    { id: 'q2_name', label: '품명2', type: 'text' },
                    { id: 'q2_qty', label: '수량2', type: 'number' },
                    { id: 'q2_prc', label: '단가2', type: 'number' },
                    { id: 'q3_name', label: '품명3', type: 'text' },
                    { id: 'q3_qty', label: '수량3', type: 'number' },
                    { id: 'q3_prc', label: '단가3', type: 'number' },
                    { id: 'amount', label: '견적 총액', type: 'number' }
                ],
                calculate: (data) => {
                    let total = 0;
                    [1, 2, 3].forEach(i => {
                        const qty = parseInt(data[`q${i}_qty`]);
                        const prc = parseInt(data[`q${i}_prc`]);
                        if (!isNaN(qty) && !isNaN(prc)) {
                            total += qty * prc;
                        }
                    });
                    if (total > 0) data.amount = total;
                    return data;
                },
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const amt = mode === 'print' ? '' : Number(data.amount || 0).toLocaleString();

                    const rows = [1, 2, 3].map(i => {
                        const name = v(`q${i}_name`);
                        const qty = v(`q${i}_qty`);
                        const prc = v(`q${i}_prc`);
                        let supply = '';
                        if (qty && prc) supply = (parseInt(qty) * parseInt(prc)).toLocaleString();

                        if (mode === 'print') return '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
                        return `<tr><td>${name}</td><td>${qty}</td><td>${prc}</td><td>${supply}</td></tr>`;
                    }).join('');

                    return `
                    <div class="doc-header"><h1>견 적 서</h1></div>
                    <div class="doc-info"><p><span class="editable">${v('to') || '________________ 귀하'}</span></p><p>아래와 같이 견적합니다.</p></div>
                    <table class="doc-table">
                        <tr><th>견적총액</th><td colspan="3" class="editable">₩ ${mode === 'print' ? '________________________' : amt} (부가세 포함)</td></tr>
                    </table>
                    <table class="doc-table">
                        <thead><tr><th>품명</th><th>수량</th><th>단가</th><th>공급가액</th></tr></thead>
                        <tbody>
                            ${rows}
                            ${mode === 'print' ? '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'.repeat(2) : ''}
                        </tbody>
                    </table>
                    <div class="doc-footer">
                        <div class="date">${mode === 'print' ? '20__ . __ . __' : (data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">공급자: ${mode === 'print' ? '________________________' : 'OOO 사업부'} <span class="editable">${mode === 'print' ? '________________ (인)' : '(인)'}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'expenditure',
                name: '지출결의서',
                fields: [
                    { id: 'requester', label: '작성자', type: 'text' },
                    { id: 'e1_desc', label: '상세내역1', type: 'text' },
                    { id: 'e1_amt', label: '금액1', type: 'number' },
                    { id: 'e2_desc', label: '상세내역2', type: 'text' },
                    { id: 'e2_amt', label: '금액2', type: 'number' },
                    { id: 'total', label: '총 금액', type: 'number' }
                ],
                calculate: (data) => {
                    let sum = 0;
                    [1, 2].forEach(i => {
                        const val = parseInt(data[`e${i}_amt`]);
                        if (!isNaN(val)) sum += val;
                    });
                    if (sum > 0) data.total = sum;
                    return data;
                },
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const amt = mode === 'print' ? '' : Number(data.total || 0).toLocaleString();

                    const rows = [1, 2].map(i => {
                        const desc = v(`e${i}_desc`);
                        const mnt = v(`e${i}_amt`);
                        if (mode === 'print') return '<tr><td colspan="4">&nbsp;</td></tr>';
                        return `<tr><td style="width:120px; font-weight:700;">내역${i}</td><td class="editable">${desc}</td><td style="width:80px; font-weight:700;">금액</td><td class="editable">₩ ${mnt ? parseInt(mnt).toLocaleString() : ''}</td></tr>`;
                    }).join('');

                    return `
                    <div class="doc-header"><h1>지 출 결 의 서</h1></div>
                    <table class="doc-table">
                        <tr><th style="background:#F1F5F9;">총 금액</th><td colspan="3" class="editable" style="font-size:18px; font-weight:900; color:var(--primary-indigo);">₩ ${mode === 'print' ? '________________________' : amt}</td></tr>
                        ${rows}
                    </table>
                    <div class="doc-footer">
                        <div class="date">${mode === 'print' ? '20__ . __ . __' : (data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">작성자: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('requester') + ' (인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'receipt',
                name: '영수증',
                fields: [
                    { id: 'receiver', label: '수령인', type: 'text' },
                    { id: 'amount', label: '금액', type: 'number' },
                    { id: 'purpose', label: '수령 항목', type: 'text' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const amt = mode === 'print' ? '' : Number(data.amount || 0).toLocaleString();
                    return `
                    <div class="doc-header"><h1>영 수 증</h1></div>
                    <table class="doc-table">
                        <tr><th>금액</th><td colspan="3" class="editable">₩ ${mode === 'print' ? '________________________' : amt}</td></tr>
                        <tr><th>항목</th><td colspan="3" class="editable">${v('purpose')}</td></tr>
                    </table>
                    <div class="doc-section"><p>위 금액을 정히 영수합니다.</p></div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">수령인: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('receiver') + ' (인)')}</span></div>
                    </div>
                `;
                }
            }
        ]
    },
    education: {
        title: '교육/학교',
        items: [
            {
                id: 'school_trip',
                name: '현장체험학습 신청서',
                fields: [
                    { id: 'student_name', label: '학생 성명', type: 'text' },
                    { id: 'grade', label: '학년/반', type: 'text', placeholder: '5학년 1반' },
                    { id: 'period', label: '학습 기간', type: 'text', placeholder: '2025.05.01 ~ 2025.05.03' },
                    { id: 'place', label: '학습 장소', type: 'text' },
                    { id: 'reason', label: '학습 사유', type: 'textarea' },
                    { id: 'parent_name', label: '보호자 성명', type: 'text' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>현장체험학습 신청서</h1></div>
                    <table class="doc-table">
                        <tr><th>학생 성명</th><td class="editable">${v('student_name')}</td><th>학년/반</th><td class="editable">${v('grade')}</td></tr>
                        <tr><th>학습 기간</th><td colspan="3" class="editable">${v('period')}</td></tr>
                        <tr><th>학습 장소</th><td colspan="3" class="editable">${v('place')}</td></tr>
                        <tr><th>학습 사유</th><td colspan="3" class="editable">${mode === 'print' ? '&nbsp;' : (v('reason')).replace(/\n/g, '<br>')}</td></tr>
                    </table>
                    <div class="doc-section"><p>위와 같이 현장체험학습을 신청합니다.</p></div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">보호자: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('parent_name') + ' (인)')}</span></div>
                        <div class="target">${mode === 'print' ? '________________________' : 'OOO'} 초등학교장 귀하</div>
                    </div>
                `;
                }
            },
            {
                id: 'after_school',
                name: '방과후학교 수강 신청서',
                fields: [
                    { id: 'student_name', label: '학생 성명', type: 'text' },
                    { id: 'grade', label: '학년/반', type: 'text' },
                    { id: 'program', label: '수강 희망 프로그램', type: 'text', placeholder: '코딩, 창의수학 등' },
                    { id: 'parent_name', label: '보호자 성명', type: 'text' },
                    { id: 'contact', label: '비상 연락처', type: 'text' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>방과후학교 수강 신청서</h1></div>
                    <table class="doc-table">
                        <tr><th>학생 성명</th><td class="editable">${v('student_name')}</td><th>학년/반</th><td class="editable">${v('grade')}</td></tr>
                        <tr><th>희망 프로그램</th><td colspan="3" class="editable">${v('program')}</td></tr>
                        <tr><th>보호자 성명</th><td class="editable">${v('parent_name')}</td><th>연락처</th><td class="editable">${v('contact')}</td></tr>
                    </table>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">신청인(보호자): <span class="editable">${mode === 'print' ? '________________ (인)' : (v('parent_name') + ' (인)')}</span></div>
                    </div>
                `;
                }
            },
            {
                id: 'parental_consent',
                name: '학부모 동의서',
                fields: [
                    { id: 'parent_name', label: '학부모 성명', type: 'text' },
                    { id: 'relation', label: '학생과의 관계', type: 'select', options: ['부(父)', '모(母)', '기타'] },
                    { id: 'student_name', label: '학생 성명', type: 'text' },
                    { id: 'content', label: '동의 내용', type: 'textarea', placeholder: '학교 행사 참여 등 동의 내용 작성' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    return `
                    <div class="doc-header"><h1>학부모 동의서</h1></div>
                    <table class="doc-table">
                        <tr><th>학부모 성명</th><td class="editable">${v('parent_name')}</td><th>관계</th><td class="editable">${v('relation')}</td></tr>
                        <tr><th>학생 성명</th><td colspan="3" class="editable">${v('student_name')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <h3>[동의 사항]</h3>
                        <div class="doc-content-box editable">${mode === 'print' ? '&nbsp;' : (v('content')).replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${(data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">학부모: <span class="editable">${mode === 'print' ? '________________ (인)' : (v('parent_name') + ' (인)')}</span></div>
                    </div>
                `;
                }
            }
        ]
    },
    realestate: {
        title: '부동산',
        items: [
            {
                id: 'lease_contract',
                name: '임대차계약서 (주택)',
                fields: [
                    { id: 'landlord', label: '임대인(집주인)', type: 'text' },
                    { id: 'tenant', label: '임차인(세입자)', type: 'text' },
                    { id: 'address', label: '부동산 소재지', type: 'text' },
                    { id: 'deposit', label: '보증금', type: 'number' },
                    { id: 'monthly', label: '월세', type: 'number' },
                    { id: 'period', label: '계약기간', type: 'text', placeholder: '2025.01.01 ~ 2027.01.01' }
                ],
                render: (data, mode = 'preview') => {
                    const v = (key) => mode === 'print' ? '' : (data[key] || '');
                    const dep = mode === 'print' ? '' : Number(data.deposit || 0).toLocaleString();
                    const mon = mode === 'print' ? '' : Number(data.monthly || 0).toLocaleString();
                    return `
                    <div class="doc-header"><h1>주택 임대차 계약서</h1></div>
                    <div class="doc-section">
                        <p>임대인(갑): <span class="editable">${v('landlord')}</span></p>
                        <p>임차인(을): <span class="editable">${v('tenant')}</span></p>
                    </div>
                    <table class="doc-table">
                        <tr><th>소재지</th><td colspan="3" class="editable">${v('address')}</td></tr>
                        <tr><th>보증금</th><td class="editable">금 ${mode === 'print' ? '____________________' : dep}원 정</td><th>월세</th><td class="editable">금 ${mode === 'print' ? '________________' : mon}원</td></tr>
                        <tr><th>계약기간</th><td colspan="3" class="editable">${mode === 'print' ? '20__ . __ . __ ~ 20__ . __ . __' : v('period')}</td></tr>
                    </table>
                    <div class="doc-section">
                        <p>위 부동산의 임대차에 관하여 임대인과 임차인은 합의에 의해 계약을 체결한다.</p>
                    </div>
                    <div class="doc-footer">
                        <div class="date">${mode === 'print' ? '20__ . __ . __' : (data.submitDate || new Date().toLocaleDateString())}</div>
                        <div class="signature">임대인(갑): <span class="editable">${mode === 'print' ? '________________ (인)' : (v('landlord') + ' (인)')}</span></div>
                        <div class="signature">임차인(을): <span class="editable">${mode === 'print' ? '________________ (인)' : (v('tenant') + ' (인)')}</span></div>
                    </div>
                `;
                }
            }
        ]
    }
};

window.FormTemplates = FormTemplates;
if (typeof module !== 'undefined') module.exports = FormTemplates;
