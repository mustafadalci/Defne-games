/* Stad: the shared part of "Defne ve Nisan'ın Şehri": the character's look, Misem, sounds, the city map data,
   walking (with path finding), the HUD and every room. A page draws the map itself (2D SVG in stad.html,
   3D in stad3d.html) and hands that drawing to Stad.boot(renderer). */
(() => {
  const $ = s => document.querySelector(s);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('stad-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('stad-' + k, JSON.stringify(v)); } catch (e) {} }
  };

  // ================= Look of the character =================
  const DEFAULT_LOOK = {
    hair: 'lang', hairColor: '#6B3E26', top: 'tshirt', topColor: '#FF6FA5', bottom: 'rok', bottomColor: '#5B7CFA',
    shoes: 'sneaker', shoeColor: '#FFFFFF', hat: 'geen', hatColor: '#FFD23F', board: 'geen', boardColor: '#7C4DFF', boardArt: 'vlammen', wheelColor: '#FFD23F'
  };
  const NISAN_LOOK = {
    hair: 'krullen', hairColor: '#2B1D14', top: 'streep', topColor: '#2EC4B6', bottom: 'broek', bottomColor: '#FFB703',
    shoes: 'sneaker', shoeColor: '#E0483D', hat: 'strik', hatColor: '#FF6FA5', board: 'geen', boardColor: '#7C4DFF'
  };
  const state = {
    look: Object.assign({}, DEFAULT_LOOK, store.get('look', {})),
    onBoard: store.get('onBoard', false),
    fridge: store.get('fridge', []),
    skateBest: store.get('skateBest', 0)
  };
  Sommen.soundOn = store.get('sound', true);

  const SKIN = '#F3C9A2', CHEEK = '#F49A9A', INK = '#3B2A20';
  const FRINGE = c => `<path d="M-17.5 -81 Q-18 -99 0 -99 Q18 -99 17.5 -81 Q12 -91 3 -88 Q-6 -93 -17.5 -81 Z" fill="${c}"/>`;
  const HAIR = {
    kort: { name: 'Kort', back: () => '', front: c => `<path d="M-17.5 -79 Q-19 -100 0 -100 Q19 -100 17.5 -79 Q16 -88 9 -91 Q0 -86 -9 -91 Q-16 -88 -17.5 -79 Z" fill="${c}"/>` },
    lang: { name: 'Lang', back: c => `<path d="M-18 -84 Q-22 -60 -17 -48 Q0 -44 17 -48 Q22 -60 18 -84 Z" fill="${c}"/>`, front: FRINGE },
    staartjes: { name: 'Staartjes', back: c => `<ellipse cx="-22" cy="-74" rx="6" ry="12" fill="${c}" transform="rotate(22 -22 -74)"/><ellipse cx="22" cy="-74" rx="6" ry="12" fill="${c}" transform="rotate(-22 22 -74)"/>`,
      front: c => FRINGE(c) + `<circle cx="-17" cy="-84" r="3" fill="#FF6FA5"/><circle cx="17" cy="-84" r="3" fill="#FF6FA5"/>` },
    paardenstaart: { name: 'Paardenstaart', back: c => `<path d="M10 -94 Q32 -88 26 -58 Q20 -64 13 -80 Z" fill="${c}"/>`, front: FRINGE },
    knot: { name: 'Knot', back: () => '', front: c => `<circle cx="0" cy="-102" r="8.5" fill="${c}"/>` + FRINGE(c) },
    krullen: { name: 'Krullen', back: c => `<circle cx="-18" cy="-72" r="6.5" fill="${c}"/><circle cx="18" cy="-72" r="6.5" fill="${c}"/><circle cx="-16" cy="-62" r="5.5" fill="${c}"/><circle cx="16" cy="-62" r="5.5" fill="${c}"/>`,
      front: c => [-14, -7, 0, 7, 14].map(x => `<circle cx="${x}" cy="${-93 + Math.abs(x) / 2.5}" r="7.5" fill="${c}"/>`).join('') }
  };
  const HATS = {
    geen: { name: 'Geen', draw: () => '' },
    pet: { name: 'Pet', draw: c => `<path d="M-18 -88 Q-18 -105 0 -105 Q18 -105 18 -88 Z" fill="${c}"/><path d="M4 -89 Q22 -93 27 -86 Q14 -84 4 -86 Z" fill="${c}" stroke="rgba(0,0,0,.2)"/>` },
    muts: { name: 'Muts', draw: c => `<path d="M-18 -86 Q-18 -108 0 -108 Q18 -108 18 -86 Z" fill="${c}"/><rect x="-19" y="-90" width="38" height="7" rx="3" fill="#fff" opacity=".75"/><circle cx="0" cy="-110" r="5" fill="#fff"/>` },
    zonnehoed: { name: 'Zonnehoed', draw: c => `<ellipse cx="0" cy="-90" rx="28" ry="6" fill="${c}"/><path d="M-14 -90 Q-14 -107 0 -107 Q14 -107 14 -90 Z" fill="${c}"/><rect x="-14" y="-95" width="28" height="4" fill="#fff" opacity=".75"/>` },
    kroon: { name: 'Kroon', draw: c => `<path d="M-13 -95 L-13 -109 L-6.5 -101 L0 -111 L6.5 -101 L13 -109 L13 -95 Z" fill="#FFD23F" stroke="#D9A400"/><circle cx="0" cy="-99" r="2.4" fill="${c}"/>` },
    strik: { name: 'Strik', draw: c => `<path d="M9 -95 l10 -7 v14 Z M9 -95 l-10 -7 v14 Z" fill="${c}"/><circle cx="9" cy="-95" r="3" fill="${c}"/>` }
  };
  const TOPS = { tshirt: 'T-shirt', trui: 'Trui', streep: 'Streepjes' };
  const BOTTOMS = { rok: 'Rok', broek: 'Broek', kort: 'Korte broek' };
  const SHOES = { sneaker: 'Sneakers', laarzen: 'Laarzen' };
  const CLOTH_COLORS = ['#FF6FA5', '#E0483D', '#FF9F1C', '#FFD23F', '#2E9E5B', '#2EC4B6', '#5B7CFA', '#7C4DFF', '#FFFFFF', '#2B2B3A'];
  const HAIR_COLORS = ['#2B1D14', '#6B3E26', '#A0612F', '#E8C26A', '#D9542B', '#FF8CC6', '#5BA4FF', '#9B6BFF'];

  function boardSVG(c, wheel = '#333') {
    return `<rect x="-25" y="-8" width="50" height="6" rx="3" fill="${c}" stroke="rgba(0,0,0,.25)"/><circle cx="-15" cy="-1" r="3.2" fill="${wheel}" stroke="#333" stroke-width="1"/><circle cx="15" cy="-1" r="3.2" fill="${wheel}" stroke="#333" stroke-width="1"/>`;
  }

  // A front-facing person; the feet are at (0, 0) and the head top near y = -100.
  function personSVG(L, o = {}) {
    const tc = L.topColor, bc = L.bottomColor, sc = L.shoeColor, legFill = L.bottom === 'broek' ? bc : SKIN;
    const lift = o.board ? 8 : 0, long = L.top === 'trui';
    const shoe = x => L.shoes === 'laarzen'
      ? `<rect x="${x - 5}" y="-17" width="11" height="16" rx="3" fill="${sc}" stroke="rgba(0,0,0,.2)"/>`
      : `<ellipse cx="${x + 1}" cy="-3" rx="6.5" ry="4" fill="${sc}" stroke="rgba(0,0,0,.25)"/>`;
    let s = o.noShadow ? '' : `<ellipse cx="0" cy="0" rx="17" ry="4.5" fill="#000" opacity=".18"/>`;
    if (o.board) s += boardSVG(L.boardColor, L.wheelColor);
    s += `<g transform="translate(0 ${-lift})">`;
    s += (HAIR[L.hair] || HAIR.lang).back(L.hairColor);
    s += `<g class="lg l"><rect x="-9" y="-35" width="7" height="32" rx="3" fill="${legFill}"/>${shoe(-6)}</g>`;
    s += `<g class="lg r"><rect x="2" y="-35" width="7" height="32" rx="3" fill="${legFill}"/>${shoe(5)}</g>`;
    if (L.bottom === 'rok') s += `<path d="M-13 -45 H13 L19 -25 Q0 -21 -19 -25 Z" fill="${bc}"/>`;
    else if (L.bottom === 'kort') s += `<path d="M-13 -45 H13 V-28 H2 V-36 H-2 V-28 H-13 Z" fill="${bc}"/>`;
    else s += `<rect x="-13" y="-45" width="26" height="12" rx="3" fill="${bc}"/>`;
    s += `<rect x="-20" y="-61" width="7" height="23" rx="3.5" fill="${long ? tc : SKIN}"/><rect x="13" y="-61" width="7" height="23" rx="3.5" fill="${long ? tc : SKIN}"/>`;
    s += `<circle cx="-16.5" cy="-37" r="3.7" fill="${SKIN}"/><circle cx="16.5" cy="-37" r="3.7" fill="${SKIN}"/>`;
    s += `<rect x="-14" y="-65" width="28" height="24" rx="7" fill="${tc}" stroke="rgba(0,0,0,.08)"/>`;
    if (!long) s += `<rect x="-21" y="-64" width="9" height="10" rx="4" fill="${tc}"/><rect x="12" y="-64" width="9" height="10" rx="4" fill="${tc}"/>`;
    if (L.top === 'streep') s += `<path d="M-14 -57 H14 M-14 -50 H14" stroke="${tc === '#FFFFFF' ? '#5B7CFA' : '#fff'}" stroke-width="3" opacity=".85"/>`;
    if (L.top === 'trui') s += `<path d="M0 -48 l-4.5 -4.5 a2.6 2.6 0 0 1 4.5 -3.4 a2.6 2.6 0 0 1 4.5 3.4 Z" fill="${tc === '#FFFFFF' ? '#FF6FA5' : '#fff'}" opacity=".9"/>`;
    s += `<circle cx="0" cy="-80" r="17" fill="${SKIN}"/>`;
    s += `<circle cx="-6" cy="-80" r="2.3" fill="${INK}"/><circle cx="6" cy="-80" r="2.3" fill="${INK}"/>`;
    s += `<path d="M-5 -73 Q0 -69 5 -73" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="-10.5" cy="-75" r="2.7" fill="${CHEEK}" opacity=".6"/><circle cx="10.5" cy="-75" r="2.7" fill="${CHEEK}" opacity=".6"/>`;
    s += (HAIR[L.hair] || HAIR.lang).front(L.hairColor);
    s += (HATS[L.hat] || HATS.geen).draw(L.hatColor);
    return s + '</g>';
  }

  // Misem the meerkat: upright, sandy, dark eye patches and a thin tail with a dark tip. Feet at (0, 0).
  function misemSVG() {
    return `<ellipse cx="0" cy="0" rx="10" ry="2.8" fill="#000" opacity=".16"/>
      <path d="M4 -4 Q18 -2 20 -15" stroke="#C99E66" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M19.6 -12 L20.2 -16" stroke="#4A3524" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="-3.6" cy="-1.6" rx="3.6" ry="2" fill="#B88A55"/><ellipse cx="3.6" cy="-1.6" rx="3.6" ry="2" fill="#B88A55"/>
      <ellipse cx="0" cy="-15" rx="8" ry="13.5" fill="#D8B07A"/><ellipse cx="0" cy="-13" rx="5" ry="9" fill="#F2DDB6"/>
      <path d="M-4 -23 Q-7.5 -18 -4 -15 M4 -23 Q7.5 -18 4 -15" stroke="#B88A55" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <circle cx="-6.2" cy="-36" r="2.4" fill="#4A3524"/><circle cx="6.2" cy="-36" r="2.4" fill="#4A3524"/>
      <ellipse cx="0" cy="-32" rx="7.5" ry="7" fill="#D8B07A"/>
      <ellipse cx="0" cy="-28.4" rx="3.8" ry="3.2" fill="#ECCD9C"/>
      <ellipse cx="-3.2" cy="-33.4" rx="2.7" ry="2.2" fill="#4A3524"/><ellipse cx="3.2" cy="-33.4" rx="2.7" ry="2.2" fill="#4A3524"/>
      <circle cx="-2.7" cy="-33.8" r=".95" fill="#fff"/><circle cx="3.7" cy="-33.8" r=".95" fill="#fff"/>
      <circle cx="0" cy="-27.5" r="1.4" fill="#3A2A1A"/>`;
  }

  // A horse seen from the side, facing right; feet at y = 0.
  function horseSVG(o) {
    const b = o.body, m = o.mane;
    const legs = [-30, -18, 18, 30].map(x => `<rect x="${x - 4}" y="-46" width="8" height="44" rx="3" fill="${b}"/><rect x="${x - 4.5}" y="-7" width="9" height="7" rx="2" fill="#3A2A1A"/>`).join('');
    const stripes = o.stripes ? [-30, -18, -6, 6, 18].map(x => `<path d="M${x} -76 Q${x + 5} -58 ${x} -42" stroke="#222" stroke-width="5" fill="none"/>`).join('') : '';
    const ears = o.longEars ? `<path d="M44 -104 L40 -128 L50 -106 Z M50 -104 L52 -128 L56 -104 Z" fill="${b}" stroke="#555" stroke-width="1"/>` : `<path d="M44 -104 L47 -117 L52 -104 Z" fill="${b}"/>`;
    return `<ellipse cx="0" cy="0" rx="42" ry="5" fill="#000" opacity=".15"/>
      <path d="M-40 -62 Q-58 -52 -50 -24" stroke="${m}" stroke-width="8" fill="none" stroke-linecap="round"/>
      ${legs}
      <ellipse cx="0" cy="-58" rx="44" ry="19" fill="${b}"/>${stripes}
      ${o.spots ? `<circle cx="-20" cy="-62" r="5" fill="#fff" opacity=".7"/><circle cx="-6" cy="-52" r="4" fill="#fff" opacity=".7"/><circle cx="-28" cy="-50" r="3.5" fill="#fff" opacity=".7"/>` : ''}
      <path d="M26 -66 L40 -100 L56 -96 L44 -58 Z" fill="${b}"/>
      <ellipse cx="60" cy="-96" rx="17" ry="9.5" fill="${b}" transform="rotate(28 60 -96)"/>
      <path d="M28 -70 Q34 -94 44 -106" stroke="${m}" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${ears}
      <circle cx="56" cy="-100" r="2.3" fill="#2B1D14"/>
      ${o.blaze ? `<path d="M62 -101 Q70 -96 72 -88" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>` : ''}
      <circle cx="71" cy="-87" r="1.4" fill="#2B1D14"/>
      ${o.saddle ? `<path d="M-15 -77 Q0 -83 15 -77 L13 -60 L-13 -60 Z" fill="${o.saddle}"/><path d="M0 -60 V-34" stroke="#6B4A2A" stroke-width="2"/>` : ''}`;
  }
  const DEFNE_HORSE = { body: '#9C5B2E', mane: '#3A2214', blaze: true, saddle: '#E0483D' };
  const BABY_HORSE = { body: '#F2DDB6', mane: '#C79A5B', spots: true, saddle: '#FF6FA5' };

  // A four-legged cat or dog seen from the side, facing right; feet at y = 0.
  function quadSVG(o) {
    const b = o.body, d = o.dark || '#3A2A1A', belly = o.belly || '#F7EAD3';
    const legs = [-26, -14, 14, 24].map(x => `<rect x="${x - 3.5}" y="-27" width="7" height="27" rx="3" fill="${b}"/>`).join('');
    const tail = { up: `M-34 -34 Q-50 -58 -38 -74`, long: `M-34 -34 Q-58 -40 -56 -64`, wag: `M-34 -36 Q-48 -50 -44 -62` }[o.tail || 'long'];
    const ears = o.ears === 'floppy'
      ? `<ellipse cx="29" cy="-50" rx="6" ry="12" fill="${d}" transform="rotate(15 29 -50)"/>`
      : o.ears === 'round' ? `<circle cx="29" cy="-64" r="6" fill="${b}"/><circle cx="46" cy="-64" r="6" fill="${b}"/>`
      : `<path d="M27 -60 L30 -78 L38 -64 Z M41 -64 L48 -78 L50 -60 Z" fill="${b}"/>`;
    const stripes = o.stripes ? [-22, -10, 2, 14].map(x => `<path d="M${x} -50 Q${x + 4} -40 ${x} -28" stroke="${d}" stroke-width="4" fill="none"/>`).join('') : '';
    const spots = o.spots ? [[-22, -40], [-8, -46], [6, -38], [-16, -30], [16, -44], [0, -30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${d}"/>`).join('') : '';
    return `<ellipse cx="0" cy="0" rx="36" ry="4.5" fill="#000" opacity=".15"/>
      <path d="${tail}" stroke="${b}" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${legs}
      <ellipse cx="0" cy="-38" rx="38" ry="16" fill="${b}"/><ellipse cx="4" cy="-28" rx="24" ry="6" fill="${belly}"/>${stripes}${spots}
      ${o.mane ? `<circle cx="36" cy="-54" r="23" fill="${o.mane}"/>` : ''}
      <circle cx="38" cy="-54" r="15" fill="${b}"/>${o.ears === 'floppy' ? '' : ears}
      <ellipse cx="48" cy="-49" rx="8" ry="6" fill="${belly}"/>
      <circle cx="54.5" cy="-51" r="2.6" fill="${d}"/><circle cx="42" cy="-58" r="2.3" fill="#1E1A16"/>
      ${o.tears ? `<path d="M42 -56 Q44 -50 48 -46" stroke="#1E1A16" stroke-width="1.6" fill="none"/>` : ''}
      ${o.whiskers ? `<path d="M52 -48 L64 -51 M52 -46 L64 -45" stroke="${d}" stroke-width="1"/>` : ''}
      ${o.ears === 'floppy' ? ears : ''}`;
  }

  // ================= Sounds =================
  let ac;
  function sweep(points, type = 'sine', vol = .2) {
    if (!Sommen.soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime, end = points[points.length - 1][0];
      o.type = type;
      points.forEach(([t, f], i) => i ? o.frequency.linearRampToValueAtTime(f, t0 + t) : o.frequency.setValueAtTime(f, t0));
      g.gain.setValueAtTime(.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + .03);
      g.gain.setValueAtTime(vol, t0 + Math.max(.04, end - .06));
      g.gain.exponentialRampToValueAtTime(.0001, t0 + end);
      o.connect(g).connect(ac.destination);
      o.start(t0); o.stop(t0 + end + .05);
    } catch (e) {}
  }
  const later = (ms, f) => setTimeout(f, ms);
  const SOUND = {
    kat: () => sweep([[0, 520], [.15, 900], [.5, 430]], 'triangle'),
    hond: () => { sweep([[0, 240], [.12, 160]], 'sawtooth', .22); later(220, () => sweep([[0, 250], [.12, 170]], 'sawtooth', .22)); },
    leeuw: () => sweep([[0, 110], [.3, 160], [1.2, 70]], 'sawtooth', .28),
    tijger: () => sweep([[0, 150], [.25, 120], [.9, 85]], 'sawtooth', .26),
    cheeta: () => [0, 1, 2].forEach(i => later(i * 160, () => sweep([[0, 1300], [.09, 1700]], 'sine', .14))),
    paard: () => sweep([[0, 700], [.12, 950], [.3, 620], [.5, 880], [.7, 560], [1, 420]], 'sawtooth', .13),
    pony: () => sweep([[0, 950], [.1, 1200], [.25, 850], [.45, 1100], [.7, 750]], 'sawtooth', .12),
    ezel: () => { sweep([[0, 520], [.35, 300]], 'sawtooth', .16); later(400, () => sweep([[0, 560], [.4, 280]], 'sawtooth', .16)); },
    zebra: () => sweep([[0, 650], [.2, 400], [.4, 700], [.7, 380]], 'square', .1),
    pop: () => sweep([[0, 500], [.08, 900]], 'sine', .18),
    yay: () => Sommen.tones([523, 659, 784, 1046], .1),
    snip: () => { sweep([[0, 2400], [.05, 1800]], 'square', .06); later(110, () => sweep([[0, 2400], [.05, 1800]], 'square', .06)); },
    whee: () => sweep([[0, 400], [.6, 1200], [1, 600]], 'sine', .14)
  };

  // ================= The city map (world units; the camera scrolls over it) =================
  const W = 2400, H = 1750;
  const PLACES = [
    { id: 'bieb', name: 'Bibliotheek', x: 110, y: 380, w: 340, h: 230, wall: '#8EC5F0', roof: '#3D6FB6', icon: '📚', type: 'flat' },
    { id: 'kapper', name: 'Kapper', x: 560, y: 420, w: 250, h: 190, wall: '#FFC6DD', roof: '#D94C84', icon: '✂️', type: 'flat' },
    { id: 'zoo', name: 'Dierentuin', x: 1380, y: 300, w: 470, h: 310, wall: '#B7E39A', roof: '#3E9A4A', icon: '🦁', type: 'zoo' },
    { id: 'markt', name: 'Supermarkt', x: 1960, y: 400, w: 320, h: 210, wall: '#FFF1B8', roof: '#E0483D', icon: '🛒', type: 'shop' },
    { id: 'huisDefne', name: 'Huis van Defne', x: 110, y: 940, w: 250, h: 190, wall: '#FFD9B8', roof: '#E0483D', icon: '🏠', type: 'house' },
    { id: 'huisNisan', name: 'Huis van Nisan', x: 440, y: 940, w: 250, h: 190, wall: '#D7CCFF', roof: '#6A4CE0', icon: '🏡', type: 'house' },
    { id: 'buren', name: 'De buren', x: 770, y: 940, w: 230, h: 190, wall: '#C9F0E4', roof: '#2E8E7A', icon: '🌷', type: 'house' },
    { id: 'skate', name: 'Skatepark', x: 1380, y: 930, w: 400, h: 200, wall: '#C7CCD6', roof: '#7C4DFF', icon: '🛹', type: 'skate' }
  ];
  const ZONES = {
    speeltuin: { name: 'Speeltuin', x: 130, y: 1260, w: 880, h: 400 },
    manege: { name: 'Manege', x: 1380, y: 1240, w: 900, h: 420 }
  };
  const doorOf = p => ({ x: p.x + p.w / 2, y: p.y + p.h + 16 });

  const PLAY = {
    schommel: { name: 'Schommel', x: 300, y: 1420 },
    glijbaan: { name: 'Glijbaan', x: 540, y: 1430 },
    wip: { name: 'Wip', x: 780, y: 1440 },
    draaimolen: { name: 'Draaimolen', x: 900, y: 1590 },
    zandbak: { name: 'Zandbak', x: 330, y: 1600 }
  };

  const nisanPos = { x: 690, y: 1172 };

  // ================= Moving around =================
  const P = { x: 1200, y: 1430, face: 1, moving: false };
  const M = { x: 1170, y: 1440, face: 1, moving: false };
  const horse = { x: 1650, y: 1470 }, baby = { x: 1780, y: 1500 };
  let riding = false, activity = null, roomOpen = null, introOpen = true;
  const keys = new Set();
  let target = null, onArrive = null;

  const OBST = PLACES.map(p => ({ x: p.x - 10, y: p.y - 30, w: p.w + 20, h: p.h + 34 }));
  const blocked = (x, y, m = 0) => OBST.some(r => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m);

  // Path finding on a 20-unit grid (A*), then shortened to the fewest straight stretches.
  const CELL = 20, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
  const solid = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) solid[gy * GW + gx] = blocked(gx * CELL + CELL / 2, gy * CELL + CELL / 2, 12) ? 1 : 0;
  function clearLine(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8);
    // keep a little room from walls, so a straight stretch never clips a building's corner
    for (let i = 1; i <= n; i++) if (blocked(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, i === n ? 0 : 8)) return false;
    return true;
  }
  function findPath(from, to) {
    if (clearLine(from, to)) return [to];
    const cell = q => Math.min(GW - 1, Math.max(0, Math.floor(q.x / CELL))) + Math.min(GH - 1, Math.max(0, Math.floor(q.y / CELL))) * GW;
    let start = cell(from);
    const goal = cell(to);
    if (solid[goal]) return [to];
    // standing right against a wall: start from the nearest free cell
    if (solid[start]) {
      let best = -1, bd = Infinity;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const x = start % GW + dx, y = Math.floor(start / GW) + dy, j = y * GW + x;
        if (x >= 0 && y >= 0 && x < GW && y < GH && !solid[j] && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = j; }
      }
      if (best >= 0) start = best;
    }
    const g = new Float32Array(GW * GH).fill(Infinity), came = new Int32Array(GW * GH).fill(-1), heap = [];
    const hval = i => Math.hypot(i % GW - goal % GW, Math.floor(i / GW) - Math.floor(goal / GW));
    const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const pk = (k - 1) >> 1; if (heap[pk][0] <= heap[k][0]) break; [heap[pk], heap[k]] = [heap[k], heap[pk]]; k = pk; } };
    const pop = () => { const top = heap[0], end = heap.pop(); if (heap.length) { heap[0] = end; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    g[start] = 0; push(start, hval(start));
    while (heap.length) {
      const [, i] = pop();
      if (i === goal) break;
      const x = i % GW, y = Math.floor(i / GW);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const j = ny * GW + nx; if (solid[j] || (dx && dy && (solid[y * GW + nx] || solid[ny * GW + x]))) continue;
        const ng = g[i] + (dx && dy ? 1.414 : 1);
        if (ng < g[j]) { g[j] = ng; came[j] = i; push(j, ng + hval(j)); }
      }
    }
    if (came[goal] < 0) return [to];
    const pts = [to];
    for (let i = came[goal]; i >= 0; i = came[i]) { pts.unshift({ x: (i % GW) * CELL + CELL / 2, y: Math.floor(i / GW) * CELL + CELL / 2 }); if (i === start) break; }
    const out = []; let cur = from, k = 0;
    while (k < pts.length) {
      let far = k;
      for (let j = pts.length - 1; j > k; j--) if (clearLine(cur, pts[j])) { far = j; break; }
      out.push(pts[far]); cur = pts[far]; k = far + 1;
    }
    return out;
  }
  let route = [];
  function walkTo(x, y, cb) { route = findPath({ x: P.x, y: P.y }, { x, y }); target = route.shift(); onArrive = cb || null; }

  const boardOn = () => state.look.board !== 'geen' && state.onBoard;

  // The page's map drawing: drawPlayer() (look, skateboard or horse changed), update() (every frame while walking),
  // resize(), nisanSays(text) and play(id, done) (a playground activity; call done() when it is over).
  let R = null;

  function step(dt) {
    if (introOpen || roomOpen || activity) return;
    let vx = 0, vy = 0;
    if (keys.size) {
      vx = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      vy = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
      if (vx || vy) { target = null; onArrive = null; route = []; if (R.keyDir) [vx, vy] = R.keyDir(vx, vy); }
    } else if (target) {
      const dx = target.x - P.x, dy = target.y - P.y, d = Math.hypot(dx, dy);
      if (d < 7) { if (route.length) target = route.shift(); else { target = null; const f = onArrive; onArrive = null; if (f) f(); } }
      else { vx = dx / d; vy = dy / d; }
    }
    const len = Math.hypot(vx, vy);
    if (len) {
      vx /= len; vy /= len;
      const sp = (riding ? 270 : boardOn() ? 480 : 175) * dt;
      let nx = P.x + vx * sp, ny = P.y + vy * sp;
      const z = ZONES.manege;
      if (riding) { nx = clamp(nx, z.x + 70, z.x + z.w - 80); ny = clamp(ny, z.y + 120, z.y + z.h - 20); }
      nx = clamp(nx, 30, W - 30); ny = clamp(ny, 110, H - 20);
      const ox = P.x, oy = P.y;
      if (!blocked(nx, ny)) { P.x = nx; P.y = ny; }
      else if (!blocked(nx, P.y)) P.x = nx;
      else if (!blocked(P.x, ny)) P.y = ny;
      if (target && Math.hypot(P.x - ox, P.y - oy) < sp * .2) {
        // stuck against a wall: try the next stretch of the route, or give up
        if (route.length) target = route.shift(); else { target = null; onArrive = null; }
      }
      if (Math.abs(vx) > .2) P.face = vx < 0 ? -1 : 1;
    }
    P.moving = len > 0;
    // Misem follows a little behind.
    const tx = P.x - P.face * (riding ? 80 : 38), ty = P.y + (riding ? 30 : 6);
    const dx = tx - M.x, dy = ty - M.y, d = Math.hypot(dx, dy);
    M.moving = d > 4;
    if (M.moving) {
      const ms = Math.min(d, Math.max(150, d * 5) * dt);
      M.x += dx / d * ms; M.y += dy / d * ms;
      if (Math.abs(dx) > 2) M.face = dx < 0 ? -1 : 1;
    }
    R.update();
    near();
    placeHeadBtn();
  }

  // ================= HUD: what can be done here =================
  let hudKey = '';
  function hud(key, html) {
    if (key === hudKey) return;
    hudKey = key; $('#hud').innerHTML = html;
  }
  let toastTimer;
  function toast(text, ms = 2200) {
    const t = $('#toast'); t.textContent = text; t.classList.remove('gone');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('gone'), ms);
  }
  let lastZone = '', greeted = false;
  function inZone(z, pad = 0) { return P.x > z.x - pad && P.x < z.x + z.w + pad && P.y > z.y - pad && P.y < z.y + z.h + pad; }
  function near() {
    if (riding) return hud('ride', `<button class="act green" data-act="dismount">Afstappen 🐴</button>`);
    const door = PLACES.find(p => { const d = doorOf(p); return Math.hypot(P.x - d.x, P.y - d.y) < 60; });
    if (door) hud('door' + door.id, `<button class="act" data-act="enter" data-place="${door.id}">${door.icon} Naar binnen: ${door.name}</button>`);
    else if (Math.hypot(P.x - horse.x, P.y - horse.y) < 90) hud('horse', `<button class="act" data-act="mount">Op Defne's paard 🐴</button>`);
    else hud('', '');
    const zone = inZone(ZONES.speeltuin) ? 'speeltuin' : inZone(ZONES.manege) ? 'manege' : '';
    if (zone && zone !== lastZone) toast(zone === 'speeltuin' ? 'De speeltuin! Tik op de schommel, glijbaan, wip, draaimolen of zandbak.' : 'De manege! Ga naar Defne\'s paard en stap op.', 3200);
    lastZone = zone;
    if (!greeted && Math.hypot(P.x - nisanPos.x, P.y - nisanPos.y) < 120) { greeted = true; R.nisanSays('Hoi Defne! Hoi Misem!'); }
  }
  function mount() {
    riding = true; target = null;
    P.x = horse.x; P.y = horse.y; M.x = baby.x; M.y = baby.y;
    R.drawPlayer(); SOUND.paard();
    toast('Je rijdt op je paard! Misem rijdt op haar veulen. 🐴', 3000);
  }
  function dismount() {
    riding = false;
    horse.x = P.x; horse.y = P.y;
    baby.x = clamp(M.x, ZONES.manege.x + 60, ZONES.manege.x + ZONES.manege.w - 60); baby.y = M.y;
    P.x = horse.x - 70; P.y = horse.y + 20; M.x = P.x - 36; M.y = P.y + 6;
    R.drawPlayer(); SOUND.pony();
  }

  // ================= Playground activities =================
  function play(id) {
    const p = PLAY[id];
    activity = id; hud('busy', '');
    R.play(id, () => {
      P.x = p.x + (id === 'glijbaan' ? 110 : 0); P.y = p.y + 50; M.x = P.x - 36; M.y = P.y + 6;
      activity = null; hudKey = '-'; R.update();
    });
  }

  // ================= Taps on the map (the page works out what was tapped) =================
  const busy = () => introOpen || !!roomOpen || !!activity;
  const tap = {
    place(id) { if (busy() || riding) return; const p = PLACES.find(q => q.id === id), d = doorOf(p); walkTo(d.x, d.y, () => openRoom(p.id)); },
    play(id) { if (busy() || riding) return; const p = PLAY[id]; walkTo(p.x, p.y + 50, () => play(id)); },
    horse() { if (busy() || riding) return; walkTo(horse.x - 40, horse.y + 10, mount); },
    npc() { if (busy()) return; walkTo(nisanPos.x - 50, nisanPos.y + 6); R.nisanSays(pick(['Hoi Defne!', 'Kom je spelen?', 'Misem is zo lief!', 'Zullen we naar de dierentuin?'])); },
    ground(x, y) { if (busy()) return; if (!$('#headMenu').hidden) return closeHeadMenu(); walkTo(x, y); }
  };

  $('#hud').addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'enter') openRoom(b.dataset.place);
    if (b.dataset.act === 'mount') mount();
    if (b.dataset.act === 'dismount') dismount();
  });
  const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  document.addEventListener('keydown', e => {
    if (ARROWS.includes(e.key)) {
      if (roomOpen === 'skate') return;
      if (!roomOpen && !introOpen) { keys.add(e.key); e.preventDefault(); }
    }
    if ((e.key === 'Enter' || e.key === ' ') && !roomOpen && !introOpen && document.activeElement === document.body) {
      const b = $('#hud [data-act]'); if (b) { e.preventDefault(); b.click(); }
    }
    if (e.key === 'Enter' && introOpen) startCity();
  });
  document.addEventListener('keyup', e => keys.delete(e.key));
  window.addEventListener('blur', () => keys.clear());

  // ================= Rooms =================
  const ROOMS = {};
  function openRoom(id) {
    const p = PLACES.find(q => q.id === id) || SPECIAL_ROOMS[id];
    roomOpen = id; keys.clear(); target = null; closeHeadMenu(); $('#headBtn').hidden = true;
    $('#roomTitle').textContent = `${p.icon} ${p.name}`;
    $('#room').hidden = false; $('#room').style.background = p.wall;
    $('#roomBody').scrollTop = 0;
    ROOMS[id]($('#roomBody'));
    SOUND.pop();
  }
  function closeRoom() {
    if (!roomOpen) return;
    const p = PLACES.find(q => q.id === roomOpen);
    if (roomOpen === 'skate') stopSkate();
    roomOpen = null;
    $('#room').hidden = true; $('#roomBody').innerHTML = '';
    if (p) { const d = doorOf(p); P.x = d.x; P.y = d.y + 40; M.x = P.x - 36; M.y = P.y + 6; }
    hudKey = '-'; R.drawPlayer(); R.update();
  }
  $('#outBtn').addEventListener('click', closeRoom);
  const meBox = (look, w = 220) => `<svg class="preview" style="width:min(100%, ${w}px)" viewBox="-42 -118 84 124" aria-label="Defne">${personSVG(look)}</svg>`;

  // ---- 1. Library ----
  const BOOKS = [
    { who: 'Defne', title: 'Misem en de verloren bal', color: '#FF6FA5', ico: '⚽', pages: [
      ['🐾', 'Misem speelt met haar rode bal in de tuin.'], ['🌳', 'Oei! De bal rolt weg, onder de grote boom.'],
      ['🔍', 'Misem zoekt en zoekt. Ze staat op haar achterpootjes en kijkt rond.'], ['🎉', 'Daar is de bal! Defne geeft Misem een knuffel.'] ] },
    { who: 'Defne', title: 'Defne rijdt paard', color: '#9C5B2E', ico: '🐴', pages: [
      ['🐴', 'Defne heeft een paard. Het paard is bruin met een witte streep.'], ['🥕', 'Eerst krijgt het paard een wortel. Knabbel knabbel!'],
      ['🌾', 'Dan rijden ze samen over het veld. Tik tak, tik tak.'], ['🐎', 'Het kleine veulen van Misem rent mee. Wat een fijne dag!'] ] },
    { who: 'Defne', title: 'De grote pizza', color: '#E0483D', ico: '🍕', pages: [
      ['🍕', 'Defne bakt een pizza. Eerst het deeg, dan de saus.'], ['🧀', 'Dan kaas en salami. En olijven voor Nisan.'],
      ['🔥', 'De pizza gaat de oven in. Mmm, wat ruikt dat lekker!'] ] },
    { who: 'Nisan', title: 'Nisan en de regenboog', color: '#7C4DFF', ico: '🌈', pages: [
      ['🌧️', 'Het regent in de stad. Nisan kijkt uit het raam.'], ['☀️', 'Dan komt de zon. En kijk eens…'],
      ['🌈', 'Een regenboog! Rood, oranje, geel, groen, blauw en paars.'], ['👭', 'Nisan en Defne rennen naar buiten om te springen in de plassen.'] ] },
    { who: 'Nisan', title: 'Nisan in de dierentuin', color: '#2E9E5B', ico: '🦁', pages: [
      ['🦁', 'Nisan ziet een leeuw. Hij brult: ROAAAR!'], ['🐆', 'De cheeta is heel snel. Zoef!'],
      ['🐯', 'De tijger heeft mooie strepen.'], ['🐈', 'Maar het liefst aait Nisan de kleine poes.'] ] },
    { who: 'Nisan', title: 'Het geheime boek', color: '#2EC4B6', ico: '🔑', pages: [
      ['📚', 'In de bibliotheek staat een heel oud boek.'], ['🔑', 'Er zit een sleuteltje in! Waar is dat voor?'],
      ['🎁', 'Het past op een kistje. Daarin zit… een tekening van Defne, Nisan en Misem!'] ] }
  ];
  ROOMS.bieb = body => {
    const shelf = who => `<p class="label">Boeken van ${who}</p><div class="books">${BOOKS.map((b, i) => b.who !== who ? '' :
      `<button class="book" data-book="${i}" style="background:${b.color}"><span class="ico">${b.ico}</span><span>${b.title}</span></button>`).join('')}</div>`;
    body.innerHTML = `<div class="wrap"><p class="lead">Kies een boek uit de kast. Tik erop om het te lezen.</p>
      <div class="panel" style="background:#FFF3E2">${shelf('Defne')}${shelf('Nisan')}</div></div><div class="reader" id="reader" hidden></div>`;
    body.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => readBook(BOOKS[+b.dataset.book], 0)));
  };
  function readBook(book, i) {
    const r = $('#reader'), [pic, text] = book.pages[i], last = i === book.pages.length - 1;
    r.hidden = false;
    r.innerHTML = `<div class="page"><h3>${book.title}</h3><div class="pic" aria-hidden="true">${pic}</div><p>${text}</p>
      <small>Bladzijde ${i + 1} van ${book.pages.length}</small>
      <div class="row"><button class="big" data-p="-1" ${i === 0 ? 'disabled' : ''}>◀</button>
      <button class="big green" data-p="close">${last ? 'Uit! Boek dicht' : 'Dicht'}</button>
      <button class="big" data-p="1" ${last ? 'disabled' : ''}>▶</button></div></div>`;
    r.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.p === 'close') { r.hidden = true; if (last) SOUND.yay(); return; }
      SOUND.pop(); readBook(book, i + +b.dataset.p);
    }));
  }

  // ---- 3. Hairdresser ----
  ROOMS.kapper = body => {
    const render = () => {
      body.innerHTML = `<div class="wrap"><div class="split">
        <div class="panel"><div class="mirror">${meBox(state.look, 260)}</div></div>
        <div class="panel"><p class="label">Kapsel</p><div class="choices">${Object.entries(HAIR).map(([k, h]) => `<button class="chip" data-hair="${k}" aria-pressed="${state.look.hair === k}">${h.name}</button>`).join('')}</div>
        <p class="label">Haarkleur</p><div class="choices">${HAIR_COLORS.map(c => `<button class="sw" data-hc="${c}" style="background:${c}" aria-pressed="${state.look.hairColor === c}" aria-label="Haarkleur"></button>`).join('')}</div>
        <p class="lead">✂️ Knip knip! Kies wat je mooi vindt.</p></div></div></div>`;
      body.querySelectorAll('[data-hair]').forEach(b => b.addEventListener('click', () => { setLook({ hair: b.dataset.hair }); SOUND.snip(); render(); }));
      body.querySelectorAll('[data-hc]').forEach(b => b.addEventListener('click', () => { setLook({ hairColor: b.dataset.hc }); SOUND.pop(); render(); }));
    };
    render();
  };
  function setLook(change) { Object.assign(state.look, change); store.set('look', state.look); }

  // ---- 4. Market ----
  const PRODUCTS = [
    ['🍎', 'Appel', 1], ['🍌', 'Banaan', 2], ['🍞', 'Brood', 3], ['🥛', 'Melk', 2], ['🧀', 'Kaas', 4],
    ['🍦', 'IJsje', 3], ['🥕', 'Wortel', 1], ['🍓', 'Aardbeien', 4], ['🍪', 'Koekjes', 2], ['🦗', 'Krekels voor Misem', 2]
  ];
  ROOMS.markt = body => {
    let basket = [];
    body.innerHTML = `<div class="wrap"><p class="lead">Tik op wat je wilt kopen. Er passen 4 dingen in je mandje.</p>
      <div class="panel"><div class="shop">${PRODUCTS.map(([ico, name, price], i) => `<button class="item" data-i="${i}"><span class="ico">${ico}</span><span>${name}</span><span class="price">€${price}</span></button>`).join('')}</div></div>
      <div class="panel"><p class="label">🧺 Mijn mandje</p><div class="basket" id="basket"></div>
      <div class="row"><button class="big green" id="payBtn" disabled>Afrekenen</button></div><div id="payQuiz" hidden></div></div></div>`;
    const paint = () => {
      $('#basket').innerHTML = basket.length ? basket.map((i, k) => `<button data-k="${k}" aria-label="Haal ${PRODUCTS[i][1]} terug">${PRODUCTS[i][0]}</button>`).join('') : '<span class="empty">Je mandje is nog leeg.</span>';
      $('#payBtn').disabled = !basket.length;
    };
    body.querySelector('.shop').addEventListener('click', e => {
      const b = e.target.closest('.item'); if (!b || !$('#payQuiz').hidden) return;
      if (basket.length >= 4) return toast('Je mandje is vol! Reken eerst af.');
      basket.push(+b.dataset.i); SOUND.pop(); paint();
    });
    $('#basket').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b && $('#payQuiz').hidden) { basket.splice(+b.dataset.k, 1); paint(); } });
    $('#payBtn').addEventListener('click', () => {
      const prices = basket.map(i => PRODUCTS[i][2]), total = prices.reduce((a, b) => a + b, 0);
      $('#payQuiz').hidden = false; $('#payBtn').hidden = true;
      const quiz = Sommen.quiz({ root: $('#payQuiz'), level: () => 1, onSolved: () => {
        state.fridge = state.fridge.concat(basket.map(i => PRODUCTS[i][0])).slice(-16); store.set('fridge', state.fridge);
        SOUND.yay(); toast('Betaald! De boodschappen staan nu in de koelkast thuis. 🏠', 3200);
        basket = []; $('#payQuiz').hidden = true; $('#payBtn').hidden = false; paint();
      } });
      const sum = prices.length === 1 ? `${prices[0]} = ` : prices.join(' + ') + ' = ';
      quiz.ask({ intro: 'Hoeveel euro kost alles samen?', body: `<div class="sm-eq">€ ${sum}${Sommen.slot(0)}</div>`,
        speak: `Hoeveel kost alles samen? ${prices.join(' plus ')}`, answers: [total],
        hints: ['Tel de prijzen één voor één bij elkaar op.'], explains: [`${prices.join(' + ')} = ${total}`] });
    });
    paint();
  };

  // ---- 7. Zoo ----
  const ZOO = [
    { title: 'Katten & honden', bg: '#C9E9A0', animals: [
      { key: 'kat', label: 'Poes', say: 'Miauw!', art: () => quadSVG({ body: '#F2A65A', belly: '#FFE3C2', ears: 'pointy', tail: 'up', stripes: true, dark: '#C46A24', whiskers: true }), s: 1 },
      { key: 'kat', label: 'Kat', say: 'Miauw!', art: () => quadSVG({ body: '#7D8597', belly: '#E5E7EB', ears: 'pointy', tail: 'up', whiskers: true, dark: '#454B57' }), s: .9 },
      { key: 'hond', label: 'Hond', say: 'Woef woef!', art: () => quadSVG({ body: '#C98A4B', belly: '#F4DDBF', ears: 'floppy', tail: 'wag', dark: '#6B4423' }), s: 1.15 },
      { key: 'hond', label: 'Puppy', say: 'Waf!', art: () => quadSVG({ body: '#F4EFE6', belly: '#FFFFFF', ears: 'floppy', tail: 'wag', dark: '#2B2B2B', spots: true }), s: .75 } ] },
    { title: 'Leeuw, cheeta & tijger', bg: '#F1D9A0', animals: [
      { key: 'leeuw', label: 'Leeuw', say: 'ROAAAR!', art: () => quadSVG({ body: '#E2B159', belly: '#F6DFA8', ears: 'round', mane: '#A8611F', tail: 'long', dark: '#5A3410' }), s: 1.4 },
      { key: 'cheeta', label: 'Cheeta', say: 'Tjirp tjirp!', art: () => quadSVG({ body: '#F0C55A', belly: '#FFF1C9', ears: 'round', spots: true, tears: true, tail: 'long', dark: '#2B2117' }), s: 1.2 },
      { key: 'tijger', label: 'Tijger', say: 'Grrrr!', art: () => quadSVG({ body: '#F08A24', belly: '#FFF3E0', ears: 'round', stripes: true, tail: 'long', dark: '#1E1A16' }), s: 1.35 } ] },
    { title: 'Paarden', bg: '#D3EFB1', animals: [
      { key: 'paard', label: 'Paard', say: 'Hihihi!', art: () => horseSVG({ body: '#6B3E1F', mane: '#1E140C', blaze: true }), s: .95 },
      { key: 'pony', label: 'Pony', say: 'Hihi!', art: () => horseSVG({ body: '#E8D7B5', mane: '#A27840', spots: true }), s: .65 },
      { key: 'zebra', label: 'Zebra', say: 'Hie-ha!', art: () => horseSVG({ body: '#FFFFFF', mane: '#222', stripes: true }), s: .85 },
      { key: 'ezel', label: 'Ezel', say: 'Iaa iaa!', art: () => horseSVG({ body: '#9AA0A8', mane: '#4A4F57', longEars: true }), s: .7 } ] }
  ];
  ROOMS.zoo = body => {
    let tab = 0;
    const render = () => {
      const sec = ZOO[tab], n = sec.animals.length, gap = 900 / n;
      const animals = sec.animals.map((a, i) => {
        const x = gap / 2 + i * gap, y = 330 - (i % 2) * 30;
        return `<g class="zoo-animal" data-a="${i}" transform="translate(${x} ${y})"><g><g transform="scale(${a.s})">${a.art()}</g></g>
          <text x="0" y="34" text-anchor="middle" font-size="22" font-weight="700" fill="#2B2B3A">${a.label}</text><g class="say"></g></g>`;
      }).join('');
      const decor = tab === 1 ? `<path d="M620 250 q60 -90 140 -20 q30 30 20 70 h-180 Z" fill="#C9A26B"/><circle cx="120" cy="120" r="34" fill="#FFD23F"/>`
        : tab === 0 ? `<rect x="40" y="200" width="90" height="70" rx="8" fill="#E0483D"/><path d="M30 205 L85 160 L140 205 Z" fill="#9A2E24"/><text x="70" y="255" font-size="26">🦴</text>`
        : `<rect x="760" y="210" width="110" height="70" rx="6" fill="#B5502E"/><path d="M750 214 L815 170 L880 214 Z" fill="#7A3018"/>`;
      body.innerHTML = `<div class="wrap"><div class="tabs" role="tablist">${ZOO.map((s, i) => `<button class="tab" role="tab" aria-selected="${i === tab}" data-t="${i}">${s.title}</button>`).join('')}</div>
        <p class="lead">Tik op een dier!</p>
        <div class="panel" style="padding:8px"><svg class="scene" viewBox="0 0 900 400" style="background:${sec.bg}">
          <rect y="300" width="900" height="100" fill="#000" opacity=".06"/>${decor}
          <path d="M0 380 H900" stroke="#B5793F" stroke-width="10"/>${[...Array(19)].map((_, i) => `<rect x="${i * 50}" y="350" width="10" height="40" fill="#B5793F"/>`).join('')}
          ${animals}</svg></div></div>`;
      body.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { tab = +b.dataset.t; render(); }));
      body.querySelectorAll('.zoo-animal').forEach(g => g.addEventListener('click', () => {
        const a = sec.animals[+g.dataset.a];
        SOUND[a.key]();
        g.classList.remove('hop'); void g.getBBox(); g.classList.add('hop');
        const w = a.say.length * 13 + 30, top = -150 * a.s - 20;
        g.querySelector('.say').innerHTML = `<g class="bubble"><rect x="${-w / 2}" y="${top}" width="${w}" height="42" rx="16" fill="#fff" stroke="#2B2B3A" stroke-opacity=".2" stroke-width="2"/><text x="0" y="${top + 29}" text-anchor="middle" font-size="24" font-weight="700" fill="#D94C84">${a.say}</text></g>`;
        clearTimeout(g._t); g._t = setTimeout(() => { g.querySelector('.say').innerHTML = ''; }, 1600);
      }));
    };
    render();
  };

  // ---- 5. Houses ----
  function roomScene(inner, bg = '#FFE9D6', floor = '#D9A56A') {
    return `<svg class="scene" viewBox="0 0 900 420"><rect width="900" height="300" fill="${bg}"/><rect y="300" width="900" height="120" fill="${floor}"/>
      ${[...Array(9)].map((_, i) => `<path d="M${i * 100} 300 V420" stroke="rgba(0,0,0,.08)" stroke-width="3"/>`).join('')}
      <rect x="380" y="50" width="140" height="110" rx="10" fill="#BFE6FF" stroke="#fff" stroke-width="8"/><path d="M450 50 V160 M380 105 H520" stroke="#fff" stroke-width="6"/>${inner}</svg>`;
  }
  ROOMS.huisDefne = body => {
    const fridgeItems = state.fridge.length ? state.fridge.join(' ') : 'Nog leeg. Ga naar de supermarkt!';
    body.innerHTML = `<div class="wrap"><p class="lead">Thuis bij Defne. Tik op de kledingkast om je om te kleden, of op het bed om te slapen.</p>
      <div class="panel" style="padding:8px;position:relative">${roomScene(`
        <g class="toy" data-t="kast"><rect x="40" y="70" width="170" height="250" rx="10" fill="#C98A4B"/><path d="M125 80 V310" stroke="#8A5A2B" stroke-width="5"/><circle cx="112" cy="200" r="6" fill="#FFD23F"/><circle cx="138" cy="200" r="6" fill="#FFD23F"/><text x="125" y="60" text-anchor="middle" font-size="22" font-weight="700" fill="#5E3A1A">👗 Kledingkast</text></g>
        <g class="toy" data-t="bed"><rect x="600" y="240" width="260" height="70" rx="12" fill="#FF6FA5"/><rect x="600" y="200" width="30" height="120" rx="8" fill="#B5793F"/><rect x="830" y="230" width="30" height="90" rx="8" fill="#B5793F"/><rect x="635" y="222" width="70" height="30" rx="12" fill="#fff"/><path d="M700 240 h150 v20 h-150 Z" fill="#FFD23F" opacity=".7"/></g>
        <g class="toy" data-t="koelkast"><rect x="250" y="120" width="100" height="200" rx="12" fill="#EEF4FA" stroke="#B9C3D1" stroke-width="4"/><path d="M250 190 H350" stroke="#B9C3D1" stroke-width="4"/><rect x="330" y="140" width="6" height="30" rx="3" fill="#8C97A6"/><text x="300" y="112" text-anchor="middle" font-size="20" font-weight="700" fill="#5E3A1A">🧊 Koelkast</text></g>
        <g><ellipse cx="540" cy="350" rx="60" ry="20" fill="#B5793F"/><ellipse cx="540" cy="344" rx="48" ry="13" fill="#F2DDB6"/><g transform="translate(540 348) scale(1.6)">${misemSVG()}</g><text x="540" y="400" text-anchor="middle" font-size="18" font-weight="700" fill="#5E3A1A">Mandje van Misem</text></g>
        <rect class="night" id="night" width="900" height="420" fill="#1B1F4A" opacity="0" pointer-events="none"/>`)}</div>
      <div class="panel" id="fridgePanel" hidden><p class="label">In de koelkast</p><p class="lead" style="font-size:2rem">${fridgeItems}</p></div>
      </div>`;
    body.querySelectorAll('.toy').forEach(t => t.addEventListener('click', () => {
      t.classList.remove('wiggle'); void t.getBBox(); t.classList.add('wiggle');
      if (t.dataset.t === 'kast') wardrobe(body, () => ROOMS.huisDefne(body));
      if (t.dataset.t === 'koelkast') { $('#fridgePanel').hidden = !$('#fridgePanel').hidden; SOUND.pop(); }
      if (t.dataset.t === 'bed') {
        const n = $('#night'); n.style.opacity = .7; sweep([[0, 500], [1.2, 300]], 'sine', .1);
        toast('Zzz… Slaap lekker, Defne en Misem! 🌙', 2000); setTimeout(() => { n.style.opacity = 0; toast('Goedemorgen! ☀️'); }, 2200);
      }
    }));
  };

  // ---- Wardrobe: real clothes on a rail and shelves; drag one onto Defne (or tap it) to put it on ----
  const CLOSET = {
    top: { label: '👕 Shirts', items: [['tshirt', '#FF6FA5'], ['tshirt', '#5B7CFA'], ['tshirt', '#FFFFFF'], ['trui', '#FFD23F'], ['trui', '#7C4DFF'], ['trui', '#2E9E5B'], ['streep', '#2EC4B6'], ['streep', '#E0483D']].map(([top, topColor]) => ({ top, topColor })) },
    bottom: { label: '👖 Broeken & rokken', items: [['rok', '#5B7CFA'], ['rok', '#FF6FA5'], ['rok', '#7C4DFF'], ['broek', '#3B5BA9'], ['broek', '#2B2B3A'], ['kort', '#FFD23F'], ['kort', '#E0483D']].map(([bottom, bottomColor]) => ({ bottom, bottomColor })) },
    shoes: { label: '👟 Schoenen', items: [['sneaker', '#FFFFFF'], ['sneaker', '#FF6FA5'], ['sneaker', '#2B2B3A'], ['laarzen', '#B5793F'], ['laarzen', '#E0483D']].map(([shoes, shoeColor]) => ({ shoes, shoeColor })) },
    hat: { label: '🎩 Hoeden', items: [['geen', '#FFD23F'], ['pet', '#E0483D'], ['muts', '#5B7CFA'], ['zonnehoed', '#FFD23F'], ['kroon', '#FF6FA5'], ['strik', '#FF6FA5']].map(([hat, hatColor]) => ({ hat, hatColor })) }
  };
  function itemSVG(kind, it) {
    const ol = 'stroke="rgba(0,0,0,.35)" stroke-width="1.6"';
    if (kind === 'top') {
      const c = it.topColor, long = it.top === 'trui';
      return `<path d="M0 -26 q0 -6 6 -6 M0 -26 v4" stroke="#8A8F99" stroke-width="2" fill="none"/>
        <path d="M-20 -14 L-8 -21 Q0 -16 8 -21 L20 -14 L${long ? 26 : 22} ${long ? 10 : -4} L14 ${long ? 12 : -1} L14 22 L-14 22 L-14 ${long ? 12 : -1} L${long ? -26 : -22} ${long ? 10 : -4} Z" fill="${c}" ${ol}/>
        ${it.top === 'streep' ? `<path d="M-14 0 H14 M-14 9 H14" stroke="${c === '#FFFFFF' ? '#5B7CFA' : '#fff'}" stroke-width="3.5"/>` : ''}
        ${long ? `<path d="M0 8 l-4 -4 a2.5 2.5 0 0 1 4 -3 a2.5 2.5 0 0 1 4 3 Z" fill="#fff" opacity=".85"/>` : ''}`;
    }
    if (kind === 'bottom') {
      const c = it.bottomColor;
      if (it.bottom === 'rok') return `<path d="M-12 -16 H12 L20 14 Q0 20 -20 14 Z" fill="${c}" ${ol}/><rect x="-12" y="-18" width="24" height="5" rx="2" fill="${c}" ${ol}/>`;
      const len = it.bottom === 'kort' ? 2 : 22;
      return `<path d="M-14 -18 H14 L15 ${len} H3 L1 -4 H-1 L-3 ${len} H-15 Z" fill="${c}" ${ol}/>`;
    }
    if (kind === 'shoes') {
      const c = it.shoeColor;
      const one = x => it.shoes === 'laarzen' ? `<path d="M${x - 6} -14 h10 v18 h6 q2 6 -2 6 h-14 Z" fill="${c}" ${ol}/>` : `<path d="M${x - 8} 2 q0 -10 8 -10 q4 0 6 4 l8 2 q3 2 2 6 h-24 Z" fill="${c}" ${ol}/><path d="M${x - 8} 4 h24" stroke="#fff" stroke-width="2"/>`;
      return one(-10) + one(8);
    }
    if (it.hat === 'geen') return `<text x="0" y="6" text-anchor="middle" font-size="13" font-weight="700" fill="#5E3A1A">Zonder</text><text x="0" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#5E3A1A">hoed</text>`;
    return `<g transform="translate(0 90) scale(.9)">${HATS[it.hat].draw(it.hatColor)}</g>`;
  }
  const wearing = (kind, it) => Object.keys(it).every(k => state.look[k] === it[k]);

  function wardrobe(body, back) {
    const shelves = Object.entries(CLOSET).map(([kind, sec]) => `<p class="shelf-label">${sec.label}</p>
      <div class="shelf ${kind === 'top' ? 'rail' : ''}">${sec.items.map((it, i) => `<button class="cloth" data-kind="${kind}" data-i="${i}" aria-pressed="${wearing(kind, it)}" aria-label="${sec.label}">
        <svg viewBox="-30 -34 60 60">${itemSVG(kind, it)}</svg></button>`).join('')}</div>`).join('');
    body.innerHTML = `<div class="wrap">
      <button class="big board-btn" id="toBoard">🛹 Mijn skateboard</button>
      <div class="split">
        <div class="panel dropzone" id="dropMe"><div id="mePreview">${meBox(state.look, 250)}</div><p class="lead" style="text-align:center">Sleep kleren naar Defne, of tik erop.</p></div>
        <div class="closet">${shelves}</div>
      </div>
      <div class="row"><button class="big green" id="wBack">${back ? '← Terug naar de kamer' : '✓ Klaar'}</button></div></div>`;
    body.scrollTop = 0;
    const wear = (kind, i) => {
      setLook(CLOSET[kind].items[i]); SOUND.pop();
      $('#mePreview').innerHTML = meBox(state.look, 250);
      $('#mePreview').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06) rotate(-2deg)' }, { transform: 'scale(1)' }], { duration: 350 });
      body.querySelectorAll('.cloth').forEach(b => b.setAttribute('aria-pressed', String(wearing(b.dataset.kind, CLOSET[b.dataset.kind].items[+b.dataset.i]))));
    };
    // drag & drop with a ghost that follows the finger
    let drag = null;
    const zone = $('#dropMe'), overZone = (x, y) => { const r = zone.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; };
    body.querySelectorAll('.cloth').forEach(b => b.addEventListener('pointerdown', e => {
      drag = { b, x0: e.clientX, y0: e.clientY, ghost: null }; b.setPointerCapture(e.pointerId);
    }));
    body.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.ghost && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
        drag.ghost = drag.b.querySelector('svg').cloneNode(true); drag.ghost.classList.add('ghost'); document.body.appendChild(drag.ghost);
      }
      if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; zone.classList.toggle('over', overZone(e.clientX, e.clientY)); }
    });
    const end = e => {
      if (!drag) return;
      const { b, ghost } = drag; drag = null;
      zone.classList.remove('over');
      if (ghost) { ghost.remove(); if (overZone(e.clientX, e.clientY)) wear(b.dataset.kind, +b.dataset.i); }
      else wear(b.dataset.kind, +b.dataset.i);
    };
    body.addEventListener('pointerup', end); body.addEventListener('pointercancel', () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; zone.classList.remove('over'); });
    $('#toBoard').addEventListener('click', () => boardShop(body, () => wardrobe(body, back)));
    $('#wBack').addEventListener('click', () => back ? back() : closeRoom());
  }

  // ---- Skateboard workshop: top colour, the design underneath, wheels; flip the board to see the bottom ----
  const ARTS = {
    effen: { name: 'Effen', draw: c => '' },
    vlammen: { name: 'Vlammen', draw: () => [0, 1, 2, 3, 4].map(i => `<path d="M${30 + i * 50} 80 q-12 -30 8 -52 q-2 22 14 28 q4 -16 -2 -30 q26 20 10 54 Z" fill="${i % 2 ? '#FF9F1C' : '#E0483D'}"/><path d="M${40 + i * 50} 80 q-4 -16 6 -24 q4 12 6 24 Z" fill="#FFD23F"/>`).join('') },
    sterren: { name: 'Sterren', draw: () => [[50, 30], [100, 60], [150, 25], [200, 58], [250, 32], [75, 66], [225, 18]].map(([x, y], i) => `<path transform="translate(${x} ${y}) scale(${i % 2 ? .7 : 1})" d="M0 -12 L3.5 -4 L12 -3.7 L5.5 2 L7.4 10.5 L0 6 L-7.4 10.5 L-5.5 2 L-12 -3.7 L-3.5 -4 Z" fill="#FFD23F" stroke="#fff" stroke-width="1"/>`).join('') },
    regenboog: { name: 'Regenboog', draw: () => ['#E84A3F', '#F39A2D', '#F6D23C', '#4FB858', '#3F8FDB', '#8C5BD1'].map((c, i) => `<rect x="0" y="${i * 15}" width="300" height="15" fill="${c}"/>`).join('') },
    hartjes: { name: 'Hartjes', draw: () => [[60, 45], [120, 30], [180, 58], [240, 40], [95, 70], [210, 18]].map(([x, y], i) => `<path transform="translate(${x} ${y}) scale(${i % 2 ? .8 : 1.1})" d="M0 10 L-12 -2 A6.5 6.5 0 0 1 0 -9 A6.5 6.5 0 0 1 12 -2 Z" fill="${i % 2 ? '#FFFFFF' : '#FF4F8B'}"/>`).join('') },
    bliksem: { name: 'Bliksem', draw: () => `<path d="M40 45 L120 20 L110 42 L190 30 L175 50 L260 45 L150 72 L165 52 L90 62 L100 44 Z" fill="#FFD23F" stroke="#2B2B3A" stroke-width="3" stroke-linejoin="round"/>` },
    misem: { name: 'Misem', draw: () => `<g transform="translate(150 70) scale(1.6)">${misemSVG()}</g><text x="60" y="54" font-size="26" font-weight="700" fill="#fff" font-family="Fredoka, sans-serif">MISEM</text>` },
    dambord: { name: 'Dambord', draw: () => [...Array(40)].map((_, i) => (Math.floor(i / 10) + i) % 2 ? `<rect x="${(i % 10) * 30}" y="${Math.floor(i / 10) * 22.5}" width="30" height="22.5" fill="#2B2B3A"/>` : '').join('') }
  };
  const BOARD_SHAPE = 'M45 5 H255 A40 40 0 0 1 255 85 H45 A40 40 0 0 1 45 5 Z';
  function deckSVG(L, side, id) {
    const art = ARTS[L.boardArt] || ARTS.effen, c = L.boardColor;
    if (side === 'top') return `<svg viewBox="0 0 300 90"><path d="${BOARD_SHAPE}" fill="${c}" stroke="rgba(0,0,0,.3)" stroke-width="3"/>
      ${[70, 230].map(x => [35, 55].map(y => `<circle cx="${x + (y > 45 ? 8 : -8)}" cy="${y}" r="3" fill="#C9CED6"/>`).join('')).join('')}</svg>`;
    const wheels = [70, 230].map(x => `<rect x="${x - 10}" y="18" width="20" height="54" rx="6" fill="#B9C0CC"/><rect x="${x - 9}" y="4" width="18" height="18" rx="5" fill="${L.wheelColor}" stroke="#333" stroke-width="1.5"/><rect x="${x - 9}" y="68" width="18" height="18" rx="5" fill="${L.wheelColor}" stroke="#333" stroke-width="1.5"/>`).join('');
    return `<svg viewBox="0 0 300 90"><defs><clipPath id="${id}"><path d="${BOARD_SHAPE}"/></clipPath></defs>
      <path d="${BOARD_SHAPE}" fill="${c}"/><g clip-path="url(#${id})">${art.draw(c)}</g><path d="${BOARD_SHAPE}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="3"/>${wheels}</svg>`;
  }
  function boardShop(body, back) {
    let flipped = false;
    const paint = () => {
      const L = state.look, has = L.board !== 'geen';
      body.innerHTML = `<div class="wrap">
        <div class="panel" style="align-items:center"><p class="label" style="font-size:1.4rem">🛹 Mijn skateboard</p>
          <div class="deck-stage"><div class="deck ${flipped ? 'flipped' : ''}" id="deck"><div class="face">${deckSVG(L, 'top')}</div><div class="face back">${deckSVG(L, 'bottom', 'deckClip')}</div></div></div>
          <button class="big" id="flip">🔄 Draai om · nu: ${flipped ? 'onderkant' : 'bovenkant'}</button></div>
        <div class="panel"><p class="label">Kleur van het board</p><div class="choices">${CLOTH_COLORS.map(c => `<button class="sw" data-f="boardColor" data-v="${c}" style="background:${c}" aria-pressed="${L.boardColor === c}" aria-label="Kleur"></button>`).join('')}</div>
          <p class="label">Onderkant</p><div class="arts">${Object.entries(ARTS).map(([k, a]) => `<button class="art" data-f="boardArt" data-v="${k}" aria-pressed="${L.boardArt === k}">${deckSVG(Object.assign({}, L, { boardArt: k }), 'bottom', 'mini' + k)}<span>${a.name}</span></button>`).join('')}</div>
          <p class="label">Wieltjes</p><div class="choices">${['#FFD23F', '#FFFFFF', '#FF6FA5', '#2EC4B6', '#2B2B3A', '#E0483D'].map(c => `<button class="sw" data-f="wheelColor" data-v="${c}" style="background:${c}" aria-pressed="${L.wheelColor === c}" aria-label="Wielkleur"></button>`).join('')}</div></div>
        <div class="row"><button class="big green" id="take">${has ? (state.onBoard ? '✓ Ik sta op mijn skateboard' : '🛹 Op mijn skateboard!') : '🛹 Pak mijn skateboard!'}</button>
          ${has ? '<button class="big" id="stash">Skateboard opbergen</button>' : ''}<button class="big" id="bBack">← Terug</button></div></div>`;
      body.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
        setLook({ [b.dataset.f]: b.dataset.v }); SOUND.pop();
        if (b.dataset.f === 'boardArt') flipped = true;
        paint();
      }));
      $('#flip').addEventListener('click', () => { flipped = !flipped; $('#deck').classList.toggle('flipped', flipped); $('#flip').textContent = `🔄 Draai om · nu: ${flipped ? 'onderkant' : 'bovenkant'}`; SOUND.whee(); });
      $('#take').addEventListener('click', () => { setLook({ board: 'ja' }); state.onBoard = true; store.set('onBoard', true); SOUND.yay(); toast('Je hebt je skateboard! Zoef! 🛹', 2400); paint(); });
      if ($('#stash')) $('#stash').addEventListener('click', () => { setLook({ board: 'geen' }); state.onBoard = false; store.set('onBoard', false); SOUND.pop(); paint(); });
      $('#bBack').addEventListener('click', back);
    };
    paint(); body.scrollTop = 0;
  }
  ROOMS.kast = body => wardrobe(body, null);
  const SPECIAL_ROOMS = { kast: { name: 'Kledingkast', icon: '👗', wall: '#FFE3EE' } };

  // ---- The button above Defne's head (like a name tag): opens a small menu ----
  function placeHeadBtn() {
    const b = $('#headBtn'); if (!b) return;
    const pos = !roomOpen && !introOpen && !activity && R.headScreen ? R.headScreen() : null;
    b.hidden = !pos;
    if (pos) { b.style.left = pos.x + 'px'; b.style.top = pos.y + 'px'; const m = $('#headMenu'); if (!m.hidden) { m.style.left = pos.x + 'px'; m.style.top = pos.y + 'px'; } }
  }
  function closeHeadMenu() { const m = $('#headMenu'); if (m) m.hidden = true; }
  function headMenu() {
    const m = $('#headMenu'), has = state.look.board !== 'geen';
    if (!m.hidden) return closeHeadMenu();
    m.innerHTML = `<button data-hm="kast">👗 Kleren</button>
      <button data-hm="board">🛹 ${has ? (state.onBoard ? 'Van het skateboard' : 'Op het skateboard') : 'Skateboard maken'}</button>
      ${riding ? '' : '<button data-hm="home">🏠 Naar huis</button>'}`;
    m.hidden = false; placeHeadBtn(); SOUND.pop();
  }
  function headAction(a) {
    closeHeadMenu();
    if (a === 'kast') openRoom('kast');
    if (a === 'board') {
      if (state.look.board === 'geen') { openRoom('kast'); boardShop($('#roomBody'), () => wardrobe($('#roomBody'), null)); }
      else { state.onBoard = !state.onBoard; store.set('onBoard', state.onBoard); R.drawPlayer(); }
    }
    if (a === 'home') tap.place('huisDefne');
  }

  ROOMS.huisNisan = body => {
    const keysSvg = [0, 1, 2, 3, 4, 5, 6].map(i => `<rect class="key" data-n="${i}" x="${600 + i * 34}" y="200" width="32" height="90" rx="4" fill="#fff" stroke="#2B2B3A" stroke-width="2"/>`).join('');
    body.innerHTML = `<div class="wrap"><p class="lead">Nisan is thuis! Speel met haar speelgoed: de bal, de beer, de trommel en de piano.</p>
      <div class="panel" style="padding:8px">${roomScene(`
        <g transform="translate(300 330)">${personSVG(NISAN_LOOK)}</g>
        <g class="toy" data-t="bal"><circle cx="160" cy="330" r="34" fill="#E0483D"/><path d="M126 330 H194 M160 296 Q140 330 160 364" stroke="#fff" stroke-width="5" fill="none"/></g>
        <g class="toy" data-t="beer"><circle cx="460" cy="300" r="34" fill="#B5793F"/><circle cx="436" cy="268" r="12" fill="#B5793F"/><circle cx="484" cy="268" r="12" fill="#B5793F"/><ellipse cx="460" cy="352" rx="30" ry="26" fill="#B5793F"/><circle cx="450" cy="296" r="3.5" fill="#222"/><circle cx="470" cy="296" r="3.5" fill="#222"/><ellipse cx="460" cy="310" rx="9" ry="7" fill="#E9C99B"/></g>
        <g class="toy" data-t="trommel"><ellipse cx="80" cy="250" rx="45" ry="14" fill="#F6E7C8"/><rect x="35" y="250" width="90" height="60" fill="#5B7CFA"/><ellipse cx="80" cy="310" rx="45" ry="14" fill="#5B7CFA"/><path d="M40 255 L80 305 L120 255" stroke="#FFD23F" stroke-width="4" fill="none"/></g>
        <g><rect x="590" y="180" width="258" height="130" rx="10" fill="#2B2B3A"/>${keysSvg}<text x="719" y="170" text-anchor="middle" font-size="20" font-weight="700" fill="#5E3A1A">🎹 Piano</text></g>
        <g id="heart"></g>`, '#E9E2FF', '#C9A57A')}</div></div>`;
    body.querySelectorAll('.key').forEach(k => k.addEventListener('click', () => {
      Sommen.tones([[262, 294, 330, 349, 392, 440, 494][+k.dataset.n]], .25);
      k.setAttribute('fill', '#FFD23F'); setTimeout(() => k.setAttribute('fill', '#fff'), 200);
    }));
    body.querySelectorAll('.toy').forEach(t => t.addEventListener('click', () => {
      t.classList.remove('wiggle'); void t.getBBox(); t.classList.add('wiggle');
      if (t.dataset.t === 'bal') { t.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-80px)' }, { transform: 'translateY(0)' }], { duration: 600, easing: 'ease-out' }); SOUND.pop(); }
      if (t.dataset.t === 'beer') { $('#heart').innerHTML = `<text class="bubble" x="440" y="240" font-size="40">💖</text>`; setTimeout(() => { $('#heart').innerHTML = ''; }, 1200); SOUND.pop(); }
      if (t.dataset.t === 'trommel') [0, 180, 360].forEach(ms => later(ms, () => sweep([[0, 140], [.12, 60]], 'sine', .35)));
    }));
  };

  ROOMS.buren = body => {
    let slices = 6;
    body.innerHTML = `<div class="wrap"><p class="lead">De buurvrouw heeft taart gebakken en haar kat ligt te slapen. Tik maar!</p>
      <div class="panel" style="padding:8px">${roomScene(`
        <g transform="translate(200 360)"><rect x="-120" y="-60" width="240" height="14" rx="6" fill="#B5793F"/><rect x="-110" y="-46" width="12" height="46" fill="#8A5A2B"/><rect x="98" y="-46" width="12" height="46" fill="#8A5A2B"/>
          <g class="toy" data-t="taart"><ellipse cx="0" cy="-64" rx="70" ry="12" fill="#fff"/><g id="cake"></g></g></g>
        <g class="toy" data-t="kat" transform="translate(640 360)"><ellipse cx="0" cy="-6" rx="80" ry="22" fill="#E0483D" opacity=".8"/><g transform="scale(1.3)">${quadSVG({ body: '#4A4F57', belly: '#9AA0A8', ears: 'pointy', tail: 'long', whiskers: true, dark: '#2A2D33' })}</g><g id="zzz"><text x="70" y="-110" font-size="28">💤</text></g></g>
        <g transform="translate(470 330)"><rect x="-26" y="-10" width="52" height="40" rx="6" fill="#C8693E"/><circle cx="0" cy="-30" r="30" fill="#3E9A4A"/><circle cx="-10" cy="-40" r="7" fill="#FF6FA5"/><circle cx="12" cy="-30" r="7" fill="#FFD23F"/></g>`, '#DDF5EC', '#C9A57A')}</div></div>`;
    const cake = () => { $('#cake').innerHTML = slices ? `<path d="M-60 -64 a60 10 0 0 0 120 0 v-40 a60 10 0 0 0 -120 0 Z" fill="#FFB5CC"/><ellipse cx="0" cy="-104" rx="60" ry="10" fill="#FFE0EA"/>${[...Array(slices)].map((_, i) => `<circle cx="${-45 + i * 18}" cy="-106" r="5" fill="#E0483D"/>`).join('')}` : `<text x="-30" y="-74" font-size="26">😋</text>`; };
    cake();
    body.querySelectorAll('.toy').forEach(t => t.addEventListener('click', () => {
      t.classList.remove('wiggle'); void t.getBBox(); t.classList.add('wiggle');
      if (t.dataset.t === 'taart') { if (slices) { slices--; toast(slices ? 'Mmm, lekker! Nog ' + slices + ' stukjes.' : 'De taart is op! 😋'); SOUND.pop(); } cake(); }
      if (t.dataset.t === 'kat') { SOUND.kat(); $('#zzz').innerHTML = `<text class="bubble" x="60" y="-110" font-size="24" font-weight="700" fill="#D94C84">Miauw?</text>`; setTimeout(() => { $('#zzz').innerHTML = `<text x="70" y="-110" font-size="28">💤</text>`; }, 1500); }
    }));
  };

  // ---- 2. Skate park: a half-pipe seen from the side ----
  let skate = null;
  ROOMS.skate = body => {
    if (state.look.board === 'geen') {
      body.innerHTML = `<div class="wrap"><div class="panel" style="align-items:center;text-align:center"><p class="lead" style="font-size:1.4rem">🛹 Je hebt een skateboard nodig!</p>
        <p class="lead">Kies er een in de kledingkast in het huis van Defne. Of leen er nu een.</p><button class="big" id="lend">Leen een skateboard</button></div></div>`;
      $('#lend').addEventListener('click', () => { setLook({ board: 'ja' }); state.onBoard = true; store.set('onBoard', true); SOUND.yay(); ROOMS.skate(body); });
      return;
    }
    // u runs from -1 (left lip) to 1 (right lip); the ramp height h(u) rises from the flat middle.
    const X = u => 450 + u * 340, Hh = u => { const a = Math.abs(u); return a < .35 ? 0 : 250 * ((a - .35) / .65) ** 2; };
    const slope = u => { const a = Math.abs(u); return a < .35 ? 0 : Math.sign(u) * 500 * (a - .35) / (.65 * .65); };
    let path = '';
    for (let i = 0; i <= 100; i++) { const u = -1 + i / 50; path += (i ? 'L' : 'M') + X(u).toFixed(1) + ' ' + (380 - Hh(u)).toFixed(1); }
    body.innerHTML = `<div class="wrap"><p class="lead">Houd ◀ of ▶ ingedrukt om steeds hoger te gaan. Vlieg je boven de rand uit? Doe dan snel een trucje!</p>
      <div class="panel skate-wrap" style="padding:8px"><svg class="scene" viewBox="0 0 900 420" style="background:linear-gradient(#BFE6FF,#E8F6FF)">
        <rect x="0" y="380" width="900" height="40" fill="#9AA2B1"/>
        <path d="${path} L790 420 L110 420 Z" fill="#C7CCD6"/><path d="${path}" fill="none" stroke="#6E7685" stroke-width="8"/>
        <rect x="70" y="118" width="40" height="302" fill="#C7CCD6"/><rect x="790" y="118" width="40" height="302" fill="#C7CCD6"/>
        <path d="M70 130 H110 M790 130 H830" stroke="#E0483D" stroke-width="6"/>
        <text x="450" y="250" text-anchor="middle" font-size="48" fill="#FF6FA5" opacity=".35" font-weight="700">SKATE</text>
        <g id="sk"><g id="skRot"><g id="skBoard">${boardSVG(state.look.boardColor, state.look.wheelColor)}</g><g id="skBody" transform="translate(0 -8)">${personSVG(state.look, { noShadow: true })}</g></g></g>
      </svg><div id="trickMsg"></div></div>
      <div class="panel"><div class="score">Punten: <span id="skScore">0</span> · Record: <span id="skBest">${state.skateBest}</span></div>
      <div class="pump"><button class="big" id="pumpL" aria-label="Naar links">◀</button><button class="big" id="pumpR" aria-label="Naar rechts">▶</button></div>
      <div class="row"><button class="big green" data-trick="draai">🔄 Draai</button><button class="big green" data-trick="flip">🛹 Flip</button><button class="big green" data-trick="grab">✋ Grab</button></div></div></div>`;
    skate = { u: 0, v: 0, air: false, y: 0, vy: 0, side: 1, push: 0, trick: null, tt: 0, score: 0, raf: 0, last: 0, X, Hh, slope };
    const hold = (el, dir) => {
      const on = e => { e.preventDefault(); skate.push = dir; }, off = () => { if (skate.push === dir) skate.push = 0; };
      el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
    };
    hold($('#pumpL'), -1); hold($('#pumpR'), 1);
    body.querySelectorAll('[data-trick]').forEach(b => b.addEventListener('click', () => trick(b.dataset.trick)));
    skate.keydown = e => { if (e.key === 'ArrowLeft') skate.push = -1; if (e.key === 'ArrowRight') skate.push = 1; if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); trick(pick(['draai', 'flip', 'grab'])); } };
    skate.keyup = e => { if ((e.key === 'ArrowLeft' && skate.push === -1) || (e.key === 'ArrowRight' && skate.push === 1)) skate.push = 0; };
    document.addEventListener('keydown', skate.keydown); document.addEventListener('keyup', skate.keyup);
    skate.raf = requestAnimationFrame(skateLoop);
  };
  function trick(kind) {
    if (!skate) return;
    if (!skate.air) return msg('Eerst hoog vliegen!');
    if (skate.trick) return;
    skate.trick = kind; skate.tt = 0;
  }
  function msg(t) { const m = $('#trickMsg'); if (!m) return; m.innerHTML = `<div class="trick-msg">${t}</div>`; }
  function skateLoop(now) {
    const s = skate; if (!s) return;
    const dt = Math.min(.033, (now - (s.last || now)) / 1000); s.last = now;
    if (!s.air) {
      const K = .0048;
      // Holding either button pumps in the direction of travel, so speed builds up swing after swing.
      const pumpDir = s.push ? (Math.abs(s.v) < .15 ? s.push : Math.sign(s.v)) : 0;
      s.v += (-K * s.slope(s.u) + pumpDir * 1.5) * dt;
      s.v *= (1 - .25 * dt);
      s.v = clamp(s.v, -2.6, 2.6);
      s.u += s.v * dt;
      if (Math.abs(s.u) >= 1) {
        s.side = Math.sign(s.u); s.u = s.side;
        if (Math.abs(s.v) > .45) { s.air = true; s.y = 0; s.vy = Math.abs(s.v) * 300; s.v = 0; }
        else s.v = -s.v * .3;
      }
    } else {
      s.vy -= 900 * dt; s.y += s.vy * dt;
      if (s.trick) s.tt += dt / .55;
      if (s.y <= 0) {
        s.air = false; s.y = 0;
        s.v = -s.side * Math.max(.6, Math.sqrt(2 * .0048 * 250)) * .97;
        if (s.trick) {
          const ok = s.tt >= 1, pts = { draai: 100, flip: 150, grab: 80 }[s.trick];
          if (ok) { s.score += pts; msg(`${{ draai: 'Draai!', flip: 'Kickflip!', grab: 'Grab!' }[s.trick]} +${pts}`); SOUND.yay(); }
          else msg('Oeps! Te laat.');
          s.trick = null; s.tt = 0;
          $('#skScore').textContent = s.score;
          if (s.score > state.skateBest) { state.skateBest = s.score; store.set('skateBest', s.score); $('#skBest').textContent = s.score; }
        }
      }
    }
    const x = s.X(s.u), y = 380 - s.Hh(s.u) - s.y;
    const ang = s.air ? 0 : Math.atan2(-s.slope(s.u) / 340, 1) * 180 / Math.PI * -1;
    const tAng = s.trick === 'draai' ? Math.min(1, s.tt) * 360 * -s.side : 0;
    $('#sk').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    $('#skRot').setAttribute('transform', `rotate(${(-ang + tAng).toFixed(1)} 0 -40)`);
    $('#skBoard').setAttribute('transform', s.trick === 'flip' ? `translate(0 -4) scale(1 ${Math.cos(Math.min(1, s.tt) * Math.PI * 2).toFixed(2)}) translate(0 4)` : '');
    $('#skBody').setAttribute('transform', s.trick === 'grab' ? 'translate(0 2) scale(1 .85)' : 'translate(0 -8)');
    s.raf = requestAnimationFrame(skateLoop);
  }
  function stopSkate() {
    if (!skate) return;
    cancelAnimationFrame(skate.raf);
    document.removeEventListener('keydown', skate.keydown); document.removeEventListener('keyup', skate.keyup);
    skate = null;
  }

  // ================= Start =================
  function startCity() {
    if (!introOpen) return;
    introOpen = false; $('#intro').hidden = true;
    SOUND.yay();
    toast('Hoi Defne! Misem loopt met je mee. Waar gaan we heen?', 3200);
  }

  function boot(renderer) {
    R = renderer;
    $('#viewport').insertAdjacentHTML('beforeend', `<button class="head-btn" id="headBtn" hidden aria-label="Menu van Defne"><span class="hb-ico">⭐</span><span class="hb-name">Defne</span></button><div class="head-menu" id="headMenu" hidden></div>`);
    $('#headBtn').addEventListener('click', e => { e.stopPropagation(); headMenu(); });
    $('#headBtn').addEventListener('pointerdown', e => e.stopPropagation());
    $('#headMenu').addEventListener('pointerdown', e => e.stopPropagation());
    $('#headMenu').addEventListener('click', e => { const b = e.target.closest('[data-hm]'); if (b) headAction(b.dataset.hm); });
    $('#startBtn').addEventListener('click', startCity);
    $('#soundBtn').addEventListener('click', () => { Sommen.soundOn = !Sommen.soundOn; store.set('sound', Sommen.soundOn); $('#soundBtn').textContent = Sommen.soundOn ? '🔊' : '🔇'; });
    $('#soundBtn').textContent = Sommen.soundOn ? '🔊' : '🔇';
    $('#boardBtn').addEventListener('click', () => { state.onBoard = !state.onBoard; store.set('onBoard', state.onBoard); R.drawPlayer(); });
    window.addEventListener('resize', () => R.resize());
    R.resize(); R.drawPlayer(); R.update();
    let last = performance.now();
    (function loop(now) {
      step(Math.min(.05, (now - last) / 1000)); last = now;
      requestAnimationFrame(loop);
    })(last);
  }

  window.Stad = {
    $, pick, clamp, later, store, state, SOUND, sweep, boot, tap,
    DEFAULT_LOOK, NISAN_LOOK, HAIR, HATS, SKIN, personSVG, misemSVG, horseSVG, quadSVG, boardSVG, deckSVG, ARTS, DEFNE_HORSE, BABY_HORSE,
    W, H, PLACES, ZONES, PLAY, doorOf, nisanPos, P, M, horse, baby, blocked, findPath,
    boardOn, riding: () => riding, inRoom: () => !!roomOpen, inIntro: () => introOpen
  };
})();
