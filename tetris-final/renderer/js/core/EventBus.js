// ===== 事件总线 — 解耦特效触发 =====
class EventBus {
    constructor() {
        this._listeners = {};
    }

    /**
     * 注册事件监听
     * @param {string} event 事件名
     * @param {Function} fn 回调函数
     */
    on(event, fn) {
        (this._listeners[event] = this._listeners[event] || []).push(fn);
    }

    /**
     * 移除事件监听
     * @param {string} event 事件名
     * @param {Function} fn 要移除的回调（不传则移除所有）
     */
    off(event, fn) {
        if (!this._listeners[event]) return;
        if (!fn) {
            delete this._listeners[event];
            return;
        }
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }

    /**
     * 发射事件
     * @param {string} event 事件名
     * @param {*} data 事件数据
     */
    emit(event, data) {
        const fns = this._listeners[event];
        if (!fns) return;
        for (const fn of fns) {
            try {
                fn(data);
            } catch (e) {
                console.warn(`[EventBus] 事件 "${event}" 处理异常:`, e);
            }
        }
    }
}

// 全局单例
const eventBus = new EventBus();