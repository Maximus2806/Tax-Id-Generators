// Segments: { t: 'n'|'a', l: length, codes?: string[] }
// If codes present — pick randomly from the list instead of generating random chars
const bbanFormats = {
  AT: [
    { t: 'n', l: 5, codes: ['32000', '20111', '12000', '14000', '19040'] },
    { t: 'n', l: 11 },
  ],
  BE: [
    { t: 'n', l: 3, codes: ['096', '539', '068', '363', '132'] },
    { t: 'n', l: 9 },
  ],
  HR: [
    { t: 'n', l: 7, codes: ['2360000', '2340009', '2380006', '2484008', '2500009'] },
    { t: 'n', l: 10 },
  ],
  CZ: [
    { t: 'n', l: 4, codes: ['0800', '0100', '0300', '0600', '0710'] },
    { t: 'n', l: 16 },
  ],
  DK: [
    { t: 'n', l: 4, codes: ['2000', '3000', '5301', '6555', '7858'] },
    { t: 'n', l: 10 },
  ],
  EE: [
    { t: 'n', l: 2, codes: ['10', '22', '96', '77'] },
    { t: 'n', l: 14 },
  ],
  FI: [
    { t: 'n', l: 3, codes: ['100', '500', '405', '157', '800'] },
    { t: 'n', l: 11 },
  ],
  FR: [
    { t: 'n', l: 5, codes: ['30006', '30004', '10096', '30002', '17569'] },
    { t: 'n', l: 18 },
  ],
  DE: [
    { t: 'n', l: 8, codes: ['10070000', '37040044', '20010020', '70020270', '50010060', '20050550', '30020900'] },
    { t: 'n', l: 10 },
  ],
  GR: [
    { t: 'n', l: 7, codes: ['0110125', '0140125', '0260057', '0720050', '0810001'] },
    { t: 'n', l: 16 },
  ],
  HU: [
    { t: 'n', l: 3, codes: ['116', '117', '101', '176', '120'] },
    { t: 'n', l: 21 },
  ],
  IE: [
    { t: 'a', l: 4, codes: ['AIBK', 'BOFI', 'ULST', 'PERM', 'ULSB'] },
    { t: 'n', l: 14 },
  ],
  IT: [{ t: 'a', l: 1 }, { t: 'n', l: 22 }],
  LV: [
    { t: 'a', l: 4, codes: ['HABA', 'UNLA', 'LATB', 'NDEA', 'PARX'] },
    { t: 'n', l: 13 },
  ],
  LT: [
    { t: 'n', l: 5, codes: ['10101', '73000', '40100', '74140'] },
    { t: 'n', l: 11 },
  ],
  LU: [
    { t: 'n', l: 3, codes: ['001', '002', '005', '006', '008'] },
    { t: 'n', l: 13 },
  ],
  MT: [
    { t: 'a', l: 4, codes: ['VALL', 'MALT', 'AKBM', 'PALT', 'MSBI'] },
    { t: 'n', l: 23 },
  ],
  NL: [
    { t: 'a', l: 4, codes: ['ABNA', 'INGB', 'RABO', 'TRIO', 'KNAB', 'SNSB'] },
    { t: 'n', l: 10 },
  ],
  NO: [
    { t: 'n', l: 4, codes: ['3000', '6347', '8601', '9710'] },
    { t: 'n', l: 7 },
  ],
  PL: [
    { t: 'n', l: 8, codes: ['10500099', '10901522', '15001077', '19401052', '24350001'] },
    { t: 'n', l: 16 },
  ],
  PT: [
    { t: 'n', l: 4, codes: ['0033', '0010', '0036', '0079', '0018'] },
    { t: 'n', l: 17 },
  ],
  RO: [
    { t: 'a', l: 4, codes: ['BRDE', 'BTRL', 'BNCU', 'RNCB', 'INGB'] },
    { t: 'n', l: 16 },
  ],
  SK: [
    { t: 'n', l: 4, codes: ['7500', '0900', '0200', '1100', '6500'] },
    { t: 'n', l: 16 },
  ],
  SI: [
    { t: 'n', l: 5, codes: ['19200', '26300', '30000', '31000', '07000'] },
    { t: 'n', l: 10 },
  ],
  ES: [
    { t: 'n', l: 4, codes: ['2100', '0049', '0075', '0128', '1465'] },
    { t: 'n', l: 16 },
  ],
  SE: [
    { t: 'n', l: 4, codes: ['8000', '5000', '6000', '9500', '3000'] },
    { t: 'n', l: 16 },
  ],
  CH: [
    { t: 'n', l: 5, codes: ['00230', '00780', '07310', '08488', '09000'] },
    { t: 'n', l: 12 },
  ],
  TR: [
    { t: 'n', l: 5, codes: ['00062', '00010', '00064', '00046', '00012'] },
    { t: 'n', l: 17 },
  ],
  GB: [
    { t: 'a', l: 4, codes: ['NWBK', 'BARC', 'HBUK', 'LOYD', 'RBOS'] },
    { t: 'n', l: 14 },
  ],
};

function randomDigit() { return String(Math.floor(Math.random() * 10)); }
function randomLetter() { return String.fromCharCode(65 + Math.floor(Math.random() * 26)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeBBAN(segments) {
  return segments.map(({ t, l, codes }) => {
    if (codes) return pick(codes);
    return Array.from({ length: l }, t === 'a' ? randomLetter : randomDigit).join('');
  }).join('');
}

function toNumericString(str) {
  return str.split('').map(c => /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c).join('');
}

function mod97(str) {
  let r = 0;
  for (const ch of str) r = (r * 10 + parseInt(ch)) % 97;
  return r;
}

function computeCheckDigits(cc, bban) {
  return String(98 - mod97(toNumericString(bban + cc + '00'))).padStart(2, '0');
}

function validateIBAN(iban) {
  return mod97(toNumericString(iban.slice(4) + iban.slice(0, 4))) === 1;
}

function generateIBAN() {
  const countryCode = document.getElementById('ibanCountry').value;
  let iban;
  do {
    const bban = makeBBAN(bbanFormats[countryCode]);
    iban = countryCode + computeCheckDigits(countryCode, bban) + bban;
  } while (!validateIBAN(iban));
  document.getElementById('ibanOutput').value = iban.match(/.{1,4}/g).join(' ');
}

function copyIBAN() {
  const input = document.getElementById('ibanOutput');
  if (!input.value) return;
  navigator.clipboard.writeText(input.value.replace(/\s/g, '')).then(() => {
    const btn = document.getElementById('ibanCopyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}
