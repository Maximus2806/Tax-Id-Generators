function formatCPF(digits) {
  const s = digits.join('');
  return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9,11)}`;
}

function isBlacklistedCPF(digits) {
  return digits.every(d => d === digits[0]);
}

function calcCheckDigit(digits, weightsStart) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (weightsStart - i);
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

function generateRandomCPF() {
  let base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  while (isBlacklistedCPF(base)) {
    base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  }
  const d10 = calcCheckDigit(base, 10);
  const d11 = calcCheckDigit([...base, d10], 11);
  document.getElementById('cpfNumber').value = formatCPF([...base, d10, d11]);
}

function copyCPF() {
  const input = document.getElementById('cpfNumber');
  if (!input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('cpfCopyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}
