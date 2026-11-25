// input.js — mouse and keyboard for The Gilded Skillet. Every control is a
// hit-test against the same LAYOUT rectangles render.js draws with, so
// what you see is exactly what you can click. Keys mirror the mouse:
// 1–6 crates, SPACE chop, G grill, P plate/pass, T bin, ENTER serve,
// arrows choose the order ticket you are cooking for.

import { INGREDIENTS, INGREDIENT_ORDER } from './recipes.js';
import { LAYOUT } from './state.js';

function inRect(x, y, r) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function binRect(i) {
  return {
    x: LAYOUT.binX0 + i * (LAYOUT.binW + LAYOUT.binGap),
    y: LAYOUT.binsY + 14,
    w: LAYOUT.binW,
    h: LAYOUT.binH - 14,
  };
}

function burnerRect(i) {
  const s = LAYOUT.grill;
  return { x: s.x + 62 + i * 112 - 50, y: s.y + 72 - 50, w: 100, h: 116 };
}

export function attachInput(canvas, state, actions, sound) {
  const toGame = (ev) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  canvas.addEventListener('pointerdown', (ev) => {
    sound.unlock();
    const { x, y } = toGame(ev);
    if (state.screen === 'title') {
      if (inRect(x, y, state.ui.startBtn)) actions.startGame();
      return;
    }
    if (state.screen === 'dayEnd') {
      if (inRect(x, y, state.ui.nextBtn)) actions.nextDay();
      return;
    }
    if (state.screen === 'gameOver') {
      if (inRect(x, y, state.ui.againBtn)) actions.startGame();
      return;
    }
    // The SERVE button sits on the pass, so it is tested before the pass.
    if (inRect(x, y, state.ui.serveBtn)) { actions.serve(); return; }
    for (let i = 0; i < state.orders.length; i += 1) {
      if (inRect(x, y, state.orders[i]._rect)) { actions.selectOrder(i); return; }
    }
    for (let i = 0; i < INGREDIENT_ORDER.length; i += 1) {
      if (inRect(x, y, binRect(i))) { actions.pickIngredient(INGREDIENT_ORDER[i]); return; }
    }
    if (inRect(x, y, LAYOUT.chop)) { actions.useBoard(); return; }
    for (let i = 0; i < 2; i += 1) {
      if (inRect(x, y, burnerRect(i))) { actions.useGrill(i); return; }
    }
    if (inRect(x, y, LAYOUT.pass)) { actions.usePass(); return; }
    if (inRect(x, y, LAYOUT.trash)) { actions.useTrash(); return; }
  });

  window.addEventListener('keydown', (ev) => {
    sound.unlock();
    const key = ev.key;
    if (state.screen === 'title') {
      if (key === 'Enter' || key === ' ') { ev.preventDefault(); actions.startGame(); }
      return;
    }
    if (state.screen === 'dayEnd') {
      if (key === 'Enter') actions.nextDay();
      return;
    }
    if (state.screen === 'gameOver') {
      if (key === 'Enter' || key.toLowerCase() === 'r') actions.startGame();
      return;
    }
    const byKey = INGREDIENT_ORDER.find((id) => INGREDIENTS[id].key === key);
    if (byKey) { actions.pickIngredient(byKey); return; }
    switch (key) {
      case ' ':
        ev.preventDefault();
        actions.useBoard();
        break;
      case 'g': case 'G': actions.useGrillSmart(); break;
      case 'p': case 'P': actions.usePass(); break;
      case 't': case 'T': actions.useTrash(); break;
      case 'Enter': actions.serve(); break;
      case 'ArrowDown':
        ev.preventDefault();
        actions.selectOrder(Math.min(state.orders.length - 1, state.selectedOrder + 1));
        break;
      case 'ArrowUp':
        ev.preventDefault();
        actions.selectOrder(Math.max(0, state.selectedOrder - 1));
        break;
      default: break;
    }
  });
}
