import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchesDirectoryOpen, matchesDirectoryServices, quebecSearchTime,
} from "../directory-result-filters.mjs";

const at = timestamp => quebecSearchTime(new Date(timestamp));
const day = (open, close) => ({ blocks: [{ open, close }] });
const openAt = (row, time) => matchesDirectoryOpen({ status: "open", ...row }, at(time));

test("uses Québec calendar time, including daylight-saving transitions", () => {
  assert.deepEqual(at("2026-03-08T05:30:00Z"), {
    today: "2026-03-08", weekday: "sunday", yesterday: "2026-03-07",
    previousWeekday: "saturday", minuteOfDay: 30,
  });
  assert.equal(at("2026-03-08T07:30:00Z").minuteOfDay, 210);
  assert.equal(at("2026-11-01T05:30:00Z").minuteOfDay, 90);
  assert.equal(at("2026-11-01T06:30:00Z").minuteOfDay, 90);
});

test("tests both sides of midnight and closes exactly at the end", () => {
  const row = { hours_json: { friday: day("21:00", "02:00") } };
  assert.equal(openAt(row, "2026-11-28T02:00:00Z"), true);
  assert.equal(openAt(row, "2026-11-28T06:59:00Z"), true);
  assert.equal(openAt(row, "2026-11-28T07:00:00Z"), false);
  assert.equal(openAt(row, "2026-11-28T10:00:00Z"), false);
  assert.equal(openAt({ ...row, status: "seasonal", is_open: true }, "2026-11-28T06:00:00Z"), false);
});

test("dated overrides replace the whole day and the prior date can carry over", () => {
  const row = { hours_json: { friday: day("21:00", "02:00") },
    special_hours: { "2026-11-28": { closed: true } } };
  assert.equal(openAt(row, "2026-11-28T06:00:00Z"), false);
  assert.equal(openAt({ special_hours: { "2026-11-27": day("21:00", "02:00") } },
    "2026-11-28T06:00:00Z"), true);
  assert.equal(openAt({ special_hours: { "2026-11-28": day("01:00", "01:00") }, is_open: true },
    "2026-11-28T06:00:00Z"), false);
  assert.equal(openAt({ special_hours: { "2026-08-31": day("09:00", "10:00") }, is_open: true },
    "2026-11-28T06:00:00Z"), false);
});

test("legacy open fallback only applies to businesses without a recognizable schedule", () => {
  const time = "2026-11-28T06:00:00Z";
  assert.equal(openAt({ hours_json: { unknown: true }, is_open: true }, time), true);
  assert.equal(openAt({ hours_json: { saturday: { blocks: [] } }, is_open: true }, time), false);
  assert.equal(openAt({ hours: "Fermé pour rénovation", is_open: true }, time), false);
  assert.equal(openAt({ hours: "CLOSED", is_open: true }, time), false);
});

test("services use only true structured booleans or the legacy fallback", () => {
  const wanted = ["Offers Takeout", "Wheelchair Accessible"];
  const amenities = [" offers tákeout ", "Wheelchair Accessible", "wifi::Free"];
  assert.equal(matchesDirectoryServices({ amenities }, wanted), true);
  assert.equal(matchesDirectoryServices({ amenities, attributes: { source: "test" } }, wanted), true);
  assert.equal(matchesDirectoryServices({ amenities, attributes: { boolean: { unrelated: false } } }, wanted), false);
  assert.equal(matchesDirectoryServices({ amenities, attributes: { single: { wifi: "Free" } } }, wanted), false);
  assert.equal(matchesDirectoryServices({ amenities, attributes: { multi: { other: [""] } } }, wanted), false);
  assert.equal(matchesDirectoryServices({ amenities, attributes: { multi: { other: [null] } } }, wanted), true);
  assert.equal(matchesDirectoryServices({ attributes: { boolean: {
    "OFFERS TAKEOUT": true, "Whéelchair Accessible": true,
  } } }, wanted), true);
});
