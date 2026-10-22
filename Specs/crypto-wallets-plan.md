# План: генератор тестовых криптоадресов (EVM/ERC20, BTC, Solana, TRON)

Статус: черновик · Дата: 2026-10-22

> **Изменение после реализации (2026-10-22):** BTC testnet-адреса и Taproot (`bc1p`, Bech32m) не проходят валидацию на нашей платформе, поэтому их убрали. Переключатель Mainnet/Testnet удалён, Bitcoin генерируется только в mainnet-форматах P2PKH, P2SH и P2WPKH. Итого 5 форматов: EVM, три BTC и Solana. Разделы ниже, где упоминаются testnet, Taproot и Bech32m (§2, §4.4, §5, §8), считать неактуальными.

## 1. Цель и рамки

Генерировать **адреса правильного формата** для QA: значение должно пройти валидацию поля «адрес кошелька» в формах депозита и вывода, чтобы тестировщик смог пройти флоу дальше.

**В рамках задачи:**
- Только адрес. Приватных ключей, seed-фраз и деривации нет.
- Адрес проходит все проверки формата и контрольных сумм, которые применяют типичные валидаторы (регулярки, EIP-55, Base58Check, Bech32/Bech32m, длина и декодирование Base58).
- Адрес структурно корректен даже для строгих валидаторов. Для Taproot и Solana это значит, что ключ лежит на кривой (см. §4).

**Вне рамок:** реальные операции в блокчейне, получение средств, балансы, вызовы RPC и API.

Адреса никому не принадлежат: ключа к ним нет, и средства, отправленные на них, будут потеряны. На странице это нужно сказать явно (§5).

## 2. Поддерживаемые форматы

| Значение `<select>` | Сеть | Формат | Пример префикса | Длина |
|---|---|---|---|---|
| `evm` | Ethereum и EVM-сети (ERC20, BEP20, Polygon, Arbitrum…) | `0x` + 40 hex, регистр по EIP-55 | `0x` | 42 |
| `btc-p2pkh` | Bitcoin | Legacy P2PKH, Base58Check | `1` (testnet `m`/`n`) | 26–34 |
| `btc-p2sh` | Bitcoin | P2SH (в т.ч. обёрнутый SegWit), Base58Check | `3` (testnet `2`) | 34–35 |
| `btc-p2wpkh` | Bitcoin | Native SegWit v0, Bech32 | `bc1q` (testnet `tb1q`) | 42 |
| `btc-p2tr` | Bitcoin | Taproot v1, Bech32m | `bc1p` (testnet `tb1p`) | 62 |
| `sol` | Solana | 32 байта в Base58 | — | 32–44 |
| `tron` | TRON (TRC20: USDT и др.) | Base58Check, байт версии `0x41` | `T` | 34 |

Плюс переключатель **Network: Mainnet / Testnet**. Он влияет только на форматы BTC; для EVM, Solana и TRON его прячем или блокируем. Testnet-сети TRON (Shasta, Nile) используют тот же префикс `T`. Стоит недорого и полезен, потому что staging-окружения часто валидируют testnet-адреса.

## 3. Архитектура (по правилам CLAUDE.md)

Новые файлы:
- `js/crypto.js` — вся логика, только глобальные функции, без модулей и импортов.
- `pages/crypto.html` — одна страница с выбором формата, по шаблону `pages/iban.html`.

Изменяемые файлы:
- `index.html` — новая `.gen-card`.
- `CLAUDE.md` — строка в таблице генераторов и короткий раздел про алгоритмы и отступления от правил.

Новых CSS-правил нет: используем `.page-generator`, `.card`, `label`, `select`, `.btn-row` и `.result`. flag-icons не подключаем: вместо флага будет эмодзи, как у IBAN.

### Осознанные отступления от текущих правил

