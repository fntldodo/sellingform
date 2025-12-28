// ============================================================
// SellingForm v3.8 - Core Application
// 공통 유틸리티 및 초기화
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 전역 네임스페이스
    // ============================================================
    
    window.SellingForm = window.SellingForm || {};

    // ============================================================
    // 유틸리티 함수
    // ============================================================
    
    window.SellingForm.Utils = {
        // 상대 시간 포맷 (예: "3일 전")
        formatRelativeTime(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) return `${days}일 전`;
            if (hours > 0) return `${hours}시간 전`;
            if (minutes > 0) return `${minutes}분 전`;
            return '방금 전';
        },

        // 날짜 포맷 (예: "2025-01-15")
        formatDate(timestamp) {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        // 파일 크기 포맷 (예: "1.5 MB")
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        },

        // Base64 크기 계산
        getBase64Size(base64String) {
            const padding = (base64String.match(/=/g) || []).length;
            return (base64String.length * 0.75) - padding;
        },

        // 로딩 표시
        showLoading(message = '처리 중...') {
            let loader = document.getElementById('globalLoader');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                                background: rgba(0,0,0,0.7); z-index: 9999; 
                                display: flex; align-items: center; justify-content: center;">
                        <div style="background: white; padding: 30px 50px; border-radius: 12px; 
                                    text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">
                            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; 
                                        border-top: 4px solid #667eea; border-radius: 50%; 
                                        margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
                            <div style="font-size: 16px; color: #333;" id="loaderMessage">${message}</div>
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
                document.body.appendChild(loader);
            } else {
                loader.style.display = 'flex';
                const msgEl = document.getElementById('loaderMessage');
                if (msgEl) msgEl.textContent = message;
            }
        },

        // 로딩 숨기기
        hideLoading() {
            const loader = document.getElementById('globalLoader');
            if (loader) {
                loader.style.display = 'none';
            }
        },

        // 디바운스
        debounce(func, wait) {
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

        // 쓰로틀
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };

    // ============================================================
    // 토스트 알림
    // ============================================================
    
    window.SellingForm.Toast = {
        show(message, duration = 3000, actionText = null, actionCallback = null) {
            // 기존 토스트 제거
            const existing = document.getElementById('globalToast');
            if (existing) existing.remove();

            // 토스트 생성
            const toast = document.createElement('div');
            toast.id = 'globalToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 14px;
                animation: toastSlideUp 0.3s ease;
            `;

            const messageEl = document.createElement('span');
            messageEl.textContent = message;
            toast.appendChild(messageEl);

            // 액션 버튼
            if (actionText && actionCallback) {
                const actionBtn = document.createElement('button');
                actionBtn.textContent = actionText;
                actionBtn.style.cssText = `
                    background: transparent;
                    border: 1px solid white;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                `;
                actionBtn.addEventListener('click', () => {
                    actionCallback();
                    toast.remove();
                });
                toast.appendChild(actionBtn);
            }

            // 스타일 추가
            if (!document.getElementById('toastStyles')) {
                const style = document.createElement('style');
                style.id = 'toastStyles';
                style.textContent = `
                    @keyframes toastSlideUp {
                        from {
                            opacity: 0;
                            transform: translateX(-50%) translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(-50%) translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(toast);

            // 자동 제거
            if (duration > 0) {
                setTimeout(() => {
                    toast.style.animation = 'toastSlideUp 0.3s ease reverse';
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
        }
    };

    // ============================================================
    // 모달 관리
    // ============================================================
    
    window.SellingForm.Modal = {
        open(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        },

        close(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    };

    // ============================================================
    // 전역 에러 핸들러
    // ============================================================
    
    window.addEventListener('error', function(e) {
        console.error('전역 에러:', e.error);
        // 개발 환경에서만 표시
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.SellingForm.Toast.show('에러 발생: ' + e.message, 5000);
        }
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled Promise Rejection:', e.reason);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.SellingForm.Toast.show('비동기 에러: ' + e.reason, 5000);
        }
    });

    // ============================================================
    // 초기화
    // ============================================================
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('SellingForm Core 초기화 완료');
        console.log('사용 가능한 모듈:', Object.keys(window.SellingForm));
    });

    // ============================================================
    // 개발자 도구 감지 (선택 사항)
    // ============================================================
    
    if (typeof window.SellingForm.DevMode === 'undefined') {
        window.SellingForm.DevMode = {
            enabled: window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1',
            
            log(...args) {
                if (this.enabled) {
                    console.log('[SellingForm]', ...args);
                }
            },
            
            warn(...args) {
                if (this.enabled) {
                    console.warn('[SellingForm]', ...args);
                }
            },
            
            error(...args) {
                console.error('[SellingForm]', ...args);
            }
        };
    }

})();
