import { BounceResult } from '../../tracking/utils/bounceDetector';
import { arbitrateLineCall, LineCallResult } from '../utils/lineArbitrator';

export interface DecisionSummary extends LineCallResult {
  frameIndex: number;
  bouncePoint: { t: number; x: number; y: number; z: number };
}

/**
 * Evaluates a bounce result from Phase 3 against ITF court lines and ball radius
 * using the line arbitration engine, producing a comprehensive decision summary.
 */
export function evaluateBounceDecision(
  bounceResult: BounceResult | null,
  matchType: 'singles' | 'doubles' = 'singles'
): DecisionSummary | null {
  if (!bounceResult || !bounceResult.bouncePoint) {
    return null;
  }

  const arbitration = arbitrateLineCall(
    bounceResult.bouncePoint,
    bounceResult.confidence,
    matchType
  );

  return {
    ...arbitration,
    frameIndex: bounceResult.frameIndex,
    bouncePoint: bounceResult.bouncePoint,
  };
}
