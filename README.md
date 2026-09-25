# playing-solo

A short browser game about slot machines that feel like progress.

People in Hollow Ferry are spontaneously combusting. You had a fever dream where you almost burned too, and something saved you for some purpose, to do some thing, in some place, with some people, using some tactic, equipped with some psychic abilities. Chapter 1 fills in some of those blanks.

## How it plays

- **Mini-stages (3).** Every turn you spin a wheel. The wheel has a gold JACKPOT sliver, but the only real outcomes are −1 HP, −½ PP, or +1 PP (nothing if PP is full). After each spin you can spend 1 PP on a Psychic Push to cool the target's heat. Get their heat to 0 before your HP runs out.
- **Boss: SAINT JACKPOT, the Ethereal Corporeal.** A slot machine that shows near misses, a boss health bar that keeps shrinking, and a cashout meter stuck at 99-point-something. None of it is real. Keep spinning and see what happens.

## Run it

No build step. Open `index.html` in a browser, or serve the folder with any static server:

```sh
python3 -m http.server
```

It also works on GitHub Pages from the repo root.

## License

GPL-3.0. See `LICENSE`.
