/*
Design reminder for this file:
- Design philosophy: Japanese Clinical Editorial.
- Logic should support a precise, calm, clinician-first interface.
- Every rule should reinforce 評価→解釈→説明→行動.
*/

export type Category = "婦人" | "紳士" | "子ども";
export type WidthLabel = "A" | "B" | "C" | "D" | "E" | "EE" | "EEE" | "EEEE" | "F" | "G";
export type ShoeScoreValue = 0 | 1 | 2;

export type JisWidthEntry = {
  girth: number;
  width: number;
};

export type JisRow = {
  footLength: number;
  widths: Partial<Record<WidthLabel, JisWidthEntry>>;
};

export type FootInput = {
  footLength: number;
  girth: number;
  width: number;
};

export type ShoeAssessmentInput = {
  heelCounter: ShoeScoreValue;
  landingStability: ShoeScoreValue;
  fixation: ShoeScoreValue;
  torsion: ShoeScoreValue;
  drop: ShoeScoreValue;
  shank: ShoeScoreValue;
  flexPoint: ShoeScoreValue;
  toeSpring: ShoeScoreValue;
  rocker: ShoeScoreValue;
  weight: ShoeScoreValue;
  insoleLength: number;
  shoeForefootInnerWidth?: number;
  patientForefootWidth?: number;
};

export type BodyAssessmentInput = {
  ankleDorsiflexionKneeExtended: number;
  ankleDorsiflexionKneeFlexed: number;
  halluxExtension: number;
  ankleInstability: "正常" | "軽度" | "中等度" | "重度";
  rearfootAlignment: "内反" | "垂直" | "外反";
};

export type GaitPhaseDetail = {
  phase: "IC-LR" | "MSt" | "TSt" | "PSw";
  finding: string;
};

export type GaitAssessmentInput = {
  icLr: string; // 正常 / 早期回内 / 強い回内 / 外側接地
  mst: string; // 正常 / 内側倒れ込み / 骨盤下垂 / 骨盤回旋増加
  tst: string; // 正常 / アーチ形成不良 / 早期離地 / 接地時間延長 / 外側逃げ
  pswInterpretation?: string; // PSw の解釈（自動生成）
};

// 両足・荷重分離型の足部評価入力
export type FootAssessmentBilateral = {
  right: {
    nonWeightBearing: FootInput;
    bilateralWeightBearing: FootInput;
  };
  left: {
    nonWeightBearing: FootInput;
    bilateralWeightBearing: FootInput;
  };
};

export type FullAssessmentInput = {
  category: Category;
  patientName: string;
  foot: FootAssessmentBilateral;
  shoe: ShoeAssessmentInput;
  body: BodyAssessmentInput;
  gait: GaitAssessmentInput;
};

const createEmptyFootInput = (): FootInput => ({
  footLength: 0,
  girth: 0,
  width: 0,
});

type LooseFootSide = Partial<{
  nonWeightBearing: Partial<FootInput>;
  bilateralWeightBearing: Partial<FootInput>;
  weightBearing: Partial<FootInput>;
  loaded: Partial<FootInput>;
  standing: Partial<FootInput>;
  nonLoaded: Partial<FootInput>;
  unloaded: Partial<FootInput>;
  noLoad: Partial<FootInput>;
}> &
  Partial<FootInput>;

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function normalizeFootInput(source?: Partial<FootInput>): FootInput {
  return {
    footLength: toSafeNumber(source?.footLength),
    girth: toSafeNumber(source?.girth),
    width: toSafeNumber(source?.width),
  };
}

function normalizeFootSide(side?: LooseFootSide | null): FootAssessmentBilateral["right"] {
  const nonWeightBearingSource =
    side?.nonWeightBearing ?? side?.nonLoaded ?? side?.unloaded ?? side?.noLoad ?? createEmptyFootInput();
  const bilateralWeightBearingSource =
    side?.bilateralWeightBearing ?? side?.weightBearing ?? side?.loaded ?? side?.standing ?? side ?? createEmptyFootInput();

  return {
    nonWeightBearing: normalizeFootInput(nonWeightBearingSource),
    bilateralWeightBearing: normalizeFootInput(bilateralWeightBearingSource),
  };
}

