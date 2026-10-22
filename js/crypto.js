// Format-valid test crypto addresses (no private keys).
// Hashes behind EVM/BTC addresses are indistinguishable from random bytes,
// so random bytes + the proper checksum encoding pass any format validator.

const TEST_DATA_WARNING = 'Test data only. No private key exists for this address — any funds sent to it are lost.';

// ── Byte helpers ────────────────────────────────────────
function randomBytes(n) { return crypto.getRandomValues(new Uint8Array(n)); }

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function concatBytes(...parts) {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

// ── Base58 / Base58Check ────────────────────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes) {
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let out = '';
  while (n > 0n) { out = BASE58_ALPHABET[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; out = '1' + out; }
  return out;
}

function base58Decode(str) {
  let n = 0n;
  for (const c of str) {
    const i = BASE58_ALPHABET.indexOf(c);
    if (i < 0) return null;
    n = n * 58n + BigInt(i);
  }
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n % 256n)); n /= 256n; }
  for (const c of str) { if (c !== '1') break; bytes.unshift(0); }
  return new Uint8Array(bytes);
}

async function base58CheckEncode(payload) {
  const checksum = (await sha256(await sha256(payload))).slice(0, 4);
  return base58Encode(concatBytes(payload, checksum));
}

async function validateBase58Check(address, version) {
  const bytes = base58Decode(address);
  if (!bytes || bytes.length !== 25 || bytes[0] !== version) return false;
  const checksum = (await sha256(await sha256(bytes.slice(0, 21)))).slice(0, 4);
  return checksum.every((b, i) => b === bytes[21 + i]);
}

// ── Keccak-256 (Ethereum variant: 0x01 padding, not SHA3's 0x06) ──
const KECCAK_RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An, 0x8000000080008000n,
  0x000000000000808Bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008An, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
  0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800An, 0x800000008000000An,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
// Rotation offsets indexed by lane x + 5y
const KECCAK_ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];
const MASK64 = (1n << 64n) - 1n;

function rotl64(v, n) {
  return n === 0 ? v : ((v << BigInt(n)) | (v >> BigInt(64 - n))) & MASK64;
}

function keccakF(s) {
  for (let round = 0; round < 24; round++) {
    // theta
    const c = [];
    for (let x = 0; x < 5; x++) c[x] = s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20];
    for (let x = 0; x < 5; x++) {
      const d = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) s[x + y] ^= d;
    }
    // rho + pi
    const b = [];
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(s[x + 5 * y], KECCAK_ROT[x + 5 * y]);
    }
    // chi
    for (let y = 0; y < 25; y += 5) {
      for (let x = 0; x < 5; x++) s[x + y] = b[x + y] ^ (~b[(x + 1) % 5 + y] & MASK64 & b[(x + 2) % 5 + y]);
    }
    // iota
    s[0] ^= KECCAK_RC[round];
  }
}

function keccak256(bytes) {
  const rate = 136;
  const padded = new Uint8Array((Math.floor(bytes.length / rate) + 1) * rate);
  padded.set(bytes);
  padded[bytes.length] ^= 0x01;
  padded[padded.length - 1] ^= 0x80;
  const s = new Array(25).fill(0n);
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 7; j >= 0; j--) lane = (lane << 8n) | BigInt(padded[offset + i * 8 + j]);
      s[i] ^= lane;
    }
    keccakF(s);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number((s[i >> 3] >> BigInt(8 * (i & 7))) & 0xFFn);
  return out;
}

// ── EVM (EIP-55) ────────────────────────────────────────
function toChecksumAddress(hexLower) {
  const hash = bytesToHex(keccak256(new TextEncoder().encode(hexLower)));
  return '0x' + Array.from(hexLower, (c, i) => parseInt(hash[i], 16) >= 8 ? c.toUpperCase() : c).join('');
}

function validateEVM(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address) && toChecksumAddress(address.slice(2).toLowerCase()) === address;
}

// ── Bech32 (BIP173) ─────────────────────────────────────
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= GEN[i];
  }
  return chk;
}

function bech32HrpExpand(hrp) {
  const codes = Array.from(hrp, c => c.charCodeAt(0));
  return [...codes.map(c => c >> 5), 0, ...codes.map(c => c & 31)];
}

