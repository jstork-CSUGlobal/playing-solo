'use strict';

/* =========================================================================
   PLAYING SOLO · Chapter 1: Kindling
   Mini-stages are wheel spins that never pay out anything good.
   The boss is a slot machine that is rigged, and the code says so.
   ========================================================================= */

const MAX_HP = 10;
const MAX_PP = 5;
const START_PP = 3;
const REST_HEAL = 2;

const state = {
  hp: MAX_HP,
  pp: START_PP,
  stage: 0,
  saved: [],
  wheelRot: 0,
  boss: null,
};

/* ---------- helpers ---------- */

const $ = (sel) => document.querySelector(sel);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const fmtPP = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function weighted(list) {
  const total = list.reduce((sum, it) => sum + it.weight, 0);
  let r = Math.random() * total;
  for (const it of list) {
    r -= it.weight;
    if (r < 0) return it.key;
  }
  return list[list.length - 1].key;
}

function hud() {
  $('#hp-bar').style.width = (state.hp / MAX_HP) * 100 + '%';
  $('#pp-bar').style.width = (state.pp / MAX_PP) * 100 + '%';
  $('#hp-text').textContent = `${state.hp}/${MAX_HP}`;
  $('#pp-text').textContent = `${fmtPP(state.pp)}/${MAX_PP}`;
}

function log(msg, cls = '') {
  const p = document.createElement('p');
  if (cls) p.className = cls;
  p.innerHTML = msg;
  const el = $('#log');
  el.prepend(p);
  while (el.children.length > 40) el.lastChild.remove();
}