export function normalizeAssessmentInput(input: FullAssessmentInput): FullAssessmentInput {
  const safeInput = (input ?? {}) as Partial<FullAssessmentInput> & {
    foot?: Partial<Record<"right" | "left", LooseFootSide>>;
  };

  return {
    category: safeInput.category ?? "婦人",
    patientName: safeInput.patientName ?? "",
    foot: {
      right: normalizeFootSide(safeInput.foot?.right),
      left: normalizeFootSide(safeInput.foot?.left),
    },
    shoe: {
      heelCounter: (toSafeNumber(safeInput.shoe?.heelCounter) as ShoeScoreValue) ?? 0,
      landingStability: (toSafeNumber(safeInput.shoe?.landingStability) as ShoeScoreValue) ?? 0,
      fixation: (toSafeNumber(safeInput.shoe?.fixation) as ShoeScoreValue) ?? 0,
      torsion: (toSafeNumber(safeInput.shoe?.torsion) as ShoeScoreValue) ?? 0,
      drop: (toSafeNumber(safeInput.shoe?.drop) as ShoeScoreValue) ?? 0,
      shank: (toSafeNumber(safeInput.shoe?.shank) as ShoeScoreValue) ?? 0,
      flexPoint: (toSafeNumber(safeInput.shoe?.flexPoint) as ShoeScoreValue) ?? 0,
      toeSpring: (toSafeNumber(safeInput.shoe?.toeSpring) as ShoeScoreValue) ?? 0,
      rocker: (toSafeNumber(safeInput.shoe?.rocker) as ShoeScoreValue) ?? 0,
      weight: (toSafeNumber(safeInput.shoe?.weight) as ShoeScoreValue) ?? 0,
      insoleLength: toSafeNumber(safeInput.shoe?.insoleLength),
      shoeForefootInnerWidth: safeInput.shoe?.shoeForefootInnerWidth,
      patientForefootWidth: safeInput.shoe?.patientForefootWidth,
    },
    body: {
      ankleDorsiflexionKneeExtended: toSafeNumber(safeInput.body?.ankleDorsiflexionKneeExtended),
      ankleDorsiflexionKneeFlexed: toSafeNumber(safeInput.body?.ankleDorsiflexionKneeFlexed),
      halluxExtension: toSafeNumber(safeInput.body?.halluxExtension),
      ankleInstability: safeInput.body?.ankleInstability ?? "正常",
      rearfootAlignment: safeInput.body?.rearfootAlignment ?? "垂直",
    },
    gait: {
      icLr: safeInput.gait?.icLr ?? "正常",
      mst: safeInput.gait?.mst ?? "正常",
      tst: safeInput.gait?.tst ?? "正常",
      pswInterpretation: safeInput.gait?.pswInterpretation ?? "正常",
    },
  };
}

// 単一足の評価結果
export type SingleFootAssessmentResult = {
  roundedFootLength: number;
  girthLabel: WidthLabel | "規格外(細)" | "規格外(広)";
  widthLabel: WidthLabel | "規格外(細)" | "規格外(広)";
  girthScore: number;
  widthScore: number;
  footType: "横広タイプ" | "甲高タイプ" | "標準タイプ";
  flexibilityType: "柔軟性足" | "剛性足" | "中間型";
  flexibilitySpread: number; // 非荷重→二脚での変化量
};

// 両足の評価結果
export type FootAssessmentResult = {
  right: SingleFootAssessmentResult;
  left: SingleFootAssessmentResult;
  leftRightDifference: {
    footLengthDiff: number; // 左足長 - 右足長
    flexibilityDiff: number; // 左柔軟性 - 右柔軟性
  };
};

export type ShoeAssessmentResult = {
  totalScore: number;
  structureRank: "S" | "A" | "B" | "C";
  criticalIssue: boolean;
  extraLength: number;
  extraLengthComment: "小" | "適正" | "やや大" | "大";
  insoleOverlapResult?: {
    canFit: boolean;
    comment: string;
  };
};

export type Recommendation = {
  title: string;
  reason: string;
  examples?: string[];
};

export type FullAssessmentResult = {
  foot: FootAssessmentResult;
  shoe: ShoeAssessmentResult;
  summary: string;
  cause: string;
  action: string;
  explanation: string;
  recommendations: Recommendation[];
};

export const widthOrder: WidthLabel[] = ["A", "B", "C", "D", "E", "EE", "EEE", "EEEE", "F", "G"];
const childWidthOrder: WidthLabel[] = ["B", "C", "D", "E", "EE", "EEE", "EEEE", "F", "G"];

