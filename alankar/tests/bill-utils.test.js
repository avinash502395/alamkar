const assert = require('assert');
const { buildAutoBillNumber } = require('../bill-utils');

assert.strictEqual(buildAutoBillNumber([]), '38-GST');
assert.strictEqual(buildAutoBillNumber(['38-GST']), '39-GST');
assert.strictEqual(buildAutoBillNumber(['38-GST', '39-GST']), '40-GST');
assert.strictEqual(buildAutoBillNumber(['BILL-0001', '39-GST']), '40-GST');
assert.strictEqual(buildAutoBillNumber(['40-GST', '41-GST']), '42-GST');
console.log('bill-utils tests passed');
