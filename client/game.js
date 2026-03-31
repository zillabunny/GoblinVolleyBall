import { physicsStep, FLOOR_Y, PLAYER_H, PLAYER_SPEED, JUMP_FORCE } from './physics.js';
import { InputState } from './input.js';

export function applyInput(player, input) {
  if (input.left)       { player.vx = -PLAYER_SPEED; player.facing = -1; }
  else if (input.right) { player.vx =  PLAYER_SPEED; player.facing =  1; }
  else                  { player.vx = 0; }

  if (input.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}

export class Game {
  constructor() {
    this._state = {
      phase: 'playing',
      ball: { x: 400, y: 100, vx: 200, vy: 0 },
      players: [
        { x: 80,  y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing:  1, lastTouchSeq: -1 },
        { x: 680, y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: -1, lastTouchSeq: -1 },
      ],
    };
    this._input = new InputState();
    this._input.bind();
  }

  get state() {
    return this._state;
  }

  update(dt) {
    if (this._state.phase === 'playing') {
      applyInput(this._state.players[0], this._input);
      physicsStep(this._state, dt);
    } else {
      // Phase timer updates (serving, point_scored, game_over) handled in future phases
    }
    this._input.tick();
  }
}
