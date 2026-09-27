'use strict';

/* =========================================================================
   PLAYING SOLO · Chapter 2: The Haystack-Stack
   A security box behind 2-step verification. The fob is dead and unsupported.
   The emergency release code is on a piece of paper somewhere in your realm,
   which is every cloud drive you ever signed up for. The box is draining.
   ========================================================================= */

const DRAIN_TICK_MS = 5000; // passive drain: 1% every 5 seconds
const COST_OPEN = 2;
const COST_SEARCH = 3;
const COST_WRONG_CODE = 8;
const DELEGATE_PP = 2;
const DELEGATE_UNLOCK_ACTIONS = 14;
const DELEGATE_UNLOCK_CONTENTS = 60;

const BOX_ITEMS = [
  { name: 'a spare fob battery (expired)', at: 90 },
  { name: 'Deacon Tallow\'s combustion reports', at: 78 },
  { name: 'the Ash Choir\'s June balance', at: 66 },
  { name: 'Marta\'s $96.40', at: 54 },
  { name: 'a list of names, one circled twice', at: 40, key: 'names' },
  { name: 'a sealed envelope that hums', at: 26, key: 'sealed' },
  { name: 'a map fragment', at: 12, key: 'map' },
];

/* ---------- building the realm ---------- */

let NID = 0;
const D = (name, children = [], flags = {}) => ({ id: ++NID, name, type: 'dir', children, ...flags });
const F = (name, content, flags = {}) => ({ id: ++NID, name, type: 'file', content, ...flags });
const nest = (names, leaf = []) => names.reduceRight((kids, n) => [D(n, kids)], leaf)[0];
const grp = () => String(1000 + Math.floor(Math.random() * 9000));
const newCode = () => `${grp()}-${grp()}-${grp()}`;

function splitExt(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ''];
}

function withDupes(name, content, n, flags = {}) {
  const [base, ext] = splitExt(name);
  const variants = [`Copy of ${name}`, `${base} (1)${ext}`, `${base} - final${ext}`, `${base}_FINAL_v2${ext}`, `${base} (2)${ext}`];
  return [F(name, content, flags), ...variants.slice(0, n).map((v) => F(v, content, { ...flags, dup: true }))];
}

const JUNK_PHOTOS = [
  'A blurry photo of your ceiling.',
  'A screenshot of a meme you don\'t remember saving.',
  'A photo of a parking spot number. You have no idea which garage.',
  'The inside of your pocket.',
  'A whiteboard, already erased.',
  'A cat that isn\'t yours.',
  'Your thumb, from the side.',
  'A menu from a restaurant that closed.',
  'A sunset through a dirty window. It was a good sunset.',
  'A screenshot of a screenshot.',
];

function photos(names) {
  return names.map((n) => F(n, pick(JUNK_PHOTOS), { untouched: true }));
}

function receipts(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const total = (5 + Math.random() * 60).toFixed(2);
    out.push(F(i === 1 ? 'receipt.jpg' : `receipt ${i}.jpg`, `A receipt. TOTAL $${total}. You flip it over in your head. Nothing on the back.`, { untouched: true, textTag: true }));
  }
  return out;
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Where the needle can end up. One is picked per run.
const SPOTS = [
  {
    drive: 'OneDrift',
    driveHint: 'You set up the fob on the work laptop. Work laptop meant OneDrift.',
    folderHint: 'It was the same week you did taxes. You scanned everything in sight.',
    file: 'scan0003.pdf',
  },
  {
    drive: 'Goggle Drive',
    driveHint: 'Before you wiped the old laptop, you dumped the whole thing into Goggle Drive.',
    folderHint: 'It was sitting on that old laptop\'s desktop, in a folder called something like "stuff".',
    file: 'IMG_4471.jpg',
  },
  {
    drive: 'MEGA',
    driveHint: 'You once uploaded an entire phone to MEGA because it was free.',
    folderHint: 'It\'s a photo from that phone. March 2020, late at night.',
    file: '20200311_221407.jpg',
  },
  {
    drive: 'Dripbox',
    driveHint: 'Dripbox auto-uploaded every photo you took for a whole year.',
    folderHint: 'It\'s in with the receipts. Every receipt looks the same.',
    file: 'receipt 7.jpg',
  },
];

