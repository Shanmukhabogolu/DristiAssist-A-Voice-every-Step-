/**
 * Unit & Benchmark Tests for Walk Assistant v2 Detector, NMS, and Coordinate Un-padding
 */

import { visionDetector } from '../services/visionDetector';
import { diagnostics } from '../services/diagnostics';
import { BoundingBox } from '../services/pathSafetyEngine';

function runV2Tests() {
  console.log('\n=============================================');
  console.log('--- RUNNING WALK ASSISTANT v2 DETECTOR TESTS ---');
  console.log('=============================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    }
  }

  // 1. IoU Calculation Test
  {
    const boxA: BoundingBox = { class: 'wall', confidence: 0.9, xmin: 0.2, ymin: 0.2, xmax: 0.6, ymax: 0.6 };
    const boxB: BoundingBox = { class: 'wall', confidence: 0.8, xmin: 0.2, ymin: 0.2, xmax: 0.6, ymax: 0.6 };
    const iouIdentical = visionDetector.calculateIoU(boxA, boxB);
    assert(Math.abs(iouIdentical - 1.0) < 0.001, 'IoU Test 1: Identical boxes produce IoU = 1.0');

    const boxC: BoundingBox = { class: 'wall', confidence: 0.7, xmin: 0.7, ymin: 0.7, xmax: 0.9, ymax: 0.9 };
    const iouDisjoint = visionDetector.calculateIoU(boxA, boxC);
    assert(iouDisjoint === 0, 'IoU Test 2: Disjoint boxes produce IoU = 0.0');

    const boxD: BoundingBox = { class: 'wall', confidence: 0.85, xmin: 0.4, ymin: 0.2, xmax: 0.8, ymax: 0.6 };
    const iouPartial = visionDetector.calculateIoU(boxA, boxD);
    assert(iouPartial > 0.3 && iouPartial < 0.4, `IoU Test 3: Partial overlapping boxes calculate correct IoU (${iouPartial.toFixed(3)})`);
  }

  // 2. Non-Maximum Suppression (NMS) Test
  {
    const duplicateBoxes: BoundingBox[] = [
      { class: 'stairs', confidence: 0.95, xmin: 0.25, ymin: 0.45, xmax: 0.75, ymax: 0.88 },
      { class: 'stairs', confidence: 0.82, xmin: 0.26, ymin: 0.46, xmax: 0.74, ymax: 0.87 }, // Overlapping (IoU ~0.9)
      { class: 'pole', confidence: 0.88, xmin: 0.05, ymin: 0.30, xmax: 0.15, ymax: 0.80 },   // Non-overlapping
    ];

    const kept = visionDetector.applyNMS(duplicateBoxes, 0.45);
    assert(kept.length === 2, 'NMS Test 1: Suppresses duplicate overlapping box with lower confidence', `Kept ${kept.length} boxes`);
    assert(kept[0].class === 'stairs' && kept[0].confidence === 0.95, 'NMS Test 2: Retains highest confidence box');
    assert(kept[1].class === 'pole', 'NMS Test 3: Preserves independent non-overlapping box');
  }

  // 3. Diagnostics Error Boundary Test
  {
    const state = { restarted: false, fallbackTriggered: false };

    diagnostics.resetRestarts();
    diagnostics.handlePipelineError(
      new Error('Simulated GPU memory disconnect'),
      () => { state.restarted = true; },
      () => { state.fallbackTriggered = true; }
    );

    assert(state.restarted, 'Error Boundary Test 1: Successfully initiates pipeline self-healing restart on 1st fault');
    assert(!state.fallbackTriggered, 'Error Boundary Test 2: Does not abort on transient single error');

    // Trigger max restarts (3)
    diagnostics.handlePipelineError(new Error('Fault 2'), () => {}, () => {});
    diagnostics.handlePipelineError(new Error('Fault 3'), () => {}, () => {});
    diagnostics.handlePipelineError(new Error('Fault 4'), () => {}, () => { state.fallbackTriggered = true; });

    assert(state.fallbackTriggered, 'Error Boundary Test 3: Escalates to safe spoken fallback after max retries exceeded');
    diagnostics.resetRestarts();
  }

  // 4. Benchmark Telemetry on 10 Fixed Walking Test Scenarios
  {
    const scenarios = [
      'wall', 'door', 'stairs', 'pole', 'pothole', 'vehicle', 'person', 'barrier', 'clear_path', 'unknown'
    ];
    let totalMs = 0;

    for (const sc of scenarios) {
      const t0 = performance.now();
      const res = visionDetector.analyzeFrame(
        null as any,
        sc === 'clear_path' ? undefined : (sc as any)
      );
      totalMs += (performance.now() - t0);
    }

    const avgMs = totalMs / scenarios.length;
    assert(avgMs < 20, `Benchmark Test: Synthetic test scenario analysis average latency is ${avgMs.toFixed(2)}ms (<20ms budget)`);
  }

  console.log('\n=============================================');
  console.log(`--- DETECTOR v2: ${passed}/${total} TESTS PASSED ---`);
  console.log('=============================================\n');

  if (passed !== total) {
    throw new Error(`Failed ${total - passed} detector v2 tests!`);
  }
}

runV2Tests();
