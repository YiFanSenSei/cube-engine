// ===== 账户系统（JSON 文件存储）=====
let _currentUser = '';

async function loadCurrentUser(){
    try { _currentUser = (await window.nativeAPI.dbGet('tetris_current_user')) || ''; } catch(e){ _currentUser = ''; }
}
function getCurrentUser(){ return _currentUser; }
function setCurrentUser(n){
    _currentUser = n;
    window.nativeAPI.dbSet('tetris_current_user', n).catch(()=>{});
}
function getStorageKey(b){ return 'tetris_' + (_currentUser || 'default') + '_' + b; }

async function getUsers(){
    try {
        const d = await window.nativeAPI.dbGet('tetris_users');
        return Array.isArray(d) ? d : [];
    } catch(e){ return []; }
}
async function saveUsers(u){
    u = [...new Set(u)];
    await window.nativeAPI.dbSet('tetris_users', u);
}

/**
 * 账户选择动画 - 向右延伸效果
 * 原理：创建与账户按钮样式相同的辅助按钮(无内容、不可点击、宽度极大)，
 * 放在裁剪容器内。辅助按钮的右端与账户按钮的右端重合。
 * 动画时辅助按钮向右平移，右端移出屏幕后执行跳转。
 * @param {Element} accItem - 被点击的账户按钮 DOM 元素
 * @param {string} name - 账户名
 */
function animateAccountSelect(accItem, name) {
    // 点击后给按钮添加标记 class，保持 hover 样式不还原
    accItem.classList.add('acc-item-clicked');

    // 第一步：按钮短促震动 0.3 秒
    accItem.style.animation = 'accShake 0.3s ease';
    // 震动结束后清除 animation 样式，恢复到 acc-item-clicked 的 hover 样式
    setTimeout(() => {
        accItem.style.animation = '';
    }, 300);

    // 第二步：震动结束后（约350ms），启动延伸动画
    setTimeout(() => {
        launchSlideAnim(accItem, name);
    }, 350);
}

function launchSlideAnim(accItem, name) {
    const rect = accItem.getBoundingClientRect();
    const styles = window.getComputedStyle(accItem);

    // 辅助按钮总宽度 = 按钮宽度 + 极大额外宽度（屏幕5倍，保证不露馅）
    const EXTRA_W = Math.max(window.innerWidth * 5, 5000);
    const fakeTotalWidth = rect.width + EXTRA_W;

    // 裁剪容器左边界 = 账户按钮偏右一点的位置（约45%处），作为「断裂延伸」的起始点
    const clipLeft = rect.left + rect.width * 0.45;

    // 辅助按钮左边缘相对于裁剪容器的位置：
    // 要求：辅助按钮右边缘 = 账户按钮右边缘（相对于裁剪容器）
    const fakeBtnLeft = -(rect.width * 0.45) - EXTRA_W;

    // 创建裁剪容器
    const clipEl = document.createElement('div');
    clipEl.className = 'acc-anim-clip';
    Object.assign(clipEl.style, {
        left: clipLeft + 'px',
        top: rect.top + 'px',
        width: (window.innerWidth - clipLeft + 200) + 'px',
        height: rect.height + 'px',
        position: 'fixed',
        overflow: 'hidden',
        zIndex: 9999,
        pointerEvents: 'none'
    });

    // 创建辅助按钮（无文本内容、不可点击）
    const fakeBtn = document.createElement('div');
    fakeBtn.className = 'acc-anim-fake-btn';

    // 克隆账户按钮的关键视觉样式
    const styleProps = [
        'background', 'background-color', 'background-image',
        'border', 'border-width', 'border-style', 'border-color',
        'border-radius', 'box-shadow', 'opacity'
    ];
    const props = {};
    for (const p of styleProps) {
        const v = styles.getPropertyValue(p);
        if (v && v !== 'none' && v !== 'rgba(0, 0, 0, 0)') {
            props[p] = v;
        }
    }
    if (!props['background'] || props['background'] === 'none') {
        props['background'] = styles.getPropertyValue('background-color');
    }

    Object.assign(fakeBtn.style, {
        position: 'absolute',
        top: '0',
        left: fakeBtnLeft + 'px',
        width: fakeTotalWidth + 'px',
        height: '100%',
        pointerEvents: 'none',
        background: props['background'] || 'rgba(255,255,255,0.06)',
        border: props['border'] || '2px solid rgba(255,255,255,0.10)',
        borderRadius: props['border-radius'] || '12px',
        boxShadow: props['box-shadow'] || 'none',
        opacity: props['opacity'] || '1'
    });

    clipEl.appendChild(fakeBtn);
    document.body.appendChild(clipEl);

    const delay = 0.2;
    const duration = 0.7;
    const distance = window.innerWidth - clipLeft + 300;
    clipEl.style.setProperty('--acc-slide-distance', distance + 'px');
    clipEl.style.setProperty('--acc-slide-duration', duration + 's');
    clipEl.style.setProperty('--acc-slide-delay', delay + 's');

    // fake 按钮延伸动画完成后，冻结 clipEl 的伸出状态，整体进入出场动画
    setTimeout(() => {
        animateAccountExit(clipEl, () => selectAccount(name));
    }, (delay + duration) * 1000 + 50);
}

