import { physicsStep } from './physics.js';

export class Game {
  constructor() {
    this._state = { phase: 'serving' };
  }

  get state() {
    return this._state;
  }

  update(dt) {
    if (this._state.phase === 'playing') {
      // physicsStep and scoring checks will be wired up in Phase 2
      // physicsStep(this._state, dt);
      // this._checkScoring();
    } else {
      // Phase timer updates (serving, point_scored, game_over) handled in future phases
    }
  }
}
