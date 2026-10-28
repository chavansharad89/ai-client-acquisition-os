import type { GateResult } from '@acos/core-launch-gates';

export interface GateDiff {
  gate: GateResult['gate'];
  matches: boolean;
  production: GateResult;
  validation: GateResult;
  delta: {
    status: boolean;
    numerator: boolean;
    denominator: boolean;
  };
}

/**
 * Compares a production computation against this package's independent
 * recomputation for the same (gate, window). Pure — no I/O, no
 * persistence; callers decide what to do with a mismatch.
 */
export function diffGateResult(production: GateResult, validation: GateResult): GateDiff {
  if (production.gate !== validation.gate) {
    throw new Error(
      `diffGateResult: gate mismatch (production=${production.gate}, validation=${validation.gate})`,
    );
  }
  const statusMatches = production.status === validation.status;
  const numeratorMatches = production.numerator === validation.numerator;
  const denominatorMatches = production.denominator === validation.denominator;
  return {
    gate: production.gate,
    matches: statusMatches && numeratorMatches && denominatorMatches,
    production,
    validation,
    delta: {
      status: statusMatches,
      numerator: numeratorMatches,
      denominator: denominatorMatches,
    },
  };
}

export function diffGateResults(production: readonly GateResult[], validation: readonly GateResult[]): GateDiff[] {
  const validationByGate = new Map(validation.map((r) => [r.gate, r]));
  return production.map((prod) => {
    const val = validationByGate.get(prod.gate);
    if (!val) throw new Error(`diffGateResults: no validation result for gate ${prod.gate}`);
    return diffGateResult(prod, val);
  });
}