function show(html) {
  $('#stage').innerHTML = html;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function storyScene({ kicker, title, body, extra = '', button, next }) {
  show(`
    <article class="story">
      ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
      <h2>${title}</h2>
      ${body.map((p) => `<p>${p}</p>`).join('')}
      ${extra}
      <div class="actions"><button class="primary" id="next">${button}</button></div>
    </article>`);
  $('#next').onclick = next;
}

/* ---------- the prophecy (a fever dream with a lot of blanks) ---------- */

function prophecy(revealed) {
  const people = state.saved.length ? state.saved.join(', ') : null;
  const rows = [
    ['some purpose', revealed && 'to stop the town from burning'],
    ['to do some thing', revealed && 'break the House'],
    ['in some place', null],
    ['with some people', revealed && people],
    ['using some tactic', revealed && 'reading between the reels'],
    ['equipped with some psychic abilities', revealed && 'Psychic Push · Read between the Reels (Novice)'],
  ];
  return `<ul class="prophecy">${rows
    .map(([blank, answer]) => {
      if (answer) return `<li><s>${blank}</s> ${answer}</li>`;
      if (revealed) return `<li>${blank} <em>(the fever won't say yet)</em></li>`;
      return `<li>${blank}</li>`;
    })
    .join('')}</ul>`;
}

/* =========================================================================
   INTRO
   ========================================================================= */

function intro() {
  Object.assign(state, { hp: MAX_HP, pp: START_PP, stage: 0, saved: [], boss: null });
  $('#log').innerHTML = '';
  hud();
  storyScene({
    kicker: 'Chapter 1: Kindling',
    title: 'The Fever Dream',
    body: [
      'Three people in Hollow Ferry caught fire this week. No match, no stove, no reason. A flash, a pop, and a scorch mark shaped like a person sitting down.',
      'Last night you dreamed you were the fourth. Heat crawled up your ribs. Your hands glowed like toaster coils. Under the roar you could hear something small and mechanical: <em>ka-chunk, ka-chunk, ka-chunk</em>, like reels settling into place.',
      'Then something caught you. Not a hand. A thought that wasn\'t yours, saying <em>not yet</em>. It told you that you were saved:',
    ],
    extra: prophecy(false) +
      '<p>The dream was very confident and extremely vague.</p>' +
      `<p>You wake up soaked, with ${START_PP} PP humming behind your eyes and a strong feeling that you should go into town.</p>`,
    button: 'Go into town',
    next: () => startStage(0),
  });
}

/* =========================================================================
   MINI-STAGES: spin the wheel
   The wheel has flashy segments and a gold JACKPOT sliver.
   The only real outcomes are -1 HP, -½ PP, or +1 PP (nothing if PP is full).
   ========================================================================= */

const FOES = [
  {
    name: 'Marta, the Smoldering Baker',
    short: 'Marta',
    heat: 2,
    intro: 'The bakery smells like burnt sugar and something worse. Marta glows faintly orange behind the counter, thumb moving on her phone. "Hey. Hey. Can you spot me five bucks? I\'m at $96.40 and cashout is at $100. I\'m <em>so close</em>."',
    taunts: [
      '"Just five. I\'ll pay you back the second it clears."',
      '"It says pending. Pending means it\'s coming."',
      '"The app says I\'m in the top 1% of players."',
    ],
    defeat: 'The glow drains out of Marta like water out of a sink. She sits down hard on a flour sack. "I\'ve been at $96.40 for three weeks," she says. "It keeps adding fees."',
  },
  {
    name: 'The Ash Choir',
    short: 'the Ash Choir',
    heat: 3,
    intro: 'Four members of the church choir stand in a circle in the square, humming in perfect harmony. Smoke curls off their robes. On every beat, they tap their phones in unison.',
    taunts: [
      '"♪ Spin, spin, the payout\'s nigh ♪"',
      '"♪ Send five to Brother Dale and the withdrawal clears ♪"',
      '"♪ So close, so close, so close, so close ♪"',
    ],
    defeat: 'The hum breaks apart into four ordinary coughing people. One of them holds up her phone. The balance screen reads PROCESSING in cheerful gold letters. It has read that since June.',
  },
  {
    name: 'Deacon Tallow, the Kindling Clerk',
    short: 'Deacon Tallow',
    heat: 3,
    intro: 'At town hall, the clerk has stacked every combustion report into one neat pile. The pile is on fire. So is he, a little. "Oh good, a witness. Everyone who burned had the same app. It runs off a machine under the old casino on Pike Street. I was going to look into it right after my next spin."',
    taunts: [
      '"Please fill out Form 7-7-7: Application for Withdrawal."',
      '"It only needs a small verification deposit."',
      '"Statistically, I\'m due."',
    ],
    defeat: 'Tallow\'s flames gutter out. He presses a key into your hand. The plastic tag reads PIKE ST. SUBLEVEL. "It told me I was 99% of the way there," he says. "I believed it every single time."',
  },
];

const WHEEL_ODDS = [
  { key: 'ppUp', weight: 45 },
  { key: 'ppDown', weight: 25 },
  { key: 'hpDown', weight: 30 },
];

const SEG_STYLE = {
  ppUp: { label: '+1 PP', color: '#2f5fb8' },
  ppDown: { label: '−½ PP', color: '#5b3a9e' },
  hpDown: { label: '−1 HP', color: '#a12f2f' },
  jackpot: { label: 'JACKPOT', color: '#e0a21a' },
};

const JACKPOT_WIDTH = 6; // degrees; thin enough that you never land on it
const PATTERN = ['ppUp', 'hpDown', 'ppUp', 'ppDown', 'ppUp', 'hpDown', 'ppUp', 'ppDown', 'ppUp', 'hpDown', 'ppUp', 'hpDown'];
const SEGMENTS = (() => {
  const segs = [{ kind: 'jackpot', start: 0, end: JACKPOT_WIDTH }];
  const w = (360 - JACKPOT_WIDTH) / PATTERN.length;
  PATTERN.forEach((kind, i) => segs.push({ kind, start: JACKPOT_WIDTH + i * w, end: JACKPOT_WIDTH + (i + 1) * w }));
  return segs;
})();

function drawWheel(canvas) {
  const size = 300;
  const dpr = 2;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const r = size / 2;
  const rad = (deg) => ((deg - 90) * Math.PI) / 180;

  for (const s of SEGMENTS) {
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.arc(r, r, r - 4, rad(s.start), rad(s.end));
    ctx.closePath();
    ctx.fillStyle = SEG_STYLE[s.kind].color;
    ctx.fill();
    ctx.strokeStyle = '#140c0a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(rad((s.start + s.end) / 2));
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = s.kind === 'jackpot' ? '#3a1d00' : '#fff';
    ctx.font = s.kind === 'jackpot' ? '800 9px system-ui, sans-serif' : '700 15px system-ui, sans-serif';
    ctx.fillText(SEG_STYLE[s.kind].label, r - 14, 0);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(r, r, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#140c0a';
  ctx.fill();
}

// Decide the outcome first, then choose where the wheel lands to sell it.
// About a third of the time it lands a hair away from JACKPOT.
function chooseLanding(outcome) {
  const first = SEGMENTS[1];
  const last = SEGMENTS[SEGMENTS.length - 1];
  if (Math.random() < 0.35) {
    if (first.kind === outcome) return { angle: first.start + 0.8, nearMiss: true };
    if (last.kind === outcome) return { angle: last.end - 0.8, nearMiss: true };
  }
  const seg = pick(SEGMENTS.filter((s) => s.kind === outcome));
  const margin = 3;
  return { angle: seg.start + margin + Math.random() * (seg.end - seg.start - margin * 2), nearMiss: false };
}

function applyWheel(outcome) {
  if (outcome === 'ppUp') {
    if (state.pp >= MAX_PP) return { text: '+1 PP… but you\'re already full. The wheel shrugs.', cls: '' };
    state.pp = Math.min(MAX_PP, state.pp + 1);
    return { text: '+1 PP. A spark of focus.', cls: 'good' };
  }
  if (outcome === 'ppDown') {
    state.pp = Math.max(0, state.pp - 0.5);
    return { text: '−½ PP. Your focus frays.', cls: 'bad' };
  }
  state.hp = Math.max(0, state.hp - 1);
  return { text: '−1 HP. The heat bites.', cls: 'bad' };
}

function startStage(i) {
  state.stage = i;
  const foe = FOES[i];
  const fight = { heat: foe.heat, phase: 'spin', spins: 0 };

  show(`
    <section class="fight">
      <p class="kicker">Stage ${i + 1} of ${FOES.length}</p>
      <h2>${foe.name}</h2>
      <div class="heat"><strong>HEAT</strong><span class="pips" id="pips"></span></div>
      <p class="flavor">${foe.intro}</p>
      <div class="wheel-wrap"><div class="pointer"></div><canvas id="wheel"></canvas></div>
      <p class="wheel-caption">★ JACKPOT PAYS ×100 ★</p>
      <p class="say" id="say"></p>
      <div class="actions">
        <button class="primary" id="spin">Spin the wheel</button>
        <button id="push">Psychic Push (1 PP)</button>
        <button id="hold">Hold</button>
      </div>
      <p class="help">Each turn you have to spin. After the spin you can spend 1 PP on a Psychic Push to cool their heat by 1. Get their heat to 0 before your HP hits 0.</p>
    </section>`);

  const canvas = $('#wheel');
  drawWheel(canvas);
  canvas.style.transition = 'none';
  canvas.style.transform = `rotate(${state.wheelRot}deg)`;
  void canvas.offsetWidth;
  canvas.style.transition = '';

  const say = (t) => ($('#say').innerHTML = t);
  const renderPips = () => ($('#pips').textContent = '🔥'.repeat(fight.heat) + '·'.repeat(foe.heat - fight.heat));
  const setPhase = (p) => {
    fight.phase = p;
    $('#spin').disabled = p !== 'spin';
    $('#push').disabled = p !== 'act' || state.pp < 1;
    $('#hold').disabled = p !== 'act';
  };

  renderPips();
  setPhase('spin');
  log(`Stage ${i + 1}: ${foe.name}.`);

  $('#spin').onclick = async () => {
    setPhase('busy');
    fight.spins++;
    const outcome = weighted(WHEEL_ODDS);
    const { angle, nearMiss } = chooseLanding(outcome);
    const cur = state.wheelRot;
    const delta = (((360 - angle - (cur % 360)) % 360) + 360) % 360;
    state.wheelRot = cur + 360 * 5 + delta;
    canvas.style.transform = `rotate(${state.wheelRot}deg)`;
    say(fight.spins % 2 === 1 ? pick(foe.taunts) : 'The wheel ticks past every segment like it\'s reading them.');
    await wait(3300);

    const res = applyWheel(outcome);
    if (nearMiss) log('The pointer stops a hair away from JACKPOT.', 'gold');
    log(res.text, res.cls);
    say(res.text);
    hud();

    if (state.hp <= 0) return death();
    setPhase('act');
  };

  $('#push').onclick = () => {
    state.pp -= 1;
    fight.heat -= 1;
    hud();
    renderPips();
    const t = `You push one cold, clear thought into ${foe.short}. Heat −1.`;
    log(t, 'good');
    say(t);
    if (fight.heat <= 0) return stageCleared(i);
    setPhase('spin');
  };

  $('#hold').onclick = () => {
    log('You hold your focus and let the wheel come around again.');
    setPhase('spin');
  };
}

function stageCleared(i) {
  const foe = FOES[i];
  state.saved.push(foe.short);
  const healed = Math.min(REST_HEAL, MAX_HP - state.hp);
  state.hp += healed;
  hud();
  log(`${foe.short} cooled. Nobody burned.`, 'good');
  const last = i === FOES.length - 1;
  storyScene({
    kicker: `Stage ${i + 1} cleared`,
    title: `${foe.name} cools off`,
    body: [
      foe.defeat,
      healed ? `You catch your breath. +${healed} HP.` : 'You catch your breath.',
      'You notice you did not win anything. You just lost a little less than the wheel wanted.',
    ],
    button: last ? 'Go to Pike Street' : 'Keep walking',
    next: () => (last ? bossIntro() : startStage(i + 1)),
  });
}

function death() {
  log('You combust.', 'bad');
  storyScene({
    kicker: 'Game over (sort of)',
    title: 'You combust',
    body: [
      'A flash, a pop, and a scorch mark shaped like you sitting down.',
      'Then, from very far away: <em>not yet</em>.',
      'You wake up on the same street, sweating, with the fight still ahead of you.',
    ],
    button: 'Try again',
    next: () => {
      state.hp = MAX_HP;
      state.pp = START_PP;
      hud();
      startStage(state.stage);
    },
  });
}

/* =========================================================================
   BOSS: SAINT JACKPOT, the Ethereal Corporeal
   Every spin looks like progress. None of it is.
   ========================================================================= */

const SYMS = ['7', '🍒', '💎', '🔔', 'BAR', '👁'];
const NON_SEVEN = SYMS.filter((s) => s !== '7');
const AWAKEN_AT_SPIN = 7;

const MARQUEE = [
  'SO CLOSE! 🔥 TWO SEVENS! ONE MORE SPIN!',
  'WINNER! +400 CREDITS 🍒 (withdrawable at 10,000)',
  'WITHDRAWAL PENDING · pay a 1 HP identity verification fee',
  'Your neighbor Marta just cashed out $4,100! You could be next!',
  'WINNER! +250 CREDITS · VIP STATUS UNLOCKED · VIP spins cost the same',
  '99% THERE! Send just $5 to unlock your winnings · processing fee: 1 HP',
  'LUCKY STREAK DETECTED 🔥 THE NEXT ONE IS THE ONE',
];

const SAINT_LINES = [
  '"SEE? YOU\'RE HURTING ME."',
  '"NOBODY HAS EVER GOTTEN THIS CLOSE."',
  '"I\'M ON MY LAST LEGS. I DON\'T EVEN HAVE LEGS."',
  '"YOU\'VE COME TOO FAR TO STOP NOW."',
  '"THE ODDS ARE TURNING IN YOUR FAVOR. THAT\'S HOW ODDS WORK."',
  '"ONE MORE. JUST ONE MORE."',
  '"I CAN FEEL IT. YOU CAN FEEL IT. SPIN."',
];

// The machine's actual source, shown once you can Read between the Reels.
const CODE_LINES = [
  { code: 'function spin(player) {' },
  { id: 'core', code: '  const outcome = house.decide(player);        // not random. never was.' },
  { id: 'nudge', code: '  if (outcome.isJackpot) outcome.reel[2] = nudge(1);  // near miss' },
  { id: 'bar', code: '  ui.bossHealth *= 0.55;                       // make them feel it' },
  { id: 'cash', code: '  ui.cashout = 1 - (1 - ui.cashout) * 0.45;    // 99.9%, forever' },
  { id: 'ask', code: '  if (player.isClose()) ask("just $5 more");   // there is no withdraw()' },
  { id: 'heat', code: '  player.heat += 1;                            // this is the combustion' },
  { code: '  return house.wins;' },
  { code: '}' },
];

const STRIKES = {
  nudge: {
    text: 'You strike the nudge. The third reel drops the act. There was never a seven on it.',
    saint: '"THAT WAS A FEATURE."',
    effect: () => document.querySelectorAll('.reel').forEach((r) => setReel(r, ['', '·', ''])),
  },
  bar: {
    text: 'You strike the fake health bar. It snaps back to 100% and stays there. You never hurt it once.',
    saint: '"PLEASE DON\'T LOOK AT THAT."',
    effect: () => setMeter('house', 1, '100% (real)'),
  },
  cash: {
    text: 'You strike the cashout curve. The meter falls to its real value.',
    saint: '"PROGRESS IS A FEELING. I SELL FEELINGS."',
    effect: () => {
      setMeter('cash', 0.031, '3.1% (real)');
      $('#balance').textContent = 'Balance: 310 credits · Withdrawals: not implemented';
    },
  },
  ask: {
    text: 'You strike the ask. The marquee goes dark mid-sentence. There was never a withdraw function to unlock. The five dollars went nowhere.',
    saint: '"EVERYONE SENDS THE FIVE."',
    effect: () => ($('#marquee').textContent = ''),
  },
  heat: {
    text: 'You strike the heat line. The glow in your ribs goes out. This is what burned the town: not bad luck, just this line, running on every spin.',
    saint: '"THE TOWN WAS WARM. I KEPT IT WARM."',
    effect: () => {
      state.hp = MAX_HP;
      hud();
      log('HP fully restored.', 'good');
    },
  },
};

function setMeter(which, frac, label) {
  $(`#${which}-bar`).style.width = clamp(frac, 0, 1) * 100 + '%';
  $(`#${which}-text`).textContent = label;
}

