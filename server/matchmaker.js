// server/matchmaker.js — queue-based matchmaker; singleton exported at bottom
import { randomUUID } from 'node:crypto';
import { GameRoom } from './gameRoom.js';

class Matchmaker {
  constructor() {
    this._queue = []; // waiting WebSocket connections
  }

  // Add a player to the queue. If two are waiting, create a GameRoom.
  addPlayer(ws) {
    this._queue.push(ws);
    if (this._queue.length >= 2) {
      const ws0 = this._queue.shift();
      const ws1 = this._queue.shift();
      const roomId = randomUUID();
      const room = new GameRoom(roomId, ws0, ws1);
      // Attach room reference to both connections for message routing
      ws0._room        = room;
      ws0._playerIndex = 0;
      ws1._room        = room;
      ws1._playerIndex = 1;
      console.log(`[matchmaker] Room ${roomId} created`);
    }
  }

  // Remove from queue (no-op if already moved to a room)
  removePlayer(ws) {
    const idx = this._queue.indexOf(ws);
    if (idx !== -1) {
      this._queue.splice(idx, 1);
    }
  }
}

export const matchmaker = new Matchmaker();
