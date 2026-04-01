// client/network.js — WebSocket client for Phase 7 multiplayer
// Status values: 'idle' | 'connecting' | 'waiting' | 'playing' | 'disconnected' | 'closed'

export class NetworkClient {
  constructor() {
    this.status      = 'idle';
    this.playerIndex = null;
    this.roomId      = null;
    this.latestState = null;   // most-recent state_snapshot; consumed each frame by main loop
    this._ws         = null;
  }

  connect() {
    this.status = 'connecting';
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port  = (parseInt(location.port || '80', 10) + 1);
    const url   = `${proto}//${location.hostname}:${port}`;

    this._ws = new WebSocket(url);

    this._ws.addEventListener('open', () => {
      this.status = 'waiting';
    });

    this._ws.addEventListener('message', e => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      const { type, payload } = msg;

      if (type === 'match_found') {
        this.playerIndex = payload.playerIndex;
        this.roomId      = payload.roomId;
      } else if (type === 'game_start') {
        this.status      = 'playing';
        this.latestState = payload.state;
      } else if (type === 'state_snapshot') {
        this.latestState = payload.state;
      } else if (type === 'opponent_disconnected') {
        this.status = 'disconnected';
      } else if (type === 'game_over') {
        // state snapshot will carry phase:'game_over' — rendering handled by ui.js
        this.status = 'playing';
      }
    });

    this._ws.addEventListener('close', () => {
      if (this.status !== 'disconnected') this.status = 'closed';
    });

    this._ws.addEventListener('error', () => {
      this.status = 'closed';
    });
  }

  sendInput(keys) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify({ type: 'input', payload: { keys } }));
    }
  }

  disconnect() {
    this._ws?.close();
  }
}