1. **`crypto.getRandomValues()` вместо `Math.random()`** для случайных байтов. Причина не в безопасности, а в удобстве: сразу получаем `Uint8Array` нужной длины. Метод синхронный и работает и вне secure context.
2. **`async`-функции.** SHA-256 (`crypto.subtle.digest`) и Ed25519 (`crypto.subtle.generateKey`) в браузере асинхронные. `onclick="generateCrypto()"` при этом работает без изменений.
3. **`crypto.subtle` требует secure context.** На Vercel (https) и `localhost` всё работает. При открытии через `file://` может не работать, поэтому локально запускать через `python -m http.server`, как уже рекомендует CLAUDE.md. Если `crypto.subtle` нет, показываем понятное сообщение об ошибке в поле вывода.

## 4. Алгоритмы

### 4.1 Общие хелперы (`js/crypto.js`)
- `randomBytes(n)` → `crypto.getRandomValues(new Uint8Array(n))`
- `bytesToHex(bytes)`, `hexToBytes(hex)`
- `sha256(bytes)` → `await crypto.subtle.digest('SHA-256', bytes)` → `Uint8Array`
- `base58Encode(bytes)` и `base58Decode(str)`: алфавит Bitcoin `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`, ведущие нулевые байты кодируются как `1`. Удобно писать через BigInt (~25 строк).

### 4.2 EVM / ERC20
1. `addr = bytesToHex(randomBytes(20))` в нижнем регистре.
2. EIP-55: `h = keccak256(ascii(addr))` в hex. Для каждого символа-буквы `addr[i]`: если `parseInt(h[i], 16) >= 8`, переводим его в верхний регистр.
3. Результат: `'0x' + checksummed`.

**Keccak-256 пишем вручную**, потому что Web Crypto его не поддерживает. Это **не** SHA3-256: паддинг `0x01`, а не `0x06`. Реализация sponge с rate 136 байт и 24 раундами Keccak-f[1600]. Проще всего на `BigInt` (25 lanes, ~60 строк); для одного хеша на 40 байт скорость не важна.

Приватный ключ не нужен: адрес — это последние 20 байт хеша от публичного ключа, и по нему невозможно проверить, существует ли ключ. Случайные 20 байт от настоящего адреса не отличить.

### 4.3 BTC Base58Check (P2PKH, P2SH)
1. `payload = [version] + randomBytes(20)` (hash160 не отличить от случайных байтов).
   - Версии: P2PKH `0x00` (mainnet) / `0x6F` (testnet), P2SH `0x05` / `0xC4`.
2. `checksum = sha256(sha256(payload)).slice(0, 4)`.
3. `base58Encode(payload + checksum)`.

### 4.4 BTC Bech32 / Bech32m (P2WPKH, P2TR)
По эталонному коду BIP173 и BIP350 (~50 строк):
- `polymod`, `hrpExpand`, `createChecksum(hrp, data, const)`, `convertBits(data, 8, 5, true)`.
- Константы: Bech32 `1`, Bech32m `0x2bc830a3`.
- HRP: `bc` (mainnet) / `tb` (testnet).
- P2WPKH: witness version `0`, программа `randomBytes(20)`, кодировка **Bech32**.
- P2TR: witness version `1`, программа 32 байта, кодировка **Bech32m**.
- Итог: `hrp + '1' + charset-кодирование([witver] + convertBits(program) + checksum)`.

**Taproot, корректная точка на кривой.** Программа P2TR — это x-only публичный ключ secp256k1. Только ~50% случайных 32-байтовых значений являются корректной координатой x, а строгие валидаторы (например, `bitcoinjs-lib` с проверкой ключа) это проверяют. Алгоритм:
- `p = 2^256 − 2^32 − 977`. Требуем `x < p`, вычисляем `y² = x³ + 7 mod p`.
- Проверка критерием Эйлера: `modPow(y², (p−1)/2, p) === 1n` (или `y² === 0n`).
- Если проверка не прошла, берём новые 32 байта. В среднем нужно около 2 попыток.
- `modPow` на BigInt занимает ~10 строк.

### 4.5 Solana
Адрес Solana — это Ed25519 public key (32 байта) в Base58. Около половины случайных 32-байтовых значений **не** лежат на кривой. Часть валидаторов (`PublicKey.isOnCurve` в `@solana/web3.js`, проверки на биржах) такие адреса отклоняет как PDA, а не как кошелёк.

