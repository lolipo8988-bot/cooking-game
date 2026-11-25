# The Gilded Skillet — a cooking game

[![Competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/lolipo8988-bot/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/lolipo8988-bot/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An original cooking game built for the make.fun "Make the best cooking game" bounty. Take orders from the board, grab ingredients from the counter bins, chop on the board or grill on the stove (golden window — overcook and it burns), assemble each dish layer by layer at the pass, and serve for coins, tips and combos before patience runs out. Beat the shift timer and the rent goal to open the next day, with rising difficulty. Mouse and keyboard, fully offline, no dependencies.

- `game/` — the playable game as static files (`game/index.html` opens in desktop Chrome)
- `screenshots/` — real renders of the game taken in a browser
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` via `vendor/makefun-game.ts`
