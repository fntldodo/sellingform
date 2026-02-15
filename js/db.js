// ============================================================
// SellingForm v3.8 - IndexedDB 관리
// ============================================================

(function() {
    'use strict';

    const DB_NAME = 'SellingFormDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'workItems';

    // ============================================================
    // DB 초기화 및 연결
    // ============================================================
    
    class DatabaseManager {
        constructor() {
            this.db = null;
        }

        // DB 연결 (없으면 생성)
        async init() {
            return new Promise((resolve, reject) => {
                // IndexedDB 지원 체크
                if (!window.indexedDB) {
                    reject(new Error('IndexedDB를 지원하지 않는 브라우저입니다.'));
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                // DB 생성 또는 업그레이드 시
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // ObjectStore 생성 (테이블과 유사)
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const objectStore = db.createObjectStore(STORE_NAME, { 
                            keyPath: 'id',
                            autoIncrement: true 
                        });

                        // 인덱스 생성 (빠른 검색용)
                        objectStore.createIndex('type', 'type', { unique: false });
                        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                        objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                        
                        console.log('ObjectStore 생성 완료:', STORE_NAME);
                    }
                };

                // 연결 성공
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log('IndexedDB 연결 성공');
                    resolve(this.db);
                };

                // 연결 실패
                request.onerror = (event) => {
                    console.error('IndexedDB 연결 실패:', event.target.error);
                    reject(event.target.error);
                };
            });
        }

        // ============================================================
        // CRUD 메서드
        // ============================================================

        // 생성 (Create)
        async addItem(itemData) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                // 타임스탬프 자동 추가
                const now = new Date().toISOString();
                const item = {
                    ...itemData,
                    createdAt: now,
                    updatedAt: now
                };

                // 트랜잭션 시작 (쓰기 모드)
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.add(item);

                request.onsuccess = () => {
                    console.log('아이템 저장 완료, ID:', request.result);
                    resolve(request.result); // 자동 생성된 ID 반환
                };

                request.onerror = () => {
                    console.error('아이템 저장 실패:', request.error);
                    reject(request.error);
                };
            });
        }

        // 읽기 - 단일 (Read One)
        async getItem(id) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        }

        // 읽기 - 전체 (Read All)
        async getAllItems(filter = null) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                
                let request;
                
                // 타입별 필터링
                if (filter && filter.type) {
                    const index = objectStore.index('type');
                    request = index.getAll(filter.type);
                } else {
                    request = objectStore.getAll();
                }

                request.onsuccess = () => {
                    let items = request.result;

                    // 최신순 정렬 (updatedAt 기준)
                    items.sort((a, b) => {
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                    });

                    // 검색어 필터링 (옵션)
                    if (filter && filter.search) {
                        const searchTerm = filter.search.toLowerCase();
                        items = items.filter(item => {
                            return (
                                (item.title && item.title.toLowerCase().includes(searchTerm)) ||
                                (item.data && JSON.stringify(item.data).toLowerCase().includes(searchTerm))
                            );
                        });
                    }

                    resolve(items);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        }

        // 수정 (Update)
        async updateItem(id, updates) {
            if (!this.db) await this.init();

            return new Promise(async (resolve, reject) => {
                try {
                    // 기존 데이터 가져오기
                    const existingItem = await this.getItem(id);
                    if (!existingItem) {
                        reject(new Error('아이템을 찾을 수 없습니다.'));
                        return;
                    }

                    // 업데이트 타임스탬프 갱신
                    const updatedItem = {
                        ...existingItem,
                        ...updates,
                        id: id, // ID는 변경 불가
                        createdAt: existingItem.createdAt, // 생성일은 유지
                        updatedAt: new Date().toISOString()
                    };

                    // 트랜잭션 시작
                    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                    const objectStore = transaction.objectStore(STORE_NAME);
                    const request = objectStore.put(updatedItem);

                    request.onsuccess = () => {
                        console.log('아이템 수정 완료, ID:', id);
                        resolve(updatedItem);
                    };

                    request.onerror = () => {
                        console.error('아이템 수정 실패:', request.error);
                        reject(request.error);
                    };
                } catch (error) {
                    reject(error);
                }
            });
        }

        // 삭제 (Delete)
        async deleteItem(id) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.delete(id);

                request.onsuccess = () => {
                    console.log('아이템 삭제 완료, ID:', id);
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('아이템 삭제 실패:', request.error);
                    reject(request.error);
                };
            });
        }

        // ============================================================
        // 유틸리티 메서드
        // ============================================================

        // 전체 데이터 카운트
        async getCount(type = null) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                
                let request;
                if (type) {
                    const index = objectStore.index('type');
                    request = index.count(type);
                } else {
                    request = objectStore.count();
                }

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        }

        // 전체 데이터 삭제 (초기화)
        async clearAll() {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.clear();

                request.onsuccess = () => {
                    console.log('전체 데이터 삭제 완료');
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        }

        // DB 연결 종료
        close() {
            if (this.db) {
                this.db.close();
                this.db = null;
                console.log('IndexedDB 연결 종료');
            }
        }
    }

    // ============================================================
    // 전역 인스턴스 생성
    // ============================================================
    
    const dbManager = new DatabaseManager();

    // 페이지 로드 시 자동 초기화
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await dbManager.init();
        } catch (error) {
            console.error('DB 초기화 실패:', error);
            // 사용자에게 알림 (옵션)
            if (window.SellingForm && window.SellingForm.Toast) {
                window.SellingForm.Toast.show(
                    '데이터 저장 기능을 사용할 수 없습니다. 최신 브라우저를 사용해주세요.',
                    5000
                );
            }
        }
    });

    // 페이지 종료 시 연결 정리
    window.addEventListener('beforeunload', () => {
        dbManager.close();
    });

    // ============================================================
    // 전역 네임스페이스에 등록
    // ============================================================
    
    window.SellingForm = window.SellingForm || {};
    window.SellingForm.DB = dbManager;

    // ============================================================
    // 데이터 구조 예시 (주석)
    // ============================================================
    
    /*
    workItem 구조:
    {
        id: 1, // 자동 생성
        type: 'detail', // 'detail' | 'pdf' | 'convert' | 'form'
        title: '프리미엄 수분 크림 상세페이지',
        thumbnail: 'data:image/png;base64,...', // 썸네일 Base64
         { 
            // 타입별 실제 작업 데이터
            template: 'beauty_01',
            sections: { hero: {...}, usp: {...}, ... }
        },
        createdAt: '2025-12-28T01:30:00.000Z',
        updatedAt: '2025-12-28T02:15:00.000Z'
    }
    */

})();
