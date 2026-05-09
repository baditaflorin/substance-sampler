import type { ConfidenceLabel, SubstanceWarning, UserFacingError } from "@/features/sampler/types";

export function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.74) {
    return "high";
  }

  if (score >= 0.48) {
    return "medium";
  }

  return "low";
}

export function warning(
  id: string,
  title: string,
  what: string,
  why: string,
  nextStep: string,
  confidenceImpact = 0.08,
  severity: SubstanceWarning["severity"] = "warning"
): SubstanceWarning {
  return {
    id,
    severity,
    title,
    what,
    why,
    nextStep,
    confidenceImpact
  };
}

export function userError(
  code: string,
  title: string,
  what: string,
  why: string,
  nextStep: string,
  recoverable = true
): UserFacingError {
  return { code, title, what, why, nextStep, recoverable };
}
