(function() {
    'use strict';

    var scripts = [
        '[cdnjs.cloudflare.com](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js&#39;)
        '[cdnjs.cloudflare.com](https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js&#39;)
    ];

    var scriptsLoaded = 0;
    scripts.forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = function() {
            scriptsLoaded++;
            if (scriptsLoaded === scripts.length) {
                console.log('Export 라이브러리 로드 완료');
            }
        };
        document.head.appendChild(script);
    });

    window.SellingForm = window.SellingForm || {};
    window.SellingForm.Export = {
        exportToZip: exportToZip,
        exportAsHTML: exportAsHTML,
        startExport: startExport
    };

    function startExport(exportType, projectData, options) {
        if (!window.JSZip || !window.saveAs) {
            alert('Export 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.');
            return Promise.resolve(false);
        }

        try {
            if (exportType === 'image') {
                var canvas = document.getElementById('previewCanvas');
                return exportToZip(canvas, options.projectName, {
                    sliceHeight: options.sliceHeight || 1200,
                    format: options.format || 'png'
                });
            } else if (exportType === 'html') {
                return exportAsHTML(projectData, options.projectName);
            } else if (exportType === 'both') {
                var canvas = document.getElementById('previewCanvas');
                return exportToZip(canvas, options.projectName + '_images', {
                    sliceHeight: options.sliceHeight || 1200,
                    format: options.format || 'png'
                }).then(function() {
                    return exportAsHTML(projectData, options.projectName + '_html');
                });
            }
        } catch (error) {
            console.error('Export 실패:', error);
            alert('Export 중 오류가 발생했습니다: ' + error.message);
            return Promise.resolve(false);
        }
    }

    function exportToZip(canvas, projectName, options) {
        return new Promise(function(resolve) {
            options = options || {};
            var sliceHeight = options.sliceHeight || 1200;
            var format = options.format || 'png';
            var quality = options.quality || 0.9;

            if (!canvas) {
                alert('캔버스를 찾을 수 없습니다.');
                resolve(false);
                return;
            }

            var zip = new JSZip();
            var totalHeight = canvas.height;
            var width = canvas.width;
            var sliceCount = Math.ceil(totalHeight / sliceHeight);
            var promises = [];

            for (var i = 0; i < sliceCount; i++) {
                (function(index) {
                    var sliceCanvas = document.createElement('canvas');
                    sliceCanvas.width = width;
                    var currentSliceHeight = Math.min(sliceHeight, totalHeight - (index * sliceHeight));
                    sliceCanvas.height = currentSliceHeight;

                    var ctx = sliceCanvas.getContext('2d');
                    ctx.drawImage(canvas, 0, index * sliceHeight, width, currentSliceHeight, 0, 0, width, currentSliceHeight);

                    var promise = new Promise(function(res) {
                        sliceCanvas.toBlob(function(blob) {
                            var fileName = 'slice_' + String(index + 1).padStart(2, '0') + '.' + format;
                            zip.file(fileName, blob);
                            res();
                        }, 'image/' + format, quality);
                    });
                    promises.push(promise);
                })(i);
            }

            Promise.all(promises).then(function() {
                return zip.generateAsync({ type: 'blob' });
            }).then(function(zipBlob) {
                saveAs(zipBlob, projectName + '.zip');
                resolve(true);
            });
        });
    }

    function exportAsHTML(projectData, projectName) {
        return new Promise(function(resolve) {
            if (!projectData || !projectData.data) {
                alert('프로젝트 데이터가 없습니다.');
                resolve(false);
                return;
            }

            var zip = new JSZip();
            var html = generateHTML(projectData);
            zip.file('index.html', html);
            
            var css = generateCSS(projectData.template);
            zip.file('style.css', css);
            
            var images = extractImages(projectData.data);
            if (images.length > 0) {
                var imgFolder = zip.folder('images');
                for (var i = 0; i < images.length; i++) {
                    var img = images[i];
                    var blob = base64ToBlob(img.data);
                    imgFolder.file(img.name + '.' + img.ext, blob);
                }
            }
            
            var readme = generateReadme(projectData);
            zip.file('README.txt', readme);
            
            zip.generateAsync({ type: 'blob' }).then(function(zipBlob) {
                saveAs(zipBlob, projectName + '.zip');
                resolve(true);
            });
        });
    }

    function generateHTML(projectData) {
        var data = projectData.data;
        var productName = (data.hero && data.hero.productName) || '상품명';
        var html = '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + productName + '</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<div class="detail-page-container">\n';
        for (var sectionKey in data) {
            var sectionData = data[sectionKey];
            if (sectionData && Object.keys(sectionData).length > 0) {
                html += renderSectionHTML(sectionKey, sectionData);
            }
        }
        html += '</div>\n</body>\n</html>';
        return html;
    }

    function renderSectionHTML(sectionKey, sectionData) {
        return '';
    }

    function generateCSS(templateId) {
        return '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: sans-serif; }';
    }

    function extractImages(data) {
        var images = [];
        var imageCounter = 0;
        for (var sectionKey in data) {
            var sectionData = data[sectionKey];
            for (var slotKey in sectionData) {
                var value = sectionData[slotKey];
                if (value && typeof value === 'string' && value.startsWith('data:image/')) {
                    var ext = value.split(';')[0].split('/')[1];
                    var name = generateImageName(sectionKey, slotKey, imageCounter++);
                    images.push({
                        name: name,
                        ext: ext,
                         value
                    });
                }
            }
        }
        return images;
    }

    function generateImageName(section, slot, index) {
        var nameMap = {
            'hero_mainImage': 'hero_main',
            'hero_gallery1': 'gallery1',
            'hero_gallery2': 'gallery2',
            'hero_gallery3': 'gallery3',
            'usp_icon1': 'usp_icon1',
            'usp_icon2': 'usp_icon2',
            'usp_icon3': 'usp_icon3',
            'detail_detailImage': 'detail_main',
            'brand_logo': 'brand_logo',
            'brand_brandImage': 'brand_main'
        };
        var key = section + '_' + slot;
        return nameMap[key] || 'image_' + index;
    }

    function base64ToBlob(base64) {
        var parts = base64.split(';base64,');
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);
        for (var i = 0; i < rawLength; i++) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    }

    function generateReadme(projectData) {
        var productName = (projectData.data.hero && projectData.data.hero.productName) || '제목 없음';
        return 'SellingForm Export\nProject: ' + productName + '\nTemplate: ' + (projectData.template || 'beauty_01') + '\nDate: ' + new Date().toLocaleString('ko-KR');
    }

})();
