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
    totalGstAmount: Math.round(rows.reduce((sum, row) => sum + row.gstAmount, 0) * 100) / 100,
  };
}

function distributeBillDiscount(items = [], discount = 0) {
  const rows = (items || []).map((item) => ({ ...item }));
  const grossCents = rows.map((item) => Math.max(0, Math.round(Number(item.total_amount || 0) * 100)));
  const grossTotal = grossCents.reduce((sum, amount) => sum + amount, 0);
  const discountCents = Math.min(grossTotal, Math.max(0, Math.round(Number(discount || 0) * 100)));
  const allocations = grossCents.map((amount) => grossTotal ? Math.floor(discountCents * amount / grossTotal) : 0);
  let remaining = discountCents - allocations.reduce((sum, amount) => sum + amount, 0);
  const remainderOrder = grossCents
    .map((amount, index) => ({ index, remainder: grossTotal ? discountCents * amount % grossTotal : 0 }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const row of remainderOrder) {
    if (!remaining) break;
    if (grossCents[row.index] > allocations[row.index]) {
      allocations[row.index] += 1;
      remaining -= 1;
    }
  }

  const discountedItems = rows.map((item, index) => {
    const originalCents = grossCents[index];
    const totalCents = originalCents - allocations[index];
    const originalBase = Number(item.base_amount || 0);
    const baseAmount = originalCents
      ? Math.round(originalBase * totalCents / originalCents * 100) / 100
      : 0;
    const totalAmount = totalCents / 100;
    return {
      ...item,
      base_amount: baseAmount,
      gst_amount: Math.round((totalAmount - baseAmount) * 100) / 100,
      total_amount: totalAmount,
      discount_amount: allocations[index] / 100,
    };
  });
  const subtotal = Math.round(discountedItems.reduce((sum, item) => sum + item.base_amount, 0) * 100) / 100;
  const gstTotal = Math.round(discountedItems.reduce((sum, item) => sum + item.gst_amount, 0) * 100) / 100;
  const cgst = Math.round(gstTotal / 2 * 100) / 100;
  const total = Math.round(discountedItems.reduce((sum, item) => sum + item.total_amount, 0) * 100) / 100;

  return {
    items: discountedItems,
    subtotal,
    cgst,
    sgst: Math.round((gstTotal - cgst) * 100) / 100,
    discount: discountCents / 100,
    total,
  };
}

const billUtils = { buildAutoBillNumber, buildBillItemSummary, distributeBillDiscount, parseBillSequence };
if (typeof module !== 'undefined') module.exports = billUtils;
if (typeof window !== 'undefined') window.AlankarBillUtils = billUtils;
