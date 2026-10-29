import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEligibility, evaluateAllSchemes, EDUCATION_RANK } from '../src/utils/eligibilityEngine.js';
import { SCHEMES_DATA } from '../src/data/schemes.js';

test('Eligibility Engine - Farmer with land should be Eligible or Potentially Eligible for PM-KISAN', () => {
  const profile = {
    name: 'Ramesh',
    age: 32,
    gender: 'Male',
    state: 'Tamil Nadu',
    district: 'Chennai',
    occupation: 'Farmer',
    category: 'OBC',
    education: 'Class 10th Passed',
    income: 180000,
    ownsLand: true,
    isDisabled: false,
    maritalStatus: 'Married'
  };

  const pmKisan = SCHEMES_DATA.find(s => s.id === 'pm-kisan');
  assert.ok(pmKisan, 'PM-KISAN scheme should exist');

  const result = evaluateEligibility(profile, pmKisan);
  assert.ok(['Eligible', 'Potentially Eligible'].includes(result.status), `Status should be Eligible or Potentially Eligible, got: ${result.status}`);
  assert.equal(result.unmetCriteria.length, 0, 'Should have 0 unmet criteria');
  assert.ok(result.matchPercentage >= 70, `Match percentage should be >= 70, got: ${result.matchPercentage}`);
});

test('Eligibility Engine - Age over limit should be Not Eligible', () => {
  const profile = {
    name: 'Elderly Citizen',
    age: 82, // Exceeds PM-KISAN maxAge (75)
    gender: 'Male',
    state: 'Tamil Nadu',
    district: 'Chennai',
    occupation: 'Farmer',
    category: 'OBC',
    education: 'None',
    income: 100000,
    ownsLand: true,
    isDisabled: false,
    maritalStatus: 'Married'
  };

  const pmKisan = SCHEMES_DATA.find(s => s.id === 'pm-kisan');
  const result = evaluateEligibility(profile, pmKisan);
  assert.equal(result.status, 'Not Eligible');
  assert.ok(result.unmetCriteria.some(u => u.field === 'age'));
  assert.equal(result.isEligible, false);
});

test('Eligibility Engine - High income should be Not Eligible for income-capped scheme', () => {
  const profile = {
    name: 'Wealthy Citizen',
    age: 30,
    gender: 'Male',
    state: 'Tamil Nadu',
    occupation: 'Farmer',
    category: 'General',
    education: 'Postgraduate Passed',
    income: 1500000, // 15 Lakhs > PM-KISAN cap of 2.5L
    ownsLand: true,
    isDisabled: false
  };

  const pmKisan = SCHEMES_DATA.find(s => s.id === 'pm-kisan');
  const result = evaluateEligibility(profile, pmKisan);
  assert.equal(result.status, 'Not Eligible');
  assert.ok(result.unmetCriteria.some(u => u.field === 'income'));
});

test('Eligibility Engine - State specific scheme rejects outside state', () => {
  const profile = {
    name: 'Delhi Resident',
    age: 22,
    gender: 'Female',
    state: 'Delhi', // Not MP
    occupation: 'Housewife',
    category: 'OBC',
    education: 'Class 10th Passed',
    income: 120000,
    maritalStatus: 'Married'
  };

  const ladli = SCHEMES_DATA.find(s => s.id === 'ladli-behna-yojana');
  assert.ok(ladli, 'Ladli Behna scheme should exist');
  const result = evaluateEligibility(profile, ladli);
  assert.equal(result.status, 'Not Eligible');
  assert.ok(result.unmetCriteria.some(u => u.field === 'state'));
});

