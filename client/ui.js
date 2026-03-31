export class UI {
  draw(ctx, state) {
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
      ctx.fillText('Press R to restart', 400, 260);
    }
  }
}
