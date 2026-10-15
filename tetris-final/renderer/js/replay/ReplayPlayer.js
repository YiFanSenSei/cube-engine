// ===== 回放播放控制核心 =====
// 管理帧索引、速度、暂停/步进，不包含渲染逻辑

class ReplayPlayer {
    constructor() {
        this.frames = [];
        this.currentIndex = 0;
        this.playing = false;
        this.speed = 1;       // 倍速：0.25 / 0.5 / 1 / 2 / 4 / 8
        this.finished = false;
        this._autoTimer = null;
        this._onFrameChange = null;   // callback: (index) => void
        this._onFinish = null;        // callback: () => void
        this._onStateChange = null;   // callback: (playing) => void
    }

    /** 加载帧数据 */
    loadFrames(frames) {
        this.frames = frames || [];
        this.currentIndex = 0;
        this.playing = false;
        this.finished = false;
        this._clearAutoTimer();
    }

    /** 获取当前帧 */
    getCurrentFrame() {
        if (this.currentIndex < 0 || this.currentIndex >= this.frames.length) return null;
        return this.frames[this.currentIndex];
    }

    /** 获取总帧数 */
    getFrameCount() {
        return this.frames.length;
    }

    /** 获取当前帧索引（1-based 显示用） */
    getDisplayIndex() {
        return Math.min(this.currentIndex + 1, this.frames.length);
    }

    /** 上一步 */
    previousStep() {
        if (this.frames.length === 0) return false;
        if (this.playing) this.pause();
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.finished = false;
            this._notifyFrameChange();
            return true;
        }
        return false;
    }

    /** 下一步 */
    nextStep() {
        if (this.frames.length === 0) return false;
        if (this.playing) this.pause();
        if (this.currentIndex < this.frames.length - 1) {
            this.currentIndex++;
            this._notifyFrameChange();
            return true;
        } else {
            // 已到末帧
            this.finished = true;
            this._notifyFrameChange();
            if (this._onFinish) this._onFinish();
            return false;
        }
    }

    /** 跳到首帧 */
    goToStart() {
        if (this.playing) this.pause();
        this.currentIndex = 0;
        this.finished = false;
        this._notifyFrameChange();
    }

    /** 跳到末帧 */
    goToEnd() {
        if (this.playing) this.pause();
        this.currentIndex = Math.max(0, this.frames.length - 1);
        this.finished = true;
        this._notifyFrameChange();
        if (this._onFinish) this._onFinish();
    }

    /** 跳转到指定帧 */
    goTo(index) {
        if (this.playing) this.pause();
        if (index < 0) index = 0;
        if (index >= this.frames.length) index = this.frames.length - 1;
        this.currentIndex = index;
        this.finished = this.currentIndex >= this.frames.length - 1;
        this._notifyFrameChange();
    }

    /** 播放/继续 */
    play() {
        if (this.frames.length === 0) return;
        if (this.finished) {
            this.goToStart();
        }
        this.playing = true;
        this._startAutoTimer();
        if (this._onStateChange) this._onStateChange(true);
    }

    /** 暂停 */
    pause() {
        this.playing = false;
        this._clearAutoTimer();
        if (this._onStateChange) this._onStateChange(false);
    }

    /** 切换播放/暂停 */
    togglePlay() {
        if (this.playing) {
            this.pause();
        } else {
            this.play();
        }
    }

    /** 设置播放速度 */
    setSpeed(speed) {
        this.speed = speed;
        if (this.playing) {
            this._restartAutoTimer();
        }
    }

    /** 获取速度对应的延迟（ms） */
    _getDelay() {
        // 1x = 每秒一帧
        const baseDelay = 1000;
        return Math.round(baseDelay / this.speed);
    }

    /** 启动自动推进 */
    _startAutoTimer() {
        this._clearAutoTimer();
        this._autoTimer = setInterval(() => {
            if (!this.playing) return;
            if (this.currentIndex < this.frames.length - 1) {
                this.currentIndex++;
                this._notifyFrameChange();
            } else {
                // 到达末帧
                this.finished = true;
                this.playing = false;
                this._clearAutoTimer();
                this._notifyFrameChange();
                if (this._onFinish) this._onFinish();
                if (this._onStateChange) this._onStateChange(false);
            }
        }, this._getDelay());
    }

    /** 重启自动推进（速度变更时） */
    _restartAutoTimer() {
        if (this.playing) {
            this._clearAutoTimer();
            this._startAutoTimer();
        }
    }

    /** 清除自动推进定时器 */
    _clearAutoTimer() {
        if (this._autoTimer) {
            clearInterval(this._autoTimer);
            this._autoTimer = null;
        }
    }

    /** 通知帧变化 */
    _notifyFrameChange() {
        if (this._onFrameChange) this._onFrameChange(this.currentIndex);
    }

    // ---- 回调注册 ----

    onFrameChange(callback) {
        this._onFrameChange = callback;
    }

    onFinish(callback) {
        this._onFinish = callback;
    }

    onStateChange(callback) {
        this._onStateChange = callback;
    }

    /** 清理 */
    destroy() {
        this._clearAutoTimer();
        this.frames = [];
        this._onFrameChange = null;
        this._onFinish = null;
        this._onStateChange = null;
    }
}

// 全局实例
const replayPlayer = new ReplayPlayer();