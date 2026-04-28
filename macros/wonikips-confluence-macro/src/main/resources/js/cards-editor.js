(function ($) {
    AJS.bind('page-edit-loaded', function() {
    if (typeof AJS.MacroBrowser === "undefined" || !AJS.MacroBrowser.setMacroJsOverride) {
        return;
    }

    AJS.MacroBrowser.setMacroJsOverride("wonui-cards", {
        opener: function (macro) {
            // ... (기존 로직과 동일) ...
            var params = macro.params || {};
            var theme = params.theme || "aura";
            var gutter = params.gutter || "10";
            var cardsCollection = [];
            
            if (params.cardsCollection) {
                try { cardsCollection = JSON.parse(params.cardsCollection); } catch(e) {}
            }
            if (cardsCollection.length === 0) {
                cardsCollection.push({ title: "Demo Title", body: "Demo Body", color: "#0052cc", hrefType: "none", href: "", icon: "", imageType: "none", image: "" });
            }

            var currentCardIndex = 0;

            var dialogHtml = `
                <section id="aura-cards-dialog" class="aui-layer" role="dialog" aria-hidden="true" style="z-index: 4000; position: fixed; top: 5%; left: 5%; width: 90%; height: 90%; background: #fff; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden;">
                    <!-- 헤더 영역 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 1px solid #ebecf0;">
                        <h2 style="margin: 0; font-size: 20px; color: #172b4d;">Aura Cards</h2>
                        <div>
                            <button id="aura-btn-close" class="aui-button aui-button-subtle" style="margin-right: 10px;">Close</button>
                            <button id="aura-btn-save" class="aui-button aui-button-primary">Save</button>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <!-- 왼쪽 사이드바 (컨트롤) -->
                        <div class="aura-sidebar" style="width: 320px; padding: 30px; overflow-y: auto; border-right: 1px solid #ebecf0;">
                            
                            <div class="aura-field-group">
                                <label>Global Theme</label>
                                <select id="aura-theme" class="aura-select">
                                    <option value="aura">Aura</option>
                                    <option value="aura-accent">Aura Accent</option>
                                    <option value="fabric">Fabric</option>
                                </select>
                            </div>

                            <div class="aura-field-group">
                                <label>Card Gap (Gutter)</label>
                                <input type="range" id="aura-gutter" min="0" max="50" value="10" style="width: 100%;">
                                <div style="text-align: right; font-size: 12px; color: #6b778c; margin-top: 5px;"><span id="aura-gutter-val">10</span>px</div>
                            </div>
                            
                            <hr style="border: 0; border-top: 1px solid #ebecf0; margin: 20px 0;">
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <label style="margin:0;">Card Selection</label>
                                <div>
                                    <button id="aura-prev-card" class="aui-button aui-button-subtle" style="padding: 0 5px;">&lt;</button>
                                    <span id="aura-card-counter" style="font-size: 14px; font-weight: bold; margin: 0 10px;">1 / 1</span>
                                    <button id="aura-next-card" class="aui-button aui-button-subtle" style="padding: 0 5px;">&gt;</button>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                                <button id="aura-add-card" class="aui-button" style="flex: 1;">Add Card</button>
                                <button id="aura-remove-card" class="aui-button" style="flex: 1; color: #bf2600;">Remove</button>
                            </div>

                            <div class="aura-field-group">
                                <label>Title</label>
                                <input type="text" id="aura-title" class="aura-input">
                            </div>
                            
                            <div class="aura-field-group">
                                <label>Body</label>
                                <textarea id="aura-body" class="aura-textarea" rows="3"></textarea>
                            </div>
                            
                            <div class="aura-field-group">
                                <label>Accent Color</label>
                                <input type="color" id="aura-color" class="aura-input" style="padding: 2px; height: 36px;">
                            </div>
                            
                            <div class="aura-field-group">
                                <label>Icon (e.g. star, check)</label>
                                <input type="text" id="aura-icon" class="aura-input">
                            </div>

                            <div class="aura-field-group">
                                <label>Link URL (Optional)</label>
                                <input type="text" id="aura-href" class="aura-input" placeholder="https://...">
                            </div>
                        </div>
                        
                        <!-- 오른쪽 프리뷰 영역 (체커보드 배경) -->
                        <div class="aura-preview-pane" style="flex: 1; padding: 40px; overflow-y: auto; background-color: #f4f5f7; background-image: linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0); background-size: 20px 20px; background-position: 0 0, 10px 10px;">
                            
                            <style id="dynamic-preview-styles"></style>
                            <div id="aura-preview-container" class="aura-cards-wrapper" style="display: grid; max-width: 1200px; margin: auto;">
                            </div>
                        </div>
                    </div>
                </section>
                <div id="aura-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(9, 30, 66, 0.54); z-index: 3999;"></div>
            `;

            $('#aura-cards-dialog, #aura-backdrop').remove();
            $('body').append(dialogHtml);

            // 초기값 세팅
            $('#aura-theme').val(theme);
            $('#aura-gutter').val(gutter);
            $('#aura-gutter-val').text(gutter);

            function updatePreview() {
                var currentTheme = $('#aura-theme').val();
                var currentGutter = $('#aura-gutter').val();
                
                // 동적 스타일 생성 (기존 vm 템플릿의 CSS 흉내)
                var styles = \`
                    #aura-preview-container {
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    }
                    .preview-card {
                        background: #fff;
                        border-radius: 4px;
                        padding: 20px;
                        margin: \${currentGutter}px;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 4px 8px -2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31);
                        transition: transform 0.2s;
                    }
                    .preview-card:hover {
                        transform: translateY(-5px);
                    }
                    .preview-theme-aura-accent { border-top: 4px solid var(--accent-color); }
                    .preview-theme-fabric { background: var(--accent-color); color: #fff; }
                    .preview-theme-fabric .preview-title { color: #fff; }
                    .preview-title {
                        font-size: 18px; font-weight: bold; margin-top: 10px; margin-bottom: 10px; color: #172b4d;
                    }
                    .preview-body {
                        font-size: 14px; color: #5e6c84; flex: 1;
                    }
                    .preview-theme-fabric .preview-body { color: rgba(255,255,255,0.8); }
                    .preview-icon {
                        width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                        background: rgba(0,0,0,0.05); margin-bottom: 15px; font-weight: bold;
                    }
                \`;
                $('#dynamic-preview-styles').html(styles);

                // 카드 렌더링
                var $container = $('#aura-preview-container');
                $container.empty();

                cardsCollection.forEach(function(card, i) {
                    var isSelected = (i === currentCardIndex) ? 'box-shadow: 0 0 0 3px #4c9aff;' : '';
                    var iconHtml = card.icon ? \`<div class="preview-icon" style="color: \${card.color}">\${card.icon.substring(0,1).toUpperCase()}</div>\` : '';
                    
                    var cardHtml = \`
                        <div class="preview-card preview-theme-\${currentTheme}" style="--accent-color: \${card.color}; \${isSelected}" data-index="\${i}">
                            \${iconHtml}
                            <div class="preview-title">\${card.title || 'Untitled'}</div>
                            <div class="preview-body">\${(card.body || '').replace(/\\n/g, '<br>')}</div>
                        </div>
                    \`;
                    $container.append(cardHtml);
                });
            }

            function loadCardToForm(index) {
                var card = cardsCollection[index];
                if (!card) return;
                $('#aura-title').val(card.title || "");
                $('#aura-body').val(card.body || "");
                $('#aura-color').val(card.color || "#0052cc");
                $('#aura-icon').val(card.icon || "");
                $('#aura-href').val(card.href || "");
                $('#aura-card-counter').text((index + 1) + " / " + cardsCollection.length);
            }

            function saveFormToCard() {
                var card = cardsCollection[currentCardIndex];
                if (card) {
                    card.title = $('#aura-title').val();
                    card.body = $('#aura-body').val();
                    card.color = $('#aura-color').val();
                    card.icon = $('#aura-icon').val();
                    card.href = $('#aura-href').val();
                    if(card.href) card.hrefType = "url";
                    else card.hrefType = "none";
                }
            }

            // 이벤트 핸들러
            $('#aura-theme, #aura-gutter').on('input change', function() {
                $('#aura-gutter-val').text($('#aura-gutter').val());
                updatePreview();
            });

            $('#aura-title, #aura-body, #aura-color, #aura-icon, #aura-href').on('input', function() {
                saveFormToCard();
                updatePreview();
            });

            $('#aura-preview-container').on('click', '.preview-card', function() {
                saveFormToCard();
                currentCardIndex = $(this).data('index');
                loadCardToForm(currentCardIndex);
                updatePreview();
            });

            $('#aura-add-card').click(function() {
                saveFormToCard();
                cardsCollection.push({ title: "New Card", body: "Description", color: "#0052cc", hrefType: "none", href: "", icon: "" });
                currentCardIndex = cardsCollection.length - 1;
                loadCardToForm(currentCardIndex);
                updatePreview();
            });

            $('#aura-remove-card').click(function() {
                if (cardsCollection.length <= 1) {
                    alert("최소 1개의 카드가 필요합니다.");
                    return;
                }
                cardsCollection.splice(currentCardIndex, 1);
                if (currentCardIndex >= cardsCollection.length) currentCardIndex = cardsCollection.length - 1;
                loadCardToForm(currentCardIndex);
                updatePreview();
            });

            $('#aura-prev-card').click(function() {
                if (currentCardIndex > 0) {
                    saveFormToCard();
                    currentCardIndex--;
                    loadCardToForm(currentCardIndex);
                    updatePreview();
                }
            });

            $('#aura-next-card').click(function() {
                if (currentCardIndex < cardsCollection.length - 1) {
                    saveFormToCard();
                    currentCardIndex++;
                    loadCardToForm(currentCardIndex);
                    updatePreview();
                }
            });

            $('#aura-btn-save').click(function() {
                saveFormToCard();
                var macroObj = {
                    name: "wonui-cards",
                    params: {
                        theme: $('#aura-theme').val(),
                        gutter: $('#aura-gutter').val(),
                        cardsCollection: JSON.stringify(cardsCollection)
                    },
                    body: ""
                };
                tinymce.confluence.macrobrowser.macroBrowserComplete({
                    name: macroObj.name,
                    bodyHtml: macroObj.body,
                    params: macroObj.params
                });
                $('#aura-cards-dialog, #aura-backdrop').remove();
            });

            $('#aura-btn-close').click(function() {
                $('#aura-cards-dialog, #aura-backdrop').remove();
            });

            // Init
            loadCardToForm(currentCardIndex);
            updatePreview();
        }
    });
    }); // AJS.bind('init.rte')
})(AJS.$ || jQuery);
