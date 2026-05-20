/*
Design reminder for this file:
- Implements shoe matching logic based on assessment results.
- Generates shoe requirements from assessment data and matches with database shoes.
*/

import { FullAssessmentResult, FullAssessmentInput, normalizeAssessmentInput } from "./assessment";
import { ShoeSpec, calculateShoeScore } from "./shoe-database";

export interface ShoeRequirement {
  heelCounterMin: number;
  landingStabilityMin: number;
  fixationMin: number;
  torsionMin: number;
  shankMin: number;
  flexPointMin: number;
  toeSpringMin: number;
  rockerMin: number;
  weightMin: number;
  insoleLength: { min: number; max: number };
  drop: { min: number; max: number };
  reason: string;
}

export interface ShoeMatch {
  shoeId: string;
  shoeName: string;
  brand: string;
  model: string;
  matchScore: number; // 0-100
  isFullMatch: boolean;
  missingRequirements: string[];
  reason: string;
}

const requirementLabelMap = {
  heelCounter: "ヒールカウンター",
  landingStability: "接地安定性",
  fixation: "固定性",
  torsion: "トーション",
  shank: "シャンク",
  flexPoint: "屈曲位置",
  toeSpring: "トゥスプリング",
  rocker: "ロッカー",
  insoleLengthSmall: "捨て寸が不足",
  insoleLengthLarge: "捨て寸が大きい",
  dropSmall: "ドロップが低い",
  dropLarge: "ドロップが高い",
} as const;

// Generate shoe requirements from assessment results
export function generateShoeRequirements(
  input: FullAssessmentInput,
  result: FullAssessmentResult
): ShoeRequirement {
  const normalizedInput = normalizeAssessmentInput(input);
  const footType = result.foot.right.footType || result.foot.left.footType;
  const flexibility = result.foot.right.flexibilityType || result.foot.left.flexibilityType;
  const ankleDorsiflexion = Math.max(
    normalizedInput.body.ankleDorsiflexionKneeExtended,
    normalizedInput.body.ankleDorsiflexionKneeFlexed
  );

  let reason = "評価結果に基づいた靴要件：";

  // Base requirements
  let heelCounterMin = 1;
  let landingStabilityMin = 1;
  let fixationMin = 1;
  let torsionMin = 0;
  let shankMin = 0;
  let flexPointMin = 1;
  let toeSpringMin = 0;
  let rockerMin = 1;
  let weightMin = 0;

  // Adjust based on foot type
  if (footType === "横広タイプ") {
    torsionMin = 1;
    shankMin = 1;
    reason += " 横広タイプ→トーション・シャンク要件UP。";
  } else if (footType === "甲高タイプ") {
    fixationMin = 2;
    heelCounterMin = 2;
    reason += " 甲高タイプ→固定性・ヒールカウンター要件UP。";
  }

  // Adjust based on flexibility
  if (flexibility === "剛性足") {
    rockerMin = 2;
    toeSpringMin = 1;
    reason += " 剛性足→ロッカー・トゥスプリング要件UP。";
  }

  // Adjust based on ankle dorsiflexion
  if (ankleDorsiflexion < 10) {
    // Limited dorsiflexion
    rockerMin = 2;
    reason += " 背屈制限→ロッカー要件UP。";
  }

  // Insole length requirement (8-12mm discard)
  const rightDiscard = result.shoe.extraLength || 10;
  const insoleLength = {
    min:
      Math.max(
        normalizedInput.foot.right.bilateralWeightBearing.footLength,
        normalizedInput.foot.left.bilateralWeightBearing.footLength
      ) + 8,
    max:
      Math.max(
        normalizedInput.foot.right.bilateralWeightBearing.footLength,
        normalizedInput.foot.left.bilateralWeightBearing.footLength
      ) + 12,
  };

  // Drop requirement
  const dropMin = ankleDorsiflexion < 10 ? 10 : 8;
  const dropMax = 14;

  return {
    heelCounterMin,
    landingStabilityMin,
    fixationMin,
    torsionMin,
    shankMin,
    flexPointMin,
    toeSpringMin,
    rockerMin,
    weightMin,
    insoleLength,
    drop: { min: dropMin, max: dropMax },
    reason,
  };
}