function buildRealm(code, spotIndex) {
  NID = 0;
  const decoyA = newCode();
  const decoyB = newCode();
  const decoyC = newCode();
  const needle = F(
    SPOTS[spotIndex].file,
    `A picture of a pizza receipt from Gino's, $23.18. On the back, in your handwriting, pressed hard enough to dent the paper:\n\nEMERGENCY SOFTWARE AUTH RELEASE CODE\n${code}\n\nDO NOT LOSE THIS. (you, to you)`,
    { untouched: true, needle: true }
  );
  const place = (i) => (i === spotIndex ? [needle] : []);

  const oneDrift = D('OneDrift', [
    D('Desktop (backed up)', [
      F('New Text Document.txt', '(empty)'),
      F('Screenshot fob.png', 'A photo of the fob\'s little screen. It says 000000. It was already dying.'),
      F('Chrome.lnk', 'A shortcut to a program on a computer you no longer own.'),
    ]),
    D('Documents', [
      D('Taxes 2019', [
        ...withDupes('W-2.pdf', 'A W-2. You made less than you remember.', 3),
        D('misc', [
          ...photos(range(1, 9).filter((n) => n !== 3 || spotIndex !== 0).map((n) => `scan000${n}.pdf`)),
          nest(['New folder', 'New folder (2)'], place(0)),
        ]),
      ]),
      nest(['Documents', 'Documents (1)', 'New folder']),
      ...withDupes('resume.docx', 'Your resume. It lists "Microsoft Office" as a skill.', 4),
      F('IMPORTANT.txt', 'Remember where you put the important file.'),
    ]),
    D('Pictures', [
      D('Camera Roll', photos(range(1, 7).map((n) => `WIN_2019${n}0${n}_1${n}.jpg`))),
      D('Saved Pictures'),
      D('Screenshots', photos(['Screenshot (1).png', 'Screenshot (2).png', 'Screenshot (14).png'])),
    ]),
    nest(['Attachments', 'Attachments']),
  ]);

  const goggle = D('Goggle Drive', [
    D('Untitled folder'),
    nest(['Untitled folder (1)', 'Untitled folder']),
    D('Copy of Old Laptop Backup', [
      D('Desktop', [
        D('stuff', [...photos(['IMG_4402.jpg', 'IMG_4415.jpg', 'IMG_4468.jpg', 'IMG_4490.jpg']), nest(['Old'], place(1))]),
        F('todo.txt', '1. get organized\n2. ???'),
      ]),
      D('Downloads', [
        ...withDupes('KeyFob manual.pdf', 'Section 9: If your fob dies, use the Emergency Software Auth Release Code you were given at setup. Write it down. Do not misplace it. Seriously.\n\nSection 10: This device is no longer supported.', 3),
        F('setup (3).exe', 'An installer for something. It has been installing since 2019.'),
      ]),
    ]),
    D('Colab Notebooks'),
    F('Takeout-20190302-001.zip', '2.1 GB. Opening it would take the rest of your life.'),
    F('Takeout-20190302-002.zip', '2.1 GB. Same.'),
    ...withDupes('Budget.xlsx', 'A budget. Row 3 says "coffee: $0". That was a lie.', 3),
    F('passwords.xlsx', 'Every cell says "password1". One cell says "password2 (new)".', { obsolete: true }),
  ]);

  const mega = D('MEGA', [
    D('MEGAsync Uploads', [
      D('phone dump 2020', [
        D('DCIM', [
          D('Camera', [
            ...photos(['20200214_190233.jpg', '20200301_120501.jpg', '20200309_083015.jpg', '20200311_221352.jpg', '20200312_070044.jpg', '20200402_164510.jpg']),
            ...place(2),
          ]),
          D('.thumbnails'),
        ]),
        D('WhatsApp', [D('Media', [D('WhatsApp Images', photos(['IMG-20200101-WA0001.jpg', 'IMG-20200101-WA0002.jpg']))])]),
      ]),
    ]),
    D('Rubbish Bin (not the real one)', [F('code.txt', 'print("hello world")')]),
    ...withDupes('2FA recovery codes.txt', `Recovery codes for: MySpace, Club Penguin, and a Minecraft server that shut down in 2014.\n${decoyA}`, 2, { obsolete: true }),
    nest(['backup', 'backup', 'backup (old)']),
  ]);

  const drip = D('Dripbox', [
    D('Camera Uploads', [D('2021', [...receipts(9).filter((f) => !(spotIndex === 3 && f.name === 'receipt 7.jpg')), ...place(3)])]),
    nest(['Apps', 'Dripbox Paper']),
    F('Get Started with Dripbox.pdf', 'Step 1: put your files in Dripbox. Step 2: never look at them again.'),
    ...withDupes('backup_codes.txt', `KeyFob backup codes\n${decoyB}\n${decoyC}\n\nSTATUS: REVOKED. You regenerated these after you lost them. Then you lost the new ones.`, 3, { obsolete: true }),
    F('EMERGENCY.docx', 'Emergency contacts: Mom. That\'s it. That\'s the whole document.'),
    F('recovery code.jpg', 'A photo of a sticky note, so blurry it could be a code or a sandwich.', { untouched: true }),
  ]);

  return [oneDrift, goggle, mega, drip];
}

