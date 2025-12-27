// ============================================================
// SellingForm v3.8 - Export 및 ZIP 생성
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // Export 설정
    // ============================================================
    
    const ExportConfig = {
        // 채널별 캔버스 폭
        channels: {
            smartstore: { width: 860, folder: 'smartstore' },
            coupang: { width: 780, folder: 'coupang' }
        },
        
        // 기본 슬라이스 높이
        defaultSliceHeight: 1200,
        
        // 최대 슬라이스 높이 (성능 고려)
        maxSliceHeight: 2000,
        
        // 파일 형식
        formats: {
            png: 'image/png',
            jpg: 'image/jpeg'
        },
        
        // JPG 품질 (0.0 ~ 1.0)
        jpgQuality: 0.9
    };

    // ============================================================
    // Export 관리자
    // ============================================================
    
    class ExportManager {
        constructor() {
            this.projectName = '';
            this.sliceHeight = ExportConfig.defaultSliceHeight;
            this.format = 'png';
            this.sourceCanvas = null;
        }

        // ============================================================
        // 메인 Export 프로세스
        // ============================================================
        
        async exportToZip(sourceCanvas, projectName, options = {}) {
            // 옵션 설정
            this.sourceCanvas = sourceCanvas;
            this.projectName = this._sanitizeFilename(projectName);
            this.sliceHeight = options.sliceHeight || ExportConfig.defaultSliceHeight;
            this.format = options.format || 'png';

            try {
                // 로딩 표시
                if (window.SellingForm && window.SellingForm.Utils) {
                    window.SellingForm.Utils.showLoading('이미지 생성 중...');
                }

                // JSZip 인스턴스 생성
                const zip = new JSZip();

                // 스마트스토어용 생성 (860px)
                await this._generateChannelImages(
                    zip,
                    ExportConfig.channels.smartstore,
                    'smartstore'
                );

                // 쿠팡용 생성 (780px, 860px 비율 축소)
                await this._generateChannelImages(
                    zip,
                    ExportConfig.channels.coupang,
                    'coupang'
                );

                // ZIP 파일 생성 및 다운로드
                const blob = await zip.generateAsync({ 
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                });

                // 다운로드
                this._downloadBlob(blob, `${this.projectName}_export.zip`);

                // 로딩 숨기기
                if (window.SellingForm && window.SellingForm.Utils) {
                    window.SellingForm.Utils.hideLoading();
                }

                // 성공 토스트
                if (window.SellingForm && window.SellingForm.Toast) {
                    window.SellingForm.Toast.show('Export 완료! 다운로드를 확인하세요.', 3000);
                }

                return true;

            } catch (error) {
                console.error('Export 실패:', error);
                
                // 로딩 숨기기
                if (window.SellingForm && window.SellingForm.Utils) {
                    window.SellingForm.Utils.hideLoading();
                }

                // 에러 알림
                alert(`Export 중 오류가 발생했습니다: ${error.message}`);
                return false;
            }
        }

        // ============================================================
        // 채널별 이미지 생성
        // ============================================================
        
        async _generateChannelImages(zip, channelConfig, channelName) {
            const { width, folder } = channelConfig;
            
            // 폴더 생성
            const channelFolder = zip.folder(folder);

            // 원본 캔버스 크기
            const sourceWidth = this.sourceCanvas.width;
            const sourceHeight = this.sourceCanvas.height;

            // 비율 계산
            const scale = width / sourceWidth;
            const scaledHeight = Math.round(sourceHeight * scale);

            // 임시 캔버스 생성 (스케일링용)
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = scaledHeight;
            const ctx = tempCanvas.getContext('2d');

            // 원본을 스케일링해서 그리기
            ctx.drawImage(
                this.sourceCanvas,
                0, 0, sourceWidth, sourceHeight,
                0, 0, width, scaledHeight
            );

            // 슬라이스 개수 계산
            const sliceCount = Math.ceil(scaledHeight / this.sliceHeight);

            // 각 슬라이스 생성
            for (let i = 0; i < sliceCount; i++) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = width;
                
                // 마지막 슬라이스는 높이가 다를 수 있음
                const startY = i * this.sliceHeight;
                const remainingHeight = scaledHeight - startY;
                const currentSliceHeight = Math.min(this.sliceHeight, remainingHeight);
                
                sliceCanvas.height = currentSliceHeight;
                const sliceCtx = sliceCanvas.getContext('2d');

                // 흰색 배경
                sliceCtx.fillStyle = '#FFFFFF';
                sliceCtx.fillRect(0, 0, width, currentSliceHeight);

                // 해당 영역 복사
                sliceCtx.drawImage(
                    tempCanvas,
                    0, startY, width, currentSliceHeight,
                    0, 0, width, currentSliceHeight
                );

                // Blob 생성
                const blob = await this._canvasToBlob(sliceCanvas);

                // 파일명 생성
                const index = String(i + 1).padStart(3, '0');
                const filename = `${this.projectName}_${channelName}_${width}x${currentSliceHeight}_${index}.${this.format}`;

                // ZIP에 추가
                channelFolder.file(filename, blob);
            }

            // 메모리 정리
            tempCanvas.width = 0;
            tempCanvas.height = 0;
        }

        // ============================================================
        // Canvas를 Blob으로 변환
        // ============================================================
        
        _canvasToBlob(canvas) {
            return new Promise((resolve, reject) => {
                const mimeType = ExportConfig.formats[this.format];
                const quality = this.format === 'jpg' ? ExportConfig.jpgQuality : undefined;

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas를 Blob으로 변환 실패'));
                    }
                }, mimeType, quality);
            });
        }

        // ============================================================
        // 파일명 안전 처리
        // ============================================================
        
        _sanitizeFilename(filename) {
            if (!filename) return 'untitled';
            
            return filename
                .trim()
                .replace(/[^a-zA-Z0-9가-힣_-]/g, '_') // 특수문자 → _
                .replace(/_+/g, '_') // 연속 _ → 단일 _
                .replace(/^_|_$/g, '') // 앞뒤 _ 제거
                .substring(0, 50); // 최대 50자
        }

        // ============================================================
        // Blob 다운로드
        // ============================================================
        
        _downloadBlob(blob, filename) {
            // FileSaver.js가 있으면 사용
            if (window.saveAs) {
                window.saveAs(blob, filename);
                return;
            }

            // 없으면 기본 방식
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // 메모리 정리
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }

        // ============================================================
        // 유틸리티: 권장 슬라이스 높이 계산
        // ============================================================
        
        calculateRecommendedSliceHeight(totalHeight) {
            // 총 높이에 따라 적절한 슬라이스 높이 제안
            if (totalHeight <= 3000) {
                return 1200;
            } else if (totalHeight <= 6000) {
                return 1500;
            } else {
                return 1800;
            }
        }

        // ============================================================
        // 유틸리티: Export 예상 정보
        // ============================================================
        
        getExportInfo(canvasHeight, sliceHeight) {
            const smartstoreCount = Math.ceil(canvasHeight / sliceHeight);
            const coupangCount = Math.ceil((canvasHeight * 780 / 860) / sliceHeight);
            
            return {
                smartstore: {
                    width: 860,
                    sliceCount: smartstoreCount
                },
                coupang: {
                    width: 780,
                    sliceCount: coupangCount
                },
                totalImages: smartstoreCount + coupangCount
            };
        }
    }

    // ============================================================
    // 전역 인스턴스 생성
    // ============================================================
    
    const exportManager = new ExportManager();

    // ============================================================
    // 전역 네임스페이스에 등록
    // ============================================================
    
    window.SellingForm = window.SellingForm || {};
    window.SellingForm.Export = exportManager;
    // ============================================================
    // CDN 라이브러리 동적 로드 (필요 시)
    // ============================================================
    
function loadLibraries() {
        // JSZip 로드
        if (!window.JSZip) {
            const script1 = document.createElement('script');
            // 수정된 줄:
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script1.crossOrigin = 'anonymous';
            document.head.appendChild(script1);
        }

        // FileSaver.js 로드
        if (!window.saveAs) {
            const script2 = document.createElement('script');
            // 수정된 줄:
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';
            script2.crossOrigin = 'anonymous';
            document.head.appendChild(script2);
        }
    }

    
    
    // 페이지 로드 시 라이브러리 로드
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadLibraries);
    } else {
        loadLibraries();
    }

    console.log('Export Manager 초기화 완료');

})();