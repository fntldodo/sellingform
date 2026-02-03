// ============================================================
// SellingForm v3.8 - Workbench 작업 관리
// ============================================================

(function () {
    'use strict';

    // ============================================================
    // 전역 상태
    // ============================================================

    const State = {
        currentFilter: 'all',
        searchQuery: '',
        items: [],
        lastDeletedItem: null
    };

    // ============================================================
    // 페이지 초기화
    // ============================================================

    document.addEventListener('DOMContentLoaded', async function () {
        console.log('Workbench 초기화 시작');

        // UI 이벤트 바인딩
        initUI();

        // 초기 데이터 로드
        await loadItems();

        console.log('Workbench 초기화 완료');
    });

    // ============================================================
    // UI 초기화
    // ============================================================

    function initUI() {
        // 필터 버튼들
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.dataset.filter;
                setFilter(filter);
            });
        });

        // 검색 입력
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                State.searchQuery = this.value.trim();
                renderItems();
            });
        }

        // Import 버튼
        const btnImport = document.getElementById('btnImport');
        if (btnImport) {
            btnImport.addEventListener('click', triggerJsonImport);
        }

        // 뒤로가기 버튼
        const btnBack = document.getElementById('btnBack');
        if (btnBack) {
            btnBack.addEventListener('click', function () {
                window.location.href = '../index.html';
            });
        }
    }

    // ============================================================
    // 필터 설정
    // ============================================================

    function setFilter(filter) {
        State.currentFilter = filter;

        // 버튼 active 상태 변경
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // 아이템 재렌더링
        renderItems();
    }

    // ============================================================
    // 아이템 로드
    // ============================================================

    async function loadItems() {
        try {
            const allItems = await window.SellingForm.DB.getAllItems();
            State.items = allItems;
            renderItems();
        } catch (error) {
            console.error('아이템 로드 실패:', error);
            alert('작업 목록을 불러오는데 실패했습니다.');
        }
    }

    // ============================================================
    // 아이템 렌더링
    // ============================================================

    function renderItems() {
        const grid = document.getElementById('itemsGrid');
        if (!grid) return;

        // 필터링
        let filteredItems = State.items;

        // 타입 필터
        if (State.currentFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.type === State.currentFilter);
        }

        // 검색 필터
        if (State.searchQuery) {
            const query = State.searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(item => {
                return (
                    (item.title && item.title.toLowerCase().includes(query)) ||
                    (item.data && JSON.stringify(item.data).toLowerCase().includes(query))
                );
            });
        }

        // 빈 상태 체크
        if (filteredItems.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>작업이 없습니다</h3>
                    <p>새로운 작업을 시작하거나 JSON 파일을 가져오세요.</p>
                    <button class="btn-primary" onclick="window.location.href='../index.html'">
                        새 작업 시작
                    </button>
                </div>
            `;
            return;
        }

        // 아이템 카드 렌더링
        grid.innerHTML = '';
        filteredItems.forEach(item => {
            const card = createItemCard(item);
            grid.appendChild(card);
        });
    }

    // ============================================================
    // 아이템 카드 생성
    // ============================================================

    function createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'work-item';

        // 썸네일
        const thumbnail = document.createElement('div');
        thumbnail.className = 'item-thumbnail';
        if (item.thumbnail) {
            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = item.title;
            thumbnail.appendChild(img);
        } else {
            // 기본 아이콘
            const icon = document.createElement('div');
            icon.textContent = getTypeIcon(item.type);
            thumbnail.appendChild(icon);
        }
        card.appendChild(thumbnail);

        // 정보
        const info = document.createElement('div');
        info.className = 'item-info';

        // 타입 뱃지
        const typeBadge = document.createElement('span');
        typeBadge.className = `item-type ${item.type}`;
        typeBadge.textContent = getTypeName(item.type);
        info.appendChild(typeBadge);

        // 제목
        const title = document.createElement('div');
        title.className = 'item-title';
        title.textContent = item.title || '제목 없음';
        info.appendChild(title);

        // 메타 정보
        const meta = document.createElement('div');
        meta.className = 'item-meta';

        let dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '날짜 없음';
        if (window.SellingForm && window.SellingForm.Utils && window.SellingForm.Utils.formatRelativeTime) {
            dateStr = window.SellingForm.Utils.formatRelativeTime(new Date(item.updatedAt).getTime());
        }

        meta.innerHTML = `
            <span>📅 ${dateStr}</span>
            <span>ID: ${item.id}</span>
        `;
        info.appendChild(meta);

        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-edit';
        btnEdit.textContent = '편집';
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            editItem(item);
        });
        actions.appendChild(btnEdit);

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-delete';
        btnDelete.textContent = '삭제';
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteItem(item);
        });
        actions.appendChild(btnDelete);

        info.appendChild(actions);
        card.appendChild(info);

        // 카드 클릭 이벤트 (편집과 동일)
        card.addEventListener('click', () => {
            editItem(item);
        });

        return card;
    }

    // ============================================================
    // 타입별 정보
    // ============================================================

    function getTypeIcon(type) {
        const icons = {
            detail: '🎨',
            pdf: '📄',
            convert: '🔄',
            form: '📋'
        };
        return icons[type] || '📦';
    }

    function getTypeName(type) {
        const names = {
            detail: '상세페이지',
            pdf: 'PDF 변환',
            convert: '이미지 변환',
            form: '입력폼'
        };
        return names[type] || type.toUpperCase();
    }

    // ============================================================
    // 편집
    // ============================================================

    function editItem(item) {
        const typePages = {
            'detail': 'detail.html',
            'pdf': 'pdf.html',
            'form': 'form.html',
            'convert': 'convert.html'
        };

        const page = typePages[item.type];
        if (page) {
            window.location.href = `${page}?id=${item.id}`;
        } else {
            alert(`${getTypeName(item.type)} 편집 기능은 현재 지원되지 않습니다.`);
        }
    }

    // ============================================================
    // 삭제
    // ============================================================

    async function deleteItem(item) {
        const confirmed = confirm(`"${item.title}"을(를) 삭제하시겠습니까?\n삭제 후 5초 내에 실행 취소할 수 있습니다.`);
        if (!confirmed) return;

        try {
            // DB에서 삭제
            await window.SellingForm.DB.deleteItem(item.id);

            // 상태에서 제거
            State.items = State.items.filter(i => i.id !== item.id);
            State.lastDeletedItem = item;

            // UI 갱신
            renderItems();

            // Undo 토스트 표시
            if (window.SellingForm.Toast) {
                window.SellingForm.Toast.show(
                    '삭제되었습니다',
                    5000,
                    '실행 취소',
                    undoDelete
                );
            }

        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제에 실패했습니다.');
        }
    }

    // ============================================================
    // 삭제 취소
    // ============================================================

    async function undoDelete() {
        if (!State.lastDeletedItem) return;

        try {
            // DB에 복원 (새 ID로 저장)
            const newId = await window.SellingForm.DB.addItem(State.lastDeletedItem);

            // 상태에 복원
            const restoredItem = { ...State.lastDeletedItem, id: newId };
            State.items.push(restoredItem);
            State.lastDeletedItem = null;

            // UI 갱신
            await loadItems(); // 전체 다시 로드

            if (window.SellingForm.Toast) {
                window.SellingForm.Toast.show('복원되었습니다', 2000);
            }

        } catch (error) {
            console.error('복원 실패:', error);
            alert('복원에 실패했습니다.');
        }
    }

    // ============================================================
    // JSON Import
    // ============================================================

    function triggerJsonImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.addEventListener('change', async function (e) {
            const file = e.target.files[0];
            if (file) {
                await handleJsonImport(file);
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    async function handleJsonImport(file) {
        try {
            // 로딩 표시
            if (window.SellingForm.Utils) {
                window.SellingForm.Utils.showLoading('JSON 파일 처리 중...');
            }

            // 파일 읽기
            const text = await file.text();
            const jsonData = JSON.parse(text);

            // 데이터 검증
            if (!jsonData.template || !jsonData.data) {
                throw new Error('올바른 SellingForm JSON 형식이 아닙니다.');
            }

            // DB에 저장
            const itemData = {
                type: 'detail',
                title: jsonData.title || file.name.replace('.json', ''),
                thumbnail: null,
                data: jsonData
            };

            const id = await window.SellingForm.DB.addItem(itemData);

            // 로딩 숨기기
            if (window.SellingForm.Utils) {
                window.SellingForm.Utils.hideLoading();
            }

            // 성공 알림
            if (window.SellingForm.Toast) {
                window.SellingForm.Toast.show('JSON 파일을 가져왔습니다!', 2000);
            }

            // 목록 갱신
            await loadItems();

            // 바로 편집 페이지로 이동
            const goToEdit = confirm('가져온 작업을 바로 편집하시겠습니까?');
            if (goToEdit) {
                window.location.href = `detail.html?id=${id}`;
            }

        } catch (error) {
            console.error('JSON Import 실패:', error);

            if (window.SellingForm.Utils) {
                window.SellingForm.Utils.hideLoading();
            }

            alert(`JSON 가져오기 실패: ${error.message}`);
        }
    }

    // ============================================================
    // 전역 함수 노출
    // ============================================================

    window.undoDelete = undoDelete;

})();