const womenRows: JisRow[] = [
  { footLength: 210, widths: { A: { girth: 198, width: 78 }, B: { girth: 204, width: 80 }, C: { girth: 210, width: 82 }, D: { girth: 216, width: 84 }, E: { girth: 222, width: 86 }, EE: { girth: 228, width: 88 }, EEE: { girth: 234, width: 90 }, EEEE: { girth: 240, width: 92 } } },
  { footLength: 215, widths: { A: { girth: 201, width: 80 }, B: { girth: 207, width: 82 }, C: { girth: 213, width: 84 }, D: { girth: 219, width: 86 }, E: { girth: 225, width: 88 }, EE: { girth: 231, width: 90 }, EEE: { girth: 237, width: 92 }, EEEE: { girth: 243, width: 94 } } },
  { footLength: 220, widths: { A: { girth: 204, width: 81 }, B: { girth: 210, width: 83 }, C: { girth: 216, width: 85 }, D: { girth: 222, width: 87 }, E: { girth: 228, width: 89 }, EE: { girth: 234, width: 91 }, EEE: { girth: 240, width: 93 }, EEEE: { girth: 246, width: 95 } } },
  { footLength: 225, widths: { A: { girth: 207, width: 83 }, B: { girth: 213, width: 85 }, C: { girth: 219, width: 87 }, D: { girth: 225, width: 89 }, E: { girth: 231, width: 91 }, EE: { girth: 237, width: 93 }, EEE: { girth: 243, width: 95 }, EEEE: { girth: 249, width: 97 } } },
  { footLength: 230, widths: { A: { girth: 210, width: 84 }, B: { girth: 216, width: 86 }, C: { girth: 222, width: 88 }, D: { girth: 228, width: 90 }, E: { girth: 234, width: 92 }, EE: { girth: 240, width: 94 }, EEE: { girth: 246, width: 96 }, EEEE: { girth: 252, width: 98 } } },
  { footLength: 235, widths: { A: { girth: 213, width: 86 }, B: { girth: 219, width: 88 }, C: { girth: 225, width: 90 }, D: { girth: 231, width: 92 }, E: { girth: 237, width: 94 }, EE: { girth: 243, width: 96 }, EEE: { girth: 249, width: 98 }, EEEE: { girth: 255, width: 100 } } },
  { footLength: 240, widths: { A: { girth: 216, width: 87 }, B: { girth: 222, width: 89 }, C: { girth: 228, width: 91 }, D: { girth: 234, width: 93 }, E: { girth: 240, width: 95 }, EE: { girth: 246, width: 97 }, EEE: { girth: 252, width: 99 }, EEEE: { girth: 258, width: 101 } } },
  { footLength: 245, widths: { A: { girth: 219, width: 89 }, B: { girth: 225, width: 91 }, C: { girth: 231, width: 93 }, D: { girth: 237, width: 95 }, E: { girth: 243, width: 97 }, EE: { girth: 249, width: 99 }, EEE: { girth: 255, width: 101 }, EEEE: { girth: 261, width: 103 } } },
  { footLength: 250, widths: { A: { girth: 222, width: 90 }, B: { girth: 228, width: 92 }, C: { girth: 234, width: 94 }, D: { girth: 240, width: 96 }, E: { girth: 246, width: 98 }, EE: { girth: 252, width: 100 }, EEE: { girth: 258, width: 102 }, EEEE: { girth: 264, width: 104 } } },
];

const menRows: JisRow[] = [
  { footLength: 235, widths: { A: { girth: 219, width: 90 }, B: { girth: 225, width: 92 }, C: { girth: 231, width: 94 }, D: { girth: 237, width: 96 }, E: { girth: 243, width: 98 }, EE: { girth: 249, width: 100 }, EEE: { girth: 255, width: 102 }, EEEE: { girth: 261, width: 104 } } },
  { footLength: 240, widths: { A: { girth: 222, width: 91 }, B: { girth: 228, width: 93 }, C: { girth: 234, width: 95 }, D: { girth: 240, width: 97 }, E: { girth: 246, width: 99 }, EE: { girth: 252, width: 101 }, EEE: { girth: 258, width: 103 }, EEEE: { girth: 264, width: 105 } } },
  { footLength: 245, widths: { A: { girth: 225, width: 93 }, B: { girth: 231, width: 95 }, C: { girth: 237, width: 97 }, D: { girth: 243, width: 99 }, E: { girth: 249, width: 101 }, EE: { girth: 255, width: 103 }, EEE: { girth: 261, width: 105 }, EEEE: { girth: 267, width: 107 } } },
  { footLength: 250, widths: { A: { girth: 228, width: 94 }, B: { girth: 234, width: 96 }, C: { girth: 240, width: 98 }, D: { girth: 246, width: 100 }, E: { girth: 252, width: 102 }, EE: { girth: 258, width: 104 }, EEE: { girth: 264, width: 106 }, EEEE: { girth: 270, width: 108 } } },
  { footLength: 255, widths: { A: { girth: 231, width: 96 }, B: { girth: 237, width: 98 }, C: { girth: 243, width: 100 }, D: { girth: 249, width: 102 }, E: { girth: 255, width: 104 }, EE: { girth: 261, width: 106 }, EEE: { girth: 267, width: 108 }, EEEE: { girth: 273, width: 110 } } },
  { footLength: 260, widths: { A: { girth: 234, width: 97 }, B: { girth: 240, width: 99 }, C: { girth: 246, width: 101 }, D: { girth: 252, width: 103 }, E: { girth: 258, width: 105 }, EE: { girth: 264, width: 107 }, EEE: { girth: 270, width: 109 }, EEEE: { girth: 276, width: 111 } } },
  { footLength: 265, widths: { A: { girth: 237, width: 99 }, B: { girth: 243, width: 101 }, C: { girth: 249, width: 103 }, D: { girth: 255, width: 105 }, E: { girth: 261, width: 107 }, EE: { girth: 267, width: 109 }, EEE: { girth: 273, width: 111 }, EEEE: { girth: 279, width: 113 } } },
  { footLength: 270, widths: { A: { girth: 240, width: 100 }, B: { girth: 246, width: 102 }, C: { girth: 252, width: 104 }, D: { girth: 258, width: 106 }, E: { girth: 264, width: 108 }, EE: { girth: 270, width: 110 }, EEE: { girth: 276, width: 112 }, EEEE: { girth: 282, width: 114 } } },
  { footLength: 275, widths: { A: { girth: 243, width: 102 }, B: { girth: 249, width: 104 }, C: { girth: 255, width: 106 }, D: { girth: 261, width: 108 }, E: { girth: 267, width: 110 }, EE: { girth: 273, width: 112 }, EEE: { girth: 279, width: 114 }, EEEE: { girth: 285, width: 116 } } },
  { footLength: 280, widths: { A: { girth: 246, width: 103 }, B: { girth: 252, width: 105 }, C: { girth: 258, width: 107 }, D: { girth: 264, width: 109 }, E: { girth: 270, width: 111 }, EE: { girth: 276, width: 113 }, EEE: { girth: 282, width: 115 }, EEEE: { girth: 288, width: 117 } } },
];

