/**
 * Unit Tests for PathSafetyEngine
 * 
 * Tests the 6 required scenarios plus edge cases:
 * 1. Pothole ahead (center, near) -> suggests "Move left" or "Move right" depending on which side is clearer.
 * 2. Vehicle in center -> warning, never suggests walking toward it.
 * 3. Approaching vehicle (expanding bounding box) -> urgent warning.
 * 4. Person crossing -> does not cause erratic turn commands; yields or warns without panic.
 * 5. All lanes blocked -> "Stop. Hazard ahead."
 * 6. Flicker test: single-frame false positive does NOT trigger speech.
 * 7. Hysteresis test: alternating noisy frames do not flip-flop directions within 1.5 seconds.
 */

import { PathSafetyEngine, BoundingBox, FrameInput } from '../services/pathSafetyEngine';

function runUnitTests() {
  console.log('\n========================================');
  console.log('--- RUNNING PATH SAFETY ENGINE TESTS ---');
  console.log('========================================\n');

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

  // ----------------------------------------------------
  // TEST 1: Pothole ahead (center, near) -> suggests Move right if left is blocked or right is clearer
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    let t = 1000;

    // Send 3 consecutive frames with pothole in center (xmin 0.45, xmax 0.55, near ymax 0.85)
    // Left lane also has a pole (xmin 0.25, xmax 0.35, ymax 0.70)
    // Right lane is clear
    const frame: FrameInput = {
      timestamp: t,
      detections: [
        { class: 'pothole', confidence: 0.90, xmin: 0.45, ymin: 0.60, xmax: 0.55, ymax: 0.85 },
        { class: 'pole', confidence: 0.85, xmin: 0.25, ymin: 0.20, xmax: 0.35, ymax: 0.70 },
      ],
    };

    engine.processFrame({ ...frame, timestamp: 1000 });
    engine.processFrame({ ...frame, timestamp: 1100 });
    const decision = engine.processFrame({ ...frame, timestamp: 1200 });

    assert(
      decision.action === 'move_right',
      'Test 1: Pothole in center with pole on left suggests "move_right"',
      `Got action: ${decision.action}, reason: ${decision.reason}`
    );
    assert(
      decision.speech.en.includes('Move right'),
      'Test 1: English speech instructs "Move right"',
      `Spoken: ${decision.speech.en}`
    );
    assert(
      decision.speech.hi.includes('दाएँ चलें'),
      'Test 1: Hindi speech instructs "दाएँ चलें"',
      `Spoken: ${decision.speech.hi}`
    );
    assert(
      decision.speech.te.includes('కుడివైపు వెళ్లండి'),
      'Test 1: Telugu speech instructs "కుడివైపు వెళ్లండి"',
      `Spoken: ${decision.speech.te}`
    );
  }

  // ----------------------------------------------------
  // TEST 2: Vehicle in center -> never suggests walking toward it
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    // Center vehicle, left clear, right has another vehicle
    const frame: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'vehicle', confidence: 0.92, xmin: 0.42, ymin: 0.40, xmax: 0.58, ymax: 0.80 },
        { class: 'vehicle', confidence: 0.88, xmin: 0.62, ymin: 0.40, xmax: 0.78, ymax: 0.80 },
      ],
    };

    engine.processFrame({ ...frame, timestamp: 1000 });
    engine.processFrame({ ...frame, timestamp: 1100 });
    const decision = engine.processFrame({ ...frame, timestamp: 1200 });

    assert(
      decision.action === 'move_left',
      'Test 2: Vehicle in center and right steers left (never into vehicle)',
      `Got action: ${decision.action}`
    );
    assert(
      !decision.speech.en.includes('Move right'),
      'Test 2: English speech does NOT guide into right vehicle',
      `Spoken: ${decision.speech.en}`
    );
  }

  // ----------------------------------------------------
  // TEST 3: Approaching vehicle (box expanding) -> urgent warning & Stop
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    // Frame 1: Vehicle far/mid (height = 0.20)
    engine.processFrame({
      timestamp: 1000,
      detections: [
        { class: 'vehicle', confidence: 0.95, xmin: 0.40, ymin: 0.40, xmax: 0.60, ymax: 0.60, trackId: 'car_1' },
      ],
    });

    // Frame 2: Vehicle expanding rapidly (height = 0.40, area doubled) in 200ms
    const decision = engine.processFrame({
      timestamp: 1200,
      detections: [
        { class: 'vehicle', confidence: 0.95, xmin: 0.35, ymin: 0.35, xmax: 0.65, ymax: 0.75, trackId: 'car_1' },
      ],
    });

    assert(
      decision.action === 'stop',
      'Test 3: Approaching vehicle triggers Stop action',
      `Got action: ${decision.action}`
    );
    assert(
      decision.interruptSpeech === true,
      'Test 3: Approaching vehicle triggers high-priority interruptSpeech'
    );
    assert(
      decision.speech.en.includes('Approaching vehicle') || decision.speech.en.includes('Warning'),
      'Test 3: Speech explicitly announces approaching vehicle warning',
      `Spoken: ${decision.speech.en}`
    );
  }

  // ----------------------------------------------------
  // TEST 4: Person crossing -> does not cause erratic turn commands; yields or warns without panic
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    // Person in mid band (ymax 0.65), confidence 0.70
    // Person risk weight is 0.5 * proximity 0.6 = 0.21 (below 0.30 critical corridor threshold)
    const frame: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'person', confidence: 0.70, xmin: 0.45, ymin: 0.30, xmax: 0.55, ymax: 0.65 },
      ],
    };

    engine.processFrame({ ...frame, timestamp: 1000 });
    engine.processFrame({ ...frame, timestamp: 1100 });
    const decision = engine.processFrame({ ...frame, timestamp: 1200 });

    assert(
      decision.action === 'proceed',
      'Test 4: Distant crossing pedestrian does not panic-turn the user',
      `Action: ${decision.action}, center risk: ${decision.laneRisks.center.toFixed(2)}`
    );
    assert(
      !decision.interruptSpeech,
      'Test 4: Non-urgent pedestrian does not interrupt ongoing speech'
    );
  }

  // ----------------------------------------------------
  // TEST 5: All lanes blocked -> "Stop. Hazard ahead."
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    // Center: open drain, Left: stairs, Right: barrier/vehicle
    const frame: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'open_drain', confidence: 0.92, xmin: 0.42, ymin: 0.65, xmax: 0.58, ymax: 0.88 },
        { class: 'stairs', confidence: 0.88, xmin: 0.22, ymin: 0.65, xmax: 0.38, ymax: 0.88 },
        { class: 'barrier', confidence: 0.85, xmin: 0.62, ymin: 0.65, xmax: 0.78, ymax: 0.88 },
      ],
    };

    engine.processFrame({ ...frame, timestamp: 1000 });
    engine.processFrame({ ...frame, timestamp: 1100 });
    const decision = engine.processFrame({ ...frame, timestamp: 1200 });

    assert(
      decision.action === 'stop',
      'Test 5: All lanes blocked produces Stop action',
      `Action: ${decision.action}`
    );
    assert(
      decision.speech.en.includes('Stop'),
      'Test 5: English speech commands "Stop"',
      `Spoken: ${decision.speech.en}`
    );
    assert(
      decision.speech.hi.includes('रुकें'),
      'Test 5: Hindi speech commands "रुकें"',
      `Spoken: ${decision.speech.hi}`
    );
    assert(
      decision.speech.te.includes('ఆగండి'),
      'Test 5: Telugu speech commands "ఆగండి"',
      `Spoken: ${decision.speech.te}`
    );
  }

  // ----------------------------------------------------
  // TEST 6: Flicker test -> single-frame false positive does NOT trigger speech
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    // Empty frames beforehand
    engine.processFrame({ timestamp: 1000, detections: [] });
    engine.processFrame({ timestamp: 1100, detections: [] });

    // Single random glitch frame with pothole
    const glitchDecision = engine.processFrame({
      timestamp: 1200,
      detections: [
        { class: 'pothole', confidence: 0.95, xmin: 0.45, ymin: 0.60, xmax: 0.55, ymax: 0.85 },
      ],
    });

    assert(
      glitchDecision.shouldSpeak === false,
      'Test 6: Single-frame flicker does NOT trigger spoken alert',
      `shouldSpeak: ${glitchDecision.shouldSpeak}`
    );
    assert(
      glitchDecision.speech.en === '',
      'Test 6: Speech text remains empty on unconfirmed flicker'
    );
  }

  // ----------------------------------------------------
  // TEST 7: Hysteresis test -> alternating noisy frames do NOT flip-flop directions within 1.5s
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();

    // 1. Establish initial move_left command (center blocked, right blocked, left clear)
    const blockCenterAndRight: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'pothole', confidence: 0.90, xmin: 0.45, ymin: 0.60, xmax: 0.55, ymax: 0.85 },
        { class: 'pole', confidence: 0.85, xmin: 0.65, ymin: 0.50, xmax: 0.75, ymax: 0.80 },
      ],
    };

    engine.processFrame({ ...blockCenterAndRight, timestamp: 1000 });
    engine.processFrame({ ...blockCenterAndRight, timestamp: 1100 });
    const dec1 = engine.processFrame({ ...blockCenterAndRight, timestamp: 1200 });

    assert(
      dec1.action === 'move_left',
      'Test 7a: Initial decision is move_left',
      `Got: ${dec1.action}`
    );

    // 2. Now at t = 1600ms (only 400ms later, well inside 1500ms hysteresis window),
    // a slight noise frame makes right lane appear marginally clearer than left
    // (left has a minor temporary noise, but left risk is still < 0.45)
    const noiseSwitchFrame: FrameInput = {
      timestamp: 1600,
      detections: [
        { class: 'pothole', confidence: 0.90, xmin: 0.45, ymin: 0.60, xmax: 0.55, ymax: 0.85 },
        { class: 'animal', confidence: 0.45, xmin: 0.25, ymin: 0.30, xmax: 0.35, ymax: 0.55 },
      ],
    };

    engine.processFrame({ ...noiseSwitchFrame, timestamp: 1500 });
    const dec2 = engine.processFrame({ ...noiseSwitchFrame, timestamp: 1600 });

    assert(
      dec2.action === 'move_left',
      'Test 7b: Hysteresis locks direction and prevents flip-flop to move_right within 1.5s',
      `Got: ${dec2.action}`
    );
  }

  // ----------------------------------------------------
  // TEST 8: Tilt Rejection test -> tilt at sky or shoes rejects frame and warns user
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    const tiltedFrame: FrameInput = {
      timestamp: 2000,
      tilt: { pitch: 48 }, // Pointed up at sky
      detections: [],
    };

    const dec = engine.processFrame(tiltedFrame);
    assert(
      dec.rejectedTilt === true,
      'Test 8: Phone pointing up (>35 deg pitch) triggers rejectedTilt flag'
    );
    assert(
      dec.speech.en.includes('Camera is tilted'),
      'Test 8: Spoken alert instructs user to keep phone level'
    );
  }

  // ----------------------------------------------------
  // TEST 9: Wall ahead -> announces "Wall, ahead, 2 steps. Stop."
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    const wallFrame: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'wall', confidence: 0.95, xmin: 0.20, ymin: 0.25, xmax: 0.80, ymax: 0.85 },
      ],
    };

    engine.processFrame({ ...wallFrame, timestamp: 1000 });
    engine.processFrame({ ...wallFrame, timestamp: 1100 });
    const decision = engine.processFrame({ ...wallFrame, timestamp: 1200 });

    assert(
      decision.action === 'stop',
      'Test 9: Wall blocking center corridor produces Stop action',
      `Got action: ${decision.action}`
    );
    assert(
      decision.speech.en.includes('Wall') && decision.speech.en.includes('Stop'),
      'Test 9: Spoken English warns "Wall, ahead, 2 steps. Stop."',
      `Spoken: ${decision.speech.en}`
    );
    assert(
      decision.speech.hi.includes('दीवार') && decision.speech.hi.includes('रुकें'),
      'Test 9: Spoken Hindi warns "दीवार, सामने... रुकें।"',
      `Spoken: ${decision.speech.hi}`
    );
    assert(
      decision.speech.te.includes('గోడ') && decision.speech.te.includes('ఆగండి'),
      'Test 9: Spoken Telugu warns "గోడ, ముందు... ఆగండి."',
      `Spoken: ${decision.speech.te}`
    );
  }

  // ----------------------------------------------------
  // TEST 10: Door ahead -> announces "Door, ahead, 2 steps. Stop."
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    const doorFrame: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'door', confidence: 0.92, xmin: 0.28, ymin: 0.20, xmax: 0.72, ymax: 0.86 },
      ],
    };

    engine.processFrame({ ...doorFrame, timestamp: 1000 });
    engine.processFrame({ ...doorFrame, timestamp: 1100 });
    const decision = engine.processFrame({ ...doorFrame, timestamp: 1200 });

    assert(
      decision.action === 'stop',
      'Test 10: Door blocking path produces Stop action',
      `Got action: ${decision.action}`
    );
    assert(
      decision.speech.en.includes('Door') && decision.speech.en.includes('Stop'),
      'Test 10: Spoken English warns "Door, ahead, 2 steps. Stop."',
      `Spoken: ${decision.speech.en}`
    );
    assert(
      decision.speech.hi.includes('दरवाज़ा') && decision.speech.hi.includes('रुकें'),
      'Test 10: Spoken Hindi warns "दरवाज़ा, सामने... रुकें।"',
      `Spoken: ${decision.speech.hi}`
    );
    assert(
      decision.speech.te.includes('తలుపు') && decision.speech.te.includes('ఆగండి'),
      'Test 10: Spoken Telugu warns "తలుపు, ముందు... ఆగండి."',
      `Spoken: ${decision.speech.te}`
    );
  }

  // ----------------------------------------------------
  // TEST 11: Stairs ahead -> announces "Stairs, ahead, 2 steps. Stop."
  // ----------------------------------------------------
  {
    const engine = new PathSafetyEngine();
    const stairsFrame: FrameInput = {
      timestamp: 1000,
      detections: [
        { class: 'stairs', confidence: 0.94, xmin: 0.25, ymin: 0.45, xmax: 0.75, ymax: 0.88 },
      ],
    };

    engine.processFrame({ ...stairsFrame, timestamp: 1000 });
    engine.processFrame({ ...stairsFrame, timestamp: 1100 });
    const decision = engine.processFrame({ ...stairsFrame, timestamp: 1200 });

    assert(
      decision.action === 'stop',
      'Test 11: Stairs ahead produces Stop action',
      `Got action: ${decision.action}`
    );
    assert(
      decision.speech.en.includes('Stairs') && decision.speech.en.includes('Stop'),
      'Test 11: Spoken English warns "Stairs, ahead, 1 step. Stop."',
      `Spoken: ${decision.speech.en}`
    );
    assert(
      decision.speech.hi.includes('सीढ़ियाँ') && decision.speech.hi.includes('रुकें'),
      'Test 11: Spoken Hindi warns "सीढ़ियाँ... रुकें।"',
      `Spoken: ${decision.speech.hi}`
    );
    assert(
      decision.speech.te.includes('మెట్లు') && decision.speech.te.includes('ఆగండి'),
      'Test 11: Spoken Telugu warns "మెట్లు... ఆగండి."',
      `Spoken: ${decision.speech.te}`
    );
  }

  console.log('\n========================================');
  console.log(`--- PATH SAFETY ENGINE: ${passed}/${total} TESTS PASSED ---`);
  console.log('========================================\n');

  if (passed !== total) {
    throw new Error(`Failed ${total - passed} path safety engine tests!`);
  }
}

runUnitTests();