async function selectAccount(name){
    if(!name) return;
    const users = await getUsers();
    if(!users.includes(name)){ users.push(name); await saveUsers(users); }
    setCurrentUser(name);
    await loadAchievements(); await loadTheme(); await loadLeaderboard(); await loadShopData(); await loadKeyBindings();
    updateAchievementBadge(); renderAchievementPanel(); updateShopCurrencyUI();
    document.getElementById('accountOverlay').classList.add('hidden');
    document.getElementById('menuOverlay').classList.remove('hidden');
    // 账户选择界面已隐藏，刷新装饰方块恢复为正常主题色
    if(typeof refreshDecorBlocks === 'function') refreshDecorBlocks();
}

let currentTheme = 'classic';
let brightnessMode = 'dark';

function applyTheme(id){
    currentTheme = id;
    document.body.setAttribute('data-theme', id === 'classic' ? '' : id);
    document.body.setAttribute('data-brightness', brightnessMode);
    window.nativeAPI.dbSet(getStorageKey('theme'), id).catch(()=>{});
    // Update brightness toggle UI
    updateBrightnessToggleUI();
    // Update skin list in settings panel if open
    if(document.getElementById('settingsPanel').classList.contains('show')) renderMySkins();
    if(typeof refreshDecorBlocks === 'function') refreshDecorBlocks();
}

function setBrightnessMode(mode){
    brightnessMode = mode;
    document.body.setAttribute('data-brightness', brightnessMode);
    window.nativeAPI.dbSet('tetris_global_brightness', mode).catch(()=>{});
    updateBrightnessToggleUI();
    // 如果账户选择界面当前可见，同步更新其背景色（避开 data-theme 的影响）
    const accOverlay = document.getElementById('accountOverlay');
    if (accOverlay && !accOverlay.classList.contains('hidden')) {
        accOverlay.style.background = mode === 'light' ? '#f0eef5' : '#111111';
    }
}

function updateBrightnessToggleUI(){
    // 推拉开关不需要切换 class，CSS data-brightness 属性自动控制样式
    // 更新状态文字
    const statusEl = document.getElementById('brightnessStatus');
    if(statusEl){
        statusEl.textContent = brightnessMode === 'dark' ? '暗色模式' : '亮色模式';
    }
}

async function loadTheme(){
    try {
        // Load brightness first
        const b = await window.nativeAPI.dbGet('tetris_global_brightness');
        if(b && (b === 'dark' || b === 'light')){
            brightnessMode = b;
        } else {
            // 首次启动：读取系统配色方案
            try {
                brightnessMode = window.nativeAPI.getSystemTheme();
            } catch(e){
                brightnessMode = 'dark'; // 无法获取时默认暗色
            }
        }
        // Load skin from shop data (equippedItems)
        const d = await window.nativeAPI.dbGet(getStorageKey('shop'));
        if(d && d.equipped && d.equipped.ui){
            applyTheme(d.equipped.ui);
            return;
        }
        // Fallback: load from old theme key
        const s = await window.nativeAPI.dbGet(getStorageKey('theme'));
        if(s && typeof s === 'string' && THEMES.some(t => t.id === s)) applyTheme(s);
        else applyTheme('classic'); // Default
    } catch(e){ applyTheme('classic'); }
}