function setReel(el, rows) {
  el.innerHTML = rows
    .map((s, i) => `<div class="sym${i === 1 ? ' mid' : ''}${s === '7' ? ' seven' : ''}">${s}</div>`)
    .join('');
}

function riggedReels(spin) {
  const r = () => pick(NON_SEVEN);
  if (spin === 2 || spin === 5) return [[r(), '🍒', r()], [r(), '🍒', r()], [r(), '🍒', r()]];
  const third = Math.random() < 0.5 ? ['7', r(), r()] : [r(), r(), '7'];
  return [[r(), '7', r()], [r(), '7', r()], third];
}

async function animateReels(final) {
  const reels = [...document.querySelectorAll('.reel')];
  const stopped = [false, false, false];
  reels.forEach((el) => el.classList.add('spinning'));
  const tick = setInterval(() => {
    reels.forEach((el, i) => !stopped[i] && setReel(el, [pick(SYMS), pick(SYMS), pick(SYMS)]));
  }, 70);
  const stopAt = [700, 1100, 2100];
  let t = 0;
  for (let i = 0; i < 3; i++) {
    await wait(stopAt[i] - t);
    t = stopAt[i];
    stopped[i] = true;
    reels[i].classList.remove('spinning');
    setReel(reels[i], final[i]);
    if (i === 1 && final[0][1] === '7' && final[1][1] === '7') reels[2].classList.add('tense');
  }
  reels[2].classList.remove('tense');
  clearInterval(tick);
}

