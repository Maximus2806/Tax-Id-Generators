const mexicanStates = {
  AS: 'Aguascalientes', BC: 'Baja California', BS: 'Baja California Sur',
  CC: 'Campeche', CL: 'Coahuila', CM: 'Colima', CS: 'Chiapas',
  CH: 'Chihuahua', DF: 'Ciudad de México', DG: 'Durango',
  GT: 'Guanajuato', GR: 'Guerrero', HG: 'Hidalgo', JC: 'Jalisco',
  MC: 'México', MN: 'Michoacán', MS: 'Morelos', NT: 'Nayarit',
  NL: 'Nuevo León', OC: 'Oaxaca', PL: 'Puebla', QT: 'Querétaro',
  QR: 'Quintana Roo', SP: 'San Luis Potosí', SL: 'Sinaloa',
  SR: 'Sonora', TC: 'Tabasco', TS: 'Tamaulipas', TL: 'Tlaxcala',
  VZ: 'Veracruz', YN: 'Yucatán', ZS: 'Zacatecas', NE: 'Nacido en el Extranjero',
};

function cleanString(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
}

function firstInternalVowel(str) {
  const match = str.slice(1).match(/[AEIOU]/);
  return match ? match[0] : 'X';
}

function firstInternalConsonant(str) {
  const match = str.slice(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/);
  return match ? match[0] : 'X';
}

function generateCURP(firstName, lastName1, lastName2, birthDate, gender, stateCode) {
  lastName1 = cleanString(lastName1);
  lastName2 = cleanString(lastName2);
  firstName = cleanString(firstName);
  const yy = String(birthDate.getFullYear()).slice(-2);
  const mm = String(birthDate.getMonth() + 1).padStart(2, '0');
  const dd = String(birthDate.getDate()).padStart(2, '0');
  const part1 = lastName1[0] + firstInternalVowel(lastName1) + (lastName2[0] || 'X') + (firstName[0] || 'X');
  const part2 = yy + mm + dd + gender.toUpperCase() + (mexicanStates[stateCode] ? stateCode : 'NE');
  const part3 = firstInternalConsonant(lastName1) + firstInternalConsonant(lastName2) + firstInternalConsonant(firstName);
  const part4 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return (part1 + part2 + part3 + part4).toUpperCase();
}

function generateRFC(firstName, lastName1, lastName2, birthDate) {
  lastName1 = cleanString(lastName1);
  lastName2 = cleanString(lastName2);
  firstName = cleanString(firstName);
  const yy = String(birthDate.getFullYear()).slice(-2);
  const mm = String(birthDate.getMonth() + 1).padStart(2, '0');
  const dd = String(birthDate.getDate()).padStart(2, '0');
  const part1 = lastName1[0] + firstInternalVowel(lastName1) + (lastName2[0] || 'X') + (firstName[0] || 'X');
  const homoclave = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  return (part1 + yy + mm + dd + homoclave).toUpperCase();
}

function generateFromForm() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName1 = document.getElementById('lastName1').value.trim();
  const lastName2 = document.getElementById('lastName2').value.trim();
  const birthDate = new Date(document.getElementById('birthDate').value);
  const gender = document.getElementById('gender').value;
  const stateCode = document.getElementById('stateCode').value;

  if (!firstName || !lastName1 || isNaN(birthDate.getTime())) {
    document.getElementById('curpOutput').value = '';
    document.getElementById('rfcOutput').value = '';
    document.getElementById('outputSection').style.display = 'none';
    alert('Please fill all required fields.');
    return;
  }

  document.getElementById('curpOutput').value = generateCURP(firstName, lastName1, lastName2, birthDate, gender, stateCode);
  document.getElementById('rfcOutput').value = generateRFC(firstName, lastName1, lastName2, birthDate);
  document.getElementById('outputSection').style.display = 'block';
}

// ── Random data ───────────────────────────────────────

const maleNames = ['Juan', 'José', 'Carlos', 'Luis', 'Miguel', 'Pedro', 'Jorge', 'Andrés'];
const femaleNames = ['María', 'Guadalupe', 'Ana', 'Laura', 'Patricia', 'Carla', 'Lucía', 'Verónica'];
const lastNames = ['García', 'Martínez', 'López', 'Hernández', 'González', 'Pérez', 'Rodríguez', 'Sánchez'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillRandom() {
  const gender = Math.random() > 0.5 ? 'H' : 'M';
  const firstName = gender === 'H' ? randomItem(maleNames) : randomItem(femaleNames);
  const year = Math.floor(Math.random() * (2005 - 1960 + 1)) + 1960;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  const birthDate = new Date(year, month, day).toISOString().split('T')[0];
  const stateKeys = Object.keys(mexicanStates);

  document.getElementById('firstName').value = firstName;
  document.getElementById('lastName1').value = randomItem(lastNames);
  document.getElementById('lastName2').value = randomItem(lastNames);
  document.getElementById('birthDate').value = birthDate;
  document.getElementById('gender').value = gender;
  document.getElementById('stateCode').value = randomItem(stateKeys);
}

function copyField(inputId, btnId, label) {
  const input = document.getElementById(inputId);
  if (!input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById(btnId);
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = `Copy ${label}`; }, 1500);
  });
}
