// main.js — The Gilded Skillet's kitchen logic: what every click and key
// does (pick up, chop, grill, stack, serve, scrap), the chef who runs to
// the station you used, and the frame loop that ties state, rendering,
// input and sound together. The rules of the dishes live in recipes.js;
// the facts of the shift live in state.js.

import { INGREDIENTS, findRecipeForPlate } from './recipes.js';
import { SoundKitchen } from './audio.js';
import { createState, startDay, tickState, setToast, LAYOUT } from './state.js';
import { drawScene } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const sound = new SoundKitchen();
const state = createState();
state.chef = { x: LAYOUT.chefHome.x, y: LAYOUT.chefHome.y, tx: LAYOUT.chefHome.x, ty: LAYOUT.chefHome.y, moving: false };
state.boardFlash = 0;
state.ui = {};

const rng = Math.random;

function sendChefTo(x, y) {
  state.chef.tx = x;
  state.chef.ty = y;
}

function announce(msg) {
  if (status) status.textContent = msg;
}

function floater(x, y, text, color = '#ffd873') {
  state.floaters.push({ x, y, text, t: 0, color });
}

// What state a held item must be in before it may go on a plate.
function neededState(id) {
  const prep = INGREDIENTS[id].prep;
  if (prep === 'chop') return 'chopped';
  if (prep === 'grill') return 'cooked';
  return 'raw';
}

const actions = {
  startGame() {
    Object.assign(state, createState(), { chef: state.chef, ui: state.ui, boardFlash: 0 });
    startDay(state, 1);
    sound.till();
    announce('Day 1. Orders are coming in!');
  },

  nextDay() {
    startDay(state, state.day + 1);
    sound.bell();
    setToast(state, `Day ${state.day}: new dishes on the board, faster tickets!`);
  },

  pickIngredient(id) {
    const i = INGREDIENT_ORDER_INDEX[id];
    sendChefTo(LAYOUT.binX0 + i * (LAYOUT.binW + LAYOUT.binGap) + 52, 452);
    if (state.hand) { setToast(state, 'Hands full! Use or bin what you are holding.'); sound.groan(); return; }
    state.hand = { id, state: 'raw' };
    sound.pickup();
  },

  useBoard() {
    sendChefTo(LAYOUT.chop.x + 100, 268);
    if (state.boardItem) {
      const item = state.boardItem;
      if (state.hand) { setToast(state, 'Hands full — the board has to wait.'); return; }
      if (item.chops >= state.chopsNeeded) {
        state.hand = { id: item.id, state: 'chopped' };
        state.boardItem = null;
        sound.pickup();
      } else {
        item.chops += 1;
        state.boardFlash = 0.22;
        sound.chop();
        if (item.chops >= state.chopsNeeded) setToast(state, `${INGREDIENTS[item.id].name} chopped and ready!`);
      }
      return;
    }
    if (!state.hand) { setToast(state, 'Pick up a tomato, cheese or lettuce first.'); return; }
    if (INGREDIENTS[state.hand.id].prep !== 'chop' || state.hand.state !== 'raw') {
      setToast(state, 'That does not belong on the cutting board.');
      sound.groan();
      return;
    }
    state.boardItem = { id: state.hand.id, chops: 0 };
    state.hand = null;
    sound.place();
  },

  useGrill(i) {
    sendChefTo(LAYOUT.grill.x + 62 + i * 112, 268);
    const burner = state.burners[i];
    if (burner) {
      if (state.hand) { setToast(state, 'Hands full — nowhere to put that.'); return; }
      if (burner.burnt) {
        state.hand = { id: burner.id, state: 'burnt' };
        state.burners[i] = null;
        setToast(state, 'Burnt! Bin it with T or a click on the BIN.');
        sound.burnt();
      } else if (burner.cook >= 1) {
        state.hand = { id: burner.id, state: 'cooked' };
        state.burners[i] = null;
        sound.cooked();
      } else {
        setToast(state, 'Still cooking — gold ring means ready.');
      }
      return;
    }
    if (!state.hand) { setToast(state, 'Bring a patty or an egg to the grill.'); return; }
    if (INGREDIENTS[state.hand.id].prep !== 'grill' || state.hand.state !== 'raw') {
      setToast(state, 'That does not go on the grill.');
      sound.groan();
      return;
    }
    state.burners[i] = { id: state.hand.id, cook: 0, cookTime: 2.4 + rng() * 0.8, warned: false };
    state.hand = null;
    sound.sizzle();
  },

  useGrillSmart() {
    // G key: take a finished item first, else use the first free burner.
    for (let i = 0; i < 2; i += 1) {
      const b = state.burners[i];
      if (b && (b.cook >= 1 || b.burnt) && !state.hand) { actions.useGrill(i); return; }
    }
    for (let i = 0; i < 2; i += 1) {
      if (!state.burners[i]) { actions.useGrill(i); return; }
    }
    if (state.burners[0]) actions.useGrill(0);
  },

  usePass() {
    sendChefTo(LAYOUT.pass.x + 90, 268);
    if (!state.hand) {
      if (state.plate.length > 0) {
        state.plate = [];
        sound.trash();
        setToast(state, 'Plate scrapped. Fresh plate, fresh start.');
      } else {
        setToast(state, 'The pass is where finished plates go out.');
      }
      return;
    }
    if (state.hand.state === 'burnt') { setToast(state, 'Burnt food never reaches a plate — bin it.'); sound.groan(); return; }
    if (state.hand.state !== neededState(state.hand.id)) {
      const prep = INGREDIENTS[state.hand.id].prep;
      setToast(state, prep === 'chop' ? 'Chop it on the board first!' : 'Grill it first — and catch it golden!');
      sound.groan();
      return;
    }
    state.plate.push({ id: state.hand.id });
    state.hand = null;
    sound.plate();
    const done = findRecipeForPlate(state.plate, state.orders.map((o) => o.recipe));
    if (done) setToast(state, `${done.name} complete — hit SERVE!`);
  },

  useTrash() {
    sendChefTo(LAYOUT.trash.x + 47, 452);
    if (state.hand) { state.hand = null; sound.trash(); return; }
    if (state.boardItem) { state.boardItem = null; sound.trash(); return; }
    if (state.plate.length > 0) { state.plate = []; sound.trash(); }
  },

  selectOrder(i) {
    if (i < 0 || i >= state.orders.length) return;
    state.selectedOrder = i;
    const order = state.orders[i];
    if (state.plate.length > 0 && findRecipeForPlate(state.plate, [order.recipe])) actions.serve();
  },

  serve() {
    const idx = state.orders.findIndex((o) => findRecipeForPlate(state.plate, [o.recipe]));
    if (idx === -1) {
      if (state.plate.length > 0) setToast(state, 'No ticket matches that plate yet.');
      return;
    }
    const order = state.orders[idx];
    const patienceFrac = Math.max(0, order.patience / order.patienceMax);
    const tip = Math.round(order.recipe.price * 0.6 * patienceFrac);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const comboBonus = Math.min(8, (state.combo - 1) * 2);
    const earned = order.recipe.price + tip + comboBonus;
    state.coins += earned;
    state.dayEarned += earned;
    state.score += earned * 10 + state.combo * 5;
    state.served += 1;
    state.lastServe = { name: order.recipe.name, coins: earned, tip, t: 0 };
    state.orders.splice(idx, 1);
    state.selectedOrder = Math.max(0, Math.min(state.selectedOrder, state.orders.length - 1));
    state.plate = [];
    sendChefTo(LAYOUT.pass.x + 200, 268);
    sound.bell();
    sound.till();
    floater(LAYOUT.pass.x + 140, LAYOUT.pass.y - 14, `+${earned} coins`, '#b7f29a');
    announce(`Served ${order.recipe.name} for ${earned} coins.`);
  },
};

