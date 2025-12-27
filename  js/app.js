// ============================================================
// SellingForm v3.8 - 공통 앱 로직
// ============================================================

(function() {
    'use strict';

    // 전역 네임스페이스
    window.SellingForm = window.SellingForm || {};

    // ============================================================
    // 유틸리티 함수
    // ============================================================
    
    const Utils = {
        // 안전한 파일명 변환 (공백, 특수문자 제거)
        sanitizeFilename: function(filename) {
            return filename
                .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
        },

        // 날짜 포맷 (YYYY-MM-DD HH:mm)
        formatDate: function(date) {
            if (!date) date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        },

        // 상대 시간 표시 (예: 3분 전, 2일 전)
        formatRelativeTime: function(date) {
            if (!date) return '';
            const now = new Date();
            const diffMs = now - new Date(date);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return '방금 전';
            if (diffMins < 60) return `${diffMins}분 전`;
            if (diffHours < 24) return `${diffHours}시간 전`;
            if (diffDays < 7) return `${diffDays}일 전`;
            return this.formatDate(date);
        },

        // 파일 크기 포맷 (예: 1.5 MB)
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        },

        // 디바운스 (연속 호출 방지)
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // 로딩 스피너 표시
        showLoading: function(message = '처리 중...') {
            let loader = document.getElementById('globalLoader');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.className = 'global-loader';
                loader.innerHTML = `
                    <div class="loader-content">
                        <div class="spinner"></div>
                        <p class="loader-message">${message}</p>
                    </div>
                `;
                document.body.appendChild(loader);
            } else {
                loader.querySelector('.loader-message').textContent = message;
                loader.style.display = 'flex';
            }
        },

        // 로딩 스피너 숨기기
        hideLoading: function() {
            const loader = document.getElementById('globalLoader');
            if (loader) {
                loader.style.display = 'none';
            }
        }
    };

    // ============================================================
    // 모달 관리
    // ============================================================
    
    const Modal = {
        // 모달 열기
        open: function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal ${modalId} not found`);
                return;
            }
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // 배경 스크롤 방지

            // 배경 클릭 시 닫기
            modal.addEventListener('click', this._handleBackdropClick);
            
            // ESC 키로 닫기
            document.addEventListener('keydown', this._handleEscKey);
        },

        // 모달 닫기
        close: function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            modal.style.display = 'none';
            document.body.style.overflow = ''; // 스크롤 복원

            // 이벤트 리스너 제거
            modal.removeEventListener('click', this._handleBackdropClick);
            document.removeEventListener('keydown', this._handleEscKey);
        },

        // 배경 클릭 감지 (모달 컨텐츠 클릭은 제외)
        _handleBackdropClick: function(e) {
            if (e.target.classList.contains('modal')) {
                const modalId = e.target.id;
                Modal.close(modalId);
            }
        },

        // ESC 키 감지
        _handleEscKey: function(e) {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
                openModals.forEach(modal => {
                    Modal.close(modal.id);
                });
            }
        }
    };

    // ============================================================
    // 토스트 알림
    // ============================================================
    
    const Toast = {
        // 토스트 표시
        show: function(message, duration = 3000, actionText = null, onAction = null) {
            // 기존 토스트 제거
            const existingToast = document.getElementById('globalToast');
            if (existingToast) {
                existingToast.remove();
            }

            // 새 토스트 생성
            const toast = document.createElement('div');
            toast.id = 'globalToast';
            toast.className = 'toast';
            
            let html = `<span class="toast-message">${message}</span>`;
            if (actionText && onAction) {
                html += `<button class="btn-undo" id="toastAction">${actionText}</button>`;
            }
            toast.innerHTML = html;

            document.body.appendChild(toast);

            // 액션 버튼 이벤트
            if (actionText && onAction) {
                document.getElementById('toastAction').addEventListener('click', () => {
                    onAction();
                    this.hide();
                });
            }

            // 자동 숨기기
            setTimeout(() => {
                this.hide();
            }, duration);
        },

        // 토스트 숨기기
        hide: function() {
            const toast = document.getElementById('globalToast');
            if (toast) {
                toast.style.animation = 'slideDown 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }
    };

    // ============================================================
    // 광고 슬롯 관리 (향후 확장용)
    // ============================================================
    
    const AdSlots = {
        init: function() {
            // TODO: 나중에 광고 SDK 연동 시 사용
            console.log('Ad slots initialized');
        },

        loadSlot: function(slotId) {
            // TODO: 슬롯별 광고 로드
            console.log(`Loading ad for slot: ${slotId}`);
        }
    };

    // ============================================================
    // 전역 네임스페이스에 등록
    // ============================================================
    
    window.SellingForm.Utils = Utils;
    window.SellingForm.Modal = Modal;
    window.SellingForm.Toast = Toast;
    window.SellingForm.AdSlots = AdSlots;

    // ============================================================
    // 페이지 로드 시 초기화
    // ============================================================
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('SellingForm v3.8 initialized');
        
        // 광고 슬롯 초기화
        AdSlots.init();

        // 모든 .btn-close에 닫기 이벤트 자동 바인딩
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    Modal.close(modal.id);
                }
            });
        });
    });

    // ============================================================
    // 로딩 스타일 동적 추가
    // ============================================================
    
    const style = document.createElement('style');
    style.textContent = `
        .global-loader {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .loader-content {
            text-align: center;
            color: white;
        }
        .loader-message {
            margin-top: 16px;
            font-size: 1rem;
            font-weight: 500;
        }
        @keyframes slideDown {
            to {
                transform: translateX(-50%) translateY(100px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

})();
