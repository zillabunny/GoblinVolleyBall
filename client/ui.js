export const TOUCH_BUTTONS = {
  left:  { x: 10,  y: 290, w: 90, h: 90, label: '◀' },
  right: { x: 110, y: 290, w: 90, h: 90, label: '▶' },
  jump:  { x: 600, y: 200, w: 90, h: 90, label: '▲' },
  hit:   { x: 700, y: 290, w: 90, h: 90, label: '●' },
};

export class UI {
  constructor() {
    this._onlineMode = false;
  }

  // netStatus: optional — 'connecting'|'waiting'|'disconnected'|'closed'|null
  draw(ctx, state, netStatus = null) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(state.score[0], 200, 40);
    ctx.fillText(state.score[1], 600, 40);
    if (state.phase !== 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '16px monospace';
      ctx.fillText(state.phase, 400, 20);
    }
    if (state.phase === 'game_over') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, 800, 450);
      ctx.fillStyle = '#4aff4a';
      ctx.font = 'bold 48px monospace';
      ctx.fillText(`GOBLIN ${state.winner + 1} WINS!`, 400, 200);
      ctx.fillStyle = 'white';
      ctx.font = '24px monospace';
      if (this._onlineMode) {
        ctx.fillText('Click to return to lobby', 400, 260);
      } else {
        ctx.fillText('Press R to restart', 400, 260);
      }
    }

    // Network status overlays
    if (netStatus === 'connecting') {
      this._drawBanner(ctx, 'Connecting to server...');
    } else if (netStatus === 'waiting') {
      this._drawBanner(ctx, 'Waiting for opponent...');
    } else if (netStatus === 'disconnected') {
      this._drawBanner(ctx, 'Opponent disconnected — reconnecting (30s)...');
    } else if (netStatus === 'closed') {
      this._drawBanner(ctx, 'Connection lost. Please refresh.');
    }
  }

  _drawBanner(ctx, text) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 190, 800, 70);
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 400, 232);
  }
}
