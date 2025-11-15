function normalizeSpaces(s) {
  let str = s.trim();
  while (str.indexOf('  ') !== -1) {
    str = str.replace('  ', ' ');
  }
  return str;
}

function toUpperSafe(s) {
  return s == null ? s : String(s).toUpperCase();
}

function isPositiveIntegerString(s) {
  if (typeof s !== 'string' && typeof s !== 'number') return false;
  const str = String(s);
  if (str.length === 0) return false;
  // disallow decimal point or minus sign
  if (str.indexOf('.') !== -1 || str.indexOf('-') !== -1) return false;
  // ensure every char is digit
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  // prevent leading zeros like ""? allow 0? spec says positive integer (>0)
  const n = parseInt(str, 10);
  return Number.isFinite(n) && n > 0;
}

function isValidAccountId(id) {
  if (typeof id !== 'string' || id.length === 0) return false;
  for (let i = 0; i < id.length; i++) {
    const c = id.charAt(i);
    const code = id.charCodeAt(i);
    // allow letters, numbers, hyphen (-), period (.), at (@)
    const isAlpha = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    const isNum = (code >= 48 && code <= 57);
    const isAllowedPunct = c === '-' || c === '.' || c === '@';
    if (!(isAlpha || isNum || isAllowedPunct)) return false;
  }
  return true;
}

function isValidDateYYYYMMDD(s) {
  if (typeof s !== 'string') return false;
  const parts = s.split('-');
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  if (y.length !== 4 || m.length < 1 || m.length > 2 || d.length < 1 || d.length > 2) return false;
  // numeric checks
  for (let ch of y) if (ch < '0' || ch > '9') return false;
  for (let ch of m) if (ch < '0' || ch > '9') return false;
  for (let ch of d) if (ch < '0' || ch > '9') return false;
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  const di = parseInt(d, 10);
  if (!(yi >= 0 && mi >= 1 && mi <= 12 && di >= 1 && di <= 31)) return false;
  // basic day checks
  const mdays = [31, (yi % 4 === 0 && yi % 100 !== 0) || (yi % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (di > mdays[mi - 1]) return false;
  return true;
}

function compareDateOnlyUTC(aYYYYMMDD, bYYYYMMDD) {
  // returns -1 if a < b, 0 if equal, 1 if a > b
  const partsA = aYYYYMMDD.split('-').map(x => parseInt(x, 10));
  const partsB = bYYYYMMDD.split('-').map(x => parseInt(x, 10));
  for (let i = 0; i < 3; i++) {
    if (partsA[i] < partsB[i]) return -1;
    if (partsA[i] > partsB[i]) return 1;
  }
  return 0;
}

function utcTodayYYYYMMDD() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const mm = m < 10 ? '0' + m : '' + m;
  const dd = d < 10 ? '0' + d : '' + d;
  return `${y}-${mm}-${dd}`;
}

function utilsSilentParseInt(v) {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

module.exports = {
  normalizeSpaces,
  toUpperSafe,
  isPositiveIntegerString,
  isValidAccountId,
  isValidDateYYYYMMDD,
  compareDateOnlyUTC,
  utcTodayYYYYMMDD,
  utilsSilentParseInt
};