test('Eligibility Engine - Stand Up India special rule (Woman OR SC/ST)', () => {
  const standUpScheme = SCHEMES_DATA.find(s => s.id === 'stand-up-india');
  assert.ok(standUpScheme, 'Stand Up India scheme should exist');

  // Woman General should qualify
  const womanGeneral = {
    name: 'Priya',
    age: 29,
    gender: 'Female',
    state: 'Tamil Nadu',
    occupation: 'Entrepreneur',
    category: 'General',
    education: 'Class 12th Passed',
    income: 800000
  };
  const res1 = evaluateEligibility(womanGeneral, standUpScheme);
  assert.ok(['Eligible', 'Potentially Eligible'].includes(res1.status));

  // Man General should not qualify
  const manGeneral = {
    name: 'Karthik',
    age: 29,
    gender: 'Male',
    state: 'Tamil Nadu',
    occupation: 'Entrepreneur',
    category: 'General',
    education: 'Class 12th Passed',
    income: 800000
  };
  const res2 = evaluateEligibility(manGeneral, standUpScheme);
  assert.equal(res2.status, 'Not Eligible');
  assert.ok(res2.unmetCriteria.some(u => u.field === 'category'));
});

test('Eligibility Engine - Missing information results in Potentially Eligible with pendingCriteria', () => {
  const pmKisan = SCHEMES_DATA.find(s => s.id === 'pm-kisan');
  // Profile without land specified
  const profileMissingLand = {
    name: 'Farmer Unknown Land',
    age: 35,
    gender: 'Male',
    state: 'Tamil Nadu',
    occupation: 'Farmer',
    category: 'OBC',
    education: 'Class 10th Passed',
    income: 150000,
    ownsLand: undefined // Unspecified
  };

  const result = evaluateEligibility(profileMissingLand, pmKisan);
  assert.equal(result.status, 'Potentially Eligible');
  assert.ok(result.pendingCriteria.length > 0);
  assert.ok(result.pendingCriteria.some(p => p.field === 'land'));
});

test('Eligibility Engine - Evaluates all schemes and sorts accurately', () => {
  const profile = {
    name: 'Student SC',
    age: 20,
    gender: 'Female',
    state: 'Tamil Nadu',
    occupation: 'Student',
    category: 'SC',
    education: 'Class 12th Passed',
    income: 120000,
    isDisabled: false,
    maritalStatus: 'Single'
  };

  const results = evaluateAllSchemes(profile, SCHEMES_DATA);
  assert.ok(results.length > 5);
  // Post-matric scholarship or Pudhumai Penn should be top ranked
  assert.ok(['Eligible', 'Potentially Eligible'].includes(results[0].status));
});

import { buildSystemPrompt, DEFAULT_NVIDIA_MODEL, sendNvidiaChatMessage } from '../src/utils/nvidiaChatService.js';

test('NVIDIA Chat Service - Prompt builds with schemes and profile context', () => {
  const profile = { name: 'Murugan', age: 30, state: 'Tamil Nadu', occupation: 'Farmer' };
  const prompt = buildSystemPrompt(profile, 'ta');
  assert.ok(prompt.includes('Scheme Finder AI'));
  assert.ok(prompt.includes('Murugan'));
  assert.ok(prompt.includes('Tamil'));
  assert.ok(prompt.includes('PM-KISAN'));
  assert.ok(prompt.includes('general-purpose AI assistant'));
  assert.ok(prompt.includes('Do not force every conversation into scheme eligibility'));
  assert.equal(DEFAULT_NVIDIA_MODEL, 'meta/llama-3.2-11b-vision-instruct');
});

test('NVIDIA Chat Service - Sends chat through the proxy and returns the model reply', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/nvidia/chat/completions');
    assert.equal(options.headers.Authorization, undefined);
    assert.ok(JSON.parse(options.body).messages[0].content.includes('general-purpose AI assistant'));
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'Here is a general answer.' } }]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    const result = await sendNvidiaChatMessage([
      { sender: 'user', text: 'Explain photosynthesis.' }
    ], {}, 'test-key');
    assert.equal(result.reply, 'Here is a general answer.');
    assert.deepEqual(result.extractedProfile, {});
  } finally {
    globalThis.fetch = originalFetch;
  }
});
