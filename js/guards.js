// ============================================================
// SellingForm v3.8 - AI 가드레일 & 문구 생성
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 금칙어 및 리스크 문구 리스트
    // ============================================================
    
    const RiskKeywords = {
        // 의료/건강 관련 (강한 경고)
        medical: [
            '치료', '완치', '질병', '암', '당뇨', '고혈압',
            '치매', '우울증', '아토피', '여드름 치료',
            '의학적', '임상', '처방', '진단', '병원'
        ],
        
        // 과장 광고 (중간 경고)
        exaggeration: [
            '100%', '무조건', '절대', '최고', '최상',
            '세계 1위', '국내 1위', '유일', '단 하나',
            '기적', '마법', '즉시', '즉효', '완벽'
        ],
        
        // 비교 광고 (약한 경고)
        comparison: [
            '타사 대비', '경쟁사', '다른 제품보다',
            'vs', '비교 불가', '압도적'
        ],
        
        // 가격 관련 민감 표현
        price: [
            '무료', '공짜', '0원', '덤핑', '최저가 보장',
            '원가 이하', '손해 보고', '파격'
        ]
    };

    // ============================================================
    // 마켓별 톤 프리셋
    // ============================================================
    
    const MarketTones = {
        smartstore: {
            name: '스마트스토어',
            style: 'friendly',
            characteristics: {
                greeting: true,           // 인사말 사용
                emoji: true,              // 이모지 사용
                casual: true,             // 반말/친근한 톤
                storytelling: true        // 스토리텔링
            },
            templates: {
                prefix: ['💝', '✨', '🎁', '💕', '🌟'],
                connecting: ['그래서', '그런데', '그치만', '그럼에도'],
                ending: ['~', '!', '😊', '💕']
            }
        },
        
        coupang: {
            name: '쿠팡',
            style: 'direct',
            characteristics: {
                greeting: false,
                emoji: false,
                casual: false,
                clarity: true,            // 명확성
                benefits: true            // 혜택 강조
            },
            templates: {
                prefix: ['✓', '▶', '●'],
                connecting: ['따라서', '그러므로', '덕분에'],
                ending: ['습니다', '예요', '.']
            }
        },
        
        amazon: {
            name: 'Amazon',
            style: 'professional',
            characteristics: {
                greeting: false,
                emoji: false,
                formal: true,             // 격식체
                features: true,           // 기능 중심
                specifications: true      // 스펙 강조
            },
            templates: {
                prefix: ['•', '-', '→'],
                connecting: ['Additionally', 'Furthermore', 'Moreover'],
                ending: ['.', '']
            }
        }
    };

    // ============================================================
    // 섹션별 문구 템플릿
    // ============================================================
    
    const SectionTemplates = {
        hero: {
            title: [
                '{product}로 {benefit}하세요',
                '{keyword1}을 고민하는 당신을 위한 {product}',
                '프리미엄 {product}, {benefit}의 시작'
            ],
            subtitle: [
                '{keyword1} + {keyword2}로 완성된 특별함',
                '매일 사용하고 싶은 {keyword1}',
                '{keyword2}까지 생각한 디테일'
            ]
        },
        
        usp: {
            title: [
                '{keyword1} 케어',
                '완벽한 {keyword2}',
                '{keyword3} 솔루션'
            ],
            description: [
                '{product}만의 특별한 {keyword1} 기술',
                '피부과 전문의도 인정한 {keyword2}',
                '검증된 {keyword3} 성분 함유'
            ]
        },
        
        price: [
            '지금 특별 할인가로 만나보세요',
            '합리적인 가격, 프리미엄 품질',
            '가성비 최고의 선택'
        ],
        
        proof: [
            '실제 사용자 {count}명의 만족 후기',
            '재구매율 {percent}% 달성',
            '{cert} 인증 완료'
        ],
        
        howto: {
            step: [
                '{step}단계: {action}',
                'STEP {step}. {action}',
                '{step}. {action}하기'
            ]
        },
        
        faq: {
            question: [
                '{product} 사용 방법은?',
                '얼마나 사용하면 효과를 볼 수 있나요?',
                '민감성 피부도 사용 가능한가요?'
            ]
        },
        
        brand: [
            '{brand}는 {year}년부터 {value}를 추구해왔습니다',
            '고객의 {need}를 최우선으로 생각합니다',
            '{philosophy}를 실천하는 브랜드'
        ]
    };

    // ============================================================
    // AI 가드레일 클래스
    // ============================================================
    
    class AIGuards {
        constructor() {
            this.riskKeywords = RiskKeywords;
            this.marketTones = MarketTones;
            this.templates = SectionTemplates;
        }

        // ============================================================
        // 문구 생성 (메인 함수)
        // ============================================================
        
        generateCopy(options) {
            const {
                section,           // 섹션명 (hero, usp, price 등)
                product,           // 제품명
                keywords = [],     // 키워드 배열 [keyword1, keyword2, keyword3]
                tone = 'smartstore' // 마켓 톤
            } = options;

            // 유효성 검사
            if (!product || keywords.length < 3) {
                throw new Error('제품명과 키워드 3개는 필수입니다.');
            }

            // 3개 안 생성
            const variants = [];
            
            for (let i = 0; i < 3; i++) {
                const copy = this._generateVariant(section, product, keywords, tone, i);
                const risks = this.checkRisks(copy);
                
                variants.push({
                    text: copy,
                    risks: risks,
                    hasWarning: risks.length > 0
                });
            }

            return variants;
        }

        // ============================================================
        // 개별 문구 생성
        // ============================================================
        
        _generateVariant(section, product, keywords, tone, variantIndex) {
            const marketTone = this.marketTones[tone];
            const templates = this.templates[section];

            if (!templates) {
                return `${product}의 ${keywords[0]} 특징`;
            }

            // 템플릿 선택 (3개 중 순환)
            let template;
            if (Array.isArray(templates)) {
                template = templates[variantIndex % templates.length];
            } else if (templates.title) {
                template = templates.title[variantIndex % templates.title.length];
            } else {
                template = '{product}의 {keyword1}';
            }

            // 변수 치환
            let copy = template
                .replace(/{product}/g, product)
                .replace(/{keyword1}/g, keywords[0] || '')
                .replace(/{keyword2}/g, keywords[1] || '')
                .replace(/{keyword3}/g, keywords[2] || '');

            // 톤 적용
            copy = this._applyTone(copy, marketTone, variantIndex);

            return copy;
        }

        // ============================================================
        // 톤 적용
        // ============================================================
        
        _applyTone(copy, marketTone, variantIndex) {
            const { style, characteristics, templates } = marketTone;

            // 이모지 추가 (smartstore만)
            if (characteristics.emoji && Math.random() > 0.5) {
                const emoji = templates.prefix[variantIndex % templates.prefix.length];
                copy = `${emoji} ${copy}`;
            }

            // 종결어 스타일
            if (style === 'friendly') {
                // 친근한 톤: ~, !, 😊
                if (!copy.endsWith('!') && !copy.endsWith('~')) {
                    copy += variantIndex % 2 === 0 ? '!' : '~';
                }
            } else if (style === 'direct') {
                // 직관적 톤: 명확한 종결
                if (!copy.endsWith('.') && !copy.endsWith('습니다')) {
                    copy += '.';
                }
            } else if (style === 'professional') {
                // 전문적 톤: 격식체
                if (!copy.endsWith('.')) {
                    copy += '.';
                }
            }

            return copy;
        }

        // ============================================================
        // 리스크 키워드 체크
        // ============================================================
        
        checkRisks(text) {
            const risks = [];

            // 각 카테고리별 체크
            for (const [category, keywords] of Object.entries(this.riskKeywords)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        risks.push({
                            category: category,
                            keyword: keyword,
                            severity: this._getSeverity(category),
                            message: this._getRiskMessage(category, keyword)
                        });
                    }
                }
            }

            return risks;
        }

        // ============================================================
        // 위험도 레벨
        // ============================================================
        
        _getSeverity(category) {
            const severityMap = {
                medical: 'high',
                exaggeration: 'medium',
                comparison: 'low',
                price: 'medium'
            };
            return severityMap[category] || 'low';
        }

        // ============================================================
        // 경고 메시지
        // ============================================================
        
        _getRiskMessage(category, keyword) {
            const messages = {
                medical: `"${keyword}" - 의료/건강 관련 표현은 법적 문제가 될 수 있습니다.`,
                exaggeration: `"${keyword}" - 과장 광고로 간주될 수 있습니다.`,
                comparison: `"${keyword}" - 비교 광고는 증빙 자료가 필요합니다.`,
                price: `"${keyword}" - 가격 관련 표현은 신중하게 사용하세요.`
            };
            return messages[category] || `"${keyword}" - 주의가 필요한 표현입니다.`;
        }

        // ============================================================
        // 섹션별 프리셋 버튼 문구
        // ============================================================
        
        getPresetButtons(section) {
            const presets = {
                hero: [
                    '프리미엄 케어',
                    '매일 사용하는 특별함',
                    '당신을 위한 솔루션'
                ],
                usp: [
                    '검증된 효과',
                    '안전한 성분',
                    '편리한 사용'
                ],
                price: [
                    '합리적인 가격',
                    '특별 할인 중',
                    '가성비 최고'
                ],
                proof: [
                    '만족도 95%',
                    '재구매 1위',
                    '전문가 추천'
                ],
                howto: [
                    '간편한 4단계',
                    '누구나 쉽게',
                    '매일 루틴'
                ],
                faq: [
                    '사용 방법',
                    '효과 시기',
                    '피부 타입'
                ],
                brand: [
                    '고객 최우선',
                    '지속 가능성',
                    '품질 보증'
                ]
            };

            return presets[section] || ['옵션 1', '옵션 2', '옵션 3'];
        }

        // ============================================================
        // 외부 AI Provider 연동 훅 (확장용)
        // ============================================================
        
        async generateWithExternalAI(options, provider = null) {
            // TODO: 외부 AI API 연동 (OpenAI, Claude 등)
            // 현재는 로컬 템플릿만 사용
            console.warn('외부 AI Provider 연동은 아직 구현되지 않았습니다. 로컬 템플릿을 사용합니다.');
            return this.generateCopy(options);
        }
    }

    // ============================================================
    // 전역 인스턴스 생성
    // ============================================================
    
    const aiGuards = new AIGuards();

    // ============================================================
    // 전역 네임스페이스에 등록
    // ============================================================
    
    window.SellingForm = window.SellingForm || {};
    window.SellingForm.AIGuards = aiGuards;

    console.log('AI Guards 초기화 완료');

})();