const childRows: JisRow[] = [
  { footLength: 105, widths: { B: { girth: 98, width: 40 }, C: { girth: 104, width: 42 }, D: { girth: 110, width: 44 }, E: { girth: 116, width: 46 }, EE: { girth: 122, width: 48 }, EEE: { girth: 128, width: 50 }, EEEE: { girth: 134, width: 53 }, F: { girth: 140, width: 55 }, G: { girth: 146, width: 57 } } },
  { footLength: 110, widths: { B: { girth: 102, width: 42 }, C: { girth: 108, width: 44 }, D: { girth: 114, width: 46 }, E: { girth: 120, width: 48 }, EE: { girth: 126, width: 50 }, EEE: { girth: 132, width: 52 }, EEEE: { girth: 138, width: 54 }, F: { girth: 144, width: 56 }, G: { girth: 150, width: 58 } } },
  { footLength: 115, widths: { B: { girth: 106, width: 43 }, C: { girth: 112, width: 45 }, D: { girth: 118, width: 48 }, E: { girth: 124, width: 50 }, EE: { girth: 130, width: 52 }, EEE: { girth: 136, width: 54 }, EEEE: { girth: 142, width: 56 }, F: { girth: 148, width: 58 }, G: { girth: 154, width: 60 } } },
  { footLength: 120, widths: { B: { girth: 110, width: 45 }, C: { girth: 116, width: 47 }, D: { girth: 122, width: 50 }, E: { girth: 128, width: 51 }, EE: { girth: 134, width: 53 }, EEE: { girth: 140, width: 56 }, EEEE: { girth: 146, width: 58 }, F: { girth: 152, width: 60 }, G: { girth: 158, width: 62 } } },
  { footLength: 125, widths: { B: { girth: 114, width: 47 }, C: { girth: 120, width: 49 }, D: { girth: 126, width: 51 }, E: { girth: 132, width: 53 }, EE: { girth: 138, width: 55 }, EEE: { girth: 144, width: 57 }, EEEE: { girth: 150, width: 59 }, F: { girth: 156, width: 61 }, G: { girth: 162, width: 63 } } },
  { footLength: 130, widths: { B: { girth: 118, width: 48 }, C: { girth: 124, width: 50 }, D: { girth: 130, width: 52 }, E: { girth: 136, width: 54 }, EE: { girth: 142, width: 56 }, EEE: { girth: 148, width: 58 }, EEEE: { girth: 154, width: 60 }, F: { girth: 160, width: 62 }, G: { girth: 166, width: 64 } } },
  { footLength: 135, widths: { B: { girth: 122, width: 50 }, C: { girth: 128, width: 52 }, D: { girth: 134, width: 54 }, E: { girth: 140, width: 56 }, EE: { girth: 146, width: 58 }, EEE: { girth: 152, width: 60 }, EEEE: { girth: 158, width: 62 }, F: { girth: 164, width: 64 }, G: { girth: 170, width: 67 } } },
  { footLength: 140, widths: { B: { girth: 126, width: 52 }, C: { girth: 132, width: 54 }, D: { girth: 138, width: 56 }, E: { girth: 144, width: 58 }, EE: { girth: 150, width: 60 }, EEE: { girth: 156, width: 62 }, EEEE: { girth: 162, width: 64 }, F: { girth: 168, width: 66 }, G: { girth: 174, width: 68 } } },
  { footLength: 145, widths: { B: { girth: 130, width: 53 }, C: { girth: 136, width: 55 }, D: { girth: 142, width: 57 }, E: { girth: 148, width: 59 }, EE: { girth: 154, width: 61 }, EEE: { girth: 160, width: 63 }, EEEE: { girth: 166, width: 65 }, F: { girth: 172, width: 67 }, G: { girth: 178, width: 69 } } },
  { footLength: 150, widths: { B: { girth: 134, width: 55 }, C: { girth: 140, width: 57 }, D: { girth: 146, width: 59 }, E: { girth: 152, width: 61 }, EE: { girth: 158, width: 63 }, EEE: { girth: 164, width: 65 }, EEEE: { girth: 170, width: 67 }, F: { girth: 176, width: 69 }, G: { girth: 182, width: 71 } } },
  { footLength: 155, widths: { B: { girth: 138, width: 57 }, C: { girth: 144, width: 59 }, D: { girth: 150, width: 61 }, E: { girth: 156, width: 63 }, EE: { girth: 162, width: 65 }, EEE: { girth: 168, width: 67 }, EEEE: { girth: 174, width: 69 }, F: { girth: 180, width: 71 }, G: { girth: 186, width: 73 } } },
  { footLength: 160, widths: { B: { girth: 142, width: 58 }, C: { girth: 148, width: 60 }, D: { girth: 154, width: 62 }, E: { girth: 160, width: 64 }, EE: { girth: 166, width: 66 }, EEE: { girth: 172, width: 68 }, EEEE: { girth: 178, width: 70 }, F: { girth: 184, width: 72 }, G: { girth: 190, width: 74 } } },
  { footLength: 165, widths: { B: { girth: 146, width: 60 }, C: { girth: 152, width: 62 }, D: { girth: 158, width: 64 }, E: { girth: 164, width: 66 }, EE: { girth: 170, width: 68 }, EEE: { girth: 176, width: 70 }, EEEE: { girth: 182, width: 72 }, F: { girth: 188, width: 74 }, G: { girth: 194, width: 76 } } },
  { footLength: 170, widths: { B: { girth: 150, width: 62 }, C: { girth: 156, width: 64 }, D: { girth: 162, width: 66 }, E: { girth: 168, width: 68 }, EE: { girth: 174, width: 70 }, EEE: { girth: 180, width: 72 }, EEEE: { girth: 186, width: 74 }, F: { girth: 192, width: 76 }, G: { girth: 198, width: 78 } } },
];

