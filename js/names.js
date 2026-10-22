// Realistic test names, cities and streets of an exact length (boundary testing of validations).
// A dictionary word is used when one of the needed length exists; otherwise a letter-level
// Markov chain trained on the same dictionaries synthesizes a plausible one ("Marlington").

const MAX_LENGTH = 1000;

// ── Dictionaries (ASCII letters only) ───────────────────
const wordList = str => str.trim().split(/\s+/);

const FIRST_NAMES = wordList(`
  Al Bo Ed Jo Ty Cy Di Mo
  Ava Amy Ann Ben Dan Eli Eva Ian Ida Joe Kim Leo Liz Max May Mia Ned Pam Ray Rex Roy Sam Sue Tom Zoe
  Abby Adam Alan Alex Alma Amos Andy Anna Beth Carl Cora Dale Dana Dean Dora Drew Emma Eric Evan Ezra
  Finn Gary Gene Gwen Hank Hugh Iris Ivan Jack Jade Jake Jane Jean Jill John Joel Josh Jude Kate Kurt
  Kyle Lana Leah Liam Lily Lisa Luke Lynn Mark Mary Matt Mike Nina Noah Nora Owen Paul Rosa Ruby Ruth
  Ryan Sara Sean Seth Tara Tess Theo Todd Troy Vera Wade Will
  Aaron Agnes Alice Amber Andre Anita Becky Brian Bruce Caleb Carol Chase Chloe Clara Daisy David Derek
  Diana Edgar Edith Elena Ellen Emily Ethan Faith Felix Frank Grace Grant Hazel Helen Henry Holly Irene
  Isaac Jacob James Jason Jenny Jesse Julia Karen Keith Laura Linda Logan Louis Lucas Lucy Mabel Maria
  Mason Megan Miles Nancy Naomi Oscar Peter Quinn Ralph Robin Roger Sarah Scott Simon Sofia Steve Tyler
  Abigail Adrian Albert Amelia Andrea Andrew Arnold Arthur Audrey Austin Barbara Bianca Brandon Bridget
  Carlos Carmen Cecilia Charles Claire Colin Connor Daniel Dennis Donald Dorothy Douglas Eleanor Elijah
  Elliot Evelyn Florence Gabriel Garrett Gloria Gordon Hannah Harold Harriet Isabel Jasmine Jeffrey
  Jessica Jordan Joseph Joshua Judith Justin Kenneth Lauren Leonard Lillian Lorraine Madison Marcus
  Margaret Martin Matthew Melissa Michael Miranda Natalie Nathan Nicole Oliver Olivia Pamela Patrick
  Phillip Rachel Raymond Rebecca Richard Robert Russell Samuel Sandra Sophia Stanley Stephen Stella
  Thomas Timothy Trevor Vanessa Victor Vincent Virginia Walter Warren Wesley William Winston
  Benjamin Beatrice Caroline Catherine Charlotte Christian Christopher Clementine Cornelius Elizabeth
  Frederick Gabrielle Genevieve Jacqueline Jonathan Josephine Katherine Nathaniel Rosemary Sebastian
  Theodore Valentina Alexander Alexandra Maximilian Bartholomew Evangeline
`);

