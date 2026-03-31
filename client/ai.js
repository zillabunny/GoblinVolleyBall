import { FLOOR_Y, HIT_RADIUS, HIT_MIN_DIST, NET_X, NET_W, PLAYER_W, PLAYER_H, PLAYER_SPEED } from './physics.js';

export const AI_PARAMS = {
  speedFactor:    0.92,
  reactionDelay:  0.13,
  errorRange:     28,
  jumpThreshold:  FLOOR_Y - 160,
  hitThreshold:   HIT_RADIUS,
  ballVelMinJump: 30,
};

export class AIController {
  constructor() {
    this._timer      = 0;
    this._targetX    = 400;
    this._wasInRange = false;
  }

  update(dt, player, ball, state) {
    const input = { left: false, right: false, jump: false, hit: false,
                    hitPressed: false, _hitPrev: false };

    this._timer -= dt;
    if (this._timer <= 0) {
      this._timer = AI_PARAMS.reactionDelay;
      if (ball.x < NET_X) {
        // Ball on opponent's side — hold neutral defensive position
        this._targetX = 580;
      } else {
        const error   = (Math.random() * 2 - 1) * AI_PARAMS.errorRange;
        this._targetX = Math.max(NET_X + NET_W / 2,
                        Math.min(800 - PLAYER_W, ball.x - PLAYER_W / 2 + error));
      }
    }

    const dx = this._targetX - player.x;
    if (Math.abs(dx) > 4) {
      input.left  = dx < 0;
      input.right = dx > 0;
    }

    if (ball.x > NET_X &&
        ball.y < AI_PARAMS.jumpThreshold &&
        ball.vx >= AI_PARAMS.ballVelMinJump &&
        player.onGround) {
      input.jump = true;
    }

    const pcx     = player.x + PLAYER_W / 2;
    const pcy     = player.y + PLAYER_H / 2;
    const dist    = Math.hypot(ball.x - pcx, ball.y - pcy);
    const inRange = dist <= AI_PARAMS.hitThreshold && dist >= HIT_MIN_DIST;
    input.hitPressed = inRange && !this._wasInRange;
    input.hit        = inRange;
    this._wasInRange = inRange;

    return input;
  }
}
