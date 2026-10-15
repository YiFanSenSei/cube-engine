// ===== 商城系统 =====
const SHOP_BLOCK_SKINS = [
    {id:'classic',name:'经典方块',desc:'默认方块配色',icon:'🧱',price:0,currency:'gold'},
    {id:'neon',name:'霓虹灯',desc:'发光霓虹配色',icon:'💡',price:500,currency:'gold'},
    {id:'pastel',name:'马卡龙',desc:'柔和马卡龙配色',icon:'🍬',price:1000,currency:'gold'},
    {id:'candy',name:'糖果',desc:'彩色糖果风格',icon:'🍭',price:2000,currency:'gold'},
    {id:'matrix',name:'黑客帝国',desc:'绿色矩阵风格',icon:'💚',price:5000,currency:'gold'},
    {id:'golden',name:'黄金',desc:'土豪金配色',icon:'👑',price:100,currency:'diamond'},
    {id:'crystal',name:'水晶',desc:'半透明星光',icon:'💎',price:200,currency:'diamond'},
    {id:'rainbow',name:'彩虹',desc:'七色渐变彩虹',icon:'🌈',price:500,currency:'diamond'},
    {id:'custom',name:'塔菲喵',desc:'上传的个性图片纹理',icon:'🐱',price:2000,currency:'gold'},
    {id:'uploaded',name:'我的上传',desc:'自己上传的图片皮肤',icon:'📁',price:0,currency:'gold'}
];
const SHOP_UI_SKINS = [
    {id:'classic',name:'经典黄',desc:'默认UI主题',icon:'🌙',price:0,currency:'gold'},
    {id:'ocean',name:'深海蓝',desc:'宁静海洋主题',icon:'🌊',price:800,currency:'gold'},
    {id:'forest',name:'森林绿',desc:'清新森林主题',icon:'🌲',price:2500,currency:'gold'},
    {id:'midnight',name:'午夜紫',desc:'深邃紫色主题',icon:'🌌',price:80,currency:'diamond'},
    {id:'pink',name:'少女粉',desc:'粉色少女主题',icon:'🌸',price:1500,currency:'gold'}
];

let shopCurrency = { gold: 0, diamond: 0 };
let ownedItems = { 'block:classic': true, 'ui:classic': true, 'blocks:uploaded': true };
let equippedItems = { block: 'classic', ui: 'classic', tipPosition: 'tl' };
let shopTab = 'blocks';
let trialSkin = null;

async function loadShopData(){
    shopCurrency = { gold: 0, diamond: 0 }; ownedItems = {}; equippedItems = { block: 'classic', ui: 'classic', tipPosition: 'tl' };
    ownedItems['block:classic'] = true; ownedItems['ui:classic'] = true;
    try {
        const d = await window.nativeAPI.dbGet(getStorageKey('shop'));
        if(d){
            if(d.owned && typeof d.owned === 'object') ownedItems = d.owned;
            if(d.equipped && typeof d.equipped === 'object') equippedItems = d.equipped;
            if(typeof d.gold === 'number') shopCurrency.gold = d.gold;
            if(typeof d.diamond === 'number') shopCurrency.diamond = d.diamond;
        }
    } catch(e){}
    ownedItems['block:classic'] = true; ownedItems['ui:classic'] = true;
    // 自定义皮肤免费拥有
    ownedItems['blocks:uploaded'] = true;
    if(getCurrentUser() === 'GM'){ shopCurrency.gold = 999999; shopCurrency.diamond = 999999; await saveShopData(); }
}

async function saveShopData(){
    try{ await window.nativeAPI.dbSet(getStorageKey('shop'), {owned:ownedItems,equipped:equippedItems,gold:shopCurrency.gold,diamond:shopCurrency.diamond}); } catch(e){}
}

function updateShopCurrencyUI(){
    document.getElementById('shopGold').textContent = shopCurrency.gold;
    document.getElementById('shopDiamond').textContent = shopCurrency.diamond;
}

function renderShopItems(){
    const c = document.getElementById('shopItems');
    if(!c) return;
    const items = shopTab === 'blocks' ? SHOP_BLOCK_SKINS : SHOP_UI_SKINS;
    if(items.length === 0){ c.innerHTML = '<div class="shop-empty">暂无商品</div>'; return; }
    c.innerHTML = items.map(item => {
        const ik = shopTab + ':' + item.id, owned = ownedItems[ik], isFree = item.price === 0;
        let ah = '';
        if(owned || isFree){
            ah = '<span class="shop-btn shop-btn-equip equipped" style="cursor:default;">✅ 已拥有</span>';
        } else {
            ah = '<span class="item-price'+(item.currency==='diamond'?' diamond-price':'')+'">'+(item.currency==='diamond'?'💎':'🪙')+item.price+'</span><button class="shop-btn shop-btn-buy" data-item-key="'+ik+'" data-price="'+item.price+'" data-currency="'+item.currency+'">购买</button><button class="shop-btn shop-btn-trial" data-item-key="'+ik+'" data-shop-action="trial" title="免费试用一局">试用 1局</button>';
        }
        return '<div class="shop-item'+(owned?' owned':'')+'" data-item-key="'+ik+'"><div class="item-icon block-preview">'+item.icon+'</div><div class="item-info"><div class="item-name">'+item.name+'</div><div class="item-desc">'+item.desc+'</div></div><div class="item-action">'+ah+'</div></div>';
    }).join('');
}