const LAST_NAMES = wordList(`
  Ng Wu Li Fox Kay Lee Poe Ray Roe Day Cox
  Bell Byrd Cole Cook Dunn Ford Gray Hall Hart Hill Holt Hood Hunt Kent King Lane Long Mann Moss Nash
  Page Park Pope Reed Reid Rice Rose Ross Shaw Snow Wade Ward Webb West Wood York
  Adams Allen Baker Banks Bates Black Blake Brown Burke Crane Cross Davis Dixon Doyle Drake Duffy Evans
  Field Floyd Gibbs Grant Green Hayes Hicks Irwin Jones Kelly Klein Lewis Lloyd Lynch Marsh Mason Miles
  Moore Myers Nolan Olsen Owens Payne Perry Price Quinn Reeves Riley Ryan Scott Sharp Smith Stone Thorne
  Vance Walsh Watts Wells White Wolfe Wright Young
  Abbott Barnes Barrett Bennett Bradley Brennan Bryant Carter Collins Cooper Dawson Donovan Edwards
  Fisher Fleming Foster Fuller Gilbert Goodwin Graham Hawkins Holloway Hopkins Howard Hudson Hughes
  Jackson Jenkins Johnson Keller Kennedy Knight Lambert Lawrence Marshall Matthews McCarthy Mitchell
  Morgan Morris Murphy Norris Parker Peterson Phillips Pierce Porter Powell Rhodes Roberts Rogers
  Russell Sanders Simmons Spencer Strong Sullivan Sutton Taylor Thompson Tucker Turner Walker Wallace
  Warren Watson Weaver Wheeler Williams Wilson
  Anderson Armstrong Atkinson Caldwell Campbell Carpenter Chambers Chapman Clarke Coleman Crawford
  Cunningham Ellison Ferguson Fitzgerald Fletcher Gallagher Gardner Garrison Hamilton Harrison Henderson
  Kingsley Lancaster Mackenzie Montgomery Morrison Nicholson Patterson Richardson Robertson Robinson
  Townsend Underwood Wellington Whitaker Whitfield Woodward Worthington Blackwood Hargreaves Fairweather
  Featherstone Ashworth Cartwright Pemberton Rutherford Wainwright Thistlewood Butterworth Higginbotham
`);

const CITIES = wordList(`
  Ayr Ely Rye
  Bath Bury Hull Lima Nice Oslo Rome Bern Reno Leeds Paris Plano Salem Tampa Tulsa Omaha Akron Boise
  Derby Dover Miami York Albany Austin Boston Camden Canton Dallas Dayton Denver Dublin Durham Eugene
  Exeter Fresno Galway Helena Irvine Joliet Juneau Kendal Laredo Lisbon London Madrid Malibu Marion
  Mobile Monroe Naples Newark Odessa Oxford Peoria Quincy Toledo Topeka Tucson Vienna Shelby Tacoma
  Bristol Jackson Lincoln Medford Norwich Oakland Orlando Phoenix Preston Raleigh Reading Seattle
  Trenton Warwick Wichita Windsor Yonkers Atlanta Augusta Buffalo Chester Chicago Concord Danbury
  Detroit Elmira Glasgow Houston Kingston Memphis Milford Montrose Newport Norfolk Pasadena Plymouth
  Portland Savannah Scranton Stockton Syracuse Telford Toronto Ventura Ashland Bellevue
  Aberdeen Ashford Berkeley Bradford Brighton Brooklyn Columbus Coventry Fairfield Fairview Franklin
  Glasgow Hamilton Hartford Lakewood Lancaster Lexington Madison Manchester Nashville Princeton
  Richmond Riverside Rochester Sheffield Springfield Stamford Woodstock Worcester Winchester Waterford
  Baltimore Birmingham Burlington Cambridge Canterbury Charleston Cincinnati Cleveland Edinburgh
  Georgetown Greenville Huntington Liverpool Louisville Milwaukee Northampton Nottingham Pittsburgh
  Providence Sacramento Southampton Sunderland Vancouver Wilmington Bridgeport Brookfield Clarksville
  Fayetteville Greensboro Harrisburg Jacksonville Middletown Minneapolis Philadelphia Indianapolis
  Albuquerque Chattanooga Gainesville Hagerstown Morgantown Shrewsbury Stevenage Wolverhampton
  Bournemouth Peterborough Middlesbrough
`);

