function parseBillSequence(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+)-GST$/i);
  if (match) {
    return Number(match[1]);
  }
  return null;
}

function buildAutoBillNumber(existingNumbers = []) {
  const numbers = (existingNumbers || [])
    .map((value) => parseBillSequence(String(value || '')))
    .filter((value) => Number.isInteger(value));

  if (!numbers.length) return '38-GST';

  const max = Math.max(...numbers);
  return `${max + 1}-GST`;
}

module.exports = { buildAutoBillNumber, parseBillSequence };
