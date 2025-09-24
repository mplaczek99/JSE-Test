#!/usr/bin/env node

const fs = require("fs");

// Task 1 Helpers
// Strictly parse YYYY-MM-DD
function parseDateStrict(yyyy_mm_dd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyy_mm_dd || "");
  if (!m) return null;
  const [_, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  if (
    dt.getFullYear() !== Number(y) ||
    dt.getMonth() + 1 !== Number(mo) ||
    dt.getDate() !== Number(d)
  ) return null;
  return dt;
}

function isInYearMonth(dateStr, year, month) {
  const dt = parseDateStrict(dateStr);
  return dt && dt.getFullYear() === year && dt.getMonth() + 1 === month;
}

// Fixed colors required by the schema
const FIXED_COLORS = ["RED", "BLUE", "GREEN"];
function emptyColorFreq() {
  return { RED: 0, BLUE: 0, GREEN: 0 };
}

// Count appearances for one month
function countForMonth(events, year, month) {
  const freq = emptyColorFreq();
  for (const ev of events) {
    if (!ev || typeof ev.date !== "string" || typeof ev.color !== "string") continue;
    if (isInYearMonth(ev.date, year, month)) {
      if (ev.color in freq) {
        freq[ev.color] += 1;
      }
    }
  }
  return freq;
}

// Task 2 Helpers
// Build fast lookups per the constraint “at most one event per id_a and per id_b”
function indexEvents(events) {
  const byA = new Map();
  const byB = new Map();
  for (const ev of events) {
    if (ev?.id_a !== undefined && ev.id_a !== null && !byA.has(ev.id_a)) byA.set(ev.id_a, ev);
    if (ev?.id_b !== undefined && ev.id_b !== null && !byB.has(ev.id_b)) byB.set(ev.id_b, ev);
  }
  const keyOf = (ev) => `${String(ev.id_a ?? "")}|${String(ev.id_b ?? "")}`;
  return { byA, byB, keyOf };
}

// From references, gather unique referenced events and map event->sorted names
function collectReferenced(idx, references) {
  const { byA, byB, keyOf } = idx;
  const eventByKey = new Map();
  const namesByKey = new Map();

  for (const ref of references) {
    if (!ref) continue;
    let ev = null;
    if ("id_a" in ref && ref.id_a != null) ev = byA.get(ref.id_a) ?? null;
    else if ("id_b" in ref && ref.id_b != null) ev = byB.get(ref.id_b) ?? null;

    if (ev) {
      const k = keyOf(ev);
      eventByKey.set(k, ev);
      if (!namesByKey.has(k)) namesByKey.set(k, new Set());
      if (typeof ref.name === "string") namesByKey.get(k).add(ref.name);
    }
  }

  // Freeze names as sorted arrays for deterministic tie-breaks
  const sortedNamesByKey = new Map();
  for (const [k, set] of namesByKey.entries()) {
    sortedNamesByKey.set(k, Array.from(set).sort((a, b) => a.localeCompare(b)));
  }

  return { uniqueEvents: Array.from(eventByKey.values()), namesByKey: sortedNamesByKey };
}

function canonicalNameFor(ev, namesByKey) {
  const k = `${String(ev.id_a ?? "")}|${String(ev.id_b ?? "")}`;
  const names = namesByKey.get(k) ?? [];
  return names.length ? names[0] : "";
}

// --- Main ---
try {
  const events = JSON.parse(fs.readFileSync("./event_details.json", "utf8"));
  const refs   = JSON.parse(fs.readFileSync("./references.json", "utf8"));

  // Task 1
  const task1 = {
    // Dates are in numbers...
    color_freq_2024_06: countForMonth(events, 2024, 6),
    color_freq_2025_03: countForMonth(events, 2025, 3),
  };

  // Task 2
  const idx = indexEvents(events);
  const { uniqueEvents, namesByKey } = collectReferenced(idx, refs);

  // 1a. Sum of value
  const sum_value = uniqueEvents.reduce((acc, ev) => acc + (Number(ev.value) || 0), 0);

  // 1b. Earliest date -> name (tie by alphabetical name)
  let earliest_date_name = "";
  const withDates = uniqueEvents
    .map(ev => ({ ev, dt: parseDateStrict(ev.date), name: canonicalNameFor(ev, namesByKey) }))
    .filter(x => x.dt);

  if (withDates.length) {
    withDates.sort((a, b) => {
      const t = a.dt.getTime() - b.dt.getTime();
      return t !== 0 ? t : a.name.localeCompare(b.name);
    });
    earliest_date_name = withDates[0].name || "";
  }

  // 1b. Minimum value -> name (tie by alphabetical name)
  let min_value_name = "";
  if (uniqueEvents.length) {
    const enriched = uniqueEvents.map(ev => ({ name: canonicalNameFor(ev, namesByKey), val: Number(ev.value) || 0 }));
    const minVal = Math.min(...enriched.map(x => x.val));
    const candidates = enriched.filter(x => x.val === minVal).sort((a, b) => a.name.localeCompare(b.name));
    min_value_name = candidates[0]?.name ?? "";
  }

  // 1c. High value threshold filter (value > 25) -> names (one per event), sorted alphabetically
  const high_value_names = uniqueEvents
    .filter(ev => Number(ev.value) > 25)
    .map(ev => canonicalNameFor(ev, namesByKey))
    .filter(n => n.length > 0)
    .sort((a, b) => a.localeCompare(b));

  const output = {
    task1,
    task2: {
      sum_value,
      earliest_date_name,
      min_value_name,
      high_value_names
    }
  };

  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error(err?.message || String(err));
  process.exit(1);
}