const STREET_NAMES = wordList(`
  Ash Elm Oak Bay Fir Yew Fox Elk
  Main High Park Pine Lake Hill Mill Rose Pond Glen Lark Swan Deer Hawk Wall Long Broad Front Short
  Cedar Maple Birch Holly River Ridge Brook Creek Green Heath Manor Abbey Grant Adams Union Ocean Beach
  Shore Cliff Duke King Queen Prince Bishop Castle Garden Willow Spruce Walnut Cherry Poplar Laurel
  Linden Meadow Spring Forest Valley Sunset Summit Church School Market Bridge Center Liberty Canyon
  Prairie Harbor Orchard Station Chelsea Oxford Windsor Hampton Lincoln Madison Jackson Monroe Wilson
  Clinton Kennedy Victoria Albert Juniper Hickory Chestnut Magnolia Sycamore Hawthorn Highland Lakeview
  Hillside Riverside Fairview Pleasant Prospect Franklin Jefferson Roosevelt Hamilton Lafayette Vineyard
  Kensington Cambridge Stratford Wellington Devonshire Lancaster Somerset Highgate Greenwood Oakwood
  Elmwood Maplewood Woodland Brookside Cherrywood Washington Sparrow Falcon Heron Eagle Robin
`);

const STREET_TYPES = wordList('Way Row Lane Road Walk Drive Court Place Close Grove Street Avenue Square Terrace Parkway Crescent Boulevard');
const CITY_PREFIXES = wordList('New Old Port Fort Lake Bay Cape Glen Mount North South East West Saint Grand Upper Little');
const CITY_SUFFIXES = wordList('City Bay Park Falls Beach Hills Creek Ridge Grove Point Valley Harbor Heights Springs Village Junction');
const LAST_PARTICLES = wordList('De Da Di Du La Le Van Von Del Ten Mac');

// Apostrophe forms per part: a letter is a prefix ("O" → O'Brien), "s" is possessive (King's)
const FIRST_APOS = ['D'];
const LAST_APOS = ['O', 'O', 'D'];
const CITY_APOS = ['L', 's'];
const STREET_APOS = ['s'];

// ── Random helpers ──────────────────────────────────────
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randomItem(list) { return list[Math.floor(Math.random() * list.length)]; }
function capitalize(word) { return word[0].toUpperCase() + word.slice(1); }

