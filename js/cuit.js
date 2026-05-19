function calculateCheckDigit(cuitDigits) {
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cuitDigits[i] * weights[i];
  }
  const check = 11 - (sum % 11);
  if (check === 11) return 0;
  if (check === 10) return null;
  return check;
}

function formatCUIT(digits) {
  return `${digits.slice(0, 2).join('')}-${digits.slice(2, 10).join('')}-${digits[10]}`;
}

function generateRandomCUIT() {
  const prefixes = [20, 23, 24, 27, 30, 33, 34];
  let cuitDigits = [];
  let check = null;

  while (check === null) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const base = [
      ...String(prefix).split('').map(Number),
      ...Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)),
    ];
    check = calculateCheckDigit(base);
    if (check !== null) {
      cuitDigits = [...base, check];
    }
  }

  document.getElementById('cuitNumber').value = formatCUIT(cuitDigits);
}

function copyCUIT() {
  const input = document.getElementById('cuitNumber');
  if (!input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('cuitCopyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}