function setParents(dir) {
  for (const c of dir.children) {
    c.parent = dir;
    if (c.type === 'dir') setParents(c);
  }
}

function walkFiles(dir, fn) {
  for (const c of dir.children) {
    if (c.type === 'dir') walkFiles(c, fn);
    else fn(c, dir);
  }
}

function pathOf(node) {
  const parts = [];
  for (let n = node; n; n = n.parent) parts.unshift(n.name);
  return parts.join(' / ');
}

const GENERIC_DIR = /^(new folder|untitled folder)/i;

// Bottom-up: dissolve generic "New folder" wrappers into their parent,
// then drop anything left empty. Returns how many folders went away.
function tidy(dir) {
  let removed = 0;
  for (const c of dir.children) if (c.type === 'dir') removed += tidy(c);
  const next = [];
  for (const c of dir.children) {
    if (c.type === 'dir' && c.children.length === 0) { removed++; continue; }
    if (c.type === 'dir' && GENERIC_DIR.test(c.name)) { removed++; next.push(...c.children); continue; }
    next.push(c);
  }
  dir.children = next;
  return removed;
}

/* =========================================================================
   SCENES
   ========================================================================= */

function ch2Intro(skipped) {
  if (skipped) {
    resetRun();
    state.saved = ['Marta', 'the Ash Choir', 'Deacon Tallow'];
    $('#log').innerHTML = '';
  }
  state.hp = MAX_HP;
  state.pp = MAX_PP;
  hud();
  $('#chapter').textContent = 'Chapter 2: The Haystack-Stack';
  storyScene({
    kicker: 'Chapter 2: The Haystack-Stack',
    title: 'The Box Inside the Box',
    body: [
      'Behind the dead Saint\'s coin hopper, bolted to the frame, there\'s a steel security box. Its keypad wakes up when you touch it.',
      '<strong>2-STEP VERIFICATION REQUIRED.</strong> Please enter the code from your registered KeyFob.',
      'You have the KeyFob. It\'s on your keyring. It has been dead for two years. The company that made it sent one email about "sunsetting legacy hardware" and then stopped existing.',
      'Then the box starts to hum. A progress bar you didn\'t ask for crawls across the keypad: <em>REMOTE TRANSFER IN PROGRESS · node 2 of 7</em>. Someone is draining it from the other end.',
      'There is one other way in. When you set up the fob, a very tired support rep gave you an <strong>emergency software auth release code</strong> and told you not to misplace it, for exactly this reason. You wrote it on a piece of paper.',
      'The paper is somewhere in your realm. Your realm is every cloud drive you ever made an account on.',
      'Your mind goes completely blank.',
    ],
    button: 'Start digging',
    next: ch2Play,
  });
}