Решение:
1. Основной путь: `crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])`, затем `exportKey('raw', publicKey)` даёт 32 байта гарантированно корректной точки. Приватный ключ сразу выбрасываем и нигде не показываем.
2. Запасной путь, если браузер не поддерживает Ed25519 в Web Crypto: `randomBytes(32)`. Это допустимый по формату адрес, но без гарантии нахождения на кривой. В подсказке это нужно отметить.

### 4.6 TRON
Адрес TRON устроен так же, как адрес Ethereum: это последние 20 байт Keccak-256 от публичного ключа secp256k1. Отличие в том, что вместо `0x` используется байт версии `0x41` и кодировка Base58Check.
1. `payload = [0x41] + randomBytes(20)`.
2. Дальше как в §4.3: `checksum = sha256(sha256(payload)).slice(0, 4)`, затем `base58Encode(payload + checksum)`.
3. Результат всегда начинается с `T` и имеет длину 34 символа.

Keccak здесь не нужен, потому что хеш заменяется случайными байтами. Переиспользуется код Base58Check из BTC, меняется только байт версии.

### 4.7 Самопроверка перед выводом (по образцу `validateIBAN`)
`validateAddress(format, network, address)` независимо декодирует сгенерированную строку:
- EVM: регулярка `^0x[0-9a-fA-F]{40}$` и пересчёт EIP-55 совпадает.
- Base58Check: декодирование, пересчёт 4 байт контрольной суммы, проверка байта версии и длины 25. Для TRON дополнительно: версия `0x41`, длина строки 34.
- Bech32/Bech32m: декодирование, `polymod` с нужной константой, проверка HRP, witness version и длины программы.
- Solana: декодирование Base58 даёт ровно 32 байта.

Если проверка не прошла (на практике не должно случаться), генерируем заново, не более 5 попыток, затем показываем ошибку.

## 5. UI: `pages/crypto.html`

По шаблону `iban.html`:
- `<title>Crypto Address Generator — Tax ID Generator</title>`, breadcrumb `/ Crypto Wallets`.
- `<h2>&#129689; Crypto Address Generator</h2>` (🪙).
- `<label for="cryptoFormat">Network / Format</label>` и `<select id="cryptoFormat" onchange="generateCrypto()">` с вариантами из §2 через `<optgroup>`:
  - Ethereum / EVM: `ERC20 / EVM (0x…)`
  - Bitcoin: `Legacy P2PKH (1…)`, `P2SH (3…)`, `Native SegWit (bc1q…)`, `Taproot (bc1p…)`
  - Solana: `Solana (Base58)`
  - TRON: `TRON / TRC20 (T…)`
- `<label for="cryptoNetwork">Network</label>` и `<select id="cryptoNetwork" onchange="generateCrypto()">` с вариантами Mainnet и Testnet. Для не-BTC форматов ставим `disabled`.
- `<input type="text" id="cryptoOutput" readonly>`. Плейсхолдер меняется под формат.
- `.btn-row`: `Generate` (`generateCrypto()`) и `Copy` (`id="cryptoCopyBtn"`, `copyCrypto()`).
- `<div class="result" id="cryptoHint">` с короткой подсказкой по формату (например, «Also valid on BSC, Polygon, Arbitrum…») и постоянным предупреждением: *«Test data only. No private key exists for this address — any funds sent to it are lost.»*
- В конце `<script src="../js/crypto.js"></script><script>generateCrypto();</script>`.

`copyCrypto()` работает как остальные: `navigator.clipboard.writeText`, затем `Copied!` на 1500 мс. Пробелы не вырезаем, их нет.

## 6. Карточка в `index.html`

Добавить после карточки IBAN:
```html
<div class="gen-card">
  <div class="flag">&#129689;</div>
  <h3>Crypto Wallets</h3>
  <div class="country">ERC20 · Bitcoin · Solana · TRON</div>
  <div class="currency">7 formats</div>
  <a class="btn" href="pages/crypto.html">Open Generator</a>
</div>
```

## 7. Порядок работ

