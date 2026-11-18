'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../lib/webIqAutoTimeZone.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const api = {};
vm.runInNewContext(compiled, { exports: api }, { filename });

const seoul = { location: 'Seoul, South Korea', localTime: 'Monday, 2026-11-16T14:00:00+09:00', utcOffset: 9 };
const seattle = { location: 'Seattle, Washington', localTime: 'Sunday, 2026-11-15T21:00:00-08:00', utcOffset: -8 };
const tokyo = { location: '도쿄, 일본', localTime: '2026-11-16T14:00:00+09:00', utcOffset: 9 };
const london = { location: 'London, United Kingdom', localTime: '2026-11-16T05:00:00Z', utcOffset: 0 };
const result = content => ({ evidence: { type: 'structured/timeZone', content } });
const parse = (contents, city = 'seattle') => api.parseWebIqTimeZonePayload({ results: contents.map(result) }, city);
const response = (parsed, cityId = 'seattle') => ({ schemaVersion: 'webiq.auto.timezone.response.v1',
  cityId, mode: 'lite', requestCount: 1, estimatedMicroUsd: 8_000, retrievedAt: '2026-11-16T05:00:00Z', ...parsed });

test('weekday-prefixed local date, midnight crossing, and reversed provider entry order', () => {
  const parsed = parse([{ startTimeZone: seattle, endTimeZone: seoul }]);
  assert.equal(parsed.status, 'usable');
  assert.equal(parsed.seoul.localTime, seoul.localTime);
  assert.equal(parsed.destination.localTime, seattle.localTime);
  assert.equal(parsed.destination.utcOffset, '-8');
  assert.equal(parsed.differenceMinutes, 17 * 60);
  assert.equal(api.isAutoTimeZoneResponse(response(parsed), 'seattle'), true);
});

test('array shape, multi-result lookups and equal offsets preserve a real zero', () => {
  for (const contents of [[{ timeZones: [tokyo, seoul] }], [{ timeZones: [tokyo] }, { timeZones: [seoul] }]]) {
    const parsed = parse(contents, 'tokyo');
    assert.equal(parsed.destination.location, tokyo.location);
    assert.equal(parsed.differenceMinutes, 0);
    assert.equal(api.isAutoTimeZoneResponse(response(parsed, 'tokyo'), 'tokyo'), true);
  }
});

test('summer offsets and local weekday prefixes are taken from the response', () => {
  const summerLondon = { location: 'London, England, UK', localTime: 'Monday, 2026-06-01T06:00:00+01:00' };
  const from = { ...seoul, localTime: 'Monday, 2026-06-01T14:00:00+09:00' };
  const parsed = parse([{ timeZones: [from, summerLondon] }], 'london');
  assert.equal(parsed.differenceMinutes, 8 * 60);
  assert.equal(parsed.destination.utcOffset, null);
  assert.equal(api.isAutoTimeZoneResponse(response(parsed, 'london'), 'london'), true);
});

test('a single confirmed city or a missing offset never creates a time difference', () => {
  const partial = parse([{ endTimeZone: seoul, timeDifference: '17 hours' }]);
  assert.equal(partial.status, 'not_verified');
  assert.equal(partial.differenceMinutes, null);
  assert.equal(partial.destination, null);
  assert.equal(api.isAutoTimeZoneResponse(response(partial), 'seattle'), true);
  const noOffset = parse([{ timeZones: [seoul, { location: 'Seattle', localTime: '2026-11-15T21:00:00' }] }]);
  assert.equal(noOffset.differenceMinutes, null);
  assert.equal(noOffset.destination.localTime, '2026-11-15T21:00:00');
  assert.equal(api.isAutoTimeZoneResponse(response(noOffset), 'seattle'), true);
});

