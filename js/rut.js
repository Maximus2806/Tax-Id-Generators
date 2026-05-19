function calculateDV(num) {
  let sum = 0;
  let multiplier = 2;
  for (let i = num.toString().length - 1; i >= 0; i--) {
    sum += parseInt(num.toString()[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

function formatRUT(num, dv) {
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

function generateRandomRUT() {
  const num = Math.floor(Math.random() * (25000000 - 1000000) + 1000000);
  document.getElementById('rutNumber').value = formatRUT(num, calculateDV(num));
}

function copyRUT() {
  const input = document.getElementById('rutNumber');
  if (!input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('rutCopyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}