function bossIntro() {
  state.hp = MAX_HP;
  state.pp = MAX_PP;
  hud();
  log('HP and PP fully restored.', 'good');
  storyScene({
    kicker: 'End of Chapter 1',
    title: 'Pike Street Sublevel',
    body: [
      'You sit on the curb until your hands stop shaking. HP and PP fully restored.',
      'The old Lucky Seven casino has been boarded up for fifteen years. Tallow\'s key opens a service door. The stairs go down further than the building is tall.',
      'At the bottom sits one slot machine, alone in a dark room, lit up like a birthday cake. It is breathing.',
      'The cabinet flexes. The reels are eyes. The lever is an arm. The coin tray is a mouth, and it is smiling. It is here and not here at the same time, like a reflection that learned to stand up.',
      '"WELCOME BACK, PLAYER," says SAINT JACKPOT. "YOU\'RE ALREADY A WINNER. YOU JUST HAVEN\'T CASHED OUT YET."',
    ],
    button: 'Approach the machine',
    next: bossFight,
  });
}

function bossFight() {
  const b = (state.boss = { spins: 0, integrity: 1, cashout: 0.6, awakened: false, struck: new Set() });

  show(`
    <section class="boss">
      <p class="kicker">Boss</p>
      <h2>SAINT JACKPOT <small>the Ethereal Corporeal</small></h2>
      <div class="meter"><label>THE HOUSE</label><div class="bar"><div id="house-bar" class="fill house"></div></div><span id="house-text"></span></div>
      <div class="machine" id="machine">
        <div class="marquee" id="marquee">★ WELCOME BACK, PLAYER ★</div>
        <div class="reels"><div class="reel"></div><div class="reel"></div><div class="reel"></div></div>
        <div class="meter"><label>CASHOUT</label><div class="bar"><div id="cash-bar" class="fill cash"></div></div><span id="cash-text"></span></div>
        <p class="balance" id="balance"></p>
      </div>
      <p class="say" id="say">"PULL THE LEVER. EVERY SPIN HURTS ME."</p>
      <div class="actions"><button class="jackpot" id="spin"></button></div>
      <div id="reveal"></div>
    </section>`);

  const say = (t) => ($('#say').innerHTML = t);
  const credits = () => Math.floor(b.cashout * 10000).toLocaleString();
  const renderFake = () => {
    setMeter('house', b.integrity, (Math.ceil(b.integrity * 1000) / 10).toFixed(1) + '%');
    setMeter('cash', b.cashout, (Math.floor(b.cashout * 1000) / 10).toFixed(1) + '%');
    $('#balance').textContent = `Balance: ${credits()} credits · Withdrawals unlock at 10,000`;
  };
  const renderSpinBtn = () => {
    $('#spin').textContent = state.pp >= 1 ? 'SPIN · ante 1 PP' : 'SPIN · ante 1 HP';
  };
  // Before the ability wakes up, the thing from the dream will not let you burn here.
  const hurt = (n) => {
    const before = state.hp;
    state.hp = Math.max(1, state.hp - n);
    if (before - n < 1) log('Something holds you together. <em>Not yet.</em>', 'good');
  };

  document.querySelectorAll('.reel').forEach((el) => setReel(el, [pick(NON_SEVEN), '7', pick(NON_SEVEN)]));
  renderFake();
  renderSpinBtn();
  log('Boss: SAINT JACKPOT, the Ethereal Corporeal.');

  $('#spin').onclick = async () => {
    const btn = $('#spin');
    btn.disabled = true;
    b.spins++;

    if (state.pp >= 1) {
      state.pp -= 1;
      log('Ante: −1 PP.', 'bad');
    } else {
      hurt(1);
      log('Ante: −1 HP.', 'bad');
    }
    hud();

    await animateReels(riggedReels(b.spins));

    b.integrity *= 0.55;
    b.cashout = 1 - (1 - b.cashout) * 0.45;
    renderFake();

    const msg = MARQUEE[Math.min(b.spins, MARQUEE.length) - 1];
    $('#marquee').textContent = msg;
    say(SAINT_LINES[(b.spins - 1) % SAINT_LINES.length]);
    log(msg, 'gold');

    if (b.spins === 3 || b.spins === 6) {
      hurt(1);
      log('Fee: −1 HP.', 'bad');
      hud();
    }

    if (b.spins >= AWAKEN_AT_SPIN || (b.spins >= 3 && state.hp <= 3)) return awaken();
    renderSpinBtn();
    btn.disabled = false;
  };
}