function ch2Play() {
  const spot = Math.floor(Math.random() * SPOTS.length);
  const code = newCode();
  const roots = buildRealm(code, spot);
  const trash = D('Trash', [], { trash: true });
  roots.forEach(setParents);

  const c = (state.ch2 = {
    code,
    spot,
    roots,
    trash,
    cwd: roots[0],
    contents: 100,
    actions: 0,
    hints: 0,
    delegateUnlocked: false,
    delegated: false,
    over: false,
    timer: null,
  });

  show(`
    <section class="ch2">
      <p class="kicker">Chapter 2 · The Haystack-Stack</p>
      <h2>The Security Box</h2>
      <div class="box-panel">
        <div class="meter"><label>CONTENTS</label><div class="bar"><div id="drain-bar" class="fill drain"></div></div><span id="drain-text"></span></div>
        <p class="drain-note">REMOTE TRANSFER IN PROGRESS · node 2 of 7</p>
        <ul class="items" id="items"></ul>
        <p class="fob">KeyFob: <span class="dead">device unsupported · no codes</span></p>
        <form id="keypad" class="keypad">
          <input id="code" inputmode="numeric" autocomplete="off" placeholder="____-____-____" aria-label="Emergency release code">
          <button class="primary" type="submit">Enter code</button>
        </form>
      </div>

      <div class="explorer">
        <div class="drives" id="drives"></div>
        <form id="search" class="search">
          <input id="q" placeholder="Search (−${COST_SEARCH}%)" aria-label="Search">
          <button type="submit">Search</button>
        </form>
        <nav class="crumbs" id="crumbs"></nav>
        <ul class="files" id="files"></ul>
        <pre class="preview" id="preview" hidden></pre>
      </div>

      <p class="say" id="say">Opening a folder or file drains the box by ${COST_OPEN}%. So does standing around.</p>
      <div class="actions">
        <button id="recall">Recall (1 PP)</button>
        <span id="delegate-slot"></span>
      </div>
      <div id="sorter"></div>
    </section>`);

  const say = (t) => ($('#say').innerHTML = t);

  const renderBox = () => {
    const v = Math.max(0, c.contents);
    $('#drain-bar').style.width = v + '%';
    $('#drain-text').textContent = Math.ceil(v) + '%';
    $('#items').innerHTML = BOX_ITEMS.map((it) => `<li class="${v < it.at ? 'gone' : ''}">${it.name}</li>`).join('');
  };

  const allRoots = () => (c.trash.children.length ? [...c.roots, c.trash] : c.roots);

  const renderDrives = () => {
    $('#drives').innerHTML = allRoots()
      .map((r, i) => `<button class="drive${rootOf(c.cwd) === r ? ' on' : ''}" data-i="${i}">${r.trash ? '🗑 ' : '☁ '}${r.name}</button>`)
      .join('');
    $('#drives').querySelectorAll('.drive').forEach((b) => {
      b.onclick = () => {
        c.cwd = allRoots()[Number(b.dataset.i)];
        $('#preview').hidden = true;
        renderExplorer();
      };
    });
  };

  const rootOf = (n) => {
    while (n.parent) n = n.parent;
    return n;
  };

  const icon = (n) => {
    if (n.type === 'dir') return '📁';
    if (/\.(jpg|png|heic)$/i.test(n.name)) return '🖼';
    if (/\.zip$/i.test(n.name)) return '📦';
    return '📄';
  };

  const renderCrumbs = () => {
    const chain = [];
    for (let n = c.cwd; n; n = n.parent) chain.unshift(n);
    $('#crumbs').innerHTML = chain
      .map((n, i) => (i === chain.length - 1 ? `<span>${escapeHtml(n.name)}</span>` : `<button class="crumb" data-i="${i}">${escapeHtml(n.name)}</button>`))
      .join(' / ');
    $('#crumbs').querySelectorAll('.crumb').forEach((b) => {
      b.onclick = () => {
        c.cwd = chain[Number(b.dataset.i)];
        $('#preview').hidden = true;
        renderExplorer();
      };
    });
  };

  const renderList = (nodes, showPath) => {
    const sorted = showPath
      ? nodes
      : [...nodes].sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.type === 'dir' ? -1 : 1));
    $('#files').innerHTML = sorted.length
      ? sorted
          .map((n) => `<li><button class="entry" data-id="${n.id}">${icon(n)} ${escapeHtml(n.name)}${showPath ? `<small>${escapeHtml(pathOf(n.parent))}</small>` : ''}</button></li>`)
          .join('')
      : '<li class="empty">This folder is empty. Of course it is.</li>';
    const byId = new Map(sorted.map((n) => [String(n.id), n]));
    $('#files').querySelectorAll('.entry').forEach((b) => {
      b.onclick = () => openNode(byId.get(b.dataset.id));
    });
  };

  const renderExplorer = () => {
    renderDrives();
    renderCrumbs();
    renderList(c.cwd.children, false);
  };

  const drain = (pct) => {
    if (c.over) return;
    c.contents -= pct;
    renderBox();
    if (c.contents <= 0) boxEmptied();
  };

  const act = (pct) => {
    c.actions++;
    drain(pct);
    maybeUnlockDelegate();
  };

  const openNode = (n) => {
    if (c.over || !n) return;
    act(COST_OPEN);
    if (c.over) return;
    if (n.type === 'dir') {
      c.cwd = n;
      $('#preview').hidden = true;
      renderExplorer();
      return;
    }
    n.opened = true;
    const p = $('#preview');
    p.hidden = false;
    p.textContent = `${n.name}\n${'─'.repeat(Math.min(32, n.name.length))}\n${n.content}`;
    if (n.needle) {
      say('Your stomach drops. That\'s it. That\'s your handwriting.');
      log('Found it: the emergency release code.', 'gold');
    } else if (n.obsolete) {
      say('A code! …with a problem.');
    } else if (n.dup) {
      say('You have definitely seen this file before. Several times.');
    }
    p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  $('#search').onsubmit = (e) => {
    e.preventDefault();
    const q = $('#q').value.trim().toLowerCase();
    if (!q || c.over) return;
    act(COST_SEARCH);
    if (c.over) return;
    const hits = [];
    for (const r of allRoots()) walkFiles(r, (f) => f.name.toLowerCase().includes(q) && hits.push(f));
    $('#crumbs').innerHTML = `<span>Search: "${escapeHtml(q)}" · ${hits.length} result${hits.length === 1 ? '' : 's'}</span>`;
    $('#preview').hidden = true;
    renderList(hits, true);
    say(hits.length ? 'Search only reads file names. You did not name it anything useful.' : 'Nothing. Search only reads file names.');
  };

  $('#keypad').onsubmit = (e) => {
    e.preventDefault();
    if (c.over) return;
    const entered = $('#code').value.replace(/\D/g, '');
    if (entered.length !== 12) {
      say('The keypad wants twelve digits.');
      return;
    }
    if (entered === c.code.replace(/\D/g, '')) return boxOpened();
    state.hp -= 1;
    hud();
    log('Wrong code. The box shocks you: −1 HP.', 'bad');
    say('ZAP. <em>INVALID CODE.</em> The transfer speeds up for a second, like it heard you.');
    drain(COST_WRONG_CODE);
    if (state.hp <= 0) return ch2Death('The box shocks you one too many times.');
  };

  $('#recall').onclick = () => {
    if (c.over || state.pp < 1 || c.hints >= 3) return;
    state.pp -= 1;
    c.hints++;
    hud();
    const s = SPOTS[c.spot];
    const memory = [
      'You wrote it on the back of a receipt. Then, because you were being smart, you took a picture of it. Then, because you were being you, you lost the picture.',
      s.driveHint,
      s.folderHint,
    ][c.hints - 1];
    say(`<strong>Recall:</strong> ${memory}`);
    log(`Recall: ${memory}`, 'good');
    if (c.hints >= 3) $('#recall').disabled = true;
  };

  const maybeUnlockDelegate = () => {
    if (c.delegateUnlocked || c.over) return;
    if (c.actions < DELEGATE_UNLOCK_ACTIONS && c.contents > DELEGATE_UNLOCK_CONTENTS) return;
    c.delegateUnlocked = true;
    log('NEW ABILITY: Delegate (Novice).', 'good');
    $('#sorter').innerHTML = `
      <div class="awaken">
        <p class="kicker" style="color:#a9c3ff">Something rustles in your coat pocket.</p>
        <p><span class="ability">NEW ABILITY: DELEGATE</span><span class="tier">Novice</span></p>
        <p>A small paper crane climbs out, folded from old receipts. It clears its throat, which paper should not be able to do. "Hi. I'm the Sorter. I go through everything so you don't have to. Want me to clean this up?"</p>
      </div>`;
    $('#delegate-slot').innerHTML = `<button id="delegate" class="primary">Delegate to the Sorter (${DELEGATE_PP} PP)</button>`;
    $('#delegate').disabled = state.pp < DELEGATE_PP;
    $('#delegate').onclick = sorterPlan;
  };

  /* ---------- the Sorter ---------- */

  const sorterPlan = () => {
    if (c.over || c.delegated || state.pp < DELEGATE_PP) return;
    state.pp -= DELEGATE_PP;
    hud();
    $('#delegate').disabled = true;

    const groups = { dup: [], obsolete: [], untouched: [] };
    for (const r of c.roots) {
      walkFiles(r, (f) => {
        if (f.dup) groups.dup.push(f);
        else if (f.obsolete) groups.obsolete.push(f);
        else if (f.untouched && !f.opened) groups.untouched.push(f);
      });
    }
    const tag = (f) => (f.needle ? ' <span class="tag">✎ handwriting on back</span>' : f.textTag ? ' <span class="tag dim">text detected</span>' : '');
    const group = (key, title, verb, files) => `
      <label class="group">
        <input type="checkbox" data-group="${key}" checked>
        <span><strong>${title}</strong> · ${files.length} files · ${verb}</span>
      </label>
      <details><summary>Show list</summary><ul class="plan">${files
        .map((f) => `<li>${escapeHtml(f.name)}${tag(f)}<small>${escapeHtml(pathOf(f.parent))}</small></li>`)
        .join('')}</ul></details>`;

    $('#sorter').innerHTML = `
      <div class="sorter">
        <p>The Sorter flutters through all four drives in about a second. "Okay. Here's what I'd do. Uncheck anything you want me to leave alone."</p>
        ${group('dup', 'Duplicates', 'delete', groups.dup)}
        ${group('obsolete', 'Obsolete codes and junk', 'delete', groups.obsolete)}
        ${group('untouched', 'Old files you\'ve never opened', 'move to Trash', groups.untouched)}
        <p class="help">It will also un-nest every "New folder" and remove empty folders.</p>
        <div class="actions"><button id="approve" class="primary">Approve plan</button></div>
      </div>`;
    say('"I can tell what you haven\'t opened. I can\'t tell what matters to you."');
    $('#approve').onclick = () => sorterApply(groups);
  };

  const sorterApply = (groups) => {
    if (c.over) return;
    const checked = new Set([...document.querySelectorAll('[data-group]')].filter((x) => x.checked).map((x) => x.dataset.group));
    let deleted = 0;
    let trashed = 0;
    for (const key of ['dup', 'obsolete', 'untouched']) {
      if (!checked.has(key)) continue;
      for (const f of groups[key]) {
        f.parent.children = f.parent.children.filter((x) => x !== f);
        if (key === 'untouched') {
          c.trash.children.push(f);
          trashed++;
        } else deleted++;
      }
    }
    let folders = 0;
    for (const r of c.roots) {
      folders += tidy(r);
      setParents(r);
    }
    setParents(c.trash);
    c.delegated = true;
    c.cwd = c.roots.includes(rootOf(c.cwd)) ? rootOf(c.cwd) : c.roots[0];

    const summary = `Deleted ${deleted} files, moved ${trashed} to Trash, and cleared ${folders} folders.`;
    log(`The Sorter: ${summary}`, 'good');
    $('#sorter').innerHTML = `
      <div class="sorter done">
        <p>"Done. ${summary}${trashed ? ' Anything in Trash is still there if one of those mattered.' : ''}" The crane folds itself flat and slides back into your pocket.</p>
      </div>`;
    const needleTrashed = c.trash.children.some((f) => f.needle);
    say(needleTrashed ? 'The realm looks so much cleaner. Something about "never opened" is bothering you.' : 'The realm looks so much cleaner.');
    renderExplorer();
  };

  /* ---------- endings ---------- */

  const stop = () => {
    c.over = true;
    clearInterval(c.timer);
  };

  const boxEmptied = () => {
    stop();
    ch2Death('The progress bar finishes. The box clicks open by itself, and it is completely empty. Node 2 took everything.');
  };

  const boxOpened = () => {
    stop();
    ch2Victory();
  };

  c.timer = setInterval(() => drain(1), DRAIN_TICK_MS);
  state.onLeave = stop;
  renderBox();
  renderExplorer();
  log('Chapter 2: the security box is draining.');
}