| # | Шаг | Объём |
|---|---|---|
| 1 | Хелперы: random, hex, sha256, Base58 | ~50 строк |
| 2 | Keccak-256 и EIP-55, проверка на тест-векторах | ~80 строк |
| 3 | Base58Check: P2PKH и P2SH, mainnet/testnet | ~25 строк |
| 4 | Bech32/Bech32m: P2WPKH и P2TR, проверка точки на кривой для Taproot | ~80 строк |
| 5 | Solana: Ed25519 через Web Crypto и запасной путь | ~20 строк |
| 5a | TRON: Base58Check с версией `0x41` (переиспользует шаг 3) | ~10 строк |
| 6 | `validateAddress` и диспетчер `generateCrypto()`, `copyCrypto()` | ~70 строк |
| 7 | `pages/crypto.html` и карточка в `index.html` | ~70 строк HTML |
| 8 | Ручная проверка (§8) | — |
| 9 | Обновить `CLAUDE.md`, коммит, PR, деплой (`vercel --prod` из актуального `main`) | — |

Итого примерно 360 строк JS, сравнимо с `iban.js` (166 строк) плюс Keccak.

## 8. Проверка

### 8.1 Тест-векторы (прогнать в консоли браузера на странице)
| Функция | Вход | Ожидаемый результат |
|---|---|---|
| `keccak256` | пустая строка | `c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470` |
| EIP-55 | `5aaeb6053f3e94c9b9a09f33669435e7ef1beaed` | `0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed` |
| EIP-55 | `fb6916095ca1df60bb79ce92ce3ea74c37c5d359` | `0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359` |
| Base58Check P2PKH | version `0x00`, 20 нулевых байт | `1111111111111111111114oLvT2` |
| Bech32 P2WPKH mainnet | `751e76e8199196d454941c45d1b3a323f1433bd6` | `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4` |
| Bech32 P2WPKH testnet | то же | `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx` |
| Bech32m P2TR (BIP350) | `79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798` | `bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0` |
| Base58 (Solana) | 32 нулевых байта | `11111111111111111111111111111111` |
| Base58Check (TRON) | version `0x41`, 20 нулевых байт | `T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb` |

### 8.2 Внешняя проверка
Несколько сгенерированных адресов каждого формата проверить сторонним валидатором, например формой ввода адреса в MetaMask, Phantom, TronLink или Electrum, офлайн-инструментом или тестовым стендом самого продукта. Блокчейн-обозреватели не подходят: им нужен существующий адрес, а наши адреса пустые, хотя и корректные.

### 8.3 Ручные сценарии UI
- Каждый формат × сеть: значение генерируется при загрузке и при смене `<select>`, префикс и длина соответствуют §2.
- Для EVM, Solana и TRON переключатель Network заблокирован.
- Copy копирует значение без лишних символов, на кнопке на 1500 мс появляется `Copied!`.
- Карточка на главной ведёт на страницу, breadcrumb ведёт обратно.
- Проверить в Chrome, Firefox и Safari, в том числе путь Ed25519. При отсутствии поддержки должен сработать запасной путь без ошибок.
- Ширина экрана телефона: длинный Taproot-адрес не ломает вёрстку, `<input>` остаётся в пределах карточки.

## 9. Критерии готовности
- [ ] Все тест-векторы из §8.1 совпадают.
- [ ] Каждый сгенерированный адрес проходит `validateAddress` и внешний валидатор (§8.2).
- [ ] Taproot-программа — корректная координата x на secp256k1. Публичный ключ Solana — корректная точка Ed25519 (основной путь).
- [ ] Нет новых зависимостей, ES-модулей и CSS-правил. Страница работает на Vercel и через `python -m http.server`.
- [ ] `CLAUDE.md` обновлён: таблица генераторов, описание алгоритмов, отступления из §3.

## 10. Риски и открытые вопросы
- **Ошибка в Keccak.** Это самый «тонкий» кусок кода. Риск закрывают тест-векторы EIP-55 из §8.1.
- **Валидаторы конкретных продуктов** могут поддерживать не все форматы (например, только `bc1q`, без Taproot). Это не ошибка генератора: тестировщик выбирает нужный формат.
- **Нужны ли форматы сверх перечисленных** (Litecoin, P2WSH `bc1q…` на 62 символа, адреса в нижнем регистре без EIP-55)? Пока вне рамок; архитектура с таблицей форматов позволяет добавить их позже.