async function renderAccountSelection(){
    const c = document.getElementById('accountSelectList');
    if(!c) return;
    let users = await getUsers();
    // 最多显示三个账户
    const displayUsers = users.slice(0, 3);
    c.innerHTML = displayUsers.map(n => {
        return '<div class="acc-item" data-account-name="'+n+'">' +
            '<span class="acc-info"><span class="acc-name">'+n+'</span><div class="acc-desc">点击选择此账户</div></span>' +
            '<span class="acc-arrow">→</span>' +
            '<button class="acc-del-btn" data-delete-account="'+n+'" title="删除此账户">✕</button>' +
            '</div>';
    }).join('');
    // 为每个账户项添加点击动画处理
    c.querySelectorAll('[data-account-name]').forEach(b => b.addEventListener('click', function() {
        animateAccountSelect(this, b.dataset.accountName);
    }));
    c.querySelectorAll('[data-delete-account]').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        const name = b.dataset.deleteAccount;
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;';
        d.innerHTML = '<div style="background:var(--bg-panel);border:1px solid var(--border-color);border-radius:16px;padding:30px 40px;text-align:center;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.8);">' +
            '<div style="font-size:48px;margin-bottom:10px;">⚠️</div><h3 style="margin-bottom:8px;">确认删除</h3>' +
            '<p style="color:var(--text-muted);margin-bottom:20px;font-size:14px;">账户 "<strong style="color:var(--danger-color);">'+name+'</strong>" 的所有数据将被永久删除！<br>此操作不可撤销。</p>' +
            '<div style="display:flex;gap:10px;justify-content:center;">' +
            '<button class="btn btn-danger" id="confirmDeleteBtn" style="padding:10px 30px;">确认删除</button>' +
            '<button class="btn" id="cancelDeleteBtn" style="padding:10px 30px;">取消</button></div></div>';
        document.body.appendChild(d);
        document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
            for(const k of ['achievements','theme','leaderboard','shop'])
                await window.nativeAPI.dbDelete('tetris_'+name+'_'+k).catch(()=>{});
            let users = await getUsers();
            users = users.filter(u => u !== name);
            await saveUsers(users);
            document.body.removeChild(d);
            if(_currentUser === name) setCurrentUser('');
            await renderAccountSelection();
        });
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => document.body.removeChild(d));
    }));

    // 控制创建账户区域的显示
    const createSection = document.getElementById('accountCreateSection');
    if(createSection) {
        createSection.classList.toggle('hidden', displayUsers.length >= 3);
    }
}

// ===== 我的皮肤（已集成到设置面板内）=====
function toggleMySkinsPanel(){
    // 皮肤设置已直接嵌入设置菜单中，通过系统设置按钮访问
    // 此函数保留为兼容性占位
}

let mySkinsTab = 'ui';