function pickWeighted(entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// ── Markov model (order 2 with order-1 backoff) ─────────
const VOWELS = 'aeiouy';
const CONSONANTS = 'bcdfghjklmnprstvwz';

// Each context maps to { next: [[letter, count], ...], end: probability that the word ends here }
function trainMarkov(list) {
  const o2 = {}, o1 = {};
  const add = (table, ctx, c) => { table[ctx] = table[ctx] || {}; table[ctx][c] = (table[ctx][c] || 0) + 1; };
  for (const word of list) {
    const s = '^^' + word.toLowerCase() + '$';
    for (let i = 2; i < s.length; i++) {
      add(o2, s.slice(i - 2, i), s[i]);
      add(o1, s[i - 1], s[i]);
    }
  }
  const finalize = table => {
    const out = {};
    for (const ctx in table) {
      const counts = table[ctx];
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      out[ctx] = { next: Object.entries(counts).filter(([c]) => c !== '$'), end: ((counts.$ || 0) + 0.05) / (total + 1) };
    }
    return out;
  };
  return { o2: finalize(o2), o1: finalize(o1) };
}

function markovNode(model, ctx) {
  return model.o2[ctx] || model.o1[ctx[1]];
}

// Probability that a word ends right after the 2-letter context `ctx`
function endChance(model, ctx) {
  const node = markovNode(model, ctx);
  return node ? node.end : 0.1;
}

// Rejects a 3rd identical letter in a row and a 4th consonant in a row
function violatesShape(word, c) {
  const n = word.length;
  if (n >= 2 && word[n - 1] === c && word[n - 2] === c) return true;
  if (VOWELS.includes(c)) return false;
  let run = 0;
  for (let i = n - 1; i >= 0 && !VOWELS.includes(word[i]); i--) run++;
  return run >= 3;
}

function markovWord(model, n) {
  let word = '';
  for (let i = 0; i < n; i++) {
    const ctx = ('^^' + word).slice(-2);
    const node = markovNode(model, ctx);
    let options = node ? node.next.filter(([c]) => !violatesShape(word, c)) : [];
    if (!options.length) {
      const pool = !word || VOWELS.includes(word[word.length - 1]) ? CONSONANTS : VOWELS;
      options = [...pool].filter(c => !violatesShape(word, c)).map(c => [c, 1]);
    }
    // Last letter: favour letters that typically end a word (-son, -ton, -a, -ley)
    if (i === n - 1) options = options.map(([c, w]) => [c, w * endChance(model, ctx[1] + c)]);
    word += pickWeighted(options);
  }
  return capitalize(word);
}

function makeCategory(list) {
  const byLength = {};
  for (const word of list) (byLength[word.length] = byLength[word.length] || []).push(word);
  return { list, byLength, model: trainMarkov(list) };
}

const CATEGORIES = {
  first: makeCategory(FIRST_NAMES),
  last: makeCategory(LAST_NAMES),
  city: makeCategory(CITIES),
  street: makeCategory(STREET_NAMES),
};

// A capitalized word of exactly n letters
function fitWord(catName, n) {
  const cat = CATEGORIES[catName];
  if (n === 1) return randomItem('ABCDEFGHIJKLMNOPRSTVW');
  const exact = cat.byLength[n];
  if (exact && Math.random() < 0.7) return randomItem(exact);
  if (n <= 14) return markovWord(cat.model, n);
  // One long Markov word reads as noise, so glue 4–9 letter chunks, mostly real words: "Ashfordlincolnbrook"
  let word = '';
  for (let rest = n; rest > 0;) {
    const len = rest <= 9 ? rest : randInt(4, Math.min(9, rest - 4));
    const real = cat.byLength[len];
    word += (real && Math.random() < 0.6 ? randomItem(real) : markovWord(cat.model, len)).toLowerCase();
    rest -= len;
  }
  return capitalize(word);
}

// ── Value structure ─────────────────────────────────────
// A value is a list of words; a word is a list of parts joined by hyphens.
// A part is either free ({ cat, apos }) — filled by fitWord — or fixed ({ fixed: [options] }).
const free = (cat, apos = []) => ({ cat, apos });
const fixed = options => ({ fixed: options });
const repeat = (n, make) => Array.from({ length: n }, make);

const FIELDS = [
  {
    key: 'firstName', label: 'Name', range: [3, 10], words: 1, cat: 'first',
    skeleton: w => repeat(w, () => [free('first', FIRST_APOS)]),
  },
  {
    key: 'lastName', label: 'Surname', range: [4, 12], words: 1, cat: 'last',
    skeleton: (w, opts) => {
      const list = repeat(w, () => [free('last', LAST_APOS)]);
      if (opts.spaces && w >= 2 && Math.random() < 0.4) list[0] = [fixed(LAST_PARTICLES)]; // Van Dyke
      return list;
    },
  },
  {
    key: 'fullName', label: 'Full name', range: [8, 25], words: 2, cat: 'last',
    skeleton: w => w === 1
      ? [[free('first', FIRST_APOS)]]
      : [...repeat(w - 1, () => [free('first')]), [free('last', LAST_APOS)]],
  },
  {
    key: 'city', label: 'City', range: [4, 15], words: 1, cat: 'city',
    skeleton: (w, opts) => {
      const list = repeat(w, () => [free('city', CITY_APOS)]);
      if (opts.spaces && w >= 2) {
        const r = Math.random();
        const both = r >= 0.8 && w >= 3;                                  // North Cedar Falls
        if (r < 0.4 || both) list[0] = [fixed(CITY_PREFIXES)];            // New Haven
        if ((r >= 0.4 && r < 0.8) || both) list[w - 1] = [fixed(CITY_SUFFIXES)]; // Cedar Falls
      }
      return list;
    },
  },
  {
    key: 'street', label: 'Street', range: [8, 25], words: 2, cat: 'street',
    skeleton: w => w === 1
      ? [[free('street', STREET_APOS)]]
      : [...repeat(w - 1, () => [free('street', STREET_APOS)]), [fixed(STREET_TYPES)]],
  },
];

// Shortest value that can carry the required symbols: "A", "A B", "A-B", "O'B", "O'B-C D"
function minLength(opts) {
  if (opts.any) return 1;
  return 1 + 2 * [opts.spaces, opts.hyphens, opts.apostrophes].filter(Boolean).length;
}

function wordCount(field, n, opts) {
  const min = opts.spaces ? 2 : 1;
  const base = Math.max(min, field.words);
  // Long values get more words (CamelCase-glued without spaces: TheodoreFlorenceIsabel). Exception:
  // a single-word field with hyphens only stays one word, split into hyphen parts in buildValue.
  const grows = opts.spaces || field.words > 1 || !opts.hyphens;
  let count = grows ? Math.max(base, Math.round(n / 8)) : base;
  // Drop extra words until each can get ~3 letters ("Elm", not "OxA"); hyphen and apostrophe add 2 chars each
  const required = c => 3 * c + (opts.spaces ? c - 1 : 0) + (opts.hyphens ? 2 : 0) + (opts.apostrophes ? 2 : 0);
  while (count > min && required(count) > n) count--;
  return count;
}

// Natural length of a random dictionary word, used as a weight when splitting the length
function naturalLength(catName) {
  return randomItem(CATEGORIES[catName].list).length;
}

// Splits `total` into parts proportional to `weights`, each part at least 1
function distribute(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const lens = weights.map(w => Math.max(1, Math.round(w * total / sum)));
  let diff = total - lens.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const i = Math.floor(Math.random() * lens.length);
    if (diff > 0) { lens[i]++; diff--; } else if (lens[i] > 1) { lens[i]--; diff++; }
  }
  return lens;
}

