/**
 * Path-Safety Engine (Pure TypeScript)
 * 
 * Divides the forward camera view into 5 horizontal lanes and 3 distance bands.
 * Fuses Model A (ground-surface CNN) and Model B (YOLO obstacle detector) predictions,
 * applies exponential moving average (EMA) smoothing, multi-frame confirmation,
 * risk weighting, hysteresis direction locking, and generates trilingual speech guidance.
 * 
 * Strict safety rules:
 * - Assistive aid only; never claims a path is "safe" (uses "looks clear" / "no hazard detected").
 * - Never guides the user toward a vehicle, pothole, open drain, or stairs.
 * - Single-frame flickers never trigger speech alerts.
 * - Hysteresis prevents direction flip-flopping within 1.5 seconds.
 */

export type Lane = 'far_left' | 'left' | 'center' | 'right' | 'far_right';
export type DistanceBand = 'near' | 'mid' | 'far';

export type ObstacleClass =
  | 'pothole'
  | 'open_drain'
  | 'stairs'
  | 'pole'
  | 'street_light'
  | 'vehicle'
  | 'animal'
  | 'person'
  | 'barrier'
  | 'door'
  | 'wall'
  | 'unknown';

export type GroundSurfaceClass =
  | 'clear_path'
  | 'pothole'
  | 'open_drain'
  | 'stairs'
  | 'rough_or_debris'
  | 'wet_or_slippery';

export interface BoundingBox {
  class: ObstacleClass;
  confidence: number;
  xmin: number; // 0.0 to 1.0
  ymin: number; // 0.0 to 1.0
  xmax: number; // 0.0 to 1.0
  ymax: number; // 0.0 to 1.0
  trackId?: string;
}

export interface GroundPrediction {
  class: GroundSurfaceClass;
  confidence: number;
}

export interface TiltReading {
  pitch: number; // degrees from chest vertical: 0 is forward, positive is tilted up, negative tilted down
  roll?: number;
}

export interface FrameInput {
  ground?: GroundPrediction;
  detections: BoundingBox[];
  tilt?: TiltReading;
  timestamp?: number;
}

export interface PrimaryHazardInfo {
  class: ObstacleClass | GroundSurfaceClass;
  lane: Lane;
  band: DistanceBand;
  distanceSteps: number;
  confidence: number;
  isApproaching?: boolean;
}

export type GuidanceAction = 'proceed' | 'move_left' | 'move_right' | 'stop';

export interface SpokenGuidance {
  en: string;
  hi: string;
  te: string;
}

export interface EngineDecision {
  action: GuidanceAction;
  speech: SpokenGuidance;
  shouldSpeak: boolean;
  interruptSpeech: boolean;
  reason: string;
  laneRisks: Record<Lane, number>;
  primaryHazard?: PrimaryHazardInfo;
  rejectedTilt: boolean;
  timestamp: number;
}

export interface EngineConfig {
  emaAlpha: number; // EMA weight for current frame (default 0.4)
  clearThreshold: number; // Risk threshold below which a lane is considered clear (default 0.3)
  hazardThreshold: number; // Risk threshold above which a lane is blocked (default 0.4)
  hysteresisMs: number; // Minimum ms to maintain a chosen direction unless dangerous (default 1500)
  speechBudgetMs: number; // Min ms between speech announcements unless urgent (default 1800)
  clearReminderIntervalMs: number; // Periodic interval for "path looks clear" (default 10000)
  verboseMode: boolean; // Speak "path clear" periodically (default false)
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  emaAlpha: 0.55,
  clearThreshold: 0.3,
  hazardThreshold: 0.4,
  hysteresisMs: 1200,
  speechBudgetMs: 750,
  clearReminderIntervalMs: 8000,
  verboseMode: false,
};

// Five vertical lanes across image width [0.0 to 1.0]
export const LANE_BOUNDS: Record<Lane, [number, number]> = {
  far_left: [0.0, 0.2],
  left: [0.2, 0.4],
  center: [0.4, 0.6],
  right: [0.6, 0.8],
  far_right: [0.8, 1.0],
};

