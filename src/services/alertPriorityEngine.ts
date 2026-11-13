import { HazardType, Zone, ZonePrediction, AlertItem, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

// Priority definitions:
// Danger (3): pothole, open_drain, stairs, pole, vehicle
// Caution (2): animal
// Info (1): person
// Safe (0): clear_path
export const DANGER_CLASSES: Set<HazardType> = new Set([
  'pothole',
  'open_drain',
  'stairs',
  'pole',
  'vehicle',
]);

export function getHazardPriority(hazard: HazardType): number {
  if (DANGER_CLASSES.has(hazard)) return 3;
  if (hazard === 'animal') return 2;
  if (hazard === 'person') return 1;
  return 0; // 'clear_path'
}

export interface CooldownTracker {
  [alertKey: string]: number; // key -> timestamp of last alert
}

export class AlertPriorityEngine {
  private cooldownMap: CooldownTracker = {};
  private lastSpokenAlerts: AlertItem[] = [];

  /**
   * Evaluates predictions from left, center, right zones and outputs up to 2 prioritized alerts.
   */
  public evaluatePredictions(
    predictions: ZonePrediction[],
    options: {
      confidenceThreshold: number;
      cooldownSeconds: number;
      language: SupportedLanguage;
      now?: number;
    }
  ): {
    alertsToSpeak: AlertItem[];
    interruptCurrentSpeech: boolean;
    allEvaluated: AlertItem[];
  } {
    const {
      confidenceThreshold = 0.6,
      cooldownSeconds = 4,
      language = 'en',
      now = Date.now(),
    } = options;

    const candidateAlerts: AlertItem[] = [];
    let hasLowConfidenceHazard = false;

    // 1. Convert zone predictions into candidate alert items
    for (const pred of predictions) {
      if (pred.hazard === 'clear_path') {
        continue;
      }

      if (pred.confidence < confidenceThreshold) {
        // Below confidence threshold: flag potential ambiguous obstacle
        if (DANGER_CLASSES.has(pred.hazard)) {
          hasLowConfidenceHazard = true;
        }
        continue;
      }

      const priority = getHazardPriority(pred.hazard);

      // Trilingual alerts: "Pothole, left" / "गड्ढा, बाएँ" / "గుంత, ఎడమ"
      const messageEn = `${TRANSLATIONS.en.hazards[pred.hazard]}, ${TRANSLATIONS.en.zones[pred.zone]}.`;
      const messageHi = `${TRANSLATIONS.hi.hazards[pred.hazard]}, ${TRANSLATIONS.hi.zones[pred.zone]}।`;
      const messageTe = `${TRANSLATIONS.te.hazards[pred.hazard]}, ${TRANSLATIONS.te.zones[pred.zone]}.`;

      candidateAlerts.push({
        id: `${pred.hazard}-${pred.zone}-${now}`,
        messageEn,
        messageHi,
        messageTe,
        hazard: pred.hazard,
        zone: pred.zone,
        priority,
        confidence: pred.confidence,
        timestamp: now,
      });
    }

    // If no confident hazards were found, but there was a low-confidence hazard detected
    if (candidateAlerts.length === 0 && hasLowConfidenceHazard) {
      const cautionKey = `caution-not-sure`;
      const lastTime = this.cooldownMap[cautionKey];
      if (lastTime === undefined || now - lastTime >= cooldownSeconds * 1000) {
        this.cooldownMap[cautionKey] = now;
        const fallbackAlert: AlertItem = {
          id: `not-sure-${now}`,
          messageEn: TRANSLATIONS.en.lowConfidence,
          messageHi: TRANSLATIONS.hi.lowConfidence,
          messageTe: TRANSLATIONS.te.lowConfidence,
          hazard: 'pothole',
          zone: 'center',
          priority: 2,
          confidence: 0.5,
          timestamp: now,
        };
        return {
          alertsToSpeak: [fallbackAlert],
          interruptCurrentSpeech: false,
          allEvaluated: [fallbackAlert],
        };
      }
      return {
        alertsToSpeak: [],
        interruptCurrentSpeech: false,
        allEvaluated: [],
      };
    }

    // 2. Sort by Priority descending, then Confidence descending
    candidateAlerts.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      const zoneWeight = (z: Zone) => (z === 'center' ? 0.05 : 0);
      const scoreA = a.confidence + zoneWeight(a.zone);
      const scoreB = b.confidence + zoneWeight(b.zone);
      return scoreB - scoreA;
    });

    // 3. Filter candidate alerts by cooldown:
    const eligibleAlerts: AlertItem[] = [];
    let hasDangerInterrupt = false;

    for (const alert of candidateAlerts) {
      const alertKey = `${alert.hazard}-${alert.zone}`;
      const lastSpoken = this.cooldownMap[alertKey];

      if (lastSpoken === undefined || now - lastSpoken >= cooldownSeconds * 1000) {
        eligibleAlerts.push(alert);
        if (alert.priority >= 3) {
          hasDangerInterrupt = true;
        }
      }
    }

    // 4. Limit to at most 2 alerts spoken per cycle
    const alertsToSpeak = eligibleAlerts.slice(0, 2);

    for (const alert of alertsToSpeak) {
      const alertKey = `${alert.hazard}-${alert.zone}`;
      this.cooldownMap[alertKey] = now;
    }

    if (alertsToSpeak.length > 0) {
      this.lastSpokenAlerts = alertsToSpeak;
    }

    return {
      alertsToSpeak,
      interruptCurrentSpeech: hasDangerInterrupt,
      allEvaluated: candidateAlerts,
    };
  }

  public getLastSpokenAlerts(): AlertItem[] {
    return this.lastSpokenAlerts;
  }

  public resetCooldowns(): void {
    this.cooldownMap = {};
    this.lastSpokenAlerts = [];
  }
}
