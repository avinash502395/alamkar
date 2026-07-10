const assert = require('assert');
const { buildAutoBillNumber, buildBillItemSummary } = require('../bill-utils');

assert.strictEqual(buildAutoBillNumber([]), '38-GST');
assert.strictEqual(buildAutoBillNumber(['38-GST']), '39-GST');
assert.strictEqual(buildAutoBillNumber(['38-GST', '39-GST']), '40-GST');
assert.strictEqual(buildAutoBillNumber(['BILL-0001', '39-GST']), '40-GST');
assert.strictEqual(buildAutoBillNumber(['40-GST', '41-GST']), '42-GST');

const summary = buildBillItemSummary([
  { product_name: 'Agarbatti', qty: 2, rate: 100, gst_rate: 5, base_amount: 190.48, gst_amount: 9.52, total_amount: 200 },
  { product_name: 'Camphor', qty: 1, rate: 50, gst_rate: 12, base_amount: 44.64, gst_amount: 5.36, total_amount: 50 },
]);
assert.deepStrictEqual(summary.rows.map((row) => ({ serial: row.serial, gstRate: row.gstRate, totalQty: row.totalQty, gstAmount: row.gstAmount })), [
  { serial: 1, gstRate: 5, totalQty: 2, gstAmount: 9.52 },
  { serial: 2, gstRate: 12, totalQty: 1, gstAmount: 5.36 },
]);
assert.strictEqual(summary.totalItems, 3);
assert.strictEqual(summary.totalGstAmount, 14.88);
console.log('bill-utils tests passed');