function getClosestRow(category: Category, footLength: number): JisRow {
  const rows = category === "婦人" ? womenRows : category === "紳士" ? menRows : childRows;
  let closest = rows[0];
  for (const row of rows) {
    if (Math.abs(row.footLength - footLength) < Math.abs(closest.footLength - footLength)) {
      closest = row;
    }
  }
  return closest;
}

function judgeMetric(row: JisRow, metric: "girth" | "width", value: number, category: Category): { label: WidthLabel | "規格外(細)" | "規格外(広)"; score: number } {
  const widthLabels = category === "子ども" ? childWidthOrder : widthOrder;
  const entries = widthLabels
    .map((label) => {
      const entry = row.widths[label];
      if (!entry) return null;
      return { label, threshold: entry[metric], index: widthLabels.indexOf(label) };
    })
    .filter((e) => e !== null) as Array<{ label: WidthLabel; threshold: number; index: number }>;

  for (const entry of entries) {
    if (value <= entry.threshold) {
      return { label: entry.label, score: entry.index };
    }
  }

  return { label: "規格外(広)" as const, score: entries.length + 1 };
}

function assessSingleFoot(category: Category, nonWeightBearing: FootInput, bilateralWeightBearing: FootInput): SingleFootAssessmentResult {
  const row = getClosestRow(category, bilateralWeightBearing.footLength);
  const roundedFootLength = row.footLength;
  const girthJudge = judgeMetric(row, "girth", bilateralWeightBearing.girth, category);
  const widthJudge = judgeMetric(row, "width", bilateralWeightBearing.width, category);

  const scoreGap = widthJudge.score - girthJudge.score;
  const flexibilitySpread = bilateralWeightBearing.girth - nonWeightBearing.girth;

  let footType: SingleFootAssessmentResult["footType"] = "標準タイプ";
  if (scoreGap >= 2) footType = "横広タイプ";
  if (scoreGap <= -2) footType = "甲高タイプ";

  let flexibilityType: SingleFootAssessmentResult["flexibilityType"] = "中間型";
  if (flexibilitySpread >= 8) flexibilityType = "柔軟性足";
  if (flexibilitySpread <= 3) flexibilityType = "剛性足";

  return {
    roundedFootLength,
    girthLabel: girthJudge.label,
    widthLabel: widthJudge.label,
    girthScore: girthJudge.score,
    widthScore: widthJudge.score,
    footType,
    flexibilityType,
    flexibilitySpread,
  };
}

export function assessFoot(category: Category, footBilateral: FootAssessmentBilateral): FootAssessmentResult {
  const normalizedFoot = {
    right: normalizeFootSide(footBilateral?.right),
    left: normalizeFootSide(footBilateral?.left),
  };

  const right = assessSingleFoot(category, normalizedFoot.right.nonWeightBearing, normalizedFoot.right.bilateralWeightBearing);
  const left = assessSingleFoot(category, normalizedFoot.left.nonWeightBearing, normalizedFoot.left.bilateralWeightBearing);

  const leftRightDifference = {
    footLengthDiff: left.roundedFootLength - right.roundedFootLength,
    flexibilityDiff: left.flexibilitySpread - right.flexibilitySpread,
  };

  return {
    right,
    left,
    leftRightDifference,
  };
}

export function assessShoe(footLength: number, shoe: ShoeAssessmentInput): ShoeAssessmentResult {
  const totalScore =
    shoe.heelCounter +
    shoe.landingStability +
    shoe.fixation +
    shoe.torsion +
    shoe.drop +
    shoe.shank +
    shoe.flexPoint +
    shoe.toeSpring +
    shoe.rocker +
    shoe.weight;

  const criticalIssue = shoe.heelCounter === 0 || shoe.landingStability === 0 || shoe.fixation === 0;
  const extraLength = shoe.insoleLength - footLength;

  let extraLengthComment: ShoeAssessmentResult["extraLengthComment"] = "適正";
  if (extraLength < 8) extraLengthComment = "小";
  else if (extraLength > 12) {
    if (extraLength > 16) extraLengthComment = "大";
    else extraLengthComment = "やや大";
  }
  // 捨て寸基準: 8-12mm が適正

  let structureRank: ShoeAssessmentResult["structureRank"] = "C";
  if (!criticalIssue && totalScore >= 17) structureRank = "S";
  else if (!criticalIssue && totalScore >= 14) structureRank = "A";
  else if (totalScore >= 10) structureRank = "B";

  // インソール・オーバーラップテスト
  let insoleOverlapResult: ShoeAssessmentResult["insoleOverlapResult"] | undefined;
  if (shoe.shoeForefootInnerWidth !== undefined && shoe.patientForefootWidth !== undefined) {
    const canFit = shoe.patientForefootWidth <= shoe.shoeForefootInnerWidth;
    const comment = canFit
      ? "✅ 前足部は概ね収まります"
      : "⚠️ 前足部が干渉しやすく、幅の再検討が必要です";
    insoleOverlapResult = { canFit, comment };
  }

  return {
    totalScore,
    structureRank,
    criticalIssue,
    extraLength,
    extraLengthComment,
    insoleOverlapResult,
  };
}

