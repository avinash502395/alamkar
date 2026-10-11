const assert = require('assert');
const { buildAutoBillNumber, buildBillItemSummary, distributeBillDiscount } = require('../bill-utils');

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

const discounted = distributeBillDiscount([
  { product_name: 'Agarbatti', base_amount: 190.48, gst_amount: 9.52, total_amount: 200 },
  { product_name: 'Camphor', base_amount: 44.64, gst_amount: 5.36, total_amount: 50 },
], 25);
assert.deepStrictEqual(discounted.items.map((item) => [item.discount_amount, item.total_amount]), [[20, 180], [5, 45]]);
assert.deepStrictEqual([discounted.subtotal, discounted.cgst, discounted.sgst, discounted.discount, discounted.total], [211.61, 6.7, 6.69, 25, 225]);

const pennyDiscount = distributeBillDiscount([
  { base_amount: 1, gst_amount: 0, total_amount: 1 },
  { base_amount: 1, gst_amount: 0, total_amount: 1 },
  { base_amount: 1, gst_amount: 0, total_amount: 1 },
], 0.01);
assert.deepStrictEqual(pennyDiscount.items.map((item) => item.discount_amount), [0.01, 0, 0]);
assert.strictEqual(pennyDiscount.items.reduce((sum, item) => sum + item.total_amount, 0), 2.99);

const cappedDiscount = distributeBillDiscount([
  { base_amount: 9.52, gst_amount: 0.48, total_amount: 10 },
], 15);
assert.deepStrictEqual([cappedDiscount.discount, cappedDiscount.total], [10, 0]);
console.log('bill-utils tests passed');