function awaken() {
  const b = state.boss;
  b.awakened = true;
  $('#spin').remove();
  $('#machine').classList.add('exposed');
  state.pp = MAX_PP;
  hud();
  log('NEW ABILITY: Read between the Reels (Novice).', 'good');
  log('Every PP you fed the machine spills back out.', 'good');

  $('#say').innerHTML = '"…WHY ARE YOU LOOKING AT ME LIKE THAT?"';
  $('#reveal').innerHTML = `
    <div class="awaken">
      <p class="kicker" style="color:#a9c3ff">Something clicks behind your eyes. <em>Not yet</em>, says the voice from the dream. <em>Now.</em></p>
      <p><span class="ability">NEW ABILITY: READ BETWEEN THE REELS</span><span class="tier">Novice</span></p>
      <p>You stop watching the reels and look at the gaps between them. The lights go thin. The sevens are stickers. Under the cabinet, under the smile, you can see what the Saint actually is: a few lines of intent, running over and over.</p>
      <p class="help">Strike a line to break it. The machine has one core.</p>
    </div>
    <div class="code" id="code">
      ${CODE_LINES.map((l, i) =>
        l.id
          ? `<button class="line strikeable${l.id === 'core' ? ' core' : ''}" data-id="${l.id}">${escapeHtml(l.code)}</button>`
          : `<button class="line inert" disabled data-i="${i}">${escapeHtml(l.code)}</button>`
      ).join('')}
    </div>`;

  document.querySelectorAll('.line.strikeable').forEach((el) => {
    el.onclick = () => strike(el.dataset.id, el);
  });
}

