import {
  CANVAS_W, CANVAS_H,
  FLOOR_Y, NET_X, NET_W, NET_HEIGHT,
  BALL_RADIUS, PLAYER_W, PLAYER_H,
} from './physics.js';
import { TOUCH_BUTTONS } from './ui.js';

export class Renderer {
  draw(ctx, state) {
    // 1. Background
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. Floor
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
    ctx.strokeStyle = '#5a3e2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(CANVAS_W, FLOOR_Y);
    ctx.stroke();

    // 3. Net
    ctx.fillStyle = '#d4c4a0';
    ctx.fillRect(NET_X - NET_W / 2, FLOOR_Y - NET_HEIGHT, NET_W, NET_HEIGHT);

    // 4. Torch bodies
    ctx.fillStyle = '#5a3e2b';
    ctx.fillRect(30, 60, 16, 40);
    ctx.fillRect(762, 60, 16, 40);

    // 5 & 6. Torch flames and glow — left torch at (38, 58), right at (770, 58)
    const torches = [{ cx: 38, cy: 58 }, { cx: 770, cy: 58 }];
    for (const { cx, cy } of torches) {
      // Glow: radial gradient
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
      glow.addColorStop(0, 'rgba(255,107,26,0.25)');
      glow.addColorStop(1, 'rgba(255,107,26,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();

      // Outer flame
      ctx.fillStyle = '#ff6b1a';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      // Inner flame
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Ball
    ctx.fillStyle = '#e8d44d';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8a030';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 8. Players
    const playerColors = ['#4a7c3f', '#7c3f4a'];
    state.players.forEach((p, i) => {
      // Body
      ctx.fillStyle = playerColors[i];
      ctx.fillRect(p.x, p.y, PLAYER_W, PLAYER_H);

      // Eyes (white sclera)
      const eyePositions = [{ ex: p.x + 8, ey: p.y + 14 }, { ex: p.x + 28, ey: p.y + 14 }];
      for (const { ex, ey } of eyePositions) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (black, offset in facing direction)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(ex + 2 * p.facing, ey, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 9. Touch controls (touch devices only)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      for (const btn of Object.values(TOUCH_BUTTONS)) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
      }
      ctx.textBaseline = 'alphabetic';
    }
  }
}
