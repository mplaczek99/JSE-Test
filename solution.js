#!/usr/bin/env node

const fs = require("fs");

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

// --- Main ---
try {
  const events = JSON.parse(fs.readFileSync("./event_details.json", "utf8"));

  const result = {
    task1: {
      color_freq_2024_06: countForMonth(events, 2024, 6),
      color_freq_2025_03: countForMonth(events, 2025, 3),
    },
  };

  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error reading event_details.json:", err.message);
  process.exit(1);
}