function ch2Death(why) {
  log('The box wins this round.', 'bad');
  storyScene({
    kicker: 'Game over (sort of)',
    title: 'Access Denied',
    body: [why, 'Then, from very far away: <em>not yet</em>.', 'You blink, and the box is humming again, full, with the transfer just starting. Your drives feel shuffled.'],
    button: 'Try again',
    next: () => {
      state.hp = MAX_HP;
      state.pp = MAX_PP;
      hud();
      ch2Play();
    },
  });
}

function ch2Victory() {
  const c = state.ch2;
  const kept = BOX_ITEMS.filter((it) => c.contents >= it.at);
  const has = (key) => kept.some((it) => it.key === key);

  if (c.delegated) state.people.push('the Sorter');
  if (has('names')) state.people.push('a name you don\'t recognize, circled twice');
  state.place = has('map') ? 'a server farm the map calls the Cold Aisle (node 2 of 7)' : null;
  state.abilities.push('Keyring (Novice)');
  if (c.delegated) state.abilities.splice(state.abilities.length - 1, 0, 'Delegate (Novice)');
  if (has('sealed')) state.abilities.push('something sealed, still humming');
  state.tactics.push('writing it down somewhere you can find it');

  log(`The box opens. Recovered ${kept.length} of ${BOX_ITEMS.length} items.`, 'gold');
  saveChapter(3);

  storyScene({
    kicker: 'Chapter 2 complete',
    title: 'Access Granted',
    body: [
      'Twelve digits. The keypad goes green. The transfer bar freezes, blinks, and disappears. Somewhere on node 2, somebody\'s download just failed.',
      `You got to it with ${Math.ceil(c.contents)}% left. Inside you find:`,
      `<ul class="items">${BOX_ITEMS.map((it) => `<li class="${kept.includes(it) ? '' : 'gone'}">${it.name}</li>`).join('')}</ul>`,
      c.delegated
        ? 'The Sorter pokes its head out of your pocket. "So, about next time."'
        : 'You did the whole thing by hand. Your eyes hurt.',
      'This time you do not write the code on a receipt. You put it in a vault, behind one key you will actually remember, and you put that key somewhere that isn\'t a drawer.',
      '<strong>NEW ABILITY: KEYRING</strong> <span class="tier">Novice</span>. Codes you find stay found.',
      'The fever dream comes back on the walk home. More of it has filled in:',
    ],
    extra: prophecy(true) +
      (has('map') ? '' : '<p>You lost the map fragment to the drain. Wherever you\'re going next, you\'ll have to find it the hard way.</p>') +
      '<p class="kicker">End of Chapter 2 · Chapter 3 coming soon</p>',
    button: 'Replay Chapter 2',
    next: () => ch2Intro(true),
    alt: { label: 'Start over from Chapter 1', next: intro },
  });
}
