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

function buildBillItemSummary(items = []) {
  const rows = (items || []).map((it, index) => ({
    serial: index + 1,
    productName: String(it.product_name || it.name || 'Item'),
    hsn: String(it.hsn || '-'),
    gstRate: Number(it.gst_rate || 0),
    rate: Number(it.rate || 0),
    qty: Number(it.qty || it.quantity || 1),
    totalQty: Number(it.qty || it.quantity || 1),
    totalAmount: Number(it.total_amount || it.total || 0),
    gstAmount: Number(it.gst_amount || 0),
  }));

  return {
    rows,
    totalItems: rows.reduce((sum, row) => sum + row.qty, 0),
    totalGstAmount: rows.reduce((sum, row) => sum + row.gstAmount, 0),
  };
}

module.exports = { buildAutoBillNumber, buildBillItemSummary, parseBillSequence };
