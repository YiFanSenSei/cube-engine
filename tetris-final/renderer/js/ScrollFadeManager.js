// ===== 滚动渐淡遮罩管理器 =====
// 为可滚动容器添加边缘渐淡效果（iOS 风格）
// 当内容还能朝某个方向滚动时，在边缘应用 CSS mask-image 渐变遮罩
'use strict';

class ScrollFadeManager {
    constructor(configs = []) {
        this._entries = [];
        this._resizeObserver = null;
        this._mutationObserver = null;
        if (configs.length > 0) configs.forEach(cfg => this.addTarget(cfg));
    }

    addTarget(cfg) {
        const { selector, parentSelector, containerEl, fadeHeight } = cfg;
        let el = containerEl || null;
        if (!el && selector) {
            el = parentSelector
                ? document.querySelector(parentSelector)?.querySelector(selector)
                : document.querySelector(selector);
        }
        if (!el || el.dataset.scrollFadeInited) return;
        el.dataset.scrollFadeInited = '1';

        const fadeH = fadeHeight || 40;

        const updateMasks = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const canScrollUp = scrollTop > 3;
            const canScrollDown = scrollTop + clientHeight < scrollHeight - 3;

            if (!canScrollUp && !canScrollDown) {
                el.style.webkitMaskImage = 'none';
                el.style.maskImage = 'none';
            } else if (canScrollUp && !canScrollDown) {
                el.style.webkitMaskImage = `linear-gradient(to bottom, transparent 0px, #000 ${fadeH}px)`;
                el.style.maskImage = `linear-gradient(to bottom, transparent 0px, #000 ${fadeH}px)`;
            } else if (!canScrollUp && canScrollDown) {
                el.style.webkitMaskImage = `linear-gradient(to top, transparent 0px, #000 ${fadeH}px)`;
                el.style.maskImage = `linear-gradient(to top, transparent 0px, #000 ${fadeH}px)`;
            } else {
                el.style.webkitMaskImage = `linear-gradient(to bottom, transparent 0px, #000 ${fadeH}px, #000 calc(100% - ${fadeH}px), transparent 100%)`;
                el.style.maskImage = `linear-gradient(to bottom, transparent 0px, #000 ${fadeH}px, #000 calc(100% - ${fadeH}px), transparent 100%)`;
            }
        };

        el.addEventListener('scroll', updateMasks, { passive: true });
        requestAnimationFrame(updateMasks);

        this._entries.push({ el, updateMasks });

        if (!this._mutationObserver) {
            this._mutationObserver = new MutationObserver(() => this._entries.forEach(e => e.updateMasks()));
            this._mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
        }
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver(() => this._entries.forEach(e => e.updateMasks()));
        }
        this._resizeObserver.observe(el);
    }

    refresh() { this._entries.forEach(e => e.updateMasks()); }

    destroy() {
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
        if (this._mutationObserver) { this._mutationObserver.disconnect(); this._mutationObserver = null; }
        this._entries.forEach(e => {
            e.el.removeEventListener('scroll', e.updateMasks);
            e.el.style.webkitMaskImage = '';
            e.el.style.maskImage = '';
        });
        this._entries = [];
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { ScrollFadeManager };