function buildValue(field, n, opts) {
  const list = field.skeleton(wordCount(field, n, opts), opts);

  if (opts.hyphens) {
    const candidates = list.filter(word => !word[0].fixed);
    const word = randomItem(candidates);
    // Mary → Mary-Jane; long values get more parts (Mary-Jane-Anna-Rose) so each stays name-sized,
    // the same way spaces add words, instead of two huge glued parts
    const seps = (opts.spaces ? list.length - 1 : 0) + (opts.apostrophes ? 2 : 0);
    const fits = k => 3 * (list.length + k - 1) + seps + (k - 1) <= n;
    let k = Math.max(2, Math.round(n / 8) - (list.length - 1));
    while (k > 2 && !fits(k)) k--;
    for (let i = 1; i < k; i++) word.push({ ...word[0] });
  }
  if (opts.apostrophes) {
    const candidates = list.flat().filter(part => !part.fixed && part.apos && part.apos.length);
    const part = randomItem(candidates);
    part.aposForm = randomItem(part.apos);
  }

  const parts = list.flat();
  const hyphenCount = list.reduce((sum, word) => sum + word.length - 1, 0);
  let budget = n - (opts.spaces ? list.length - 1 : 0) - hyphenCount - (opts.apostrophes ? 2 : 0);

  // Fixed parts take a dictionary option that leaves room for the rest, or turn into free parts
  shuffle(parts.filter(part => part.fixed)).forEach(part => {
    const others = parts.filter(p => p !== part && !p.text).length;
    let fits = part.fixed.filter(o => budget - o.length >= others * 3);
    if (!fits.length) fits = part.fixed.filter(o => budget - o.length >= others);
    if (fits.length) {
      part.text = randomItem(fits);
      budget -= part.text.length;
    } else {
      part.cat = field.cat;
      part.apos = [];
    }
    part.fixed = null;
  });

  const freeParts = parts.filter(part => !part.text);
  const lens = distribute(budget, freeParts.map(part => naturalLength(part.cat)));
  freeParts.forEach((part, i) => {
    let core = fitWord(part.cat, lens[i]);
    // Avoid "D'Diana"-style repeats after an apostrophe prefix
    for (let retry = 0; retry < 5 && lens[i] > 1 && core[0] === part.aposForm; retry++) core = fitWord(part.cat, lens[i]);
    if (!part.aposForm) part.text = core;
    else if (part.aposForm === 's') part.text = core + "'s";
    else part.text = part.aposForm + "'" + core;
  });

  // Words joined by spaces, or CamelCase-glued when spaces are off (parts are already capitalized)
  return list.map(word => word.map(part => part.text).join('-')).join(opts.spaces ? ' ' : '');
}

