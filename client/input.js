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