test('missing time, foreign city, similarly named city, malformed date and conflicting offset stay partial', () => {
  for (const bad of [{ ...london, location: 'New London, Connecticut' }, { ...london, location: 'London, Ontario, Canada' },
    { ...london, localTime: '2026-02-30T05:00:00Z' }, { ...london, utcOffset: 2 },
    { ...london, localTime: '05:00' }, { ...london, localTime: '2026-11-18T25:14:03' },
    { ...london, localTime: '2026-11-18T09:14:03+14:05' },
    { ...london, utcOffset: 22 }, { ...london, location: 'Seattle' }]) {
    const parsed = parse([{ timeZones: [seoul, bad] }], 'london');
    assert.equal(parsed.status, 'not_verified');
    assert.equal(parsed.destination, null);
  }
  const ambiguous = parse([{ timeZones: [{ ...seoul, location: 'Seoul and Seattle' }] }]);
  assert.equal(ambiguous.seoul, null);
  assert.equal(ambiguous.destination, null);
});

test('no time-zone evidence, invalid response envelopes and a mismatched visible city', () => {
  assert.equal(parse([]).status, 'empty');
  assert.equal(api.parseWebIqTimeZonePayload({ results: [{ evidence: { type: 'text', content: 'UTC+9' } }] }, 'london').status, 'empty');
  assert.equal(api.parseWebIqTimeZonePayload({ errorCode: 'failure', results: [] }, 'tokyo'), null);
  const valid = response(parse([{ timeZones: [seoul, seattle] }]));
  assert.equal(api.isAutoTimeZoneResponse(valid, 'london'), false);
  assert.equal(api.isAutoTimeZoneResponse({ ...valid, differenceMinutes: 0 }, 'seattle'), false);
});

test('a fixed English comparison query is independent of the Korean display question', () => {
  assert.equal(api.getTimeZoneServiceQuestion('london'), 'time difference between Seoul and London');
  assert.match(api.getTimeZoneQuestion('london', 'ko'), /서울과 런던/);
  assert.equal(api.WEB_IQ_AUTO_SEOUL_LOCATION, 'lat:37.5665;long:126.9780');
});

test('use the UTC instant and offset returned for each city if localTime has no date', () => {
  const utcTime = 'Wednesday, 2026-11-18T22:06:01.4567890Z';
  const parsed = parse([{ startTimeZone: { location: 'Seoul', utcTime, utcOffset: 9 },
    endTimeZone: { location: 'London, England', utcTime, utcOffset: 0, localTime: '22:06' } }], 'london');
  assert.equal(parsed.seoul.localTime, '2026-11-19T07:06:01');
  assert.equal(parsed.destination.localTime, '2026-11-18T22:06:01');
  assert.equal(parsed.seoul.derivedFromUtc.utcTime, utcTime);
  assert.equal(parsed.seoul.derivedFromUtc.localTime, null);
  assert.equal(parsed.destination.derivedFromUtc.localTime, '22:06');
  assert.equal(parsed.differenceMinutes, 540);
  const body = response(parsed, 'london');
  assert.equal(api.isAutoTimeZoneResponse(body, 'london'), true);
  assert.equal(api.isAutoTimeZoneResponse({ ...body, seoul: { ...body.seoul, localTime: '2026-11-18T07:06:01' } }, 'london'), false);
});

test('calculations require a complete UTC timestamp, city and offset from the same entry', () => {
  const utc = 'Wednesday, 2026-11-18T22:06:01Z';
  for (const bad of [{ utcTime: '2026-02-30T22:06:01Z', utcOffset: 0 }, { utcTime: '22:06:01', utcOffset: 0 },
    { utcTime: '2026-11-18T22:06:01+03:00', utcOffset: 0 }, { utcTime: utc, utcOffset: null },
    { utcTime: utc, utcOffset: 0, localTime: '23:06' }, { utcTime: utc, utcOffset: 0, location: 'London, Ontario' }]) {
    const parsed = parse([{ startTimeZone: seoul, endTimeZone: { location: 'London', ...bad } }], 'london');
    assert.equal(parsed.destination, null);
    assert.equal(parsed.differenceMinutes, null);
  }
});