async function handleShopAction(e){
    const t = e.target;
    if(!t.dataset || !t.dataset.itemKey) return;
    const ik = t.dataset.itemKey, action = t.dataset.shopAction;
    if(action === 'equip'){ await equipShopItem(ik); return; }
    if(action === 'trial'){
        const p = ik.split(':');
        if(p.length === 2){
            let cat = p[0], id = p[1];
            if (cat === 'blocks') cat = 'block';
            if(ownedItems[ik]){ await equipShopItem(ik); return; }
            trialSkin = {}; trialSkin.revertBlock = equippedItems.block; trialSkin.revertUi = equippedItems.ui;
            if(cat === 'block'){ equippedItems.block = id; applyBlockSkin(id); trialSkin.block = id; }
            else{ equippedItems.ui = id; applyTheme(id === 'classic' ? 'classic' : id); trialSkin.ui = id; }
            await saveShopData(); renderShopItems(); playSfx('click');
            showShopNotification('🎮 试用中：'+id+' 皮肤（一局后自动恢复）','info');
            toggleShopPanel();
            if(!gameStarted || playerGame.gameOver){
                gameMode = menuMode; document.getElementById('menuOverlay').classList.add('hidden');
                updateModeUI(); updateGameUI(); startGame();
            }
        }
        return;
    }
    const price = parseInt(t.dataset.price), currency = t.dataset.currency;
    if(!price || !currency) return;
    const bal = currency === 'diamond' ? shopCurrency.diamond : shopCurrency.gold;
    if(bal < price){ showShopNotification('余额不足！需要 '+(currency==='diamond'?'💎':'🪙')+price,'error'); return; }
    if(currency === 'diamond') shopCurrency.diamond -= price; else shopCurrency.gold -= price;
    ownedItems[ik] = true; await saveShopData(); updateShopCurrencyUI(); renderShopItems(); playSfx('purchase');
    showShopNotification('✅ 购买成功！','success');
    // UI skins: 仅添加到已拥有，不自动装备；方块皮肤保持自动装备
    if(shopTab === 'blocks') await equipShopItem(ik);
}

async function equipShopItem(ik){
    const p = ik.split(':');
    if(p.length !== 2) return;
    let cat = p[0], id = p[1];
    // 统一键名：商城用 'blocks'（复数），内部用 'block'（单数）
    if (cat === 'blocks') cat = 'block';
    if(!ownedItems[ik]) return;
    if(trialSkin) trialSkin = null;
    equippedItems[cat] = id; await saveShopData(); renderShopItems();
    if(cat === 'ui') applyTheme(id === 'classic' ? 'classic' : id);
    else if(cat === 'block') applyBlockSkin(id);
    showShopNotification('✅ 已装备 '+(cat==='block'?'方块':'UI')+' 皮肤','success');
}

async function applyTrialSkin(cat, id){
    if (cat === 'blocks') cat = 'block';
    trialSkin = {}; trialSkin.revertBlock = equippedItems.block; trialSkin.revertUi = equippedItems.ui;
    if(cat === 'block'){ equippedItems.block = id; applyBlockSkin(id); trialSkin.block = id; }
    else{ equippedItems.ui = id; applyTheme(id === 'classic' ? 'classic' : id); trialSkin.ui = id; }
    await saveShopData();
}

async function clearTrialSkin(showNotif){
    if(!trialSkin) return;
    equippedItems.block = trialSkin.revertBlock; equippedItems.ui = trialSkin.revertUi;
    applyBlockSkin(equippedItems.block); applyTheme(equippedItems.ui === 'classic' ? 'classic' : equippedItems.ui);
    await saveShopData();
    const n = trialSkin.block || trialSkin.ui || '';
    trialSkin = null; renderShopItems();
    if(showNotif && n) showShopNotification('试用结束，'+n+' 皮肤已自动恢复','info');
}

function showShopNotification(msg, type){
    const n = document.getElementById('achievementNotif');
    if(!n) return;
    n.querySelector('.notif-icon').textContent = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '🎉';
    n.querySelector('.notif-name').textContent = msg;
    n.querySelector('.notif-desc').textContent = '';
    n.classList.add('show');
    clearTimeout(n._timeout);
    n._timeout = setTimeout(() => n.classList.remove('show'), 2500);
}

function toggleShopPanel(){
    const p = document.getElementById('shopPanel');
    const bp = document.getElementById('shopBackdrop');
    if(!p) return;
    const s = p.classList.contains('show');
    if(!s){
        updateShopCurrencyUI(); renderShopItems(); p.classList.add('show');
        if(bp) bp.classList.add('show');
    } else {
        p.classList.remove('show');
        if(bp) bp.classList.remove('show');
    }
}