function bech32CreateChecksum(hrp, data) {
  const mod = bech32Polymod([...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^ 1;
  return Array.from({ length: 6 }, (_, i) => (mod >>> (5 * (5 - i))) & 31);
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0, bits = 0;
  const out = [];
  const maxv = (1 << toBits) - 1;
  const maxAcc = (1 << (fromBits + toBits - 1)) - 1;
  for (const v of data) {
    acc = ((acc << fromBits) | v) & maxAcc;
    bits += fromBits;
    while (bits >= toBits) { bits -= toBits; out.push((acc >> bits) & maxv); }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }
  return out;
}

// SegWit v0 only (Taproot/Bech32m is not accepted by our platform)
function segwitEncode(hrp, program) {
  const data = [0, ...convertBits(program, 8, 5, true)];
  return hrp + '1' + [...data, ...bech32CreateChecksum(hrp, data)].map(d => BECH32_CHARSET[d]).join('');
}

function segwitDecode(hrp, address) {
  if (address !== address.toLowerCase()) return null;
  const sep = address.lastIndexOf('1');
  if (address.slice(0, sep) !== hrp) return null;
  const data = Array.from(address.slice(sep + 1), c => BECH32_CHARSET.indexOf(c));
  if (data.length < 7 || data.includes(-1) || data[0] !== 0) return null;
  if (bech32Polymod([...bech32HrpExpand(hrp), ...data]) !== 1) return null;
  const program = convertBits(data.slice(1, -6), 5, 8, false);
  return program && new Uint8Array(program);
}

// ── Solana (Ed25519 public key) ─────────────────────────
let ed25519Supported = true;

async function solanaPublicKey() {
  try {
    const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']);
    return new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
  } catch (e) {
    // Fallback: format-valid, but not guaranteed to be on the Ed25519 curve
    ed25519Supported = false;
    return randomBytes(32);
  }
}

function validateSolana(address) {
  const bytes = base58Decode(address);
  return !!bytes && bytes.length === 32 && base58Encode(bytes) === address;
}

// ── Formats (Bitcoin mainnet only) ──────────────────────
const BTC_P2PKH_VERSION = 0x00;
const BTC_P2SH_VERSION = 0x05;
const BTC_HRP = 'bc';
const TRON_VERSION = 0x41;

const cryptoFormats = {
  'evm': {
    placeholder: 'e.g. 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    hint: 'EVM address with EIP-55 checksum. Valid for ERC20 tokens and on BSC (BEP20), Polygon, Arbitrum, Optimism, Avalanche C-Chain and other EVM networks.',
    generate: async () => toChecksumAddress(bytesToHex(randomBytes(20))),
    validate: async address => validateEVM(address),
  },
  'btc-p2pkh': {
    placeholder: 'e.g. 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    hint: 'Bitcoin Legacy (P2PKH) mainnet address, Base58Check. Starts with 1.',
    generate: async () => base58CheckEncode(concatBytes([BTC_P2PKH_VERSION], randomBytes(20))),
    validate: async address => validateBase58Check(address, BTC_P2PKH_VERSION),
  },
  'btc-p2sh': {
    placeholder: 'e.g. 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    hint: 'Bitcoin P2SH mainnet address (incl. wrapped SegWit), Base58Check. Starts with 3.',
    generate: async () => base58CheckEncode(concatBytes([BTC_P2SH_VERSION], randomBytes(20))),
    validate: async address => validateBase58Check(address, BTC_P2SH_VERSION),
  },
  'btc-p2wpkh': {
    placeholder: 'e.g. bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    hint: 'Bitcoin Native SegWit (P2WPKH) mainnet address, Bech32. Starts with bc1q.',
    generate: async () => segwitEncode(BTC_HRP, randomBytes(20)),
    validate: async address => segwitDecode(BTC_HRP, address)?.length === 20,
  },
  'sol': {
    placeholder: 'e.g. EpqQ54Zqx39Rcvyw33fWmiEs2JWncpakGVF39uqt5NAE',
    hint: 'Solana address: Ed25519 public key in Base58. Also valid for SPL tokens.',
    generate: async () => base58Encode(await solanaPublicKey()),
    validate: async address => validateSolana(address),
  },
  // TRON: for future use. Hidden in the UI (option commented out in pages/crypto.html) until the platform supports it.
  // Same 20-byte hash as EVM, encoded as Base58Check with version 0x41 (always starts with T)
  'tron': {
    placeholder: 'e.g. T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    hint: 'TRON address, Base58Check with version byte 0x41. Valid for TRC20 tokens (e.g. USDT). Starts with T.',
    generate: async () => base58CheckEncode(concatBytes([TRON_VERSION], randomBytes(20))),
    validate: async address => address.length === 34 && validateBase58Check(address, TRON_VERSION),
  },
};

// ── UI ──────────────────────────────────────────────────
let cryptoRequestId = 0;

async function generateCrypto() {
  const requestId = ++cryptoRequestId;
  const format = cryptoFormats[document.getElementById('cryptoFormat').value];
  const output = document.getElementById('cryptoOutput');
  const hint = document.getElementById('cryptoHint');

  output.placeholder = format.placeholder;

  if (!window.crypto || !crypto.subtle) {
    output.value = '';
    hint.textContent = 'Web Crypto is unavailable. Open this page over https or http://localhost.';
    return;
  }

  let address = null;
  for (let attempt = 0; attempt < 5 && !address; attempt++) {
    const candidate = await format.generate();
    if (await format.validate(candidate)) address = candidate;
  }
  if (requestId !== cryptoRequestId) return; // a newer request has started

  output.value = address || '';
  const notes = [address ? format.hint : 'Generation failed — please try again.'];
  if (format === cryptoFormats.sol && !ed25519Supported) {
    notes.push('This browser lacks Ed25519 support: the address is format-valid but may be off-curve.');
  }
  notes.push(TEST_DATA_WARNING);
  hint.textContent = notes.join('\n\n');
}

function copyCrypto() {
  const input = document.getElementById('cryptoOutput');
  if (!input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('cryptoCopyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}
