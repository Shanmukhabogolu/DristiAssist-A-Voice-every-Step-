import { AlertPriorityEngine, getHazardPriority } from '../services/alertPriorityEngine';
import { ZonePrediction } from '../types';

function runTests() {
  console.log('--- RUNNING ALERT PRIORITY ENGINE TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
    }
  }

  const engine = new AlertPriorityEngine();

  // Test 1: Priority ranking
  assert(getHazardPriority('pothole') === 3, 'Pothole is danger priority 3');
  assert(getHazardPriority('open_drain') === 3, 'Open drain is danger priority 3');
  assert(getHazardPriority('animal') === 2, 'Animal is caution priority 2');
  assert(getHazardPriority('person') === 1, 'Person is info priority 1');
  assert(getHazardPriority('clear_path') === 0, 'Clear path is safe priority 0');

  // Test 2: Danger classes outrank animal and person
  const preds1: ZonePrediction[] = [
    { zone: 'left', hazard: 'person', confidence: 0.95 },
    { zone: 'center', hazard: 'animal', confidence: 0.90 },
    { zone: 'right', hazard: 'pothole', confidence: 0.85 },
  ];
  const result1 = engine.evaluatePredictions(preds1, {
    confidenceThreshold: 0.6,
    cooldownSeconds: 4,
    language: 'en',
    now: 1000,
  });

  assert(result1.alertsToSpeak.length > 0, 'Generates alerts');
  assert(result1.alertsToSpeak[0].hazard === 'pothole', 'Pothole (danger) outranks animal and person');
  assert(result1.interruptCurrentSpeech === true, 'Pothole triggers interruptCurrentSpeech');

  // Test 3: At most 2 alerts spoken per cycle
  const preds2: ZonePrediction[] = [
    { zone: 'left', hazard: 'open_drain', confidence: 0.90 },
    { zone: 'center', hazard: 'stairs', confidence: 0.92 },
    { zone: 'right', hazard: 'vehicle', confidence: 0.88 },
  ];
  const result2 = engine.evaluatePredictions(preds2, {
    confidenceThreshold: 0.6,
    cooldownSeconds: 4,
    language: 'en',
    now: 1000,
  });
  assert(result2.alertsToSpeak.length <= 2, 'At most 2 alerts spoken per cycle');

  // Test 4: Cooldown prevents repetition of exact same alert within 4 seconds
  const result3SameTime = engine.evaluatePredictions(preds1, {
    confidenceThreshold: 0.6,
    cooldownSeconds: 4,
    language: 'en',
    now: 2000, // only 1s later
  });
  const hasRepeatedPothole = result3SameTime.alertsToSpeak.some(
    (a) => a.hazard === 'pothole' && a.zone === 'right'
  );
  assert(!hasRepeatedPothole, 'Cooldown blocks repeating same pothole within 4 seconds');

  // Test 5: Cooldown expires after 4 seconds
  const result4AfterCooldown = engine.evaluatePredictions(preds1, {
    confidenceThreshold: 0.6,
    cooldownSeconds: 4,
    language: 'en',
    now: 6000, // 5s later
  });
  const hasPotholeAfterCooldown = result4AfterCooldown.alertsToSpeak.some(
    (a) => a.hazard === 'pothole' && a.zone === 'right'
  );
  assert(hasPotholeAfterCooldown, 'Alert repeats after cooldown duration expires');

  // Test 6: Below confidence threshold (e.g. 50% < 60%) triggers cautious alert
  engine.resetCooldowns();
  const lowConfPreds: ZonePrediction[] = [
    { zone: 'center', hazard: 'stairs', confidence: 0.45 },
  ];
  const lowConfResult = engine.evaluatePredictions(lowConfPreds, {
    confidenceThreshold: 0.6,
    cooldownSeconds: 4,
    language: 'en',
    now: 10000,
  });
  assert(
    lowConfResult.alertsToSpeak.length === 1 &&
      lowConfResult.alertsToSpeak[0].messageEn.includes('Not sure, use your cane carefully'),
    'Below confidence threshold produces cane caution alert instead of guessing'
  );

  console.log(`--- TEST RESULTS: ${passed}/${total} PASSED ---`);
  if (passed !== total) {
    throw new Error('Some unit tests failed.');
  }
}

runTests();