// ── Any characters: Unicode letters ─────────────────────
// Only precomposed BMP characters, so value.length equals the visible character count.
const DIACRITICS = {
  a: 'áàâäãåā', c: 'çćč', d: 'ď', e: 'éèêëē', g: 'ğ', i: 'íìîï', l: 'ł', n: 'ñń',
  o: 'óòôöõø', r: 'ř', s: 'śš', t: 'ť', u: 'úùûü', y: 'ýÿ', z: 'źżž',
};
const CYRILLIC = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const GREEK = 'αβγδεζηθικλμνξοπρστυφχψω';
const CJK = '中山田李王张林川木水金石高明';

function unicodeLetter(letter) {
  const lower = letter.toLowerCase();
  const r = Math.random();
  let c;
  if (r < 0.55 && DIACRITICS[lower]) c = randomItem(DIACRITICS[lower]);
  else if (r < 0.75) c = randomItem(CYRILLIC);
  else if (r < 0.9) c = randomItem(GREEK);
  else c = randomItem(CJK);
  const upper = c.toUpperCase();
  return letter !== lower && upper.length === 1 ? upper : c;
}

function buildUnicodeValue(field, n) {
  // Spaces, hyphens and apostrophes are allowed, not required: each one is a coin flip
  const opts = { spaces: Math.random() < 0.5, hyphens: Math.random() < 0.5, apostrophes: Math.random() < 0.5 };
  while (minLength(opts) > n) opts[randomItem(Object.keys(opts).filter(k => opts[k]))] = false;

  const chars = [...buildValue(field, n, opts)];
  const letters = shuffle(chars.map((c, i) => (/[A-Za-z]/.test(c) ? i : -1)).filter(i => i >= 0));
  const count = Math.max(1, Math.round(letters.length * (0.3 + Math.random() * 0.3)));
  letters.slice(0, count).forEach(i => { chars[i] = unicodeLetter(chars[i]); });
  return chars.join('');
}

// ── Self-check before display (like validateIBAN) ───────
function validateValue(value, n, opts) {
  if (typeof value !== 'string' || value.length !== n) return false;
  if (/^[ '-]|[ -]$|[ '-]{2}/.test(value)) return false;
  if (opts.any) {
    return /^[\p{L} '-]+$/u.test(value) && /[^\x00-\x7F]/.test(value) && value === value.normalize('NFC');
  }
  const symbols = [[opts.spaces, ' '], [opts.hyphens, '-'], [opts.apostrophes, "'"]];
  for (const [on, symbol] of symbols) {
    if (value.includes(symbol) !== Boolean(on)) return false;
  }
  return /^[A-Za-z '-]+$/.test(value);
}

function generateValue(field, n, opts) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const value = opts.any ? buildUnicodeValue(field, n) : buildValue(field, n, opts);
    if (validateValue(value, n, opts)) return value;
  }
  return null;
}

// ── UI ──────────────────────────────────────────────────
const COPY_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';
const CHECK_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const SYMBOL_FLAGS = ['Spaces', 'Hyphens', 'Apostrophes'];

