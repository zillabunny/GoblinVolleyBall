import { TOUCH_BUTTONS } from './ui.js';
import { CANVAS_W, CANVAS_H } from './physics.js';

export class InputState {
  constructor() {
    this.left = false; this.right = false;
    this.jump = false; this.hit   = false;
    this._hitPrev        = false;
    this._hitJustPressed = false;
  }

  get hitPressed() {
    return (this.hit && !this._hitPrev) || this._hitJustPressed;
  }

  tick() {
    // MUST be called exactly once per frame, AFTER all reads of hitPressed.
    this._hitPrev        = this.hit;
    this._hitJustPressed = false;
  }

  bind() {
    window.addEventListener('keydown', e => this._onKey(e, true));
    window.addEventListener('keyup',   e => this._onKey(e, false));
  }

  bindTouch(canvas) {
    const onStart = e => {
      e.preventDefault();
      const rect   = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      for (const touch of e.changedTouches) {
        const gx = (touch.clientX - rect.left) * scaleX;
        const gy = (touch.clientY - rect.top)  * scaleY;
        for (const [key, btn] of Object.entries(TOUCH_BUTTONS)) {
          if (gx >= btn.x && gx <= btn.x + btn.w &&
              gy >= btn.y && gy <= btn.y + btn.h) {
            this[key] = true;
            if (key === 'hit') this._hitJustPressed = true;
          }
        }
      }
    };
    const onEnd = e => {
      e.preventDefault();
      const rect   = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      for (const touch of e.changedTouches) {
        const gx = (touch.clientX - rect.left) * scaleX;
        const gy = (touch.clientY - rect.top)  * scaleY;
        for (const [key, btn] of Object.entries(TOUCH_BUTTONS)) {
          if (gx >= btn.x && gx <= btn.x + btn.w &&
              gy >= btn.y && gy <= btn.y + btn.h) {
            this[key] = false;
          }
        }
      }
    };
    canvas.addEventListener('touchstart',  onStart, { passive: false });
    canvas.addEventListener('touchend',    onEnd,   { passive: false });
    canvas.addEventListener('touchcancel', onEnd,   { passive: false });
  }

  _onKey(e, down) {
    switch (e.code) {
      case 'ArrowLeft':  case 'KeyA': this.left  = down; break;
      case 'ArrowRight': case 'KeyD': this.right = down; break;
      case 'ArrowUp':    case 'KeyW': this.jump  = down; break;
      case 'Space':                   this.hit   = down; break;
    }
    if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
  }
}
