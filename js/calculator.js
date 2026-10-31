/*
 * Agritourism Revenue Calculator — calculation logic.
 *
 * This file has no browser code in it, so it can be tested on its own
 * (see tests/calculator.test.js). The page loads it as window.AgriCalc.
 *
 * ABOUT THE STARTING NUMBERS
 * --------------------------
 * Every default value below (rates, visitor counts, days open, cost
 * percentages) is an ILLUSTRATIVE EXAMPLE ONLY. None of them come from a
 * survey, study or industry report. They exist so the calculator shows a
 * sensible-looking result on first load. The page tells visitors to replace
 * them with their own numbers.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AgriCalc = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Field kinds: "money" (currency amount), "percent" (0-100),
  // "count" (whole number), "days" (0-366 days or nights per year).
  var STREAMS = [
    {
      id: 'stays',
      name: 'Farm stays',
      hint: 'Cabins, glamping tents, farmhouse rooms or RV sites.',
      enabled: true,
      costPercent: 35, // illustrative example
      fields: [
        { key: 'units', label: 'Rooms, cabins or sites you rent', kind: 'count', value: 2 },          // illustrative example
        { key: 'rate', label: 'Average price per night', kind: 'money', value: 150 },                 // illustrative example
        { key: 'occupancy', label: 'Share of open nights booked (%)', kind: 'percent', value: 50 },     // illustrative example
        { key: 'nights', label: 'Nights open per year', kind: 'days', value: 200 }                    // illustrative example
      ],
      revenue: function (v) { return v.units * v.rate * (v.occupancy / 100) * v.nights; }
    },
    {
      id: 'upick',
      name: 'U-pick',
      hint: 'Berries, apples, flowers, pumpkins and other pick-your-own crops.',
      enabled: true,
      costPercent: 40, // illustrative example
      fields: [
        { key: 'visitors', label: 'Visitors per day (average)', kind: 'count', value: 60 },           // illustrative example
        { key: 'spend', label: 'Average spend per visitor', kind: 'money', value: 18 },                // illustrative example
        { key: 'days', label: 'Days open per year', kind: 'days', value: 45 }                         // illustrative example
      ],
      revenue: function (v) { return v.visitors * v.spend * v.days; }
    },
    {
      id: 'events',
      name: 'Events and weddings',
      hint: 'Weddings, private parties, corporate retreats, farm dinners.',
      enabled: false,
      costPercent: 45, // illustrative example
      fields: [
        { key: 'events', label: 'Events per year', kind: 'count', value: 12 },                        // illustrative example
        { key: 'fee', label: 'Average income per event', kind: 'money', value: 3500 }                  // illustrative example
      ],
      revenue: function (v) { return v.events * v.fee; }
    },
    {
      id: 'tours',
      name: 'Farm tours and education',
      hint: 'Guided tours, school trips, workshops and classes.',
      enabled: false,
      costPercent: 25, // illustrative example
      fields: [
        { key: 'tours', label: 'Tours or classes per year', kind: 'count', value: 40 },               // illustrative example
        { key: 'guests', label: 'Guests per tour (average)', kind: 'count', value: 15 },              // illustrative example
        { key: 'price', label: 'Price per guest', kind: 'money', value: 20 }                          // illustrative example
      ],
      revenue: function (v) { return v.tours * v.guests * v.price; }
    },
    {
      id: 'retail',
      name: 'Farm stand or retail',
      hint: 'Produce, eggs, honey, baked goods, crafts and gifts.',
      enabled: true,
      costPercent: 55, // illustrative example
      fields: [
        { key: 'customers', label: 'Customers per day (average)', kind: 'count', value: 30 },         // illustrative example
        { key: 'sale', label: 'Average sale per customer', kind: 'money', value: 15 },                 // illustrative example
        { key: 'days', label: 'Days open per year', kind: 'days', value: 120 }                        // illustrative example
      ],
      revenue: function (v) { return v.customers * v.sale * v.days; }
    },
    {
      id: 'seasonal',
      name: 'Seasonal attractions',
      hint: 'Pumpkin patches, corn mazes, hayrides, holiday lights.',
      enabled: false,
      costPercent: 40, // illustrative example
      fields: [
        { key: 'visitors', label: 'Visitors per day (average)', kind: 'count', value: 150 },          // illustrative example
        { key: 'ticket', label: 'Admission price per visitor', kind: 'money', value: 12 },            // illustrative example
        { key: 'extra', label: 'Extra spend per visitor (food, extras)', kind: 'money', value: 8 },    // illustrative example
        { key: 'days', label: 'Days open per year', kind: 'days', value: 30 }                         // illustrative example
      ],
      revenue: function (v) { return v.visitors * (v.ticket + v.extra) * v.days; }
    },
    {
      id: 'custom',
      name: 'Your own idea',
      hint: 'Anything else: farm-to-table dinners, animal experiences, rentals.',
      enabled: false,
      custom: true, // the visitor can rename this stream
      costPercent: 30, // illustrative example
      fields: [
        { key: 'quantity', label: 'Sales per year (tickets, bookings or items)', kind: 'count', value: 100 }, // illustrative example
        { key: 'price', label: 'Average price per sale', kind: 'money', value: 25 }                    // illustrative example
      ],
      revenue: function (v) { return v.quantity * v.price; }
    }
  ];

  var LIMITS = {
    money: { min: 0, max: 10000000 },
    percent: { min: 0, max: 100 },
    count: { min: 0, max: 1000000 },
    days: { min: 0, max: 366 }
  };

  // Illustrative example: a 30% swing either side of the expected figure.
  // This is a simple "what if it goes worse / better" range, not a forecast.
  // The page reads its own values from config.js; these are fallbacks.
  var DEFAULT_SCENARIOS = { low: 0.7, high: 1.3 };

  /** Turn any input into a safe, non-negative number within the field's limits. */
  function clean(value, kind) {
    var n = typeof value === 'number' ? value : parseFloat(String(value == null ? '' : value).replace(/[, ]/g, ''));
    if (!isFinite(n) || n < 0) n = 0;
    var lim = LIMITS[kind] || LIMITS.count;
    if (n > lim.max) n = lim.max;
    return n;
  }

  function getStream(id) {
    for (var i = 0; i < STREAMS.length; i++) if (STREAMS[i].id === id) return STREAMS[i];
    return null;
  }

  /** Build a fresh copy of the starting state (all example values). */
  function defaultState() {
    var streams = {};
    STREAMS.forEach(function (s) {
      var values = {};
      s.fields.forEach(function (f) { values[f.key] = f.value; });
      streams[s.id] = { enabled: s.enabled, costPercent: s.costPercent, values: values, name: s.name };
    });
    return { streams: streams, fixedCosts: 0 };
  }

  /** Yearly gross revenue for one stream, given its raw input values. */
  function streamRevenue(id, values) {
    var s = getStream(id);
    if (!s) return 0;
    var v = {};
    s.fields.forEach(function (f) { v[f.key] = clean(values ? values[f.key] : 0, f.kind); });
    var r = s.revenue(v);
    return isFinite(r) && r > 0 ? r : 0;
  }

  /**
   * Run the whole calculation.
   * state: { streams: { id: { enabled, costPercent, values, name } }, fixedCosts }
   * scenarios: { low, high } multipliers applied to revenue.
   */
  function calculate(state, scenarios) {
    var sc = scenarios || DEFAULT_SCENARIOS;
    var low = clean(sc.low, 'count');
    var high = clean(sc.high, 'count');
    var breakdown = [];
    var gross = 0;
    var variableCosts = 0;

    STREAMS.forEach(function (s) {
      var st = state && state.streams ? state.streams[s.id] : null;
      if (!st || !st.enabled) return;
      var g = streamRevenue(s.id, st.values);
      var c = g * clean(st.costPercent, 'percent') / 100;
      gross += g;
      variableCosts += c;
      var label = s.custom && st.name && String(st.name).trim() ? String(st.name).trim() : s.name;
      breakdown.push({ id: s.id, name: label, gross: g, costs: c, net: g - c });
    });

    breakdown.forEach(function (b) { b.share = gross > 0 ? b.gross / gross : 0; });

    var fixedCosts = clean(state ? state.fixedCosts : 0, 'money');
    var margin = gross - variableCosts; // revenue left after per-stream costs

    function scenario(factor) {
      return { gross: gross * factor, net: margin * factor - fixedCosts };
    }

    return {
      gross: gross,
      variableCosts: variableCosts,
      fixedCosts: fixedCosts,
      net: margin - fixedCosts,
      breakdown: breakdown,
      scenarios: { low: scenario(low), expected: scenario(1), high: scenario(high) }
    };
  }

  return {
    STREAMS: STREAMS,
    LIMITS: LIMITS,
    DEFAULT_SCENARIOS: DEFAULT_SCENARIOS,
    clean: clean,
    defaultState: defaultState,
    streamRevenue: streamRevenue,
    calculate: calculate
  };
});
