// render.js — every pixel of The Gilded Skillet is drawn here, by hand, on
// a 2D canvas: the tiled kitchen wall, the chalk order board, the wooden
// counter with its ingredient crates, the cutting board, the two-burner
// grill, the assembly pass and a little chef who runs between stations.
// No images, no fonts to load — just shapes, gradients and patience bars.

import { INGREDIENTS, INGREDIENT_ORDER, plateProgressToward, plateMatchesRecipe } from './recipes.js';
import { LAYOUT, VIEW, dayConfig, totalGoal } from './state.js';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700 ' : ''}${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn at (x, y) with radius-ish scale s. state is
// 'raw' | 'chopped' | 'cooked' | 'burnt' and changes the drawing: sliced
// tomatoes, shredded lettuce, a fried egg, grill marks on the patty.
export function drawIngredient(ctx, id, prepState, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const burnt = prepState === 'burnt';
  if (id === 'dough') {
    ctx.fillStyle = burnt ? '#4a3421' : '#e8c98a';
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.25, s * 0.28, s * 0.14, -0.4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'tomato') {
    if (prepState === 'chopped') {
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillStyle = burnt ? '#3d2b23' : '#d8442e';
        ctx.beginPath(); ctx.ellipse(i * s * 0.5, Math.abs(i) * 2, s * 0.42, s * 0.55, i * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,180,160,0.7)';
        ctx.beginPath(); ctx.ellipse(i * s * 0.5, Math.abs(i) * 2, s * 0.2, s * 0.3, i * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = burnt ? '#3d2b23' : '#d8442e';
      ctx.beginPath(); ctx.arc(0, 1, s * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f7d2c';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.72, s * 0.34, s * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.25, s * 0.18, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'cheese') {
    if (prepState === 'chopped') {
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = burnt ? '#4c3a1e' : (i % 2 ? '#f2b63c' : '#f7c95c');
        rr(ctx, -s * 0.8 + i * 3, -s * 0.35 + i * 4, s * 1.6, s * 0.34, 3); ctx.fill();
      }
    } else {
      ctx.fillStyle = burnt ? '#4c3a1e' : '#f2b63c';
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.5); ctx.lineTo(s, s * 0.5); ctx.lineTo(s, -s * 0.15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(180,110,10,0.5)';
      ctx.beginPath(); ctx.arc(-s * 0.25, s * 0.22, s * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.4, s * 0.3, s * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = burnt ? '#33402a' : '#6fbf4a';
    if (prepState === 'chopped') {
      for (let i = 0; i < 5; i += 1) {
        ctx.save();
        ctx.rotate((i - 2) * 0.35);
        rr(ctx, -s * 0.12, -s * 0.7, s * 0.24, s * 1.3, s * 0.12); ctx.fill();
        ctx.restore();
      }
    } else {
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * s * 0.34, Math.sin(a) * s * 0.3, s * 0.5, s * 0.34, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8fd45e';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = burnt ? '#191008' : (prepState === 'cooked' ? '#6e4423' : '#a06a42');
    rr(ctx, -s * 0.95, -s * 0.52, s * 1.9, s * 1.04, s * 0.45); ctx.fill();
    if (prepState === 'cooked' && !burnt) {
      ctx.strokeStyle = 'rgba(30,16,6,0.65)';
      ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.moveTo(i * s * 0.5 - s * 0.3, -s * 0.42); ctx.lineTo(i * s * 0.5 + s * 0.1, s * 0.42); ctx.stroke();
      }
    }
    if (prepState === 'raw') {
      ctx.fillStyle = 'rgba(214,120,110,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'egg') {
    if (prepState === 'cooked' || burnt) {
      ctx.fillStyle = burnt ? '#2e2419' : '#fdf6e3';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.95, s * 0.72, 0.3, 0, Math.PI * 2);
      ctx.ellipse(s * 0.4, s * 0.3, s * 0.6, s * 0.45, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = burnt ? '#57431d' : '#f5a623';
      ctx.beginPath(); ctx.arc(s * 0.08, -s * 0.05, s * 0.4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#f6ead2';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(190,160,110,0.45)';
      ctx.beginPath(); ctx.ellipse(s * 0.18, s * 0.3, s * 0.3, s * 0.42, 0.3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// A finished (or half-built) plate: layers stacked from the bottom up.
export function drawPlateStack(ctx, plate, x, y, s) {
  ctx.fillStyle = '#e9e4da';
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.62, s * 1.5, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cfc8ba';
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.6, s * 1.14, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  plate.forEach((layer, i) => {
    drawIngredient(ctx, layer.id, layerStateOnPlate(layer), x, y + s * 0.42 - i * s * 0.26, s * 0.92);
  });
}

function layerStateOnPlate(layer) {
  const prep = INGREDIENTS[layer.id].prep;
  if (prep === 'chop') return 'chopped';
  if (prep === 'grill') return 'cooked';
  return 'raw';
}

function drawWall(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  g.addColorStop(0, '#7a4a2b');
  g.addColorStop(0.55, '#96603a');
  g.addColorStop(1, '#5d3a22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // Wall tiles behind the kitchen stations.
  ctx.fillStyle = '#e8dcc4';
  rr(ctx, 332, 84, 772, 196, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(150,120,80,0.35)';
  ctx.lineWidth = 1;
  for (let x = 332; x <= 1104; x += 64) { ctx.beginPath(); ctx.moveTo(x, 88); ctx.lineTo(x, 276); ctx.stroke(); }
  for (let y = 116; y <= 276; y += 32) { ctx.beginPath(); ctx.moveTo(336, y); ctx.lineTo(1100, y); ctx.stroke(); }
  // Shelf with jars and hanging pans.
  ctx.fillStyle = '#5d3a22';
  rr(ctx, 356, 128, 300, 10, 4); ctx.fill();
  const jarColors = ['#c94f30', '#e0a83c', '#7fae4c', '#b0526b'];
  jarColors.forEach((c, i) => {
    const jx = 380 + i * 66;
    ctx.fillStyle = 'rgba(240,240,235,0.85)';
    rr(ctx, jx, 96, 34, 32, 5); ctx.fill();
    ctx.fillStyle = c;
    rr(ctx, jx + 4, 106, 26, 18, 4); ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    rr(ctx, jx + 6, 90, 22, 8, 3); ctx.fill();
  });
  [730, 800, 870].forEach((px, i) => {
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, 92); ctx.lineTo(px, 112 + i * 4); ctx.stroke();
    ctx.fillStyle = '#4c4c52';
    ctx.beginPath(); ctx.arc(px, 138 + i * 4, 24 - i * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath(); ctx.arc(px - 6, 132 + i * 4, 9, 0, Math.PI * 2); ctx.fill();
  });
  // Two warm lamps.
  [470, 950].forEach((lx) => {
    const glow = ctx.createRadialGradient(lx, 96, 8, lx, 96, 120);
    glow.addColorStop(0, 'rgba(255,205,110,0.5)');
    glow.addColorStop(1, 'rgba(255,205,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 130, 0, 260, 240);
    ctx.strokeStyle = '#2c1c10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 64); ctx.lineTo(lx, 84); ctx.stroke();
    ctx.fillStyle = '#2c1c10';
    ctx.beginPath(); ctx.moveTo(lx - 20, 106); ctx.lineTo(lx + 20, 106); ctx.lineTo(lx + 9, 82); ctx.lineTo(lx - 9, 82); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd873';
    ctx.beginPath(); ctx.arc(lx, 104, 7, 0, Math.PI * 2); ctx.fill();
  });
  // Floor.
  ctx.fillStyle = '#4a2e1c';
  ctx.fillRect(0, 604, VIEW.w, 26);
  ctx.fillStyle = 'rgba(255,220,170,0.08)';
  for (let x = 0; x < VIEW.w; x += 56) ctx.fillRect(x, 604, 26, 26);
}

// ---- HUD: day, the big shift TIMER, coins, score, stars, goal -----------
function drawHud(ctx, state) {
  const { hud } = LAYOUT;
  ctx.fillStyle = '#221407';
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);
  ctx.fillStyle = '#c9973f';
  ctx.fillRect(0, hud.h - 3, hud.w, 3);
  text(ctx, 'THE GILDED SKILLET', 20, 32, 21, '#f3d9a4');
  text(ctx, `Day ${state.day}`, 268, 32, 19, '#ffffff');
  // Timer block: the one number the whole kitchen runs on.
  const cfg = dayConfig(state.day);
  const frac = Math.max(0, state.timeLeft / cfg.shiftSeconds);
  const urgent = state.timeLeft <= 20 && state.screen === 'play';
  ctx.fillStyle = urgent ? '#7e1f14' : '#3a2410';
  rr(ctx, 356, 8, 250, 48, 9); ctx.fill();
  const secs = Math.ceil(state.timeLeft);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  text(ctx, `TIMER ${clock}`, 481, 26, 21, urgent ? '#ffb3a0' : '#ffd873', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, 372, 42, 218, 8, 4); ctx.fill();
  ctx.fillStyle = urgent ? '#e2483a' : '#8fd45e';
  if (frac > 0) { rr(ctx, 372, 42, 218 * frac, 8, 4); ctx.fill(); }
  // Coins, score, and the day's rent goal.
  text(ctx, `Coins ${state.coins}`, 626, 21, 18, '#ffd873');
  text(ctx, `Score ${state.score}`, 626, 47, 15, '#ffffff');
  text(ctx, `Goal ${totalGoal(state.day)}`, 748, 20, 14, '#d9c9a8');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, 748, 31, 150, 9, 4); ctx.fill();
  const goalFrac = Math.min(1, state.coins / totalGoal(state.day));
  ctx.fillStyle = '#f2b63c';
  if (goalFrac > 0) { rr(ctx, 748, 31, 150 * goalFrac, 9, 4); ctx.fill(); }
  text(ctx, `Served ${state.served}`, 748, 52, 13.5, '#d9c9a8');
  // Reputation stars.
  for (let i = 0; i < 3; i += 1) {
    drawStar(ctx, 924 + i * 33, 21, 12, i < state.stars ? '#ffd23e' : 'rgba(255,255,255,0.22)');
  }
  if (state.combo >= 2) text(ctx, `COMBO x${state.combo}`, 1052, 47, 17, '#ff9d5c', 'center');
  else text(ctx, 'rush hour diner', 1052, 47, 12.5, '#a98f66', 'center');
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

// ---- Order board: chalkboard with pinned tickets -------------------------
function drawOrderBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#2e4638';
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 8;
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + b.w / 2, b.y + 28, 22, '#f3e9c8', 'center');
  ctx.strokeStyle = 'rgba(243,233,200,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(b.x + 18, b.y + 48); ctx.lineTo(b.x + b.w - 18, b.y + 48); ctx.stroke();
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet —', b.x + b.w / 2, b.y + 120, 17, '#cfe3d2', 'center');
    text(ctx, 'the bell will ring soon.', b.x + b.w / 2, b.y + 146, 17, '#cfe3d2', 'center');
  }
  state.orders.forEach((order, i) => {
    const tx = b.x + 16;
    const ty = b.y + 62 + i * 112;
    const tw = b.w - 32;
    const th = 102;
    const matches = state.plate.length > 0 && plateMatchesRecipe(state.plate, order.recipe);
    ctx.fillStyle = matches ? '#fff3c4' : '#f7efdb';
    rr(ctx, tx, ty, tw, th, 7); ctx.fill();
    if (i === state.selectedOrder || matches) {
      ctx.strokeStyle = matches ? '#e8a812' : '#c9973f';
      ctx.lineWidth = matches ? 4 : 2.5;
      rr(ctx, tx, ty, tw, th, 7); ctx.stroke();
    }
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(tx + tw / 2, ty + 7, 5, 0, Math.PI * 2); ctx.fill();
    text(ctx, order.recipe.name, tx + 12, ty + 24, 17, '#33241a');
    text(ctx, `${order.guest} · ${order.recipe.price}c`, tx + tw - 12, ty + 24, 14, '#7a5c33', 'right');
    // The layers this dish needs, ticked as the plate fills up.
    const progress = plateProgressToward(state.plate, order.recipe);
    order.recipe.items.forEach((id, j) => {
      const ix = tx + 30 + j * 46;
      const iy = ty + 56;
      ctx.fillStyle = j < progress ? '#dcefd2' : '#eee5cf';
      ctx.beginPath(); ctx.arc(ix, iy, 19, 0, Math.PI * 2); ctx.fill();
      drawIngredient(ctx, id, layerStateOnPlate({ id }), ix, iy, 13);
      if (j < progress) text(ctx, '✓', ix + 13, iy - 12, 14, '#3f7d2c', 'center');
      const prep = INGREDIENTS[id].prep;
      if (prep !== 'none') text(ctx, prep === 'chop' ? 'chop' : 'grill', ix, iy + 27, 10.5, '#8a6a45', 'center');
    });
    // Patience bar: green drains to red, and the tip drains with it.
    const pfrac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = '#ddd2ba';
    rr(ctx, tx + 12, ty + th - 14, tw - 24, 8, 4); ctx.fill();
    ctx.fillStyle = pfrac > 0.5 ? '#6fbf4a' : (pfrac > 0.25 ? '#f2b63c' : '#d8442e');
    if (pfrac > 0) { rr(ctx, tx + 12, ty + th - 14, (tw - 24) * pfrac, 8, 4); ctx.fill(); }
    order._rect = { x: tx, y: ty, w: tw, h: th };
  });
}

// ---- Stations: cutting board, grill, assembly pass, bins, trash ----------
function drawChopStation(ctx, state) {
  const s = LAYOUT.chop;
  ctx.fillStyle = '#a9743f';
  rr(ctx, s.x, s.y + 96, s.w, 44, 8); ctx.fill();
  ctx.fillStyle = '#caa06a';
  rr(ctx, s.x + 10, s.y + 30, s.w - 20, 74, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(90,55,25,0.5)'; ctx.lineWidth = 2;
  rr(ctx, s.x + 10, s.y + 30, s.w - 20, 74, 10); ctx.stroke();
  text(ctx, 'CUTTING BOARD', s.x + s.w / 2, s.y + 14, 14, '#ffe9bd', 'center');
  if (state.boardItem) {
    const flash = state.boardFlash > 0 ? Math.sin(state.boardFlash * 30) * 4 : 0;
    drawIngredient(ctx, state.boardItem.id, state.boardItem.chops >= state.chopsNeeded ? 'chopped' : 'raw', s.x + s.w / 2, s.y + 68 + flash * 0.2, 30);
    // Knife.
    ctx.save();
    ctx.translate(s.x + s.w / 2 + 44, s.y + 40 + flash);
    ctx.rotate(-0.5 + flash * 0.03);
    ctx.fillStyle = '#d9dde2';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 8); ctx.lineTo(4, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d3a22';
    rr(ctx, -16, -4, 18, 9, 4); ctx.fill();
    ctx.restore();
    for (let i = 0; i < state.chopsNeeded; i += 1) {
      ctx.fillStyle = i < state.boardItem.chops ? '#6fbf4a' : 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(s.x + s.w / 2 - 27 + i * 18, s.y + 116, 6, 0, Math.PI * 2); ctx.fill();
    }
    if (state.boardItem.chops < state.chopsNeeded) {
      text(ctx, 'Click board or tap SPACE to chop!', s.x + s.w / 2, s.y + 136, 12.5, '#ffe9bd', 'center');
    } else {
      text(ctx, 'Chopped! Click to take it.', s.x + s.w / 2, s.y + 136, 12.5, '#b7f29a', 'center');
    }
  } else {
    text(ctx, 'Bring tomato, cheese', s.x + s.w / 2, s.y + 58, 13, '#5d4020', 'center');
    text(ctx, 'or lettuce here', s.x + s.w / 2, s.y + 78, 13, '#5d4020', 'center');
  }
}

function drawGrillStation(ctx, state) {
  const s = LAYOUT.grill;
  ctx.fillStyle = '#3c3f45';
  rr(ctx, s.x, s.y + 26, s.w, 108, 12); ctx.fill();
  ctx.fillStyle = '#24262b';
  rr(ctx, s.x + 8, s.y + 34, s.w - 16, 74, 9); ctx.fill();
  text(ctx, 'GRILL — watch it, food burns!', s.x + s.w / 2, s.y + 12, 14, '#ffe9bd', 'center');
  state.burners.forEach((burner, i) => {
    const cx = s.x + 62 + i * 112;
    const cy = s.y + 68;
    ctx.fillStyle = '#101114';
    ctx.beginPath(); ctx.arc(cx, cy, 42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = burner ? '#e2483a' : '#555a63'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.stroke();
    if (burner) {
      const st = burner.burnt ? 'burnt' : (burner.cook >= 1 ? 'cooked' : 'raw');
      drawIngredient(ctx, burner.id, st, cx, cy, 26);
      // Cook ring: fills to gold at perfect, then races to the burn line.
      const frac = Math.min(1, burner.cook / 1.55);
      ctx.strokeStyle = burner.burnt ? '#d8442e' : (burner.cook >= 1 ? '#8fd45e' : '#f2b63c');
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, 47, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
      if (burner.burnt) {
        text(ctx, 'BURNT!', cx, cy + 56, 13, '#ff8a76', 'center');
        ctx.fillStyle = 'rgba(120,120,120,0.55)';
        ctx.beginPath(); ctx.arc(cx - 8, cy - 44, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 6, cy - 56, 10, 0, Math.PI * 2); ctx.fill();
      } else if (burner.cook >= 1) {
        text(ctx, 'READY — take it!', cx, cy + 56, 13, '#b7f29a', 'center');
      } else {
        text(ctx, 'cooking…', cx, cy + 56, 12, '#d9c9a8', 'center');
      }
    } else {
      text(ctx, 'empty', cx, cy + 2, 12, '#7c828c', 'center');
    }
  });
}

function drawPassStation(ctx, state) {
  const s = LAYOUT.pass;
  ctx.fillStyle = '#7c4f2a';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = '#96603a';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 9); ctx.fill();
  text(ctx, 'ASSEMBLY PASS', s.x + s.w / 2, s.y + 22, 15, '#ffe9bd', 'center');
  drawPlateStack(ctx, state.plate, s.x + 76, s.y + 84, 34);
  if (state.plate.length === 0) {
    text(ctx, 'empty plate —', s.x + 76, s.y + 148, 12.5, '#e8d3ac', 'center');
    text(ctx, 'click with food in hand', s.x + 180, s.y + 62, 13, '#ffe9bd', 'center');
    text(ctx, 'to stack a layer.', s.x + 180, s.y + 82, 13, '#ffe9bd', 'center');
  } else {
    const target = state.orders[state.selectedOrder] ?? state.orders[0];
    const names = state.plate.map((l) => INGREDIENTS[l.id].name.split(' ')[0]).join('+');
    text(ctx, names, s.x + 148, s.y + 58, 12, '#ffffff');
    const done = state.orders.find((o) => plateMatchesRecipe(state.plate, o.recipe));
    if (done) {
      const pulse = 0.75 + Math.sin(state.elapsed * 6) * 0.25;
      ctx.fillStyle = `rgba(111,191,74,${pulse})`;
      const btn = { x: s.x + 108, y: s.y + 96, w: 148, h: 46 };
      rr(ctx, btn.x, btn.y, btn.w, btn.h, 10); ctx.fill();
      text(ctx, 'SERVE IT! ▸', btn.x + btn.w / 2, btn.y + 24, 17, '#17300c', 'center');
      state.ui.serveBtn = btn;
    } else if (target) {
      const need = target.recipe.items[state.plate.length];
      text(ctx, need ? `next: ${INGREDIENTS[need].name}` : 'does not match…', s.x + 180, s.y + 108, 13.5, '#ffe9bd', 'center');
      text(ctx, 'empty-hand click scraps it', s.x + 180, s.y + 132, 11.5, '#d9b98a', 'center');
    }
  }
  // The last plate that went out, still steaming on the pass shelf.
  if (state.lastServe && state.lastServe.t < 3.4) {
    const ls = state.lastServe;
    ctx.fillStyle = 'rgba(34,20,7,0.85)';
    rr(ctx, s.x + 12, s.y - 40, s.w - 24, 34, 8); ctx.fill();
    text(ctx, `✓ ${ls.name} served — +${ls.coins}c (tip ${ls.tip})`, s.x + s.w / 2, s.y - 23, 14, '#b7f29a', 'center');
  }
}

function drawCounter(ctx, state) {
  ctx.fillStyle = '#6e4525';
  ctx.fillRect(332, LAYOUT.counterY - 8, 772, 168);
  ctx.fillStyle = '#845631';
  ctx.fillRect(332, LAYOUT.counterY - 8, 772, 14);
  text(ctx, 'INGREDIENTS ON THE COUNTER — click a crate (or press 1–6) to pick up', 700, LAYOUT.counterY + 8, 13.5, '#ffe9bd', 'center');
  INGREDIENT_ORDER.forEach((id, i) => {
    const bx = LAYOUT.binX0 + i * (LAYOUT.binW + LAYOUT.binGap);
    const by = LAYOUT.binsY + 14;
    const ing = INGREDIENTS[id];
    ctx.fillStyle = '#8a5a33';
    rr(ctx, bx, by, LAYOUT.binW, LAYOUT.binH - 14, 8); ctx.fill();
    ctx.fillStyle = '#a9743f';
    rr(ctx, bx + 5, by + 5, LAYOUT.binW - 10, 54, 6); ctx.fill();
    drawIngredient(ctx, id, 'raw', bx + LAYOUT.binW / 2, by + 32, 24);
    text(ctx, ing.name, bx + LAYOUT.binW / 2, by + 76, 13.5, '#ffffff', 'center');
    text(ctx, ing.prep === 'none' ? 'ready as-is' : (ing.prep === 'chop' ? 'needs chopping' : 'needs grilling'), bx + LAYOUT.binW / 2, by + 94, 11, '#e8d3ac', 'center');
    ctx.fillStyle = '#221407';
    ctx.beginPath(); ctx.arc(bx + 16, by + 16, 11, 0, Math.PI * 2); ctx.fill();
    text(ctx, ing.key, bx + 16, by + 17, 13, '#ffd873', 'center');
  });
  // Trash bin at the end of the counter.
  const t = LAYOUT.trash;
  ctx.fillStyle = '#565b63';
  rr(ctx, t.x, t.y + 24, t.w, t.h - 24, 8); ctx.fill();
  ctx.fillStyle = '#3c4046';
  rr(ctx, t.x - 4, t.y + 14, t.w + 8, 14, 6); ctx.fill();
  text(ctx, 'BIN', t.x + t.w / 2, t.y + 62, 15, '#ffffff', 'center');
  text(ctx, 'scrap food', t.x + t.w / 2, t.y + 82, 11, '#c9ced6', 'center');
}

function drawChef(ctx, state) {
  const c = state.chef;
  if (!c) return;
  ctx.save();
  ctx.translate(c.x, c.y + Math.sin(state.elapsed * 10) * (c.moving ? 2.2 : 0.6));
  // Body and apron.
  ctx.fillStyle = '#f4f1ea';
  rr(ctx, -17, -6, 34, 40, 10); ctx.fill();
  ctx.fillStyle = '#c94f30';
  rr(ctx, -17, 12, 34, 22, 8); ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f0c297';
  ctx.beginPath(); ctx.arc(0, -22, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-9, -36, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -41, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -36, 8, 0, Math.PI * 2); ctx.fill();
  rr(ctx, -11, -33, 22, 7, 3); ctx.fill();
  ctx.fillStyle = '#33241a';
  ctx.beginPath(); ctx.arc(-5, -22, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -22, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#33241a'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -17, 6, 0.25, Math.PI - 0.25); ctx.stroke();
  ctx.restore();
  // Whatever the chef is carrying floats by the hand.
  if (state.hand) {
    drawIngredient(ctx, state.hand.id, state.hand.state, c.x + 30, c.y + 4, 15);
    const label = INGREDIENTS[state.hand.id].name;
    ctx.fillStyle = 'rgba(34,20,7,0.82)';
    rr(ctx, c.x + 30 - label.length * 4.4 - 7, c.y - 30, label.length * 8.8 + 14, 19, 6); ctx.fill();
    text(ctx, label, c.x + 30, c.y - 20, 11.5, '#ffe9bd', 'center');
  }
}

// ---- Overlays: title, day end, game over ----------------------------------
function panel(ctx, w, h) {
  const x = (VIEW.w - w) / 2;
  const y = (VIEW.h - h) / 2;
  ctx.fillStyle = 'rgba(20,10,4,0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#f7efdb';
  rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = '#c9973f'; ctx.lineWidth = 4;
  rr(ctx, x, y, w, h, 16); ctx.stroke();
  return { x, y, w, h };
}

function button(ctx, state, key, x, y, w, h, label, color = '#6fbf4a') {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, 10); ctx.fill();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 18, '#17300c', 'center');
  state.ui[key] = { x, y, w, h };
}

function drawTitle(ctx, state) {
  const p = panel(ctx, 640, 470);
  text(ctx, 'THE GILDED SKILLET', p.x + p.w / 2, p.y + 52, 40, '#7c2d12', 'center');
  text(ctx, 'a rush-hour cooking game', p.x + p.w / 2, p.y + 88, 18, '#8a5a33', 'center');
  drawPlateStack(ctx, [{ id: 'dough' }, { id: 'patty' }, { id: 'lettuce' }, { id: 'cheese' }], p.x + p.w / 2, p.y + 128, 30);
  const lines = [
    'Orders land on the board — build each dish layer by layer.',
    'Pick ingredients from the counter crates (keys 1–6).',
    'Chop tomato, cheese and lettuce on the cutting board.',
    'Grill patties and eggs — take them off golden, not burnt!',
    'Stack the plate on the pass in order, then SERVE for coins + tip.',
    'Watch the TIMER and the patience bars. Three walk-outs ends the run.',
  ];
  lines.forEach((line, i) => text(ctx, line, p.x + p.w / 2, p.y + 196 + i * 27, 16.5, '#4a3220', 'center'));
  button(ctx, state, 'startBtn', p.x + p.w / 2 - 130, p.y + 386, 260, 54, 'OPEN THE KITCHEN ▸');
  text(ctx, 'Mouse + keyboard · sound on first click', p.x + p.w / 2, p.y + 458 - 12, 13, '#8a6a45', 'center');
}

function drawDayEnd(ctx, state) {
  const p = panel(ctx, 560, 420);
  text(ctx, `DAY ${state.day} DONE!`, p.x + p.w / 2, p.y + 54, 34, '#7c2d12', 'center');
  text(ctx, 'The last ticket is served and the grill cools down.', p.x + p.w / 2, p.y + 92, 16, '#8a5a33', 'center');
  const rows = [
    ['Coins in the till', `${state.coins}`],
    ['Score', `${state.score}`],
    ['Dishes served', `${state.served}`],
    ['Best combo', `x${state.bestCombo}`],
    ['Stars kept', '★'.repeat(Math.max(0, state.stars)) || '—'],
  ];
  rows.forEach((row, i) => {
    text(ctx, row[0], p.x + 90, p.y + 140 + i * 36, 18, '#4a3220');
    text(ctx, row[1], p.x + p.w - 90, p.y + 140 + i * 36, 18, '#7c2d12', 'right');
  });
  button(ctx, state, 'nextBtn', p.x + p.w / 2 - 130, p.y + 336, 260, 54, `START DAY ${state.day + 1} ▸`);
}

function drawGameOver(ctx, state) {
  const p = panel(ctx, 560, 420);
  text(ctx, 'KITCHEN CLOSED', p.x + p.w / 2, p.y + 54, 34, '#7e1f14', 'center');
  const why = state.stars <= 0
    ? 'Too many guests walked out hungry.'
    : `The shift ended short of the ${totalGoal(state.day)}-coin goal.`;
  text(ctx, why, p.x + p.w / 2, p.y + 92, 16.5, '#8a5a33', 'center');
  const rows = [
    ['Days survived', `${state.day}`],
    ['Coins earned', `${state.coins}`],
    ['Final score', `${state.score}`],
    ['Dishes served', `${state.served}`],
    ['Orders lost', `${state.lost}`],
  ];
  rows.forEach((row, i) => {
    text(ctx, row[0], p.x + 90, p.y + 140 + i * 36, 18, '#4a3220');
    text(ctx, row[1], p.x + p.w - 90, p.y + 140 + i * 36, 18, '#7c2d12', 'right');
  });
  button(ctx, state, 'againBtn', p.x + p.w / 2 - 130, p.y + 336, 260, 54, 'PLAY AGAIN ▸', '#f2b63c');
}

// ---- The whole frame -------------------------------------------------------
export function drawScene(ctx, state) {
  state.ui = state.ui || {};
  if (state.screen === 'play') state.ui.serveBtn = null;
  ctx.save();
  if (state.shake > 0) ctx.translate((Math.random() - 0.5) * 6 * state.shake, (Math.random() - 0.5) * 4 * state.shake);
  drawWall(ctx);
  drawOrderBoard(ctx, state);
  drawChopStation(ctx, state);
  drawGrillStation(ctx, state);
  drawPassStation(ctx, state);
  drawCounter(ctx, state);
  drawChef(ctx, state);
  drawHud(ctx, state);
  if (state.toast && state.toastT > 0) {
    ctx.fillStyle = 'rgba(34,20,7,0.92)';
    const tw = Math.max(300, state.toast.length * 9.4 + 40);
    rr(ctx, (VIEW.w - tw) / 2, 76, tw, 36, 9); ctx.fill();
    text(ctx, state.toast, VIEW.w / 2, 95, 16.5, '#ffd873', 'center');
  }
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
    text(ctx, f.text, f.x, f.y, 19, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'dayEnd') drawDayEnd(ctx, state);
  else if (state.screen === 'gameOver') drawGameOver(ctx, state);
}