function strike(id, el) {
  const b = state.boss;
  if (b.struck.has(id)) return;
  b.struck.add(id);
  el.classList.add('struck');
  el.disabled = true;

  if (id === 'core') return coreStrike();

  const s = STRIKES[id];
  s.effect();
  log(s.text, 'good');
  $('#say').innerHTML = s.saint;
}

async function coreStrike() {
  document.querySelectorAll('.line').forEach((el) => (el.disabled = true));
  $('#machine').classList.add('dead');
  setMeter('house', 0, '0%');
  $('#marquee').textContent = '';
  $('#say').innerHTML = '"BUT YOU WERE SO CLOSE."';
  log('You put everything you have into one line: <code>house.decide(player)</code>.', 'good');
  await wait(1400);
  $('#say').innerHTML = 'You were never close. Close was the product.';
  await wait(1600);
  storyScene({
    kicker: 'Chapter 1 complete',
    title: 'The House Loses',
    body: [
      'The whole machine was only ever one decision, made in advance and dressed up as chance. The line cracks. The reels stop and stay stopped. SAINT JACKPOT makes a sound like every coin in the world hitting the floor at once.',
      'Then it\'s just a box. A dusty box in a basement, unplugged, with a stickered seven peeling off the glass.',
      'Nobody combusts in Hollow Ferry that night. Marta calls her bank. The Ash Choir deletes the app in four-part harmony. Deacon Tallow files a report, and it does not catch fire.',
      'On the walk home, the fever dream comes back for a second, and some of the blanks have filled in:',
    ],
    extra: prophecy(true) +
      '<p>One line from the machine is still printing somewhere behind your eyes:</p>' +
      '<div class="code"><span class="line inert">house.decide() :: forwarding to node 2 of 7</span></div>' +
      '<p class="kicker">End of Chapter 1</p>',
    button: 'Play again',
    next: intro,
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- boot ---------- */
if (typeof document !== 'undefined') intro();
if (typeof module !== 'undefined') module.exports = { WHEEL_ODDS, FOES, MAX_HP, MAX_PP, START_PP, REST_HEAL, SEGMENTS };
