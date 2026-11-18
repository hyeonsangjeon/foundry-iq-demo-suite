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
