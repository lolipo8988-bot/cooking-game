// recipes.js — the menu of The Gilded Skillet: ingredients, how each one is
// prepared, and the dishes the order board can ask for. Pure data plus two
// small matching helpers; no drawing, no state.

// prep: 'none' goes straight on the plate, 'chop' needs the cutting board,
// 'grill' needs a burner and burns if it is left too long.
export const INGREDIENTS = {
  dough:   { id: 'dough',   name: 'Dough Round', prep: 'none',  color: '#e8c98a', key: '1' },
  tomato:  { id: 'tomato',  name: 'Tomato',      prep: 'chop',  color: '#d8442e', key: '2' },
  cheese:  { id: 'cheese',  name: 'Cheese',      prep: 'chop',  color: '#f2b63c', key: '3' },
  lettuce: { id: 'lettuce', name: 'Lettuce',     prep: 'chop',  color: '#6fbf4a', key: '4' },
  patty:   { id: 'patty',   name: 'Beef Patty',  prep: 'grill', color: '#8a5a33', key: '5' },
  egg:     { id: 'egg',     name: 'Egg',         prep: 'grill', color: '#f6ead2', key: '6' },
};

export const INGREDIENT_ORDER = ['dough', 'tomato', 'cheese', 'lettuce', 'patty', 'egg'];

// A recipe is the list of ingredient ids a finished plate must hold, in the
// order they are stacked. Price is what the till pays before any tip.
export const RECIPES = [
  { id: 'sunrise', name: 'Sunrise Stack',   price: 12, day: 1, items: ['dough', 'egg', 'cheese'] },
  { id: 'garden',  name: 'Garden Melt',     price: 14, day: 1, items: ['dough', 'tomato', 'cheese', 'lettuce'] },
  { id: 'ember',   name: 'Ember Burger',    price: 16, day: 1, items: ['dough', 'patty', 'lettuce', 'cheese'] },
  { id: 'ranch',   name: 'Ranch Hand Plate', price: 15, day: 2, items: ['patty', 'egg', 'tomato'] },
  { id: 'meadow',  name: 'Meadow Skillet',  price: 17, day: 2, items: ['lettuce', 'tomato', 'egg', 'cheese'] },
  { id: 'double',  name: 'Double Ember',    price: 21, day: 3, items: ['dough', 'patty', 'patty', 'cheese', 'tomato'] },
];

export function recipesForDay(day) {
  return RECIPES.filter((r) => r.day <= day);
}

// A plate is a list of {id, prep} layers. It matches a recipe when the ids
// line up exactly, layer for layer.
export function plateMatchesRecipe(plate, recipe) {
  if (!plate || plate.length !== recipe.items.length) return false;
  return recipe.items.every((id, i) => plate[i].id === id);
}

export function findRecipeForPlate(plate, recipes) {
  return recipes.find((r) => plateMatchesRecipe(plate, r)) ?? null;
}

// How far a half-built plate is toward a recipe: the length of the shared
// prefix, so the pass can tick off layers as they land.
export function plateProgressToward(plate, recipe) {
  let n = 0;
  while (n < plate.length && n < recipe.items.length && plate[n].id === recipe.items[n]) n += 1;
  return n;
}