// Public Web IQ field values captured from the single Nov 18 preview comparison.
const liveComparison = {
  startTimeZone: { timeZoneName: 'Korean Standard Time', timeZoneAbbreviation: 'KST', utcOffset: 9,
    utcTime: 'Wednesday, 2026-11-18T05:43:01Z', localTime: 'Wednesday, 2026-11-18T14:43:01+09:00' },
  endTimeZone: { timeZoneName: 'Greenwich Mean Time', timeZoneAbbreviation: 'GMT', utcOffset: 0,
    utcTime: 'Wednesday, 2026-11-18T05:43:01Z', localTime: 'Wednesday, 2026-11-18T05:43:01Z' },
  timeDifference: 'Korean Standard Time is ahead of Greenwich Mean Time by 9 hours. ',
};

test('live Seoul–London comparison: explicit sides and independently verified zones work without location fields', () => {
  const parsed = parse([liveComparison], 'london');
  assert.equal(parsed.status, 'usable');
  assert.equal(parsed.differenceMinutes, 540);
  assert.equal(parsed.seoul.localTime, liveComparison.startTimeZone.localTime);
  assert.equal(parsed.destination.localTime, liveComparison.endTimeZone.localTime);
  assert.equal(parsed.destination.location, null);
  assert.equal(parsed.destination.comparisonZone.timeZoneName, 'Greenwich Mean Time');
  assert.equal(parsed.destination.comparisonZone.role, 'endTimeZone');
  assert.equal(api.isAutoTimeZoneResponse(response(parsed, 'london'), 'london'), true);
  assert.equal(api.isAutoTimeZoneResponse({ ...response(parsed, 'london'), destination: {
    ...parsed.destination, comparisonZone: { ...parsed.destination.comparisonZone, role: 'startTimeZone' } } }, 'london'), false);
});

test('unlabelled comparisons must match their ordered city, UTC instant, offset and zone name', () => {
  const { startTimeZone, endTimeZone } = liveComparison;
  for (const contents of [
    { startTimeZone: endTimeZone, endTimeZone: startTimeZone },
    { timeZones: [startTimeZone, endTimeZone] },
    { startTimeZone, endTimeZone: { ...endTimeZone, location: 'London, Ontario' } },
    { startTimeZone, endTimeZone: { ...endTimeZone, timeZoneName: 'Iceland Time' } },
    { startTimeZone, endTimeZone: { ...endTimeZone, timeZoneAbbreviation: 'BST' } },
    { startTimeZone, endTimeZone: { ...endTimeZone, localTime: 'Wednesday, 2026-11-18T07:43:01Z' } },
    { startTimeZone, endTimeZone: { ...endTimeZone, localTime: '2026-11-19T05:43:01Z', utcTime: '2026-11-19T05:43:01Z' } },
    { startTimeZone, endTimeZone: { ...endTimeZone, localTime: '2026-07-18T05:43:01Z', utcTime: '2026-07-18T05:43:01Z' } },
  ]) {
    const partial = parse([contents], 'london');
    assert.equal(partial.differenceMinutes, null);
    assert.equal(partial.status, 'not_verified');
    assert.equal(api.isAutoTimeZoneResponse(response(partial, 'london'), 'london'), true);
  }
});

test('summer comparison verifies the London daylight offset at the returned instant', () => {
  const utcTime = '2026-07-18T05:43:01Z';
  const parsed = parse([{ startTimeZone: { ...liveComparison.startTimeZone, utcTime, localTime: '2026-07-18T14:43:01+09:00' },
    endTimeZone: { timeZoneName: 'British Summer Time', timeZoneAbbreviation: 'BST',
      utcTime, localTime: '2026-07-18T06:43:01+01:00', utcOffset: 1 } }], 'london');
  assert.equal(parsed.differenceMinutes, 480);
  assert.equal(api.isAutoTimeZoneResponse(response(parsed, 'london'), 'london'), true);
});
