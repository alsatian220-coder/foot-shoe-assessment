/*
Design reminder for this file:
- Provides detailed criteria and explanations for shoe assessment.
- Used by STEP 1 to clarify judgment standards for users.
- Every criterion should support 評価→解釈→説明→行動.
*/

export type ShoeScoreCriteria = {
  label: string;
  description: string;
  levelLabels: Record<0 | 1 | 2, string>;
  criteria: Record<0 | 1 | 2, string>;
};

export const shoeScoreCriteria: Record<string, ShoeScoreCriteria> = {
  heelCounter: {
    label: "ヒールカウンター",
    description: "踵部の保持性を見ます。後足部を安定させる最重要項目です。",
    levelLabels: {
      0: "弱 / なし",
      1: "普通",
      2: "強",
    },
    criteria: {
      0: "踵部の保持性が低く、潰れやすい状態です。保持機能がほぼない靴もここに含みます。",
      1: "一般的な保持性です。大きな問題はありませんが、強い支持は期待しにくい状態です。",
      2: "踵部の保持性が高く、後足部を安定させやすい状態です。",
    },
  },
  landingStability: {
    label: "接地安定性",
    description: "初期接地が明確でぶれないかを見ます。",
    levelLabels: {
      0: "低",
      1: "中",
      2: "高",
    },
    criteria: {
      0: "接地が不安定で、ぐらつきやすい状態です。",
      1: "標準的な安定性です。大きな問題はありません。",
      2: "初期接地が安定しやすく、ぐらつきが少ない状態です。",
    },
  },
  fixation: {
    label: "固定性",
    description: "足部を靴内でどれだけ固定できるかを見ます。",
    levelLabels: {
      0: "低",
      1: "中",
      2: "高",
    },
    criteria: {
      0: "足部が靴内で動きやすく、固定が不十分な状態です。",
      1: "標準的な固定性です。",
      2: "足部の固定が十分で、ズレが少ない状態です。",
    },
  },
  torsion: {
    label: "トーション",
    description: "靴のねじれ剛性を見ます。中足部の安定性に関わります。",
    levelLabels: {
      0: "柔",
      1: "中",
      2: "硬",
    },
    criteria: {
      0: "ねじれやすく、中足部が不安定になりやすい状態です。",
      1: "一般的なねじれ剛性です。",
      2: "ねじれ制御が適切で、中足部安定性が高い状態です。",
    },
  },
  drop: {
    label: "ドロップ",
    description: "踵と前足部の高低差を見ます。背屈要求量の調整に関わります。",
    levelLabels: {
      0: "低",
      1: "中",
      2: "高",
    },
    criteria: {
      0: "前後差が少なく、足関節への負荷が増す可能性がある状態です。",
      1: "一般的なドロップ高です。",
      2: "踵が高く、足関節背屈要求が少ない状態です。",
    },
  },
  shank: {
    label: "シャンク",
    description: "中足部の支持性を見ます。立脚中期の安定性に関わります。",
    levelLabels: {
      0: "弱",
      1: "中",
      2: "強",
    },
    criteria: {
      0: "中足部支持が弱く、扁平化しやすい状態です。",
      1: "標準的な中足部支持です。",
      2: "中足部の支持が十分で、立脚中期安定性が高い状態です。",
    },
  },
  flexPoint: {
    label: "屈曲",
    description: "靴がどこで曲がるかを見ます。MP関節付近での屈曲が基本です。",
    levelLabels: {
      0: "midfoot",
      1: "やや前方 / やや後方",
      2: "MTP",
    },
    criteria: {
      0: "屈曲点が中足部で、安定性低下の可能性がある状態です。",
      1: "屈曲位置は大きく外れていないものの、最適とは言い切れない状態です。",
      2: "屈曲点がMTP関節付近で適切な状態です。",
    },
  },
  toeSpring: {
    label: "トゥスプリング",
    description: "つま先の反り上がりを見ます。前方への抜けと推進補助に関わります。",
    levelLabels: {
      0: "弱",
      1: "中",
      2: "強",
    },
    criteria: {
      0: "転がり感が少なく、推進補助が弱い状態です。",
      1: "標準的なトゥスプリングです。",
      2: "前方への転がりを助けやすく、推進補助が得やすい状態です。",
    },
  },
  rocker: {
    label: "ロッカー",
    description: "靴底のローリング形状を見ます。前進のしやすさに関わります。",
    levelLabels: {
      0: "弱",
      1: "中",
      2: "強",
    },
    criteria: {
      0: "転がり補助が弱く、前進を助けにくい状態です。",
      1: "標準的なロッカー形状です。",
      2: "転がり感が得やすく、前進を補助しやすい状態です。",
    },
  },
  weight: {
    label: "重量",
    description: "靴の重さを見ます。支持性と操作性のバランスで解釈します。",
    levelLabels: {
      0: "重",
      1: "中",
      2: "軽",
    },
    criteria: {
      0: "重く、長時間歩行で疲労につながりやすい状態です。",
      1: "標準的な重さです。",
      2: "比較的軽く、扱いやすい状態です。",
    },
  },
};

export const insoleOverlapTestDescription = {
  shoeForefootInnerWidth: {
    label: "靴の前足部内幅（mm）",
    description: "靴の中で、前足部が実際に使える内側の幅です。インソールオーバーラップテストは厚さではなく、この前足部内幅に対して足やインソールが収まるかを見る確認です。",
    hint: "中敷きの前足部でもっとも広い部分、または靴内の実効幅を測定してください。",
    example: "例：前足部内幅 92mm。ここに足幅やインソール前足部幅が収まるかを確認します。",
  },
  patientForefootWidth: {
    label: "患者の前足部幅 / インソール前足部幅（mm）",
    description: "患者の足幅、もしくは作製するインソール前足部の最大幅です。臨床では『足幅が靴に対して重なるか・はみ出すか』の確認として使います。",
    hint: "裸足の足幅、またはインソール前足部の最大幅を測定してください。",
    example: "例：患者足幅 96mm、またはインソール前足部幅 95mm。",
  },
  judgment: {
    title: "判定基準",
    body: "患者の前足部幅 / インソール前足部幅 が、靴の前足部内幅 以下なら『収まる可能性が高い』、超えるなら『前足部が当たりやすく再検討が必要』と解釈します。",
  },
};

export const overlapResultLabels = {
  fit: "✅ 前足部は概ね収まります",
  notFit: "⚠️ 前足部が干渉しやすく、幅の再検討が必要です",
};