const INGREDIENT_ORDER_INDEX = {};
['dough', 'tomato', 'cheese', 'lettuce', 'patty', 'egg'].forEach((id, i) => { INGREDIENT_ORDER_INDEX[id] = i; });

// ---- Frame loop -------------------------------------------------------------
const shotName = new URLSearchParams(location.search).get('shot');
const shotMode = shotName ? stageShot(state, shotName) : false;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode) {
    const prevScreen = state.screen;
    tickState(state, dt, rng);
    if (state.screen !== prevScreen && state.screen === 'dayEnd') sound.dayEnd();
    if (state.screen !== prevScreen && state.screen === 'gameOver') sound.groan();
    // Warn once when a burner crosses into burnt.
    for (const b of state.burners) {
      if (b && b.burnt && !b.warned) {
        b.warned = true;
        sound.burnt();
        setToast(state, 'Something is burning on the grill!');
        state.shake = Math.max(state.shake, 0.5);
      }
    }
    if (state.lastServe) state.lastServe.t += dt;
    if (state.boardFlash > 0) state.boardFlash = Math.max(0, state.boardFlash - dt);
    // The chef hurries to wherever the player last worked.
    const c = state.chef;
    const dx = c.tx - c.x;
    const dy = c.ty - c.y;
    const dist = Math.hypot(dx, dy);
    c.moving = dist > 4;
    if (c.moving) {
      const step = Math.min(dist, 460 * dt);
      c.x += (dx / dist) * step;
      c.y += (dy / dist) * step;
    }
  }
  drawScene(ctx, state);
  window.__skilletState = state;
  if (shotMode && !window.__skilletReady) {
    window.__skilletReady = true;
  }
  requestAnimationFrame(frame);
}

attachInput(canvas, state, actions, sound);
requestAnimationFrame(frame);
