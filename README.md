# playing-solo

A short browser game about slot machines that feel like progress.

People in Hollow Ferry are spontaneously combusting. You had a fever dream where you almost burned too, and something saved you for some purpose, to do some thing, in some place, with some people, using some tactic, equipped with some psychic abilities. Each chapter fills in more of those blanks.

## How it plays

- **Mini-stages (3).** Every turn you spin a wheel. The wheel has a gold JACKPOT sliver, but the only real outcomes are −1 HP, −½ PP, or +1 PP (nothing if PP is full). After each spin you can spend 1 PP on a Psychic Push to cool the target's heat. Get their heat to 0 before your HP runs out.
- **Boss: SAINT JACKPOT, the Ethereal Corporeal.** A slot machine that shows near misses, a boss health bar that keeps shrinking, and a cashout meter stuck at 99-point-something. None of it is real. Keep spinning and see what happens.

### Chapter 2: The Haystack-Stack

The dead machine holds a security box locked behind 2-step verification. Your fob is dead and no longer supported. The only way in is an emergency release code you wrote on a piece of paper, somewhere across four cloud drives full of duplicates, `final_FINAL_v2` files, empty nested folders, and revoked codes. The box is being drained remotely the whole time.

- Opening a folder or file costs 2% of the box. Searching costs 3%. A wrong code costs 8% and 1 HP. The box also drains on its own.
- **Recall** (1 PP) gives you a memory hint, up to three times.
- Dig long enough and something else shows up to help. Read what it hands you before you approve it.
- What's left in the box when you open it decides how much of the prophecy you learn.

The code and its location change every run.

## Run it

No build step. Open `index.html` in a browser, or serve the folder with any static server:

```sh
python3 -m http.server
```

It also works on GitHub Pages from the repo root.

## License

GPL-3.0. See `LICENSE`.
