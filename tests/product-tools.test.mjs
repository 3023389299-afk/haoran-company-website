import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inquiryHref,
  matchesProduct,
  matchingModel,
  normalizeProductText,
} from '../src/scripts/product-tools.js';

test('normalizes catalog model punctuation consistently', () => {
  assert.equal(normalizeProductText('CDRH-1207 (R)'), 'CDRH1207R');
});

test('does not confuse shielded and unshielded searches', () => {
  assert.equal(matchesProduct('CD SERIES UNSHIELDED', 'shielded'), false);
  assert.equal(matchesProduct('NR SERIES SHIELDED', 'shielded'), true);
  assert.equal(matchesProduct('CD 系列 非屏蔽电感', '屏蔽电感'), false);
});

test('matches exact models and aliases', () => {
  assert.equal(matchingModel(['CDBE5502 / CDBE5022'], 'CDBE5022'), 'CDBE5502 / CDBE5022');
  assert.equal(matchingModel(['HR0630'], 'HR06'), '');
});

test('builds localized inquiry links without changing the form route', () => {
  assert.equal(
    inquiryHref({ lang: 'en', family: 'hr-integrated', model: 'HR0630', request: 'specification' }),
    '/en/contact?family=hr-integrated&model=HR0630&request=specification#inquiry',
  );
});
