// Run with:  node --test   (from the project folder)
const test = require('node:test');
const assert = require('node:assert/strict');
const AgriCalc = require('../js/calculator.js');

function onlyStream(id, values, costPercent) {
  const state = AgriCalc.defaultState();
  Object.keys(state.streams).forEach((k) => { state.streams[k].enabled = false; });
  state.streams[id].enabled = true;
  if (values) Object.assign(state.streams[id].values, values);
  if (costPercent !== undefined) state.streams[id].costPercent = costPercent;
  return state;
}

test('farm stays: units x rate x occupancy x nights', () => {
  const r = AgriCalc.streamRevenue('stays', { units: 2, rate: 150, occupancy: 50, nights: 200 });
  assert.equal(r, 30000);
});

test('u-pick: visitors x spend x days', () => {
  assert.equal(AgriCalc.streamRevenue('upick', { visitors: 60, spend: 18, days: 45 }), 48600);
});

test('events: events x income per event', () => {
  assert.equal(AgriCalc.streamRevenue('events', { events: 12, fee: 3500 }), 42000);
});

test('tours: tours x guests x price', () => {
  assert.equal(AgriCalc.streamRevenue('tours', { tours: 40, guests: 15, price: 20 }), 12000);
});

test('retail: customers x sale x days', () => {
  assert.equal(AgriCalc.streamRevenue('retail', { customers: 30, sale: 15, days: 120 }), 54000);
});

test('seasonal: visitors x (ticket + extra) x days', () => {
  assert.equal(AgriCalc.streamRevenue('seasonal', { visitors: 150, ticket: 12, extra: 8, days: 30 }), 90000);
});

test('custom: quantity x price', () => {
  assert.equal(AgriCalc.streamRevenue('custom', { quantity: 100, price: 25 }), 2500);
});

test('unknown stream returns 0', () => {
  assert.equal(AgriCalc.streamRevenue('nope', { a: 1 }), 0);
});

test('clean() handles blanks, text, negatives, commas and limits', () => {
  assert.equal(AgriCalc.clean('', 'money'), 0);
  assert.equal(AgriCalc.clean('abc', 'money'), 0);
  assert.equal(AgriCalc.clean(-5, 'count'), 0);
  assert.equal(AgriCalc.clean('1,250', 'money'), 1250);
  assert.equal(AgriCalc.clean(150, 'percent'), 100);
  assert.equal(AgriCalc.clean(400, 'days'), 366);
  assert.equal(AgriCalc.clean(undefined, 'count'), 0);
  assert.equal(AgriCalc.clean(Infinity, 'money'), 0);
});

test('bad inputs never produce NaN or negative revenue', () => {
  const r = AgriCalc.streamRevenue('stays', { units: 'x', rate: -10, occupancy: null, nights: '' });
  assert.equal(r, 0);
});

test('disabled streams are ignored', () => {
  const state = AgriCalc.defaultState();
  Object.keys(state.streams).forEach((k) => { state.streams[k].enabled = false; });
  const res = AgriCalc.calculate(state);
  assert.equal(res.gross, 0);
  assert.equal(res.net, 0);
  assert.deepEqual(res.breakdown, []);
});

test('net subtracts the cost percentage and fixed yearly costs', () => {
  const state = onlyStream('events', { events: 10, fee: 1000 }, 40); // 10,000 gross, 4,000 costs
  state.fixedCosts = 1500;
  const res = AgriCalc.calculate(state);
  assert.equal(res.gross, 10000);
  assert.equal(res.variableCosts, 4000);
  assert.equal(res.fixedCosts, 1500);
  assert.equal(res.net, 4500);
  assert.equal(res.breakdown.length, 1);
  assert.equal(res.breakdown[0].net, 6000);
  assert.equal(res.breakdown[0].share, 1);
});

test('net can go negative when costs exceed income', () => {
  const state = onlyStream('custom', { quantity: 10, price: 10 }, 50); // 100 gross, 50 margin
  state.fixedCosts = 500;
  assert.equal(AgriCalc.calculate(state).net, -450);
});

test('gross is the sum of enabled streams and shares add up to 1', () => {
  const state = AgriCalc.defaultState(); // stays, u-pick, retail on by default
  const res = AgriCalc.calculate(state);
  assert.equal(res.gross, 30000 + 48600 + 54000);
  const totalShare = res.breakdown.reduce((s, b) => s + b.share, 0);
  assert.ok(Math.abs(totalShare - 1) < 1e-9);
});

test('scenarios scale revenue and per-stream costs, but not fixed costs', () => {
  const state = onlyStream('events', { events: 10, fee: 1000 }, 40);
  state.fixedCosts = 1000;
  const res = AgriCalc.calculate(state, { low: 0.5, high: 2 });
  assert.equal(res.scenarios.expected.gross, 10000);
  assert.equal(res.scenarios.expected.net, 5000);
  assert.equal(res.scenarios.low.gross, 5000);
  assert.equal(res.scenarios.low.net, 2000);  // 0.5 * 6000 - 1000
  assert.equal(res.scenarios.high.gross, 20000);
  assert.equal(res.scenarios.high.net, 11000); // 2 * 6000 - 1000
});

test('custom stream uses the visitor-supplied name', () => {
  const state = onlyStream('custom');
  state.streams.custom.name = '  Goat yoga  ';
  assert.equal(AgriCalc.calculate(state).breakdown[0].name, 'Goat yoga');
  state.streams.custom.name = '   ';
  assert.equal(AgriCalc.calculate(state).breakdown[0].name, 'Your own idea');
});

test('defaultState returns independent copies', () => {
  const a = AgriCalc.defaultState();
  const b = AgriCalc.defaultState();
  a.streams.stays.values.units = 99;
  assert.equal(b.streams.stays.values.units, 2);
});

test('every stream has a cost percentage and labelled fields', () => {
  AgriCalc.STREAMS.forEach((s) => {
    assert.equal(typeof s.costPercent, 'number');
    assert.ok(s.fields.length > 0);
    s.fields.forEach((f) => {
      assert.ok(f.label && f.key && AgriCalc.LIMITS[f.kind], `${s.id}.${f.key}`);
    });
  });
});
