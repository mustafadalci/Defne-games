/* Sommen: shared Dutch math questions + answer pad for Defne's games.
   Usage: const quiz = Sommen.quiz({ root, level: () => 2, onSolved: firstTry => {} }); quiz.ask(); */
(function () {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  const LEVELS = {
    1: { max: 20, name: 'Tot 20', sub: 'goed bezig' },
    2: { max: 30, name: 'Tot 30', sub: 'knap' },
    3: { max: 50, name: 'Tot 50', sub: 'super knap' }
  };

  const slot = i => `<span class="sm-slot empty" data-i="${i}" role="button" tabindex="0" aria-label="Vakje ${i + 1}"></span>`;
  const ten = n => n - (n % 10);

  // ---------- Question generators ----------
  function addPair(L) {
    let a, b;
    if (L === 20) {
      if (Math.random() < .6) { a = rnd(5, 9); b = rnd(11 - a, 9); }
      else { a = rnd(11, 16); b = rnd(2, 19 - a); }
    } else if (Math.random() < .25) { b = 10; a = rnd(3, L - 10); }
    else { a = rnd(11, L - 3); b = rnd(2, Math.min(9, L - a)); }
    return [a, b];
  }
  function addHint(a, b) {
    if (b === 10) return `Spring 10 verder. Alleen het tiental verandert.`;
    const toTen = 10 - (a % 10);
    if (a % 10 !== 0 && b > toTen) return `Eerst naar ${ten(a) + 10}: ${a} + ${toTen}. Dan nog ${b - toTen} erbij.`;
    return `Begin bij ${a} en tel ${b} verder.`;
  }
  function subHint(c, b) {
    if (b === 10) return `Spring 10 terug. Alleen het tiental verandert.`;
    const units = c % 10;
    if (units !== 0 && b > units) return `Eerst terug naar ${ten(c)}: ${c} − ${units}. Dan nog ${b - units} eraf.`;
    return `Begin bij ${c} en tel ${b} terug.`;
  }

  const GEN = {
    add(L) {
      const [a, b] = addPair(L);
      return { key: `${a}+${b}`, intro: 'Reken uit.', body: `<div class="sm-eq">${a} + ${b} = ${slot(0)}</div>`,
        speak: `${a} plus ${b}`, answers: [a + b], hints: [addHint(a, b)], explains: [`${a} + ${b} = ${a + b}`] };
    },
    sub(L) {
      const [a, b] = addPair(L), c = a + b;
      return { key: `${c}-${b}`, intro: 'Reken uit.', body: `<div class="sm-eq">${c} − ${b} = ${slot(0)}</div>`,
        speak: `${c} min ${b}`, answers: [a], hints: [subHint(c, b)], explains: [`${c} − ${b} = ${a}`] };
    },
    miss(L) {
      const [a, b] = addPair(L), c = a + b;
      return { key: `${a}+?=${c}`, intro: 'Welk getal mist er?', body: `<div class="sm-eq">${a} + ${slot(0)} = ${c}</div>`,
        speak: `${a} plus hoeveel is ${c}?`, answers: [b], hints: [`Tel van ${a} verder tot je bij ${c} bent.`], explains: [`${a} + ${b} = ${c}`] };
    },
    dub(L) {
      const n = rnd(3, L / 2);
      if (Math.random() < .5) {
        return { key: `d${n}`, intro: 'Het dubbele. Twee keer hetzelfde getal.', body: `<div class="sm-eq">dubbel ${n} = ${slot(0)}</div>`,
          speak: `Wat is het dubbele van ${n}?`, answers: [2 * n], hints: [`Reken ${n} + ${n}.`], explains: [`${n} + ${n} = ${2 * n}`] };
      }
      return { key: `h${2 * n}`, intro: 'De helft. Verdeel eerlijk in twee.', body: `<div class="sm-eq">helft van ${2 * n} = ${slot(0)}</div>`,
        speak: `Wat is de helft van ${2 * n}?`, answers: [n], hints: [`Welk getal + hetzelfde getal is ${2 * n}?`], explains: [`${n} + ${n} = ${2 * n}`] };
    },
    pm(L) {
      const d = pick(L === 20 ? [1, 2, 3] : L === 30 ? [2, 3, 4, 5] : [3, 4, 5, 10]);
      const n = rnd(d + 1, L - d);
      return { key: `pm${n}/${d}`, intro: `Vul allebei de vakjes in: ${d} minder en ${d} meer.`,
        body: `<div class="sm-tbl"><div class="h">− ${d}</div><div class="h"></div><div class="h">+ ${d}</div><div class="c">${slot(0)}</div><div class="c mid">${n}</div><div class="c">${slot(1)}</div></div>`,
        speak: `Wat is ${d} minder dan ${n}? En wat is ${d} meer dan ${n}?`, answers: [n - d, n + d],
        hints: [subHint(n, d), addHint(n, d)], explains: [`${n} − ${d} = ${n - d}`, `${n} + ${d} = ${n + d}`] };
    },
    seq(L) {
      const step = pick(L === 20 ? [1, 2, 3] : L === 30 ? [2, 3, 5] : [3, 4, 5, 10]);
      const up = Math.random() < .5, span = step * 5;
      const start = up ? rnd(0, L - span) : rnd(span, L);
      const nums = [0, 1, 2, 3, 4, 5].map(i => start + (up ? 1 : -1) * step * i);
      const gaps = shuffle([2, 3, 4, 5]).slice(0, 2).sort();
      let k = 0;
      const body = nums.map((n, i) => gaps.includes(i) ? slot(k++) : `<span>${n}</span>`).join('');
      const hint = `Kijk goed: elke keer ${step} ${up ? 'erbij' : 'eraf'}.`;
      return { key: `s${nums.join(',')}`, intro: up ? 'Tel verder met gelijke sprongen. Vul de vakjes in.' : 'Tel terug met gelijke sprongen. Vul de vakjes in.',
        body: `<div class="sm-seq">${body}</div>`, speak: `${up ? 'Tel verder' : 'Tel terug'} met sprongen van ${step}.`,
        answers: gaps.map(i => nums[i]), hints: [hint, hint],
        explains: gaps.map(i => `${nums[i - 1]} ${up ? '+' : '−'} ${step} = ${nums[i]}`) };
    },
    line(L) {
      let a, b;
      do { a = rnd(1, L - 1); b = rnd(1, L - 1); } while (a % 10 === 0 || b % 10 === 0 || Math.abs(a - b) < 4);
      if (a > b) [a, b] = [b, a];
      const x = n => 16 + n * (288 / L);
      let ticks = '';
      for (let n = 0; n <= L; n++) {
        const big = n % 10 === 0, mid = n % 5 === 0;
        const h = big ? 12 : mid ? 9 : 5;
        ticks += `<line x1="${x(n)}" x2="${x(n)}" y1="${46 - h}" y2="${46 + h}" stroke="currentColor" stroke-width="${big ? 2.5 : 1.3}"/>`;
        if (big) ticks += `<text x="${x(n)}" y="78" text-anchor="middle">${n}</text>`;
      }
      const arrow = (v, label) => `<text x="${x(v)}" y="11" text-anchor="middle" class="lbl">${label}</text><path d="M${x(v)} 34 l-6 -11 h12 Z" class="arr"/>`;
      return { key: `l${a},${b}`, intro: 'Welke getallen wijzen de pijlen A en B aan?',
        body: `<svg class="sm-nl" viewBox="0 0 320 86"><line x1="16" x2="304" y1="46" y2="46" stroke="currentColor" stroke-width="2.5"/>${ticks}${arrow(a, 'A')}${arrow(b, 'B')}</svg><div class="sm-eq sm-pair"><span>A = ${slot(0)}</span><span>B = ${slot(1)}</span></div>`,
        speak: 'Welke getallen wijzen de pijlen A en B aan?', answers: [a, b],
        hints: [`Begin bij ${ten(a)} en tel de streepjes.`, `Begin bij ${ten(b)} en tel de streepjes.`],
        explains: [`Pijl A wijst naar ${a}.`, `Pijl B wijst naar ${b}.`] };
    },
    order(L) {
      const base = rnd(0, L - 12), set = new Set();
      while (set.size < 4) set.add(Math.random() < .6 ? rnd(base, base + 12) : rnd(1, L));
      const nums = [...set], big = Math.random() < .5;
      const ans = big ? Math.max(...nums) : Math.min(...nums);
      return { key: `o${nums.join(',')}`, intro: `Welk getal is het ${big ? 'grootst' : 'kleinst'}?`,
        body: `<div class="sm-eq sm-small">${big ? 'Tik op het grootste getal' : 'Tik op het kleinste getal'}</div>`, choices: nums,
        speak: `Welk getal is het ${big ? 'grootst' : 'kleinst'}? ${nums.join(', ')}`, answers: [ans],
        hints: ['Kijk eerst naar de tientallen. Daarna naar de eenheden.'], explains: [`${ans} is het ${big ? 'grootst' : 'kleinst'}.`] };
    }
  };
  const WEIGHTS = [['add', 3], ['sub', 3], ['miss', 2], ['dub', 1], ['pm', 2], ['seq', 2], ['line', 1], ['order', 1]];

  const recent = [];
  function make(level) {
    const L = (LEVELS[level] || LEVELS[2]).max;
    let q;
    for (let i = 0; i < 25; i++) {
      let r = Math.random() * WEIGHTS.reduce((s, w) => s + w[1], 0), type = WEIGHTS[0][0];
      for (const [t, w] of WEIGHTS) { if ((r -= w) < 0) { type = t; break; } }
      q = GEN[type](L);
      if (!recent.includes(q.key)) break;
    }
    recent.push(q.key); if (recent.length > 20) recent.shift();
    return q;
  }

  // ---------- Sound & speech ----------
  let actx;
  const api = { LEVELS, make, soundOn: true };
  api.tones = function (freqs, dur = .12, type = 'sine') {
    if (!api.soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime;
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = t0 + i * dur;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.18, t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur * 1.8);
        o.connect(g).connect(actx.destination);
        o.start(t); o.stop(t + dur * 2);
      });
    } catch (e) {}
  };
  api.speak = function (text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'nl-NL'; u.rate = .9;
      const v = speechSynthesis.getVoices().find(v => (v.lang || '').toLowerCase().startsWith('nl'));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  };

  // ---------- Styles (themed through the page's --q-* tokens) ----------
  const css = `
.sm { display: flex; flex-direction: column; gap: 12px; }
.sm-intro { font-size: 1.15rem; font-weight: 800; color: var(--q-muted, #6b5a4e); margin: 0; text-wrap: balance; }
.sm-box { background: var(--q-soft, #f6f0e8); border-radius: 18px; padding: 16px 10px; display: flex; flex-direction: column; align-items: center; gap: 12px; min-height: 110px; justify-content: center; color: var(--q-ink, #33231a); }
.sm-eq { font-family: var(--q-display, system-ui); font-weight: 600; font-size: clamp(2.1rem, 8vw, 3.1rem); display: flex; align-items: center; gap: .3em; flex-wrap: wrap; justify-content: center; font-variant-numeric: tabular-nums; }
.sm-small { font-size: 1.5rem; }
.sm-pair { gap: .8em; font-size: clamp(1.8rem, 7vw, 2.4rem); }
.sm-pair > span { display: inline-flex; align-items: center; gap: .25em; }
.sm-slot { display: inline-grid; place-items: center; min-width: 2.1em; height: 1.35em; padding: 0 .15em; border-radius: 8px; border-bottom: 5px dotted var(--q-muted, #6b5a4e); color: var(--q-accent, #2b4c9b); cursor: pointer; transition: background .2s, box-shadow .2s; }
.sm-slot.empty::after { content: "?"; color: var(--q-faint, #c8b8a8); }
.sm-slot.active { background: var(--q-card, #fff); box-shadow: 0 0 0 4px var(--q-accent, #2b4c9b); border-bottom-color: transparent; animation: sm-blink 1.2s ease-in-out infinite; }
.sm-slot.right { background: var(--q-good-soft, #e3f2e5); color: var(--q-good, #2e8b47); border-bottom: 5px solid var(--q-good, #2e8b47); box-shadow: none; animation: none; cursor: default; }
.sm-slot.shown { background: var(--q-warn-soft, #fdf0d2); color: #9a6a16; border-bottom: 5px solid #d9a03a; box-shadow: none; animation: none; cursor: default; }
@keyframes sm-blink { 50% { box-shadow: 0 0 0 4px transparent; } }
.sm-seq { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; }
.sm-seq > span { font-family: var(--q-display, system-ui); font-weight: 600; font-size: clamp(1.5rem, 5.5vw, 2.1rem); min-width: 2.1em; height: 1.8em; display: grid; place-items: center; background: var(--q-card, #fff); border: 3px solid var(--q-good, #2e8b47); border-radius: 10px; font-variant-numeric: tabular-nums; }
.sm-seq > .sm-slot { border: 3px dashed var(--q-accent, #2b4c9b); }
.sm-seq > .sm-slot.active { border-style: solid; }
.sm-tbl { display: grid; grid-template-columns: repeat(3, minmax(0, 5rem)); text-align: center; font-family: var(--q-display, system-ui); font-weight: 600; }
.sm-tbl .h { font-size: 1.3rem; color: var(--q-muted, #6b5a4e); padding-bottom: 4px; border-bottom: 3px solid currentColor; }
.sm-tbl .h:nth-child(2) { color: var(--q-ink, #33231a); }
.sm-tbl .c { font-size: 2.1rem; padding: 12px 4px 4px; display: grid; place-items: center; }
.sm-tbl .c + .c { border-left: 3px solid var(--q-ink, #33231a); }
.sm-nl { width: 100%; max-width: 400px; height: auto; color: var(--q-ink, #33231a); }
.sm-nl text { font-family: var(--q-display, system-ui); font-weight: 600; font-size: 14px; fill: currentColor; }
.sm-nl .lbl { fill: var(--q-accent, #2b4c9b); font-size: 15px; }
.sm-nl .arr { fill: var(--q-accent, #2b4c9b); }
.sm-fb { min-height: 2.2em; font-family: var(--q-display, system-ui); font-weight: 600; font-size: 1.2rem; text-align: center; display: grid; place-items: center; text-wrap: balance; }
.sm-fb.good { color: var(--q-good, #2e8b47); } .sm-fb.bad { color: var(--q-bad, #d63b2f); } .sm-fb.hint { color: #9a6a16; }
.sm-shake { animation: sm-shake .4s; }
@keyframes sm-shake { 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
.sm-keys { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.sm-key { border: 0; border-radius: 16px; background: var(--q-card, #fff); color: var(--q-ink, #33231a); box-shadow: 0 4px 0 var(--q-line, #eadbcb), inset 0 0 0 2px var(--q-line, #eadbcb); font-family: var(--q-display, system-ui); font-weight: 600; font-size: 1.9rem; height: 60px; cursor: pointer; }
.sm-key:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--q-line, #eadbcb), inset 0 0 0 2px var(--q-line, #eadbcb); }
.sm-key.del { color: var(--q-bad, #d63b2f); }
.sm-key.ok { background: var(--q-good, #2e8b47); color: #fff; box-shadow: 0 4px 0 var(--q-good-dark, #1f6633); }
.sm-choices { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.sm-choice { border: 0; border-radius: 18px; background: var(--q-card, #fff); color: var(--q-ink, #33231a); box-shadow: 0 5px 0 var(--q-line, #eadbcb), inset 0 0 0 3px var(--q-line, #eadbcb); font-family: var(--q-display, system-ui); font-weight: 600; font-size: 2.1rem; height: 84px; cursor: pointer; }
.sm-choice:disabled { opacity: .35; cursor: default; }
.sm-choice.right { background: var(--q-good, #2e8b47); color: #fff; opacity: 1; }
.sm-next { border: 0; border-radius: 18px; padding: 14px 24px; font-family: var(--q-display, system-ui); font-weight: 700; font-size: 1.4rem; background: var(--q-good, #2e8b47); color: #fff; box-shadow: 0 5px 0 var(--q-good-dark, #1f6633); cursor: pointer; }
.sm button:focus-visible, .sm-slot:focus-visible { outline: 4px solid var(--q-accent, #2b4c9b); outline-offset: 3px; }
@media (max-width: 760px) { .sm-key { height: 52px; font-size: 1.6rem; } .sm-fb { min-height: 1.6em; font-size: 1.1rem; } .sm-box { min-height: 90px; padding: 12px 8px; } .sm-choice { height: 70px; font-size: 1.8rem; } }
@media (prefers-reduced-motion: reduce) { .sm-slot.active, .sm-shake { animation: none; } }
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- Answer pad ----------
  api.quiz = function ({ root, level, onSolved }) {
    root.classList.add('sm');
    root.innerHTML = `<p class="sm-intro"></p><div class="sm-box"></div><div class="sm-fb" aria-live="polite"></div>
      <div class="sm-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => `<button class="sm-key" data-k="${k}">${k}</button>`).join('')}
      <button class="sm-key del" data-k="del" aria-label="Wissen">⌫</button><button class="sm-key" data-k="0">0</button><button class="sm-key ok" data-k="ok" aria-label="Klaar">✓</button></div>
      <div class="sm-choices" hidden></div><button class="sm-next" hidden>Verder ➜</button>`;
    const $ = s => root.querySelector(s);
    const box = $('.sm-box'), fb = $('.sm-fb'), keys = $('.sm-keys'), choices = $('.sm-choices'), next = $('.sm-next');
    let q, vals, done, tries, active, wrong, locked;

    const feedback = (t, cls) => { fb.textContent = t; fb.className = 'sm-fb ' + (cls || ''); };
    const firstOpen = () => done.findIndex(d => d === 0);
    function paint() {
      root.querySelectorAll('.sm-slot').forEach(el => {
        const i = +el.dataset.i;
        el.textContent = vals[i];
        el.classList.toggle('empty', vals[i] === '');
        el.classList.toggle('active', !locked && done[i] === 0 && i === active && q.answers.length > 1);
        el.classList.toggle('right', done[i] === 1);
        el.classList.toggle('shown', done[i] === 2);
      });
    }
    function shake() { box.classList.remove('sm-shake'); void box.offsetWidth; box.classList.add('sm-shake'); }
    function finish(lastWasReveal) {
      locked = true; paint();
      keys.hidden = true;
      if (done.includes(2)) {
        if (!lastWasReveal) feedback('Goed geprobeerd! Kijk nog even naar het oranje vakje.', 'hint');
        next.hidden = false;
        next.focus();
      } else {
        api.tones([523, 659, 784]);
        feedback(pick(['Goed zo!', 'Super!', 'Knap gedaan!', 'Helemaal goed!', 'Top!']) + (wrong === 0 ? ' ⭐' : ''), 'good');
        setTimeout(() => onSolved(wrong === 0), 900);
      }
    }
    function wrongAnswer(i) {
      tries[i]++; wrong++;
      api.tones([240, 190], .13, 'triangle');
      shake();
      if (tries[i] === 1) { feedback('Bijna! Probeer het nog eens.', 'bad'); vals[i] = ''; }
      else if (tries[i] === 2) { feedback('Tip: ' + q.hints[i], 'hint'); vals[i] = ''; }
      else {
        vals[i] = String(q.answers[i]); done[i] = 2;
        feedback('Het is ' + q.answers[i] + '. ' + q.explains[i], 'hint');
        if (q.choices) choices.querySelector(`[data-n="${q.answers[i]}"]`)?.classList.add('right');
        const n = firstOpen();
        if (n < 0) return finish(true);
        active = n;
      }
      paint();
    }
    function check() {
      if (locked) return;
      const i = active;
      if (vals[i] === '') return;
      if (+vals[i] === q.answers[i]) {
        done[i] = 1;
        const n = firstOpen();
        if (n < 0) return finish(false);
        api.tones([660, 880], .08);
        active = n;
        feedback('Goed! Nu het andere vakje.', 'good');
        paint();
      } else wrongAnswer(i);
    }
    function press(k) {
      if (locked || keys.hidden || !q) return;
      if (k === 'ok') return check();
      if (k === 'del') vals[active] = vals[active].slice(0, -1);
      else if (vals[active].length < 2) vals[active] += k;
      api.tones([700], .04);
      paint();
    }

    keys.addEventListener('click', e => { const b = e.target.closest('.sm-key'); if (b) press(b.dataset.k); });
    box.addEventListener('click', e => {
      const s = e.target.closest('.sm-slot');
      if (s && !locked && done[+s.dataset.i] === 0) { active = +s.dataset.i; paint(); }
    });
    choices.addEventListener('click', e => {
      const b = e.target.closest('.sm-choice'); if (!b || b.disabled || locked) return;
      if (+b.dataset.n === q.answers[0]) { done[0] = 1; b.classList.add('right'); finish(false); }
      else { b.disabled = true; wrongAnswer(0); }
    });
    next.addEventListener('click', () => { next.hidden = true; onSolved(false); });
    document.addEventListener('keydown', e => {
      if (!root.offsetParent || keys.hidden || locked) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') { e.preventDefault(); press('ok'); }
      else if (e.key === 'Tab' && q && q.answers.length > 1 && document.activeElement === document.body) {
        e.preventDefault(); const open = done.map((d, i) => d === 0 ? i : -1).filter(i => i >= 0);
        active = open[(open.indexOf(active) + 1) % open.length]; paint();
      }
    });

    return {
      ask() {
        q = make(level());
        vals = q.answers.map(() => ''); done = q.answers.map(() => 0); tries = q.answers.map(() => 0);
        active = 0; wrong = 0; locked = false;
        $('.sm-intro').textContent = q.intro;
        box.innerHTML = q.body;
        keys.hidden = !!q.choices;
        choices.hidden = !q.choices;
        next.hidden = true;
        if (q.choices) choices.innerHTML = q.choices.map(n => `<button class="sm-choice" data-n="${n}">${n}</button>`).join('');
        feedback('');
        paint();
      },
      speak() { if (q) api.speak(q.speak); }
    };
  };

  window.Sommen = api;
})();
