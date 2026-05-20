/*
Design reminder for this file:
- Provides detailed gait assessment framework based on 3-axis model.
- Used by STEP 3 to guide clinical interpretation of gait patterns.
*/

export type GaitPhaseFramework = {
  phase: string;
  axis: "Rearfoot" | "Forefoot" | "Proximal";
  observation: string[];
  interpretation: Record<string, string>;
  clinical_question: string;
};

export const gaitFramework: Record<string, GaitPhaseFramework> = {
  "IC-LR": {
    phase: "IC-LR（初期接地～立脚初期）",
    axis: "Rearfoot",
    observation: [
      "回内の「量」と「タイミング」",
      "踵接地の明確さ",
      "初期接地時の安定性",
    ],
    interpretation: {
      "正常": "適切なタイミングで適度な回内が起こり、衝撃を吸収。安定した着地。",
      "早期回内": "IC直後に早期に強い回内が起こる。衝撃吸収優位だが、安定性が低下。",
      "強い回内": "回内の量が大きく、後足部の制御が不全。足が内側に倒れやすい。",
      "外側接地": "外側接地（supination）。後足部の不安定性が高い。",
    },
    clinical_question: "回内の制御ができているか？",
  },
  MSt: {
    phase: "MSt（立脚中期）",
    axis: "Proximal",
    observation: [
      "ラテラルスラスト（側方への揺れ）",
      "トレンデレンブルグ徴候（骨盤下垂）",
      "デュシャンヌ徴候（骨盤回旋）",
      "骨盤の安定性",
    ],
    interpretation: {
      "正常": "骨盤が安定し、体幹が一直線。足部の支持性が十分。",
      "内側倒れ込み": "足部の支持性が低下し、骨盤が内側に倒れ込む。足の問題が起点。",
      "骨盤下垂": "トレンデレンブルグ徴候。股関節外転筋の弱化が起点。",
      "骨盤回旋増加": "骨盤が過度に回旋。体幹の安定性が低下。",
    },
    clinical_question: "足か股関節か、どちらが起点か？",
  },
  TSt: {
    phase: "TSt（立脚終期）",
    axis: "Forefoot",
    observation: [
      "2・3趾アーチの形成",
      "横アーチの形成",
      "踵骨の向き",
      "骨盤の回旋",
      "接地時間の長さ",
    ],
    interpretation: {
      "正常": "前足部が剛性を獲得し、推進力が生まれる。スムーズな蹴り出し。",
      "アーチ形成不良": "前足部の剛性が不足。推進力が低下。",
      "早期離地": "前足部の剛性が低下し、早期に離地で代償。接地時間が短い。",
      "接地時間延長": "前足部の剛性が不足し、接地時間が延長。推進力が弱い。",
      "外側逃げ": "前足部が外側に逃げる。内側の剛性が不足。",
    },
    clinical_question: "推進できる足か？",
  },
  PSw: {
    phase: "PSw（前遊脚期）",
    axis: "Forefoot",
    observation: [
      "Toe off（つま先離地）の質",
      "足の抜け方",
      "推進力の有無",
    ],
    interpretation: {
      "正常": "Toe offが明確。足が地面から抜ける。推進力がある。",
      "toe off不明確": "Toe offが不明確。足が地面から抜けにくい。TStの問題の表れ。",
      "足が引きずる": "足を引きずるように抜ける。推進力が著しく低下。",
    },
    clinical_question: "TStの結果を確認する。",
  },
};

export const gaitInterpretationGuide = {
  title: "歩行評価の3軸フレーム",
  description: "すべての歩行パターンをこの3軸に紐づけて解釈する",
  axes: [
    {
      name: "回内制御（Rearfoot）",
      focus: "IC-LR",
      description: "踵接地から立脚初期の後足部の動き。衝撃吸収と安定性のバランス。",
    },
    {
      name: "前足部剛性（Forefoot）",
      focus: "TSt-PSw",
      description: "立脚終期の前足部の剛性。推進力を生み出す。",
    },
    {
      name: "近位代償（Knee/Pelvis/Trunk）",
      focus: "MSt",
      description: "足部の問題を股関節・骨盤・体幹で代償しているか。",
    },
  ],
};
