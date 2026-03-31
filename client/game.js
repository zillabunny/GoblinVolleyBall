import { physicsStep } from './physics.js';

export class Game {
  constructor() {
    this._state = {
      phase: 'playing',
      ball: { x: 400, y: 100, vx: 200, vy: 0 },
    };
  }

  get state() {
    return this._state;
  }

  update(dt) {
    if (this._state.phase === 'playing') {
      physicsStep(this._state, dt);
    } else {
      // Phase timer updates (serving, point_scored, game_over) handled in future phases
    }
  }
}