// Intrinsic hazard risk weights
export const HAZARD_WEIGHTS: Record<ObstacleClass, number> = {
  pothole: 1.0,
  open_drain: 1.0,
  stairs: 1.0,
  vehicle: 1.0,
  wall: 1.0,
  door: 0.9,
  pole: 0.8,
  street_light: 0.8,
  barrier: 0.8,
  animal: 0.7,
  person: 0.5,
  unknown: 0.4,
};

// Classes that must never be navigated toward
export const FORBIDDEN_LANE_CLASSES: Set<string> = new Set([
  'pothole',
  'open_drain',
  'stairs',
  'vehicle',
  'wall',
  'door',
]);

interface HistoricalFrame {
  timestamp: number;
  detections: BoundingBox[];
  ground?: GroundPrediction;
}

export class PathSafetyEngine {
  private config: EngineConfig;
  private smoothedRisks: Record<Lane, number> = {
    far_left: 0,
    left: 0,
    center: 0,
    right: 0,
    far_right: 0,
  };

  private frameHistory: HistoricalFrame[] = [];
  private lastSpokenTimestamp = 0;
  private lastClearSpokenTimestamp = 0;
  private lastAction: GuidanceAction = 'proceed';
  private lastActionTimestamp = 0;
  private previousVehicleBoxes: Map<string, { height: number; area: number; timestamp: number }> = new Map();

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
  }

  public updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public reset(): void {
    this.smoothedRisks = {
      far_left: 0,
      left: 0,
      center: 0,
      right: 0,
      far_right: 0,
    };
    this.frameHistory = [];
    this.lastSpokenTimestamp = 0;
    this.lastClearSpokenTimestamp = 0;
    this.lastAction = 'proceed';
    this.lastActionTimestamp = 0;
    this.previousVehicleBoxes.clear();
  }

  /**
   * Determine which vertical lanes an obstacle box intersects
   */
  public getIntersectingLanes(box: BoundingBox): Lane[] {
    const lanes: Lane[] = [];
    const eps = 0.01;
    for (const [lane, [minX, maxX]] of Object.entries(LANE_BOUNDS) as [Lane, [number, number]][]) {
      // Box overlaps lane if max(xmin, minX) < min(xmax, maxX)
      if (Math.max(box.xmin, minX) < Math.min(box.xmax, maxX) - eps) {
        lanes.push(lane);
      }
    }
    // Fallback to center of box if tiny box fell between edges
    if (lanes.length === 0) {
      const cx = (box.xmin + box.xmax) / 2;
      for (const [lane, [minX, maxX]] of Object.entries(LANE_BOUNDS) as [Lane, [number, number]][]) {
        if (cx >= minX && cx <= maxX) {
          lanes.push(lane);
          break;
        }
      }
    }
    return lanes.length > 0 ? lanes : ['center'];
  }

  /**
   * Categorize vertical distance based on bottom edge (ymax)
   * ymax > 0.75: near (~1-2 steps, ~0.7-1.4m)
   * 0.50 < ymax <= 0.75: mid (~3-4 steps, ~2-3m)
   * ymax <= 0.50: far (5+ steps)
   */
  public getDistanceBand(ymax: number): DistanceBand {
    if (ymax > 0.75) return 'near';
    if (ymax > 0.50) return 'mid';
    return 'far';
  }

  public getStepsEstimate(band: DistanceBand, ymax: number): number {
    if (band === 'near') {
      return ymax > 0.88 ? 1 : 2;
    }
    if (band === 'mid') {
      return ymax > 0.65 ? 3 : 4;
    }
    return 5;
  }

  /**
   * Check if phone tilt indicates camera is pointed at sky or ground/shoes
   * Pitch > 35° (pointing at sky) or Pitch < -40° (pointing at feet)
   */
  public isTiltUnreliable(tilt?: TiltReading): boolean {
    if (!tilt) return false;
    return tilt.pitch > 35 || tilt.pitch < -40;
  }

  /**
   * Evaluate a single video frame and produce the guidance decision
   */
  public processFrame(input: FrameInput): EngineDecision {
    const now = input.timestamp ?? Date.now();

    // 1. Tilt safety check
    if (this.isTiltUnreliable(input.tilt)) {
      return {
        action: 'stop',
        speech: {
          en: 'Camera is tilted. Keep phone level at chest height.',
          hi: 'कैमरा झुक गया है। फोन को सीने की ऊंचाई पर सीधा रखें।',
          te: 'కెమెరా వాలింది. ఫోన్‌ను ఛాతీ ఎత్తులో నిటారుగా ఉంచండి.',
        },
        shouldSpeak: now - this.lastSpokenTimestamp >= this.config.speechBudgetMs,
        interruptSpeech: false,
        reason: 'Camera tilt exceeds reliable operating envelope',
        laneRisks: { ...this.smoothedRisks },
        rejectedTilt: true,
        timestamp: now,
      };
    }

    // 2. Track vehicles to detect approaching movement (box expansion > 15%)
    const currentVehicles = new Map<string, { height: number; area: number; timestamp: number }>();
    let approachingVehicleDetected = false;

    for (let i = 0; i < input.detections.length; i++) {
      const det = input.detections[i];
      if (det.class === 'vehicle') {
        const h = det.ymax - det.ymin;
        const w = det.xmax - det.xmin;
        const area = h * w;
        const trackKey = det.trackId || `veh_${Math.round(det.xmin * 5)}`;

        const prev = this.previousVehicleBoxes.get(trackKey);
        if (prev && now - prev.timestamp <= 1200 && now - prev.timestamp >= 100) {
          // If height expanded by > 15% or area by > 25% in <= 1.2s, it is approaching
          if (h / prev.height > 1.15 || area / prev.area > 1.25) {
            approachingVehicleDetected = true;
          }
        }
        currentVehicles.set(trackKey, { height: h, area, timestamp: now });
      }
    }
    this.previousVehicleBoxes = currentVehicles;

    // 3. Record history for multi-frame confirmation
    this.frameHistory.push({
      timestamp: now,
      detections: input.detections,
      ground: input.ground,
    });
    // Keep max 10 frames (~1 sec at 10fps)
    if (this.frameHistory.length > 10) {
      this.frameHistory.shift();
    }

    // 4. Calculate raw instantaneous risk per lane [0.0 to 1.0+]
    const rawLaneRisks: Record<Lane, number> = {
      far_left: 0,
      left: 0,
      center: 0,
      right: 0,
      far_right: 0,
    };

    const laneForbiddenHazards: Record<Lane, Set<string>> = {
      far_left: new Set(),
      left: new Set(),
      center: new Set(),
      right: new Set(),
      far_right: new Set(),
    };

    let highestRiskObstacle: {
      det: BoundingBox;
      risk: number;
      band: DistanceBand;
      lane: Lane;
      isApproaching: boolean;
    } | null = null;

    for (const det of input.detections) {
      const weight = HAZARD_WEIGHTS[det.class] ?? 0.4;
      const band = this.getDistanceBand(det.ymax);
      const proximityFactor = band === 'near' ? 1.0 : band === 'mid' ? 0.6 : 0.2;
      const approachFactor = det.class === 'vehicle' && approachingVehicleDetected ? 1.5 : 1.0;

      const risk = det.confidence * weight * proximityFactor * approachFactor;
      const lanes = this.getIntersectingLanes(det);

      for (const lane of lanes) {
        if (risk > rawLaneRisks[lane]) {
          rawLaneRisks[lane] = risk;
        }
        if (FORBIDDEN_LANE_CLASSES.has(det.class) && det.confidence >= 0.50 && band !== 'far') {
          laneForbiddenHazards[lane].add(det.class);
        }
      }

      if (!highestRiskObstacle || risk > highestRiskObstacle.risk) {
        highestRiskObstacle = {
          det,
          risk,
          band,
          lane: lanes.includes('center') ? 'center' : lanes[0],
          isApproaching: det.class === 'vehicle' && approachingVehicleDetected,
        };
      }
    }

    // Blend Model A ground surface risk if present
    if (input.ground && input.ground.class !== 'clear_path') {
      const gClass = input.ground.class;
      const gConf = input.ground.confidence;
      const gWeight =
        gClass === 'pothole' || gClass === 'open_drain' || gClass === 'stairs'
          ? 1.0
          : gClass === 'wet_or_slippery'
          ? 0.6
          : 0.5;
      const gRisk = gConf * gWeight * 0.85;

      // Ground hazards affect the main walking corridor (left, center, right)
      for (const l of ['left', 'center', 'right'] as Lane[]) {
        rawLaneRisks[l] = Math.max(rawLaneRisks[l], gRisk);
        if (FORBIDDEN_LANE_CLASSES.has(gClass) && gConf >= 0.50) {
          laneForbiddenHazards[l].add(gClass);
        }
      }
    }

    // 5. Temporal Smoothing: Exponential Moving Average (EMA)
    const alpha = this.config.emaAlpha;
    for (const lane of Object.keys(this.smoothedRisks) as Lane[]) {
      this.smoothedRisks[lane] =
        alpha * rawLaneRisks[lane] + (1 - alpha) * this.smoothedRisks[lane];
    }

    // 6. Multi-frame Confirmation check
    // Rules:
    // - Near danger (weight >= 0.8, band == 'near') requires confirmed presence in 2 of last 3 frames.
    // - Mid distance or caution requires 3 of last 5 frames.
    // - Single-frame flickers must return no speech.
    const isConfirmedHazard = this.checkMultiFrameConfirmation(highestRiskObstacle?.det);

    // 7. Guidance Decision Logic
    const centerRisk = this.smoothedRisks.center;
    const leftRisk = this.smoothedRisks.left;
    const rightRisk = this.smoothedRisks.right;

    let action: GuidanceAction = 'proceed';
    let interruptSpeech = false;
    let reason = '';
    let speech: SpokenGuidance = { en: '', hi: '', te: '' };
    let primaryHazard: PrimaryHazardInfo | undefined;

    if (highestRiskObstacle) {
      primaryHazard = {
        class: highestRiskObstacle.det.class,
        lane: highestRiskObstacle.lane,
        band: highestRiskObstacle.band,
        distanceSteps: this.getStepsEstimate(highestRiskObstacle.band, highestRiskObstacle.det.ymax),
        confidence: highestRiskObstacle.det.confidence,
        isApproaching: highestRiskObstacle.isApproaching,
      };
    }

    // Special urgent case: Approaching vehicle
    if (approachingVehicleDetected && highestRiskObstacle?.det.class === 'vehicle') {
      action = 'stop';
      interruptSpeech = true;
      reason = 'Approaching vehicle detected';
      speech = {
        en: 'Warning: Approaching vehicle ahead. Stop.',
        hi: 'चेतावनी: सामने से गाड़ी आ रही है। रुकें।',
        te: 'హెచ్చరిక: ముందు వేగంగా వాహనం వస్తోంది. ఆగండి.',
      };
    } else if (centerRisk < this.config.clearThreshold) {
      // CASE A: Center lane is clear!
      action = 'proceed';
      reason = 'Center walking corridor is clear';

      // Check if periodic clear confirmation should be spoken
      const timeSinceClear = now - this.lastClearSpokenTimestamp;
      if (
        (this.config.verboseMode && now - this.lastSpokenTimestamp >= this.config.speechBudgetMs) ||
        timeSinceClear >= this.config.clearReminderIntervalMs
      ) {
        speech = {
          en: 'Path ahead looks clear.',
          hi: 'रास्ता आगे साफ़ लग रहा है।',
          te: 'ముందు దారి స్పష్టంగా కనిపిస్తోంది.',
        };
      }
    } else {
      // CASE B: Center lane has a hazard!
      // Only proceed with navigation instructions if the hazard is confirmed across multiple frames
      if (!isConfirmedHazard) {
        // Unconfirmed detection / flicker: do not speak erratic commands
        return {
          action: this.lastAction,
          speech: { en: '', hi: '', te: '' },
          shouldSpeak: false,
          interruptSpeech: false,
          reason: 'Awaiting multi-frame confirmation of center detection',
          laneRisks: { ...this.smoothedRisks },
          primaryHazard,
          rejectedTilt: false,
          timestamp: now,
        };
      }

      const leftSafe =
        leftRisk < this.config.hazardThreshold && laneForbiddenHazards.left.size === 0;
      const rightSafe =
        rightRisk < this.config.hazardThreshold && laneForbiddenHazards.right.size === 0;

      // Side selection with hysteresis
      let candidateDirection: 'move_left' | 'move_right' | 'stop' = 'stop';

      if (leftSafe && rightSafe) {
        // Both sides are viable: choose the one with lower risk
        candidateDirection = leftRisk <= rightRisk ? 'move_left' : 'move_right';
      } else if (leftSafe) {
        candidateDirection = 'move_left';
      } else if (rightSafe) {
        candidateDirection = 'move_right';
      } else {
        candidateDirection = 'stop';
      }

      // Apply Hysteresis: do not flip between move_left and move_right within 1.5 seconds
      if (
        (this.lastAction === 'move_left' && candidateDirection === 'move_right') ||
        (this.lastAction === 'move_right' && candidateDirection === 'move_left')
      ) {
        const timeSinceLastAction = now - this.lastActionTimestamp;
        if (timeSinceLastAction < this.config.hysteresisMs) {
          // Check if previously chosen side is still reasonably safe (< 0.45 risk)
          const prevSideRisk = this.lastAction === 'move_left' ? leftRisk : rightRisk;
          const prevSideForbidden =
            this.lastAction === 'move_left'
              ? laneForbiddenHazards.left.size > 0
              : laneForbiddenHazards.right.size > 0;

          if (prevSideRisk < this.config.hazardThreshold + 0.05 && !prevSideForbidden) {
            candidateDirection = this.lastAction;
          }
        }
      }

      action = candidateDirection;

      // Check for urgent interrupt condition: high danger in near band
      if (highestRiskObstacle && highestRiskObstacle.band === 'near' && highestRiskObstacle.risk >= 0.75) {
        interruptSpeech = true;
      }

      // Generate speech text
      if (action === 'stop') {
        reason = 'All passable forward lanes are blocked or unsafe';
        if (primaryHazard && primaryHazard.class && primaryHazard.class !== 'unknown') {
          speech = this.formatGuidanceSpeech(primaryHazard.class, primaryHazard.lane, primaryHazard.distanceSteps, 'stop');
        } else {
          speech = {
            en: 'Stop. Hazard ahead.',
            hi: 'रुकें। सामने खतरा।',
            te: 'ఆగండి. ముందు ప్రమాదం.',
          };
        }
      } else {
        const hName = primaryHazard ? primaryHazard.class : 'pothole';
        const steps = primaryHazard ? primaryHazard.distanceSteps : 2;
        const hLane = primaryHazard ? primaryHazard.lane : 'center';
        speech = this.formatGuidanceSpeech(hName, hLane, steps, action);
        reason = `Center blocked (${(centerRisk * 100).toFixed(0)}% risk). Suggesting ${action}`;
      }
    }

    // 8. Speech Budgeting
    let shouldSpeak = false;
    const hasSpeechContent = speech.en.trim().length > 0;

    if (hasSpeechContent) {
      if (interruptSpeech) {
        shouldSpeak = true;
      } else {
        const timeSinceLastSpeech = now - this.lastSpokenTimestamp;
        // Fast-path: When action transitions away from proceed or changes direction, trigger immediately
        const actionChanged = action !== this.lastAction && action !== 'proceed';
        if (actionChanged || timeSinceLastSpeech >= this.config.speechBudgetMs) {
          shouldSpeak = true;
        }
      }
    }

    if (shouldSpeak) {
      this.lastSpokenTimestamp = now;
      if (action === 'proceed') {
        this.lastClearSpokenTimestamp = now;
      }
    }

    if (action !== this.lastAction) {
      this.lastAction = action;
      this.lastActionTimestamp = now;
    }

    return {
      action,
      speech,
      shouldSpeak,
      interruptSpeech,
      reason,
      laneRisks: { ...this.smoothedRisks },
      primaryHazard,
      rejectedTilt: false,
      timestamp: now,
    };
  }

  /**
   * Check if an obstacle is confirmed across historical frames:
   * - Near danger: 2 of last 3 frames
   * - Mid/far danger: 3 of last 5 frames
   */
  private checkMultiFrameConfirmation(det?: BoundingBox): boolean {
    if (!det) return false;
    if (this.frameHistory.length < 2) return false; // Needs at least 2 frames to confirm

    const band = this.getDistanceBand(det.ymax);
    const requiredMatches = band === 'near' ? 2 : 3;
    const windowSize = band === 'near' ? 3 : 5;

    const recentFrames = this.frameHistory.slice(-windowSize);
    let matchCount = 0;

    for (const frame of recentFrames) {
      const match = frame.detections.some(
        (d) => d.class === det.class && Math.abs(d.xmin - det.xmin) < 0.25
      );
      if (match) matchCount++;
    }

    return matchCount >= Math.min(requiredMatches, recentFrames.length);
  }

  /**
   * Format trilingual concise guidance string:
   * [Hazard] + [Direction] + [Distance in steps]. + [Action].
   */
  public formatGuidanceSpeech(
    hazard: string,
    lane: Lane,
    steps: number,
    action: 'move_left' | 'move_right' | 'stop'
  ): SpokenGuidance {
    const hazardLabels: Record<string, { en: string; hi: string; te: string }> = {
      pothole: { en: 'Pothole', hi: 'गड्ढा', te: 'గుంత' },
      open_drain: { en: 'Open drain', hi: 'खुली नाली', te: 'తెరిచి ఉన్న కాలువ' },
      stairs: { en: 'Stairs', hi: 'सीढ़ियाँ', te: 'మెట్లు' },
      pole: { en: 'Pole', hi: 'खंभा', te: 'స్తంభం' },
      street_light: { en: 'Street light', hi: 'स्ट्रीट लाइट', te: 'వీధి దీపం' },
      vehicle: { en: 'Vehicle', hi: 'गाड़ी', te: 'వాహనం' },
      animal: { en: 'Animal', hi: 'जानवर', te: 'జంతువు' },
      person: { en: 'Person', hi: 'व्यक्ति', te: 'వ్యక్తి' },
      barrier: { en: 'Barrier', hi: 'रुकावट', te: 'అడ్డంకి' },
      door: { en: 'Door', hi: 'दरवाज़ा', te: 'తలుపు' },
      wall: { en: 'Wall', hi: 'दीवार', te: 'గోడ' },
      rough_or_debris: { en: 'Debris', hi: 'मलबा', te: 'చెత్తాచెదారం' },
      wet_or_slippery: { en: 'Slippery path', hi: 'फिसलन', te: 'జారే దారి' },
    };

    const h = hazardLabels[hazard] || { en: 'Obstacle', hi: 'बाधा', te: 'అడ్డంకి' };
    const stepCount = Math.max(1, Math.min(steps, 5));

    // Direction phrasing
    const directionPhrases = {
      center: { en: 'ahead', hi: 'सामने', te: 'ముందు' },
      left: { en: 'left', hi: 'बाएँ', te: 'ఎడమ' },
      right: { en: 'right', hi: 'दाएँ', te: 'కుడి' },
      far_left: { en: 'far left', hi: 'दूर बाएँ', te: 'దూరంగా ఎడమ' },
      far_right: { en: 'far right', hi: 'दूर दाएँ', te: 'దూరంగా కుడి' },
    };
    const dir = directionPhrases[lane] || directionPhrases.center;

    // Steps phrasing
    const stepPhrases = {
      en: stepCount === 1 ? '1 step' : `${stepCount} steps`,
      hi: `${stepCount} कदम`,
      te: stepCount === 1 ? '1 అడుగు' : `${stepCount} అడుగులు`,
    };

    // Action phrasing
    const actionPhrases = {
      move_left: { en: 'Move left.', hi: 'बाएँ चलें।', te: 'ఎడమవైపు వెళ్లండి.' },
      move_right: { en: 'Move right.', hi: 'दाएँ चलें।', te: 'కుడివైపు వెళ్లండి.' },
      stop: { en: 'Stop.', hi: 'रुकें।', te: 'ఆగండి.' },
    };
    const act = actionPhrases[action];

    return {
      en: `${h.en}, ${dir.en}, ${stepPhrases.en}. ${act.en}`,
      hi: `${h.hi}, ${dir.hi}, ${stepPhrases.hi}। ${act.hi}`,
      te: `${h.te}, ${dir.te}, ${stepPhrases.te}. ${act.te}`,
    };
  }
}