// Match a single shoe with requirements
export function matchShoeWithRequirements(
  shoe: ShoeSpec,
  requirements: ShoeRequirement
): ShoeMatch {
  const missingRequirements: string[] = [];
  let matchScore = 100;

  if (shoe.heelCounterScore < requirements.heelCounterMin) {
    missingRequirements.push(requirementLabelMap.heelCounter);
    matchScore -= 10;
  }
  if (shoe.landingStabilityScore < requirements.landingStabilityMin) {
    missingRequirements.push(requirementLabelMap.landingStability);
    matchScore -= 10;
  }
  if (shoe.fixationScore < requirements.fixationMin) {
    missingRequirements.push(requirementLabelMap.fixation);
    matchScore -= 10;
  }
  if (shoe.torsionScore < requirements.torsionMin) {
    missingRequirements.push(requirementLabelMap.torsion);
    matchScore -= 8;
  }
  if (shoe.shankScore < requirements.shankMin) {
    missingRequirements.push(requirementLabelMap.shank);
    matchScore -= 8;
  }
  if (shoe.flexPointScore < requirements.flexPointMin) {
    missingRequirements.push(requirementLabelMap.flexPoint);
    matchScore -= 5;
  }
  if (shoe.toeSpringScore < requirements.toeSpringMin) {
    missingRequirements.push(requirementLabelMap.toeSpring);
    matchScore -= 5;
  }
  if (shoe.rockerScore < requirements.rockerMin) {
    missingRequirements.push(requirementLabelMap.rocker);
    matchScore -= 8;
  }

  if (shoe.insoleLength < requirements.insoleLength.min) {
    missingRequirements.push(requirementLabelMap.insoleLengthSmall);
    matchScore -= 15;
  } else if (shoe.insoleLength > requirements.insoleLength.max) {
    missingRequirements.push(requirementLabelMap.insoleLengthLarge);
    matchScore -= 15;
  }

  if (shoe.drop < requirements.drop.min) {
    missingRequirements.push(requirementLabelMap.dropSmall);
    matchScore -= 10;
  } else if (shoe.drop > requirements.drop.max) {
    missingRequirements.push(requirementLabelMap.dropLarge);
    matchScore -= 10;
  }

  const isFullMatch = missingRequirements.length === 0;
  const sizingRequirementLabels: string[] = [
    requirementLabelMap.insoleLengthSmall,
    requirementLabelMap.insoleLengthLarge,
    requirementLabelMap.dropSmall,
    requirementLabelMap.dropLarge,
  ];
  const structuralMissing = missingRequirements.filter((item) => !sizingRequirementLabels.includes(item));
  const sizingMissing = missingRequirements.filter((item) => sizingRequirementLabels.includes(item));

  let reason = "構造条件とサイズ条件を満たしています。";
  if (!isFullMatch) {
    if (structuralMissing.length === 0 && sizingMissing.length > 0) {
      reason = `構造は合っていますが、${sizingMissing.join("、")}の再確認が必要です。`;
    } else if (structuralMissing.length > 0 && sizingMissing.length === 0) {
      reason = `サイズは概ね合っていますが、${structuralMissing.join("、")}が要件に届いていません。`;
    } else {
      reason = `構造面では${structuralMissing.join("、")}、サイズ面では${sizingMissing.join("、")}の調整が必要です。`;
    }
  }

  return {
    shoeId: shoe.id,
    shoeName: shoe.name,
    brand: shoe.brand,
    model: shoe.model,
    matchScore: Math.max(0, matchScore),
    isFullMatch,
    missingRequirements,
    reason,
  };
}

// Match multiple shoes with requirements
export function matchMultipleShoes(
  shoes: ShoeSpec[],
  requirements: ShoeRequirement
): ShoeMatch[] {
  const matches = shoes.map((shoe) => matchShoeWithRequirements(shoe, requirements));

  // Sort: full matches first, then by score
  return matches.sort((a, b) => {
    if (a.isFullMatch !== b.isFullMatch) {
      return a.isFullMatch ? -1 : 1;
    }
    return b.matchScore - a.matchScore;
  });
}