function readOptions(key) {
  const checked = id => document.getElementById(key + id).checked;
  if (checked('Any')) return { any: true };
  return { spaces: checked('Spaces'), hyphens: checked('Hyphens'), apostrophes: checked('Apostrophes') };
}

function describeMinLength(opts) {
  const names = [[opts.spaces, 'spaces'], [opts.hyphens, 'hyphens'], [opts.apostrophes, 'apostrophes']]
    .filter(([on]) => on).map(([, name]) => name);
  const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
  return `Min length with ${list} is ${minLength(opts)}.`;
}

function generateAll() {
  for (const field of FIELDS) {
    const { key } = field;
    const opts = readOptions(key);
    const raw = document.getElementById(key + 'Length').value.trim();
    const min = minLength(opts);
    let n;
    let error = '';

    if (raw === '') {
      n = randInt(Math.max(field.range[0], min), Math.max(field.range[1], min));
    } else {
      n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > MAX_LENGTH) error = `Length must be a whole number from 1 to ${MAX_LENGTH}.`;
      else if (n < min) error = describeMinLength(opts);
    }

    const value = error ? null : generateValue(field, n, opts);
    if (!error && !value) error = 'Generation failed — please try again.';

    document.getElementById(key + 'Output').value = value || '';
    document.getElementById(key + 'Len').textContent = value ? `${n} char${n === 1 ? '' : 's'}` : '';
    document.getElementById(key + 'CopyBtn').classList.toggle('hidden', !value);
    document.getElementById(key + 'Error').textContent = error;
  }
}

// Any characters allows everything: tick and lock the symbol checkboxes, restore them when unticked
function toggleAny(key) {
  const any = document.getElementById(key + 'Any').checked;
  for (const flag of SYMBOL_FLAGS) {
    const box = document.getElementById(key + flag);
    if (any) {
      box.dataset.prev = box.checked;
      box.checked = true;
    } else {
      box.checked = box.dataset.prev === 'true';
    }
    box.disabled = any;
  }
}

function copyField(key) {
  const value = document.getElementById(key + 'Output').value;
  if (!value) return;
  navigator.clipboard.writeText(value).then(() => {
    const btn = document.getElementById(key + 'CopyBtn');
    btn.innerHTML = CHECK_ICON;
    setTimeout(() => { btn.innerHTML = COPY_ICON; }, 1500);
  });
}

function initNames() {
  for (const { key } of FIELDS) {
    document.getElementById(key + 'CopyBtn').innerHTML = COPY_ICON;
    document.getElementById(key + 'Length').addEventListener('keydown', e => {
      if (e.key === 'Enter') generateAll();
    });
  }
}

// ── Console self-test: selfTestNames() ──────────────────
function selfTestNames(iterations = 200) {
  const combos = [{ any: true }];
  for (let mask = 0; mask < 8; mask++) {
    combos.push({ spaces: Boolean(mask & 1), hyphens: Boolean(mask & 2), apostrophes: Boolean(mask & 4) });
  }
  const label = opts => (opts.any ? 'any'
    : [[opts.spaces, 'S'], [opts.hyphens, 'H'], [opts.apostrophes, 'A']].filter(([on]) => on).map(([, s]) => s).join('+') || 'none');
  const rows = [];
  for (const field of FIELDS) {
    for (const opts of combos) {
      const min = minLength(opts);
      const lengths = [...new Set([min, min + 1, 2, 3, 5, 10, 25, 50, 100, 255, 256, MAX_LENGTH])].filter(n => n >= min);
      let failures = 0;
      for (const n of lengths) {
        for (let i = 0; i < iterations; i++) {
          if (!generateValue(field, n, opts)) failures++;
        }
      }
      rows.push({ field: field.key, flags: label(opts), failures, sample: generateValue(field, 12, opts) });
    }
  }
  console.table(rows);
  return rows.every(row => row.failures === 0);
}