export function buildRecommendations(category: Category, result: FootAssessmentResult, shoe: ShoeAssessmentResult): Recommendation[] {
  const items: Recommendation[] = [];

  // 両足の評価から推奨を生成
  const rightGirth = result.right.girthLabel;
  const leftGirth = result.left.girthLabel;

  if (rightGirth === "A" || rightGirth === "B" || rightGirth === "規格外(細)" || leftGirth === "A" || leftGirth === "B" || leftGirth === "規格外(細)") {
    items.push({
      title: "細幅向けブランド候補",
      reason: "細幅傾向のため、ナローラストや中足部の絞りが明確なブランドを優先します。",
      examples:
        category === "子ども"
          ? ["踵保持が明確な面ファスナー靴", "中足部を締められる運動靴", "細め木型の学童モデル"]
          : ["ナローラスト展開のあるブランド", "中足部の絞りが明確な歩行靴", "紐で甲を締めやすい支持型モデル"],
    });
  }

  if (result.right.footType === "横広タイプ" || result.left.footType === "横広タイプ") {
    items.push({
      title: "中足部ホールド重視モデル",
      reason: "横に広がりやすいため、前足部の逃げを許しすぎず、中足部を締められる紐・ベルト構造が有効です。",
      examples: ["ハトメ数が多い紐靴", "ベルトで中足部を締められる設計", "前足部だけ広く中足部が細い木型"],
    });
  }

  if (result.right.footType === "甲高タイプ" || result.left.footType === "甲高タイプ") {
    items.push({
      title: "甲容量に余裕があるモデル",
      reason: "横幅より足囲が大きいため、甲の立ち上がりと容積に余裕のある靴が必要です。",
      examples: ["甲部に厚みを逃がせる設計", "履き口が深く固定しやすいモデル", "甲高向け容量調整ができる靴"],
    });
  }

  if (result.right.flexibilityType === "柔軟性足" || result.left.flexibilityType === "柔軟性足") {
    items.push({
      title: "剛性高めの支持型シューズ",
      reason: "荷重で崩れやすいため、ヒールカウンターとシャンクが明確な靴を優先します。",
      examples: ["踵部が潰れにくい構造", "中足部で曲がりすぎない設計", "歩行時に内側へ倒れ込みにくい支持型"],
    });
  }

  if (shoe.extraLengthComment === "大" || shoe.extraLengthComment === "やや大") {
    items.push({
      title: "サイズ見直し",
      reason: "捨て寸が大きく、靴の中で足が遊ぶ可能性があります。中敷き長ベースで再選定が必要です。",
      examples: ["中敷き実測で8〜12mmを再確認", "踵合わせで再試着", "靴紐を締めた状態で前足部の遊びを確認"],
    });
  }

  if (items.length === 0) {
    items.push({
      title: "現在の適合は概ね良好",
      reason: "構造とサイズの大きな破綻は少なく、履き方指導と経過確認で対応しやすい状態です。",
      examples: ["踵合わせの履き方を維持", "摩耗と潰れの再評価を継続", "歩行変化に合わせて再測定"],
    });
  }

  return items;
}