function applyBlockSkin(id){
    const clr = BLOCK_SKIN_COLORS[id] || BLOCK_SKIN_COLORS.classic,
          glw = BLOCK_SKIN_GLOWS[id] || BLOCK_SKIN_GLOWS.classic;
    for(const k of Object.keys(clr)){ COLORS[k] = clr[k]; COLOR_GLOW[k] = glw[k] || COLOR_GLOW[k]; }
    // 通过 SkinManager 设置激活皮肤（替代旧 window._currentBlockSkin）
    skinManager.setActiveSkin(id);

    // 自定义纹理皮肤：加载图片制作 CanvasPattern
    if(id === 'custom' || id === 'uploaded'){
        textureSkinActive = true;
        // 切换纹理皮肤类型时清除缓存，重新加载
        if(skinManager.getActiveSkinId() !== id) customTexturePattern = null;
        if(!customTexturePattern){
            const img = new Image();
            img.onload = function(){
                const c = document.createElement('canvas');
                c.width = CELL; c.height = CELL;
                const cx = c.getContext('2d');
                cx.drawImage(img, 0, 0, CELL, CELL);
                customTexturePattern = cx.createPattern(c, 'repeat');
                console.log('[Skin] 自定义纹理加载完成 (' + id + ')');
            };
            img.onerror = function(){
                console.warn('[Skin] 自定义图片加载失败，使用经典色');
                textureSkinActive = false;
                // COLORS/COLOR_GLOW 已被 custom/uploaded 的粉色调覆盖，需要恢复经典色
                const classicClr = BLOCK_SKIN_COLORS.classic;
                const classicGlw = BLOCK_SKIN_GLOWS.classic;
                for(const k of Object.keys(classicClr)){
                    COLORS[k] = classicClr[k];
                    COLOR_GLOW[k] = classicGlw[k] || COLOR_GLOW[k];
                }
            };
            if(id === 'uploaded' && customSkinDataUrl) img.src = customSkinDataUrl;
            else img.src = 'assets/block_skin.png';
        }
    } else {
        textureSkinActive = false;
    }

    const sl = document.getElementById('skinStatus');
    if(sl) sl.textContent = '🎨 ' + id;
}

// ===== 自定义皮肤上传功能 =====
let _uploadInput = null;

function _ensureUploadInput() {
    if (!_uploadInput) {
        _uploadInput = document.createElement('input');
        _uploadInput.type = 'file';
        _uploadInput.accept = 'image/*';
        _uploadInput.style.display = 'none';
        _uploadInput.addEventListener('change', _handleCustomSkinUpload);
        document.body.appendChild(_uploadInput);
    }
    return _uploadInput;
}

function _handleCustomSkinUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
            // 裁剪为正方形（取中心区域）
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;

            // 缩放到 CELL x CELL
            const c = document.createElement('canvas');
            c.width = CELL; c.height = CELL;
            const cx = c.getContext('2d');
            cx.drawImage(img, sx, sy, size, size, 0, 0, CELL, CELL);

            // 创建纹理图案
            customTexturePattern = cx.createPattern(c, 'repeat');
            textureSkinActive = true;

            // 保存到数据库
            const dataUrl = c.toDataURL('image/png');
            customSkinDataUrl = dataUrl;
            window.nativeAPI.dbSet(getStorageKey('custom_skin'), dataUrl).catch(function(err){
                console.warn('[Skin] 保存自定义皮肤失败', err);
            });

            // 如果当前装备的不是 uploaded，自动装备
            if (equippedItems.block !== 'uploaded') {
                equippedItems.block = 'uploaded';
                saveShopData().catch(function(){});
                applyBlockSkin('uploaded');
                renderMySkins();
                renderShopItems();
            }

            console.log('[Skin] 自定义纹理上传完成');
            showShopNotification('✅ 自定义皮肤上传成功！', 'success');
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
    // 重置 input 以便重复选择同一文件
    e.target.value = '';
}

function uploadCustomSkin() {
    _ensureUploadInput().click();
}

function resetCustomSkin() {
    // 清除已保存的数据
    customSkinDataUrl = null;
    customTexturePattern = null;
    textureSkinActive = false;
    window.nativeAPI.dbDelete(getStorageKey('custom_skin')).catch(function(){});
    // 如果当前装备的是 uploaded，切回经典
    if (equippedItems.block === 'uploaded') {
        equippedItems.block = 'classic';
        applyBlockSkin('classic');
        saveShopData().catch(function(){});
        renderMySkins();
        renderShopItems();
    }
    showShopNotification('已重置自定义皮肤', 'info');
}

// Node.js 导出（用于 Jest 测试）
if(typeof module !== 'undefined' && module.exports){
    module.exports = { applyBlockSkin, applyTrialSkin, clearTrialSkin, equipShopItem, SHOP_BLOCK_SKINS, SHOP_UI_SKINS, ownedItems, equippedItems, shopCurrency, saveShopData, loadShopData, trialSkin };
}