function renderMySkins(){
    const c = document.getElementById('mySkinsList');
    if(!c) return;
    const isUiTab = mySkinsTab === 'ui';
    const isBgTab = mySkinsTab === 'bg';

    if (isBgTab) {
        // 背景标签页：渲染背景设置
        c.innerHTML = renderBgSection();
        const uploadBtn = document.getElementById('uploadBgBtn');
        if (uploadBtn) uploadBtn.addEventListener('click', uploadCustomBg);
        const resetBtn = document.getElementById('resetBgBtn');
        if (resetBtn) resetBtn.addEventListener('click', resetCustomBg);
        return;
    }

    // NOTE: ownedItems keys use 'blocks:' (plural) from shop.js shopTab, but equippedItems uses 'block' (singular)
    const prefix = isUiTab ? 'ui' : 'blocks';
    const equipKey = isUiTab ? 'ui' : 'block';
    const skinList = isUiTab ? SHOP_UI_SKINS : SHOP_BLOCK_SKINS;
    // Collect owned skins from ownedItems
    const ownedSkins = [];
    for(const key of Object.keys(ownedItems)){
        if(key.startsWith(prefix + ':')){
            const id = key.split(':')[1];
            const skinInfo = skinList.find(s => s.id === id);
            if(skinInfo) ownedSkins.push(skinInfo);
        }
    }
    // Ensure classic is always present
    const classicName = isUiTab ? '经典黄' : '经典方块';
    const classicIcon = isUiTab ? '🌙' : '🧱';
    if(!ownedSkins.some(s => s.id === 'classic')){
        ownedSkins.unshift({id:'classic',name:classicName,desc:isUiTab?'默认UI主题':'默认方块配色',icon:classicIcon});
    }
    let html = '';
    if(ownedSkins.length === 0){
        html = '<div class="shop-empty">暂无皮肤，前往商城购买</div>';
    } else {
        html = ownedSkins.map(skin => {
            const isEquipped = equippedItems[equipKey] === skin.id;
            return '<div class="my-skins-item' + (isEquipped ? ' equipped' : '') + '" data-skin-id="' + skin.id + '" data-skin-prefix="' + equipKey + '">' +
                '<div class="skin-icon">' + (skin.icon || '🎨') + '</div>' +
                '<div class="skin-info">' +
                '<div class="skin-name">' + skin.name + '</div>' +
                '<div class="skin-desc">' + (skin.desc || '') + '</div>' +
                '</div>' +
                '<div class="skin-status' + (isEquipped ? ' equipped-tag' : '') + '">' + (isEquipped ? '✅ 使用中' : '点击使用') + '</div>' +
                '</div>';
        }).join('');
    }
    // 方块皮肤页面：添加自定义上传按钮
    if(!isUiTab){
        html += '<div class="my-skins-upload-section">' +
            '<button class="my-skins-upload-btn" id="uploadSkinBtn">📁 上传照片做皮肤</button>' +
            (customSkinDataUrl ? '<button class="my-skins-reset-btn" id="resetSkinBtn">🗑️ 重置</button>' : '') +
            '</div>';
    }
    c.innerHTML = html;
    // Click handler for skin items
    c.querySelectorAll('.my-skins-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.skinId;
            const pfx = el.dataset.skinPrefix || 'ui';
            if(id === equippedItems[pfx]) return;
            equippedItems[pfx] = id;
            if(pfx === 'ui') applyTheme(id);
            else applyBlockSkin(id);
            saveShopData().catch(()=>{});
            renderMySkins();
            renderShopItems();
            playSfx('click');
        });
    });
    // Upload button
    const uploadBtn = document.getElementById('uploadSkinBtn');
    if(uploadBtn) uploadBtn.addEventListener('click', uploadCustomSkin);
    // Reset button
    const resetBtn = document.getElementById('resetSkinBtn');
    if(resetBtn) resetBtn.addEventListener('click', resetCustomSkin);
}

// ===== 自定义背景功能 =====
let _uploadBgInput = null;
let _customBgEl = null; // #customBg DOM 元素

function applyCustomBg(dataUrl) {
    if (dataUrl) {
        // 创建或复用背景层元素
        if (!_customBgEl) {
            _customBgEl = document.createElement('div');
            _customBgEl.id = 'customBg';
            document.body.insertBefore(_customBgEl, document.body.firstChild);
        }
        _customBgEl.style.backgroundImage = 'url(' + dataUrl + ')';
        _customBgEl.style.display = 'block';
        customBgActive = true;
        // 刷新装饰方块（让它们也显示在背景上方）
        if (typeof refreshDecorBlocks === 'function') refreshDecorBlocks();
    } else {
        if (_customBgEl) {
            _customBgEl.style.display = 'none';
            _customBgEl.style.backgroundImage = '';
        }
        customBgActive = false;
    }
}

function _ensureBgUploadInput() {
    if (!_uploadBgInput) {
        _uploadBgInput = document.createElement('input');
        _uploadBgInput.type = 'file';
        _uploadBgInput.accept = 'image/*';
        _uploadBgInput.style.display = 'none';
        _uploadBgInput.addEventListener('change', _handleCustomBgUpload);
        document.body.appendChild(_uploadBgInput);
    }
    return _uploadBgInput;
}

