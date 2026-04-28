(function () {
    'use strict';

    var MACRO_KEY = 'page-title'; // atlassian-plugin.xml의 name 속성값 (key 아님)
    var PLUGIN_KEY = 'com.ohjih.wonikips-confluence-macro';

    // CSS를 <link> 태그로 직접 주입 (web-resource download만으로는 자동 삽입 안 됨)
    function injectCss() {
        if (document.getElementById('pt-editor-css')) return;
        var link = document.createElement('link');
        link.id   = 'pt-editor-css';
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = AJS.contextPath() + '/download/resources/' + PLUGIN_KEY + '/page-title-editor.css';
        document.head.appendChild(link);
    }

    var DEFAULTS = {
        cloudText:  '',
        fontSize:   '48',
        fontWeight: 'bold',
        alignment:  'left',
        color:      '#000000',
        htmlTag:    'h1'
    };

    function getPageTitle() {
        var el = document.querySelector('.page-title, #title-text, h1.pagetitle');
        if (el && el.textContent.trim()) return el.textContent.trim();
        var t = document.title.replace(/\s*-\s*Confluence.*$/, '').trim();
        return t || 'Demo Title';
    }

    function buildDialogHtml() {
        return [
            '<div id="pt-editor-dialog" class="aui-layer aui-dialog2 aui-dialog2-large pt-dialog" role="dialog" aria-hidden="true">',
            '  <header class="aui-dialog2-header">',
            '    <h2 class="aui-dialog2-header-main">Page Title</h2>',
            '    <a class="aui-dialog2-header-close"><span class="aui-icon aui-icon-small aui-iconfont-close-dialog">닫기</span></a>',
            '  </header>',
            '  <div class="aui-dialog2-content">',
            '    <div class="pt-body">',
            '      <div class="pt-params">',
            '        <div class="pt-field">',
            '          <label for="pt-cloud-text">제목 텍스트</label>',
            '          <input type="text" id="pt-cloud-text" class="pt-text-input" placeholder="비워두면 페이지 제목 자동 사용">',
            '        </div>',
            '        <div class="pt-field">',
            '          <label for="pt-font-weight">Font Weight</label>',
            '          <select id="pt-font-weight" class="pt-select">',
            '            <option value="normal">Normal</option>',
            '            <option value="bold">Bold</option>',
            '          </select>',
            '        </div>',
            '        <div class="pt-field">',
            '          <label for="pt-font-size">Font Size</label>',
            '          <div class="pt-slider-row">',
            '            <input type="number" id="pt-font-size-num" min="12" max="96" value="48">',
            '            <input type="range"  id="pt-font-size"     min="12" max="96" value="48">',
            '          </div>',
            '        </div>',
            '        <div class="pt-field">',
            '          <label>Text Alignment</label>',
            '          <div class="pt-align-group">',
            '            <button class="pt-align-btn pt-active" data-align="left" title="왼쪽">',
            '              <svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="2"/><rect x="1" y="6" width="10" height="2"/><rect x="1" y="10" width="14" height="2"/><rect x="1" y="14" width="8" height="2"/></svg>',
            '            </button>',
            '            <button class="pt-align-btn" data-align="center" title="가운데">',
            '              <svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="2"/><rect x="3" y="6" width="10" height="2"/><rect x="1" y="10" width="14" height="2"/><rect x="4" y="14" width="8" height="2"/></svg>',
            '            </button>',
            '            <button class="pt-align-btn" data-align="right" title="오른쪽">',
            '              <svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="2"/><rect x="5" y="6" width="10" height="2"/><rect x="1" y="10" width="14" height="2"/><rect x="7" y="14" width="8" height="2"/></svg>',
            '            </button>',
            '          </div>',
            '        </div>',
            '        <div class="pt-field">',
            '          <label for="pt-color-picker">Color</label>',
            '          <div class="pt-color-row">',
            '            <input type="color" id="pt-color-picker" value="#000000">',
            '            <input type="text"  id="pt-color-hex" class="pt-color-hex" maxlength="7" value="#000000" placeholder="#000000">',
            '          </div>',
            '        </div>',
            '        <div class="pt-field">',
            '          <label>Advanced</label>',
            '          <label for="pt-html-tag" style="text-transform:none;font-weight:normal;color:#172B4D;margin-top:4px;">HTML Tag</label>',
            '          <select id="pt-html-tag" class="pt-select">',
            '            <option value="h1">Headline 1</option>',
            '            <option value="h2">Headline 2</option>',
            '            <option value="h3">Headline 3</option>',
            '            <option value="h4">Headline 4</option>',
            '            <option value="h5">Headline 5</option>',
            '            <option value="h6">Headline 6</option>',
            '          </select>',
            '        </div>',
            '      </div>',
            '      <div class="pt-preview">',
            '        <div class="pt-preview-label">미리보기</div>',
            '        <div class="pt-preview-canvas">',
            '          <div class="pt-preview-text">',
            '            <div id="pt-preview-el" style="font-size:48px;font-weight:bold;text-align:left;color:#000000;">',
            '            </div>',
            '          </div>',
            '        </div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '  <footer class="aui-dialog2-footer">',
            '    <div class="aui-dialog2-footer-actions">',
            '      <button id="pt-save-btn" class="aui-button aui-button-primary">Save</button>',
            '      <button id="pt-close-btn" class="aui-button aui-button-link">Close</button>',
            '    </div>',
            '  </footer>',
            '</div>'
        ].join('\n');
    }

    function setAlignActive(alignment) {
        document.querySelectorAll('.pt-align-btn').forEach(function (btn) {
            btn.classList.toggle('pt-active', btn.dataset.align === alignment);
        });
    }

    function updatePreview(params) {
        var el = document.getElementById('pt-preview-el');
        if (!el) return;
        el.style.fontSize   = (params.fontSize || '48') + 'px';
        el.style.fontWeight = params.fontWeight || 'bold';
        el.style.textAlign  = params.alignment  || 'left';
        el.style.color      = params.color      || '#000000';
        var text = params.cloudText && params.cloudText.trim()
            ? params.cloudText.trim()
            : getPageTitle();
        el.textContent = text;
    }

    function getParams() {
        var alignActive = document.querySelector('.pt-align-btn.pt-active');
        return {
            cloudText:  document.getElementById('pt-cloud-text').value,
            fontSize:   document.getElementById('pt-font-size-num').value,
            fontWeight: document.getElementById('pt-font-weight').value,
            alignment:  alignActive ? alignActive.dataset.align : 'left',
            color:      document.getElementById('pt-color-hex').value,
            htmlTag:    document.getElementById('pt-html-tag').value
        };
    }

    function restoreParams(existing) {
        var p = AJS.$.extend({}, DEFAULTS, existing || {});

        document.getElementById('pt-cloud-text').value   = p.cloudText || '';
        document.getElementById('pt-font-weight').value  = p.fontWeight;
        document.getElementById('pt-font-size').value    = p.fontSize;
        document.getElementById('pt-font-size-num').value = p.fontSize;
        document.getElementById('pt-color-picker').value = p.color;
        document.getElementById('pt-color-hex').value    = p.color.toUpperCase();
        document.getElementById('pt-html-tag').value     = p.htmlTag;
        setAlignActive(p.alignment);
        updatePreview(p);
    }

    function closeDialog(dialog) {
        dialog.hide();
        var el = document.getElementById('pt-editor-dialog');
        if (el) el.parentNode.removeChild(el);
    }

    function bindEvents(dialog, macro) {
        var sizeSlider = document.getElementById('pt-font-size');
        var sizeNum    = document.getElementById('pt-font-size-num');
        var colorPicker = document.getElementById('pt-color-picker');
        var colorHex   = document.getElementById('pt-color-hex');

        document.getElementById('pt-cloud-text').addEventListener('input', function () {
            updatePreview(getParams());
        });

        sizeSlider.addEventListener('input', function () {
            sizeNum.value = sizeSlider.value;
            updatePreview(getParams());
        });

        sizeNum.addEventListener('input', function () {
            var v = parseInt(sizeNum.value, 10);
            if (!isNaN(v) && v >= 12 && v <= 96) {
                sizeSlider.value = v;
                updatePreview(getParams());
            }
        });

        colorPicker.addEventListener('input', function () {
            colorHex.value = colorPicker.value.toUpperCase();
            updatePreview(getParams());
        });

        colorHex.addEventListener('input', function () {
            var hex = colorHex.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                colorPicker.value = hex;
                updatePreview(getParams());
            }
        });

        document.getElementById('pt-font-weight').addEventListener('change', function () {
            updatePreview(getParams());
        });

        document.getElementById('pt-html-tag').addEventListener('change', function () {
            updatePreview(getParams());
        });

        document.querySelectorAll('.pt-align-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setAlignActive(btn.dataset.align);
                updatePreview(getParams());
            });
        });

        document.getElementById('pt-save-btn').addEventListener('click', function () {
            var params = getParams();

            // DC 클러스터 디버그: tinymce 경로 존재 여부 확인
            console.log('[PageTitle] Save clicked. tinymce:', typeof tinymce);
            console.log('[PageTitle] tinymce.confluence:', tinymce && typeof tinymce.confluence);
            console.log('[PageTitle] macrobrowser:', tinymce && tinymce.confluence && typeof tinymce.confluence.macrobrowser);
            console.log('[PageTitle] params:', JSON.stringify(params));

            var macroObj = {
                name:   MACRO_KEY,
                params: params,
                defaultParameterValue: '',
                body:   ''
            };

            if (typeof tinymce === 'undefined') {
                console.error('[PageTitle] tinymce 자체가 undefined — web-resource 로드 실패');
                closeDialog(dialog);
                return;
            }
            if (!tinymce.confluence || !tinymce.confluence.macrobrowser) {
                console.error('[PageTitle] tinymce.confluence.macrobrowser 없음. confluence:', JSON.stringify(Object.keys(tinymce.confluence || {})));
                closeDialog(dialog);
                return;
            }
            if (typeof tinymce.confluence.macrobrowser.macroBrowserComplete !== 'function') {
                console.error('[PageTitle] macroBrowserComplete 함수 없음. macrobrowser 키:', JSON.stringify(Object.keys(tinymce.confluence.macrobrowser)));
                closeDialog(dialog);
                return;
            }

            try {
                console.log('[PageTitle] macroBrowserComplete 호출:', JSON.stringify(macroObj));
                tinymce.confluence.macrobrowser.macroBrowserComplete(macroObj);
                console.log('[PageTitle] macroBrowserComplete 호출 완료');
            } catch (e) {
                console.error('[PageTitle] macroBrowserComplete 예외:', e.message, e.stack);
            }
            closeDialog(dialog);
        });

        document.getElementById('pt-close-btn').addEventListener('click', function () {
            closeDialog(dialog);
        });

        document.querySelector('#pt-editor-dialog .aui-dialog2-header-close')
            .addEventListener('click', function () {
                closeDialog(dialog);
            });
    }

    function registerOverride() {
        injectCss();
        if (typeof AJS.MacroBrowser !== 'undefined' && AJS.MacroBrowser.setMacroJsOverride) {
            AJS.MacroBrowser.setMacroJsOverride(MACRO_KEY, {
                opener: function (macro) {
                    document.body.insertAdjacentHTML('beforeend', buildDialogHtml());

                    var dialog = AJS.dialog2('#pt-editor-dialog');
                    dialog.show();

                    var existingParams = (macro && macro.params) ? macro.params : null;
                    restoreParams(existingParams);

                    bindEvents(dialog, macro);
                }
            });
        } else {
            AJS.log('[PageTitle] AJS.MacroBrowser not available');
        }
    }

    // init.rte: 리치 텍스트 편집기 초기화 완료 후 실행 (macro-browser보다 안전)
    AJS.bind('init.rte', registerOverride);

    // AJS.toInit 도 함께 등록 (일부 버전 호환)
    AJS.toInit(registerOverride);

}());