export function runAssessment(input: FullAssessmentInput): FullAssessmentResult {
  const normalizedInput = normalizeAssessmentInput(input);
  const foot = assessFoot(normalizedInput.category, normalizedInput.foot);
  const shoe = assessShoe(foot.right.roundedFootLength, normalizedInput.shoe);

  const rightFlexibility = foot.right.flexibilityType;
  const leftFlexibility = foot.left.flexibilityType;
  const dorsiflexionLimited = normalizedInput.body.ankleDorsiflexionKneeExtended < 10;
  const rearfootValgus = normalizedInput.body.rearfootAlignment === "外反";

  const causeParts = [
    rightFlexibility === "柔軟性足" || leftFlexibility === "柔軟性足"
      ? "足部が荷重で崩れやすい"
      : rightFlexibility === "剛性足" || leftFlexibility === "剛性足"
        ? "足部の衝撃吸収が乏しい"
        : "足部特性は中間型",
    shoe.extraLengthComment === "適正" ? "捨て寸は概ね適正" : `捨て寸は${shoe.extraLengthComment}`,
    shoe.criticalIssue ? "靴の最重要3項目に弱点がある" : `靴の構造ランクは${shoe.structureRank}`,
  ];

  if (dorsiflexionLimited) {
    causeParts.push("足関節背屈制限が歩行負荷を増やしている");
  }

  if (rearfootValgus) {
    causeParts.push("後足部外反が内側荷重を助長している");
  }

  const summary = `右足：${foot.right.footType}・${foot.right.flexibilityType}、左足：${foot.left.footType}・${foot.left.flexibilityType}で、靴の構造ランクは${shoe.structureRank}、捨て寸は${shoe.extraLengthComment}です。`;
  const cause = causeParts.join("。") + "。";
  const action =
    shoe.extraLengthComment === "大"
      ? "まずサイズ再設定を優先し、その上で中足部の固定と踵合わせの履き方指導を行います。"
      : rightFlexibility === "柔軟性足" || leftFlexibility === "柔軟性足"
        ? "ヒールカウンターとシャンクが明確な靴を選び、紐・ベルトで中足部を締める方針が優先です。"
        : "構造を維持しつつ、歩行で問題となる局面に合わせて履き方と負荷管理を調整します。";

  const explanation = `右足・左足の特性が異なる場合、より制限の強い側に合わせた靴選定が重要です。${rearfootValgus ? "後足部外反もあるため、踵の保持と内側への倒れ込み管理を同時に説明しやすい状態です。" : "患者には「足ではなく靴から整える」流れで説明しやすい状態です。"}`;

  return {
    foot,
    shoe,
    summary,
    cause,
    action,
    explanation,
    recommendations: buildRecommendations(normalizedInput.category, foot, shoe),
  };
}

export const demoInput: FullAssessmentInput = {
  category: "婦人",
  patientName: "症例A",
  foot: {
    right: {
      nonWeightBearing: {
        footLength: 243,
        girth: 226,
        width: 95,
      },
      bilateralWeightBearing: {
        footLength: 243,
        girth: 238,
        width: 101,
      },
    },
    left: {
      nonWeightBearing: {
        footLength: 242,
        girth: 224,
        width: 93,
      },
      bilateralWeightBearing: {
        footLength: 242,
        girth: 236,
        width: 99,
      },
    },
  },
  shoe: {
    heelCounter: 2,
    landingStability: 1,
    fixation: 2,
    torsion: 1,
    drop: 1,
    shank: 1,
    flexPoint: 2,
    toeSpring: 1,
    rocker: 1,
    weight: 1,
    insoleLength: 260,
  },
  body: {
    ankleDorsiflexionKneeExtended: 8,
    ankleDorsiflexionKneeFlexed: 14,
    halluxExtension: 50,
    ankleInstability: "軽度",
    rearfootAlignment: "外反",
  },
  gait: {
    icLr: "早期回内",
    mst: "内側倒れ込み",
    tst: "アーチ形成不良",
    pswInterpretation: "蹴り出しが弱い",
  },
};


// ============================================
// 靴マッチング機能
// ============================================

export type ShoeRequirement = {
  minHeelCounterScore: ShoeScoreValue;
  minLandingStabilityScore: ShoeScoreValue;
  minFixationScore: ShoeScoreValue;
  minTorsionScore: ShoeScoreValue;
  minShankScore: ShoeScoreValue;
  minFlexPointScore: ShoeScoreValue;
  minToeSpringScore: ShoeScoreValue;
  minRockerScore: ShoeScoreValue;
  minWeightScore: ShoeScoreValue;
  minInsoleLength: number;
  maxInsoleLength: number;
  preferredDrop: number;
  notes: string;
};

export type ShoeMatchResult = {
  shoeId: string;
  shoeName: string;
  matchScore: number; // 0-100
  isFullMatch: boolean; // すべての要件を満たす
  isPartialMatch: boolean; // 一部の要件を満たす
  missingRequirements: string[];
  reason: string;
};

/**
 * 診断結果から靴要件を自動生成
 */
