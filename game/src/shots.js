// shots.js — deterministic scenes for the maker's own screenshots. When
// the page is opened with ?shot=<name>, main.js stages one frozen moment
// of real play (real orders, a real half-built plate, a real cook ring)
// and stops the clock, so a headless browser can photograph the game's
// own rendering exactly as a player would see it mid-rush.

import { RECIPES } from './recipes.js';
import { startDay } from './state.js';

function order(recipeId, guest, patienceFrac) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id: recipeId, recipe, guest, patience: 60 * patienceFrac, patienceMax: 60 };
}

export function stageShot(state, name) {
  startDay(state, 1);
  state.chef = { x: 700, y: 252, tx: 700, ty: 252, moving: false };
  state.boardFlash = 0;
  state.ui = {};

  if (name === 'cover') {
    state.timeLeft = 83;
    state.coins = 47; state.score = 470; state.served = 3; state.combo = 2;
    state.orders = [order('ember', 'Coach Dan', 0.72), order('garden', 'Mabel', 0.45), order('sunrise', 'Suki', 0.88)];
    state.selectedOrder = 0;
    state.plate = [{ id: 'dough' }, { id: 'patty' }];       // Ember Burger, mid-assembly
    state.boardItem = { id: 'tomato', chops: 2 };            // halfway through chopping
    state.burners = [{ id: 'egg', cook: 0.62, cookTime: 2.6, warned: false }, null];
    state.hand = { id: 'lettuce', state: 'raw' };
    state.chef.x = 620;
    return true;
  }
  if (name === 'assemble') {
    state.timeLeft = 64;
    state.coins = 68; state.score = 820; state.served = 5; state.combo = 3;
    state.orders = [order('garden', 'Priya', 0.66), order('sunrise', 'Old Tom', 0.9)];
    state.selectedOrder = 0;
    state.plate = [{ id: 'dough' }, { id: 'tomato' }];       // Garden Melt, two layers in
    state.hand = { id: 'cheese', state: 'chopped' };         // next layer, in hand
    state.burners = [{ id: 'patty', cook: 1.12, cookTime: 2.6, warned: false }, null];
    state.chef.x = 880; state.chef.y = 258;
    return true;
  }
  if (name === 'serve') {
    state.timeLeft = 41;
    state.coins = 96; state.score = 1210; state.served = 7; state.combo = 4;
    state.orders = [order('ember', 'Captain Ilya', 0.58), order('ranch', 'Bea', 0.8)];
    state.selectedOrder = 0;
    state.plate = [{ id: 'dough' }, { id: 'patty' }, { id: 'lettuce' }, { id: 'cheese' }]; // ready!
    state.lastServe = { name: 'Garden Melt', coins: 19, tip: 5, t: 1.1 };
    state.boardItem = { id: 'cheese', chops: 4 };
    state.burners = [null, { id: 'egg', cook: 0.35, cookTime: 2.6, warned: false }];
    state.chef.x = 690; state.chef.y = 258;
    return true;
  }
  if (name === 'end') {
    state.timeLeft = 0;
    state.coins = 214; state.score = 2140; state.served = 11; state.bestCombo = 5;
    state.orders = [order('garden', 'Mabel', 0.5)];
    state.plate = [{ id: 'dough' }, { id: 'egg' }];
    state.burners = [{ id: 'patty', cook: 1.1, cookTime: 2.6, warned: false }, null];
    state.screen = 'dayEnd';
    return true;
  }
  return false;
}
