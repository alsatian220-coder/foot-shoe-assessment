/*
Design reminder for this file:
- Generates PDF reports for patients based on assessment results.
- Provides structured output for clinical documentation and patient education.
*/

import { FullAssessmentInput, FullAssessmentResult, normalizeAssessmentInput } from "./assessment";
import { generateShoeRequirements, matchMultipleShoes } from "./shoe-matching";
import { DEFAULT_SHOES } from "./shoe-database";

export function generatePDFContent(
  patientName: string,
  input: FullAssessmentInput,
  result: FullAssessmentResult
): string {
  const normalizedInput = normalizeAssessmentInput(input);
  const date = new Date().toLocaleDateString("ja-JP");

  // Generate shoe recommendations
  const requirement = generateShoeRequirements(normalizedInput, result);
  const matches = matchMultipleShoes(DEFAULT_SHOES, requirement);
  const fullMatches = matches.filter((m) => m.isFullMatch);
  const partialMatches = matches.filter((m) => !m.isFullMatch);

  let shoeRecommendations = "";
  if (fullMatches.length === 0 && partialMatches.length === 0) {
    shoeRecommendations = "マッチする靴がありません。靴データベースに靴を追加してください。";
  } else {
    if (fullMatches.length > 0) {
      shoeRecommendations += `### ✓ 完全マッチ（${fullMatches.length}件）\n\n`;
      fullMatches.forEach((match) => {
        shoeRecommendations += `- **${match.shoeName}** (${match.brand})\n`;
        shoeRecommendations += `  - マッチスコア: ${match.matchScore}%\n`;
        shoeRecommendations += `  - ${match.reason}\n\n`;
      });
    }

    if (partialMatches.length > 0) {
      shoeRecommendations += `### ◐ 部分マッチ（${partialMatches.length}件）\n\n`;
      partialMatches.forEach((match) => {
        shoeRecommendations += `- **${match.shoeName}** (${match.brand})\n`;
        shoeRecommendations += `  - マッチスコア: ${match.matchScore}%\n`;
        shoeRecommendations += `  - ${match.reason}\n`;
        if (match.missingRequirements.length > 0) {
          shoeRecommendations += `  - 未達成要件: ${match.missingRequirements.join("、")}\n`;
        }
        shoeRecommendations += "\n";
      });
    }
  }

  return `
# 足部・靴評価レポート

**患者名：** ${patientName}  
**評価日：** ${date}

---

## 1. 靴評価

### 靴スペック
- **中敷き長（mm）：** ${normalizedInput.shoe.insoleLength}
- **ドロップ（mm）：** ${normalizedInput.shoe.drop}

### 靴スコア評価（0: 弱い、1: 中間、2: 良い）
| 項目 | スコア | 評価 |
|------|--------|------|
| ヒールカウンター | ${normalizedInput.shoe.heelCounter} | ${["弱い", "中間", "良い"][normalizedInput.shoe.heelCounter]} |
| 接地安定性 | ${normalizedInput.shoe.landingStability} | ${["弱い", "中間", "良い"][normalizedInput.shoe.landingStability]} |
| 固定性 | ${normalizedInput.shoe.fixation} | ${["弱い", "中間", "良い"][normalizedInput.shoe.fixation]} |
| トーション | ${normalizedInput.shoe.torsion} | ${["弱い", "中間", "良い"][normalizedInput.shoe.torsion]} |
| ドロップ | ${normalizedInput.shoe.drop} | ${["弱い", "中間", "良い"][normalizedInput.shoe.drop]} |
| シャンク | ${normalizedInput.shoe.shank} | ${["弱い", "中間", "良い"][normalizedInput.shoe.shank]} |
| 屈曲位置 | ${normalizedInput.shoe.flexPoint} | ${["弱い", "中間", "良い"][normalizedInput.shoe.flexPoint]} |
| トゥスプリング | ${normalizedInput.shoe.toeSpring} | ${["弱い", "中間", "良い"][normalizedInput.shoe.toeSpring]} |
| ロッカー | ${normalizedInput.shoe.rocker} | ${["弱い", "中間", "良い"][normalizedInput.shoe.rocker]} |
| 重量 | ${normalizedInput.shoe.weight} | ${["弱い", "中間", "良い"][normalizedInput.shoe.weight]} |

### インソール・オーバーラップテスト
- **靴の前足部内幅（mm）：** ${normalizedInput.shoe.shoeForefootInnerWidth || "未入力"}
- **患者の前足部幅 / インソール前足部幅（mm）：** ${normalizedInput.shoe.patientForefootWidth || "未入力"}
- **判定：** ${
    normalizedInput.shoe.patientForefootWidth && normalizedInput.shoe.shoeForefootInnerWidth
      ? normalizedInput.shoe.patientForefootWidth <= normalizedInput.shoe.shoeForefootInnerWidth
        ? "✅ 前足部は概ね収まります"
        : "⚠️ 前足部が干渉しやすく、幅の再検討が必要です"
      : "未評価"
  }

---

## 2. 足部評価

### 右足
- **非荷重 - 足囲（mm）：** ${normalizedInput.foot.right.nonWeightBearing.girth}
- **非荷重 - 足幅（mm）：** ${normalizedInput.foot.right.nonWeightBearing.width}
- **立位 - 足長（mm）：** ${normalizedInput.foot.right.bilateralWeightBearing.footLength}
- **立位 - 足囲（mm）：** ${normalizedInput.foot.right.bilateralWeightBearing.girth}
- **立位 - 足幅（mm）：** ${normalizedInput.foot.right.bilateralWeightBearing.width}
- **足部タイプ：** ${result.foot.right.footType}
- **柔軟性タイプ：** ${result.foot.right.flexibilityType}
- **柔軟性スプレッド（mm）：** ${result.foot.right.flexibilitySpread}

### 左足
- **非荷重 - 足囲（mm）：** ${normalizedInput.foot.left.nonWeightBearing.girth}
- **非荷重 - 足幅（mm）：** ${normalizedInput.foot.left.nonWeightBearing.width}
- **立位 - 足長（mm）：** ${normalizedInput.foot.left.bilateralWeightBearing.footLength}
- **立位 - 足囲（mm）：** ${normalizedInput.foot.left.bilateralWeightBearing.girth}
- **立位 - 足幅（mm）：** ${normalizedInput.foot.left.bilateralWeightBearing.width}
- **足部タイプ：** ${result.foot.left.footType}
- **柔軟性タイプ：** ${result.foot.left.flexibilityType}
- **柔軟性スプレッド（mm）：** ${result.foot.left.flexibilitySpread}

---

## 3. 身体評価

| 項目 | 値 |
|------|-----|
| 背屈可動域（膝伸展） | ${normalizedInput.body.ankleDorsiflexionKneeExtended}° |
| 背屈可動域（膝屈曲） | ${normalizedInput.body.ankleDorsiflexionKneeFlexed}° |
| 母趾伸展 | ${normalizedInput.body.halluxExtension}° |
| 足首不安定性テスト | ${normalizedInput.body.ankleInstability} |
| 後足部アライメント | ${normalizedInput.body.rearfootAlignment} |

---

## 4. 歩行評価（3軸フレーム）

### IC～LR（初期接地～立脚初期）
- **軸：** 回内制御（Rearfoot）
- **所見：** ${normalizedInput.gait.icLr}
- **判定基準：** 回内の制御ができているか？

### MSt（立脚中期）
- **軸：** 近位代償（Knee/Pelvis/Trunk）
- **所見：** ${normalizedInput.gait.mst}
- **判定基準：** 足か股関節か、どちらが起点か？

### TSt（立脚終期）
- **軸：** 前足部剛性（Forefoot）
- **所見：** ${normalizedInput.gait.tst}
- **判定基準：** 推進できる足か？

### PSw（前遊脚期）
- **軸：** 前足部剛性（Forefoot）
- **所見：** ${normalizedInput.gait.pswInterpretation || "正常"}
- **判定基準：** TStの結果を確認する

---

## 5. 推奨事項

### 捨て寸（靴の中敷き長 - 足長）
- **値：** ${result.shoe.extraLength}mm
- **判定：** ${result.shoe.extraLengthComment}
- **基準：** 8-12mmが適正です

### 靴選択のポイント
1. **ヒールカウンター：** 踵部の安定性が重要です
2. **接地安定性：** 初期接地時のぶれを防ぎます
3. **固定性：** 足が靴内で遊ばないようにします
4. **トーション：** 足部の過度な動きを制限します

---

## 6. 推奨靴

${shoeRecommendations}

---

**このレポートは医療専門家による評価に基づいています。  
ご不明な点は、評価を実施した医療者にお問い合わせください。**
`;
}

export function downloadMarkdown(content: string, filename: string) {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/markdown" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function downloadPDF(content: string, filename: string) {
  // This function will be called from the component to trigger PDF download
  // The actual PDF generation happens in the component using a library like jsPDF or html2pdf
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/markdown" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
