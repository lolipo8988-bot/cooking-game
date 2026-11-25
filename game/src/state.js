// state.js — the whole mutable game in one object, plus the rules that
// advance it: days, order spawning, patience and the shift clock. Rendering
// and input live elsewhere; this file only knows the kitchen's facts.

import { recipesForDay } from './recipes.js';

// Canvas geometry, shared by render.js and input.js so a click always
// lands on the station that was drawn there.
export const VIEW = { w: 1120, h: 630 };
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1120, h: 64 },
  board: { x: 16, y: 84, w: 300, h: 530 },          // order board, left
  counterY: 470,                                     // front counter top edge
  binsY: 486,
  binW: 96, binH: 118, binGap: 8, binX0: 348,
  chop: { x: 348, y: 300, w: 200, h: 140 },
  grill: { x: 572, y: 300, w: 236, h: 140 },
  pass: { x: 832, y: 286, w: 272, h: 168 },
  trash: { x: 1010, y: 486, w: 94, h: 118 },
  chefHome: { x: 660, y: 250 },
};

export function dayConfig(day) {
  return {
    day,
    shiftSeconds: 110 + Math.min(40, day * 5),
    spawnEvery: Math.max(5.5, 11 - day * 1.1),
    patience: Math.max(34, 62 - day * 5),
    goal: 55 + day * 45,
    maxOrders: day >= 3 ? 4 : 3,
  };
}

let orderSeq = 0;

export function makeOrder(state, rng) {
  const menu = recipesForDay(state.day);
  const recipe = menu[Math.floor(rng() * menu.length)];
  const cfg = dayConfig(state.day);
  orderSeq += 1;
  return {
    id: orderSeq,
    recipe,
    patience: cfg.patience,
    patienceMax: cfg.patience,
    guest: GUEST_NAMES[Math.floor(rng() * GUEST_NAMES.length)],
  };
}

export const GUEST_NAMES = [
  'Mabel', 'Old Tom', 'Priya', 'Coach Dan', 'Aunt Rosa', 'Felix',
  'Nurse Joy', 'Captain Ilya', 'Bea', 'Mr. Okafor', 'Suki', 'Grandpa Hal',
];

export function createState() {
  return {
    screen: 'title', // title | play | dayEnd | gameOver
    day: 1,
    timeLeft: dayConfig(1).shiftSeconds,
    coins: 0,
    score: 0,
    served: 0,
    lost: 0,
    stars: 3,
    combo: 0,
    bestCombo: 0,
    dayEarned: 0,
    orders: [],
    spawnIn: 1.2,
    hand: null,            // {id, state:'raw'|'chopped'|'cooked'|'burnt'}
    boardItem: null,       // {id, chops} on the cutting board
    chopsNeeded: 4,
    burners: [null, null], // {id, cook:0..1, burnt:bool}
    plate: [],             // [{id}] layers stacked on the pass plate
    selectedOrder: 0,
    toast: '',
    toastT: 0,
    shake: 0,
    floaters: [],          // {x,y,text,t,color}
    lastServe: null,       // summary of the last served dish, for the pass
    elapsed: 0,
  };
}

export function startDay(state, day) {
  const cfg = dayConfig(day);
  state.day = day;
  state.timeLeft = cfg.shiftSeconds;
  state.orders = [];
  state.spawnIn = 0.8;
  state.hand = null;
  state.boardItem = null;
  state.burners = [null, null];
  state.plate = [];
  state.dayEarned = 0;
  state.screen = 'play';
}

export function setToast(state, text, seconds = 2.2) {
  state.toast = text;
  state.toastT = seconds;
}

// Advance orders, patience, the clock and the floaters. Returns nothing;
// screen changes (day end, game over) are applied to state directly.
export function tickState(state, dt, rng) {
  state.elapsed += dt;
  if (state.toastT > 0) state.toastT = Math.max(0, state.toastT - dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);
  for (const f of state.floaters) { f.t += dt; f.y -= dt * 34; }
  state.floaters = state.floaters.filter((f) => f.t < 1.4);
  if (state.screen !== 'play') return;

  state.timeLeft -= dt;
  const cfg = dayConfig(state.day);

  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < cfg.maxOrders) {
    state.orders.push(makeOrder(state, rng));
    state.spawnIn = cfg.spawnEvery * (0.75 + rng() * 0.5);
  }

  for (const order of state.orders) order.patience -= dt;
  const expired = state.orders.filter((o) => o.patience <= 0);
  if (expired.length > 0) {
    state.orders = state.orders.filter((o) => o.patience > 0);
    for (const _gone of expired) {
      state.stars -= 1;
      state.lost += 1;
      state.combo = 0;
      setToast(state, 'An order walked out! Mind the patience bars.');
    }
    state.shake = 1;
    if (state.stars <= 0) {
      state.screen = 'gameOver';
      return;
    }
  }

  for (const burner of state.burners) {
    if (!burner) continue;
    if (!burner.burnt) {
      burner.cook += dt / burner.cookTime;
      if (burner.cook >= 1.55) burner.burnt = true;
    }
  }

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = state.coins >= totalGoal(state.day) ? 'dayEnd' : 'gameOver';
  }
}

// Coins needed, summed over the days played so far, to keep the doors open.
export function totalGoal(day) {
  let sum = 0;
  for (let d = 1; d <= day; d += 1) sum += dayConfig(d).goal;
  return sum;
}