export function generateShoeRequirements(result: ReturnType<typeof runAssessment>): ShoeRequirement {
  const foot = result.foot;
  const shoe = result.shoe;
  const summary = result.summary;

  // 基本要件：すべての患者に必要
  let minHeelCounterScore: ShoeScoreValue = 1;
  let minLandingStabilityScore: ShoeScoreValue = 1;
  let minFixationScore: ShoeScoreValue = 1;
  let minTorsionScore: ShoeScoreValue = 0;
  let minShankScore: ShoeScoreValue = 0;
  let minFlexPointScore: ShoeScoreValue = 1;
  let minToeSpringScore: ShoeScoreValue = 0;
  let minRockerScore: ShoeScoreValue = 1;
  let minWeightScore: ShoeScoreValue = 0;

  // 足部タイプに基づく要件調整
  const rightFootType = foot.right.footType;
  const leftFootType = foot.left.footType;

  // 横広タイプ（旧：煎餅タイプ）→ 足幅が広い → シャンク・トーション要件を上げる
  if (rightFootType.includes("横広") || leftFootType.includes("横広")) {
    minTorsionScore = 1;
    minShankScore = 1;
  }

  // 甲高タイプ（旧：饅頭タイプ）→ 足囲が大きい → 固定性要件を上げる
  if (rightFootType.includes("甲高") || leftFootType.includes("甲高")) {
    minFixationScore = 2;
  }

  // 柔軟性に基づく要件調整
  const rightFlexibility = foot.right.flexibilityType;
  const leftFlexibility = foot.left.flexibilityType;

  // 低柔軟性（硬い足）→ ロッカー・トゥスプリング要件を上げる
  if (rightFlexibility.includes("低") || leftFlexibility.includes("低")) {
    minToeSpringScore = 1;
    minRockerScore = 2;
  }

  // 中敷き長の要件
  const rightFootLength = foot.right.roundedFootLength;
  const leftFootLength = foot.left.roundedFootLength;
  const maxFootLength = Math.max(rightFootLength, leftFootLength);
  const minInsoleLength = maxFootLength + 8; // 最小捨て寸 8mm
  const maxInsoleLength = maxFootLength + 12; // 最大捨て寸 12mm

  // ドロップの要件
  let preferredDrop = 12; // デフォルト
  if (summary.includes("背屈不足") || summary.includes("背屈制限")) {
    preferredDrop = 14; // 背屈不足の場合、ドロップを大きめに
  }

  const notes = `右足: ${rightFootType} (${rightFootLength}mm), 左足: ${leftFootType} (${leftFootLength}mm)。左右差: ${Math.abs(rightFootLength - leftFootLength)}mm。`;

  return {
    minHeelCounterScore,
    minLandingStabilityScore,
    minFixationScore,
    minTorsionScore,
    minShankScore,
    minFlexPointScore,
    minToeSpringScore,
    minRockerScore,
    minWeightScore,
    minInsoleLength,
    maxInsoleLength,
    preferredDrop,
    notes,
  };
}

/**
 * 靴スペックと要件をマッチング
 */
export function matchShoeWithRequirements(
  shoe: any, // ShoeSpec from ShoeDatabase
  requirement: ShoeRequirement,
): ShoeMatchResult {
  const missingRequirements: string[] = [];
  let matchScore = 100;

  // スコアベースのマッチング
  if (shoe.heelCounterScore < requirement.minHeelCounterScore) {
    missingRequirements.push("ヒールカウンター");
    matchScore -= 10;
  }
  if (shoe.landingStabilityScore < requirement.minLandingStabilityScore) {
    missingRequirements.push("接地安定性");
    matchScore -= 10;
  }
  if (shoe.fixationScore < requirement.minFixationScore) {
    missingRequirements.push("固定性");
    matchScore -= 10;
  }
  if (shoe.torsionScore < requirement.minTorsionScore) {
    missingRequirements.push("トーション");
    matchScore -= 8;
  }
  if (shoe.shankScore < requirement.minShankScore) {
    missingRequirements.push("シャンク");
    matchScore -= 8;
  }
  if (shoe.flexPointScore < requirement.minFlexPointScore) {
    missingRequirements.push("屈曲位置");
    matchScore -= 8;
  }
  if (shoe.toeSpringScore < requirement.minToeSpringScore) {
    missingRequirements.push("トゥスプリング");
    matchScore -= 8;
  }
  if (shoe.rockerScore < requirement.minRockerScore) {
    missingRequirements.push("ロッカー");
    matchScore -= 10;
  }

  // 中敷き長のマッチング
  if (shoe.insoleLength < requirement.minInsoleLength || shoe.insoleLength > requirement.maxInsoleLength) {
    missingRequirements.push(`中敷き長（${requirement.minInsoleLength}-${requirement.maxInsoleLength}mm推奨）`);
    matchScore -= 15;
  }

  // ドロップのマッチング（±2mm許容）
  if (Math.abs(shoe.drop - requirement.preferredDrop) > 2) {
    matchScore -= 5;
  }

  matchScore = Math.max(0, matchScore);
  const isFullMatch = missingRequirements.length === 0;
  const isPartialMatch = missingRequirements.length > 0 && matchScore >= 70;

  let reason = "";
  if (isFullMatch) {
    reason = "すべての要件を満たしています。推奨度が高い靴です。";
  } else if (isPartialMatch) {
    reason = `一部の要件を満たしていませんが、${missingRequirements.join("、")}以外は適合しています。`;
  } else {
    reason = `${missingRequirements.join("、")}など、複数の要件を満たしていません。`;
  }

  return {
    shoeId: shoe.id,
    shoeName: `${shoe.brand} ${shoe.name}`,
    matchScore,
    isFullMatch,
    isPartialMatch,
    missingRequirements,
    reason,
  };
}

/**
 * 複数の靴をマッチング
 */
export function matchMultipleShoes(
  shoes: any[], // ShoeSpec[]
  requirement: ShoeRequirement,
): ShoeMatchResult[] {
  return shoes
    .map((shoe) => matchShoeWithRequirements(shoe, requirement))
    .sort((a, b) => {
      // 完全マッチを優先、次に部分マッチ、最後にマッチスコアで降順
      if (a.isFullMatch && !b.isFullMatch) return -1;
      if (!a.isFullMatch && b.isFullMatch) return 1;
      if (a.isPartialMatch && !b.isPartialMatch) return -1;
      if (!a.isPartialMatch && b.isPartialMatch) return 1;
      return b.matchScore - a.matchScore;
    });
}