function _handleCustomBgUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
            // 最大宽度 1920px，等比缩放
            let w = img.width, h = img.height;
            const MAX_W = 1920;
            if (w > MAX_W) {
                h = Math.round(h * MAX_W / w);
                w = MAX_W;
            }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const cx = c.getContext('2d');
            cx.drawImage(img, 0, 0, w, h);

            const dataUrl = c.toDataURL('image/jpeg', 0.85);
            customBgDataUrl = dataUrl;
            applyCustomBg(dataUrl);

            // 保存到数据库
            window.nativeAPI.dbSet(getStorageKey('custom_bg'), dataUrl).catch(function(err){
                console.warn('[Bg] 保存自定义背景失败', err);
            });

            // 刷新背景标签页 UI
            if (document.getElementById('settingsPanel').classList.contains('show') && mySkinsTab === 'bg') {
                renderMySkins();
            }

            console.log('[Bg] 自定义背景上传完成 (' + w + 'x' + h + ')');
            showShopNotification('🖼️ 自定义背景上传成功！', 'success');
        };
        img.onerror = function() {
            showShopNotification('❌ 图片加载失败，请选择其他图片', 'error');
        };
        img.src = ev.target.result;
    };
    reader.onerror = function() {
        showShopNotification('❌ 读取文件失败', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function uploadCustomBg() {
    _ensureBgUploadInput().click();
}

function resetCustomBg() {
    customBgDataUrl = null;
    customBgActive = false;
    applyCustomBg(null);
    window.nativeAPI.dbDelete(getStorageKey('custom_bg')).catch(function(){});
    if (document.getElementById('settingsPanel').classList.contains('show') && mySkinsTab === 'bg') {
        renderMySkins();
    }
    showShopNotification('已恢复默认背景', 'info');
}

function renderBgSection() {
    let html = '';
    if (customBgDataUrl) {
        html += '<div class="my-bg-preview-wrap">' +
            '<div class="my-bg-preview" style="background-image: url(' + customBgDataUrl + ');"></div>' +
            '<div class="my-bg-info">' +
            '<div class="my-bg-label">当前背景</div>' +
            '<div class="my-bg-desc">自定义上传的背景图片</div>' +
            '</div>' +
            '</div>';
    } else {
        html += '<div class="my-bg-empty">' +
            '<div class="my-bg-empty-icon">🖼️</div>' +
            '<div class="my-bg-empty-text">暂无自定义背景</div>' +
            '<div class="my-bg-empty-desc">上传一张图片作为游戏背景吧</div>' +
            '</div>';
    }
    html += '<div class="my-bg-actions">' +
        '<button class="my-skins-upload-btn" id="uploadBgBtn">📁 上传背景图片</button>' +
        (customBgDataUrl ? '<button class="my-skins-reset-btn" id="resetBgBtn">🗑️ 重置默认</button>' : '') +
        '</div>';
    if (customBgDataUrl) {
        html += '<div class="my-bg-tip">💡 上传后自动应用，图片将自动暗化处理以保证界面可读性</div>';
    }
    return html;
}

// ===== 账户选择界面入场动画 =====
// 装饰方块组从屏幕下方边界外平移到目标位置（纯平移，无淡入淡出）；
// 底部小字（左下角、右下角）不参与任何动画；
// 其余 UI（左栏标题、右栏账户列表）从屏幕上方边界外平移到目标位置。
//
// 采用两阶段策略消除闪现：
// 阶段1（同步）：立即设置所有元素的 transform 到屏幕外位置
// 阶段2（嵌套 rAF）：启动 animate()，从当前（屏幕外）位置平移到目标位置
// 由于阶段1和 display 可见性在同一同步代码块中，浏览器首次渲染时元素已在屏幕外
function animateAccountEntrance() {
    const overlay = document.getElementById('accountOverlay');
    if (!overlay) return;
    // 离目标位置越近速度越慢：强缓出曲线
    // P1=(0.05,0.7)→起步快；P2=(0.1,1.0)→最后~90%的时间在缓慢减速至停止
    const EASE = 'cubic-bezier(0.05, 0.7, 0.1, 1.0)';

    const anims = [];
    const UNIFIED_DURATION = 1200;

    // ---- 上组：从屏幕上方边界外进入 ----
    const leftSection = document.querySelector('.acc-title-section');
    if (leftSection) {
        leftSection.style.transform = 'translateY(-100vh)';
        anims.push({ el: leftSection, delay: 0, duration: UNIFIED_DURATION });
    }

    const rightSection = document.querySelector('.acc-right-section');
    if (rightSection) {
        rightSection.style.transform = 'translateY(-100vh)';
        anims.push({ el: rightSection, delay: 0, duration: UNIFIED_DURATION });
    }

    // ---- 下组：从屏幕下方边界外进入 ----
    // 注意：左下小字(.game-footer)和右下小字(.game-footer-copyright)不参与任何动画
    // 无论从 startup 还是 logout 调用，都强制刷新为账户版装饰方块
    if (typeof refreshDecorBlocks === 'function') refreshDecorBlocks(true);
    if (typeof _decorBlocksEls !== 'undefined' && _decorBlocksEls.length > 0) {
        _decorBlocksEls.forEach(el => {
            el.style.opacity = '0';
            const orig = el.style.transform || '';
            el.__decorOrigTransform = orig;
            el.style.transform = 'translateY(100vh) ' + orig;
        });
        anims.push({ el: null, delay: 0, duration: UNIFIED_DURATION, type: 'decor' });
    }

    // ====== 终极保险：在移除 hidden 前设置背景色和全透明 ======
    // 防止 overlay 可见时因无背景色而透出后面的棋盘
    // 注：不直接使用 var(--bg-body)，因为它会受到 data-theme（UI皮肤主题）影响，
    // 导致主题色泄露到账户选择界面（账户界面应保持中性黑白灰色调）。
    // 改为根据 data-brightness 选择固定的中性背景色。
    const _isLight = document.body.getAttribute('data-brightness') === 'light';
    overlay.style.background = _isLight ? '#f0eef5' : '#111111';
    overlay.style.opacity = '0';
    
    // 装饰方块已在屏幕外（在 display:none 状态下），现在才让界面可见
    overlay.classList.remove('hidden');
    // ★ 注意：gameWrapper 不在此时恢复！否则用户会透过透明 overlay 看到棋盘
    // 把它移到 rAF 回调中，和恢复 opacity 在同一帧进行
    
    // 下一个 rAF 启动动画，同时恢复 overlay 可见和 game-wrapper 显示
    requestAnimationFrame(() => {
        // ★ 必须先禁用 CSS transition，否则清除 inline opacity 会触发
        //   .menu-overlay { transition: opacity 0.4s } 的 0→1 渐入动画，
        //   导致 overlay 在半透明期间透出底部的自定义背景图
        overlay.style.transition = 'none';
        overlay.style.opacity = '';  // 立即生效为全不透明
        void overlay.offsetHeight;  // 强制 reflow 使上述变更生效
        overlay.style.transition = '';  // 恢复 transition（供后续面板切换使用）
        // 背景色已在移除 hidden 前用 CSS 变量设置，无需重复设置
        const gameWrapper = document.querySelector('.game-wrapper');
        if (gameWrapper) gameWrapper.style.display = '';  // 此时才恢复棋盘
        // 移除启动遮挡层（此时 overlay 已全不透明，不会再透出背景）
        const blocker = document.getElementById('_startupBlocker');
        if (blocker && blocker.parentNode) blocker.parentNode.removeChild(blocker);
        for (const a of anims) {
            if (a.type === 'decor') {
                _decorBlocksEls.forEach(el => {
                    const orig = el.__decorOrigTransform || '';
                    const origOpacity = el.__decorOrigOpacity || '1';
                    el.animate([
                        { transform: 'translateY(0) ' + orig, opacity: origOpacity }
                    ], {
                        duration: a.duration,
                        easing: EASE,
                        fill: 'forwards',
                        delay: a.delay
                    });
                });
            } else {
                a.el.animate([
                    { transform: 'translateY(0)' }
                ], {
                    duration: a.duration,
                    easing: EASE,
                    fill: 'forwards',
                    delay: a.delay
                });
            }
        }
    });
}

/**
 * 账户选择界面出场动画
 * - clipEl（辅助图层，冻结着右端延伸出屏幕的假象）整体向上飞出
 * - 标题、账户列表向上飞出
 * - 装饰方块向下飞出+淡出
 * 缓动曲线为入场曲线的镜像：慢起步快结束
 * @param {Element} clipEl - 冻结的裁剪容器（含已延伸的 fake 按钮）
 * @param {Function} callback - 动画结束后执行的回调
 */
function animateAccountExit(clipEl, callback) {
    const overlay = document.getElementById('accountOverlay');
    if (!overlay) { if (callback) callback(); return; }

    // 镜像缓出：慢起步（不舍得走）、快结束
    const EASE = 'cubic-bezier(0.55, 0.0, 0.95, 0.3)';

    const anims = [];
    const UNIFIED_DURATION = 1200;

    // ---- clipEl（辅助图层）整体向上飞出 ----
    if (clipEl && clipEl.parentNode) {
        // 清除 clipEl 上的 CSS 动画样式，让它在当前位置冻结
        clipEl.style.animation = 'none';
        anims.push({ el: clipEl, delay: 0, duration: UNIFIED_DURATION, toY: -window.innerHeight + 'px' });
    }

    // ---- 上组：从当前位置向上飞出 ----
    const leftSection = document.querySelector('.acc-title-section');
    if (leftSection) {
        leftSection.style.transform = '';
        anims.push({ el: leftSection, delay: 0, duration: UNIFIED_DURATION, toY: -window.innerHeight + 'px' });
    }

    const rightSection = document.querySelector('.acc-right-section');
    if (rightSection) {
        rightSection.style.transform = '';
        anims.push({ el: rightSection, delay: 0, duration: UNIFIED_DURATION, toY: -window.innerHeight + 'px' });
    }

    // ---- 下组：装饰方块向下飞出 ----
    if (typeof _decorBlocksEls !== 'undefined' && _decorBlocksEls.length > 0) {
        _decorBlocksEls.forEach(el => {
            // 读入场时保存的纯净原始变换（仅旋转，不含 translateY 前缀）
            // 不能读 el.style.transform，因为入场阶段1设置了 translateY(100vh) 前缀
            const orig = el.__decorOrigTransform || '';
            el.__decorExitOrig = orig;
        });
        anims.push({ el: null, delay: 0, duration: UNIFIED_DURATION, type: 'decorExit' });
    }

    // 启动动画
    for (const a of anims) {
        if (a.type === 'decorExit') {
            _decorBlocksEls.forEach(el => {
                const orig = el.__decorExitOrig || '';
                // 读入场时保存的原始 opacity，不读残留的 style.opacity（阶段1设为 '0'）
                const curOpacity = parseFloat(el.__decorOrigOpacity) || 1;
                el.animate([
                    { transform: 'translateY(0) ' + orig, opacity: curOpacity },
                    { transform: 'translateY(100vh) ' + orig, opacity: 0 }
                ], {
                    duration: a.duration,
                    easing: EASE,
                    fill: 'forwards',
                    delay: a.delay
                });
            });
        } else {
            a.el.animate([
                { transform: 'translateY(0)' },
                { transform: 'translateY(' + a.toY + ')' }
            ], {
                duration: a.duration,
                easing: EASE,
                fill: 'forwards',
                delay: a.delay
            });
        }
    }

    // 等待最晚结束的动画完成
    const maxDuration = Math.max(...anims.map(a => a.delay + a.duration));
    setTimeout(() => {
        // 清理辅助图层
        if (clipEl && clipEl.parentNode) clipEl.parentNode.removeChild(clipEl);
        // 清理 UI 样式
        if (leftSection) leftSection.style.transform = '';
        if (rightSection) rightSection.style.transform = '';
        // 清理装饰方块
        if (typeof _decorBlocksEls !== 'undefined' && _decorBlocksEls.length > 0) {
            _decorBlocksEls.forEach(el => {
                el.style.transform = el.__decorExitOrig || '';
                el.style.opacity = '';
                delete el.__decorExitOrig;
            });
        }
        if (callback) callback();
    }, maxDuration + 50);
}

// Node.js 导出（用于 Jest 测试）
if(typeof module !== 'undefined' && module.exports){
    module.exports = { getStorageKey, getCurrentUser, setCurrentUser };
}
