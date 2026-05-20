/*
Design reminder for this file:
- Generates patient-facing PDF reports directly in the browser.
- Japanese text must remain readable in every environment.
- Prioritizes 評価→解釈→説明→行動 and print reliability over decorative complexity.
*/

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FullAssessmentInput, FullAssessmentResult, normalizeAssessmentInput } from "./assessment";
import { overlapResultLabels, shoeScoreCriteria } from "./assessment-criteria";
import { DEFAULT_SHOES } from "./shoe-database";
import { generateShoeRequirements, matchMultipleShoes } from "./shoe-matching";

const pageWidthMm = 210;
const pageHeightMm = 297;
const marginMm = 10;
const contentWidthMm = pageWidthMm - marginMm * 2;

const safe = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "未入力";
  return String(value);
};

const scoreToLabel = (key: string, score: 0 | 1 | 2) => {
  return shoeScoreCriteria[key]?.levelLabels?.[score] ?? String(score);
};

const formatDate = () =>
  new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const createSection = (title: string, body: string) => `
  <section style="margin-top: 24px; page-break-inside: avoid;">
    <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #d1d5db;">
      ${title}
    </h2>
    <div style="display: grid; gap: 8px; font-size: 13px; line-height: 1.75; color: #374151;">
      ${body}
    </div>
  </section>
`;

const createRow = (label: string, value: string, note?: string) => `
  <div style="display: grid; grid-template-columns: 180px 1fr; gap: 12px; align-items: start;">
    <div style="color: #6b7280;">${label}</div>
    <div>
      <div style="font-weight: 600; color: #111827;">${value}</div>
      ${note ? `<div style="margin-top: 2px; color: #6b7280; font-size: 12px;">${note}</div>` : ""}
    </div>
  </div>
`;

const createBadge = (text: string, tone: "green" | "amber" | "slate") => {
  const palette = {
    green: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
    amber: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    slate: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  }[tone];

  return `<span style="display: inline-block; padding: 3px 8px; border-radius: 999px; background: ${palette.bg}; color: ${palette.text}; border: 1px solid ${palette.border}; font-size: 12px; font-weight: 700;">${text}</span>`;
};

async function renderElementToPdf(container: HTMLDivElement, filename: string) {
  document.body.appendChild(container);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => setTimeout(resolve, 120));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const mmPerPx = contentWidthMm / canvasWidth;
    const pageContentHeightPx = (pageHeightMm - marginMm * 2) / mmPerPx;

    let renderedHeightPx = 0;
    let pageIndex = 0;

    while (renderedHeightPx < canvasHeight) {
      const sliceHeightPx = Math.min(pageContentHeightPx, canvasHeight - renderedHeightPx);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeightPx;

      const ctx = pageCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("PDF描画コンテキストの取得に失敗しました");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        renderedHeightPx,
        canvasWidth,
        sliceHeightPx,
        0,
        0,
        canvasWidth,
        sliceHeightPx
      );

      const imageData = pageCanvas.toDataURL("image/jpeg", 0.95);
      const sliceHeightMm = sliceHeightPx * mmPerPx;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(imageData, "JPEG", marginMm, marginMm, contentWidthMm, sliceHeightMm);
      renderedHeightPx += sliceHeightPx;
      pageIndex += 1;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generatePDFReport(
  patientName: string,
  input: FullAssessmentInput,
  result: FullAssessmentResult
): Promise<void> {
  const normalizedInput = normalizeAssessmentInput(input);

  const overlapJudgement =
    normalizedInput.shoe.patientForefootWidth && normalizedInput.shoe.shoeForefootInnerWidth
      ? normalizedInput.shoe.patientForefootWidth <= normalizedInput.shoe.shoeForefootInnerWidth
        ? overlapResultLabels.fit
        : overlapResultLabels.notFit
      : "未評価";

  const requirement = generateShoeRequirements(normalizedInput, result);
  const categoryShoes = DEFAULT_SHOES.filter((shoe) => shoe.category === normalizedInput.category);
  const matches = matchMultipleShoes(categoryShoes, requirement).slice(0, 5);
  const fullMatches = matches.filter((item) => item.isFullMatch);
  const partialMatches = matches.filter((item) => !item.isFullMatch);

  const fullMatchHtml = fullMatches.length
    ? `
      <div style="display: grid; gap: 12px; margin-top: 12px;">
        ${fullMatches
          .map(
            (match) => `
          <div style="border: 1px solid #86efac; background: #f0fdf4; border-radius: 14px; padding: 14px;">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
              <div style="font-size:14px; font-weight:700; color:#166534;">${match.brand} / ${match.model}</div>
              ${createBadge(`適合度 ${match.matchScore}%`, "green")}
            </div>
            <div style="margin-top:8px; font-size:13px; line-height:1.7; color:#374151;">${match.reason}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `
    : "";

  const partialMatchHtml = partialMatches.length
    ? `
      <div style="display: grid; gap: 12px; margin-top: 12px;">
        ${partialMatches
          .map(
            (match) => `
          <div style="border: 1px solid #fcd34d; background: #fffbeb; border-radius: 14px; padding: 14px;">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
              <div style="font-size:14px; font-weight:700; color:#92400e;">${match.brand} / ${match.model}</div>
              ${createBadge(`適合度 ${match.matchScore}%`, "amber")}
            </div>
            <div style="margin-top:8px; font-size:13px; line-height:1.7; color:#374151;">${match.reason}</div>
            ${match.missingRequirements.length ? `<div style="margin-top:6px; font-size:12px; color:#92400e;">不足条件：${match.missingRequirements.join("、")}</div>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
    `
    : "";

  const reportHtml = `
    <div style="width: 1120px; box-sizing: border-box; background: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif; padding: 48px 56px 56px;">
      <header style="display:flex; justify-content:space-between; gap:24px; align-items:flex-start; border-bottom:3px solid #111827; padding-bottom:20px;">
        <div>
          <div style="font-size: 12px; letter-spacing: 0.16em; color: #6b7280; text-transform: uppercase;">Integrated Foot & Shoe Assessment</div>
          <h1 style="font-size: 34px; line-height: 1.25; margin: 10px 0 0; color: #111827;">足部・靴評価レポート</h1>
          <div style="margin-top: 10px; font-size: 14px; line-height: 1.8; color: #4b5563;">靴から原因を整理し、足部構造と歩行をつないで説明する患者向けレポートです。</div>
        </div>
        <div style="min-width: 220px; display:grid; gap:8px; font-size:13px; line-height:1.7; color:#374151;">
          <div><span style="color:#6b7280;">患者名</span><br /><strong>${safe(patientName || normalizedInput.patientName || "患者名未入力")}</strong></div>
          <div><span style="color:#6b7280;">評価日</span><br /><strong>${formatDate()}</strong></div>
          <div><span style="color:#6b7280;">カテゴリー</span><br /><strong>${normalizedInput.category}</strong></div>
        </div>
      </header>

      ${createSection(
        "1. 靴評価",
        [
          createRow("中敷き長", `${safe(normalizedInput.shoe.insoleLength)} mm`),
          createRow("ドロップ", scoreToLabel("drop", normalizedInput.shoe.drop)),
          createRow("捨て寸", `${safe(result.shoe.extraLength)} mm`, `判定：${safe(result.shoe.extraLengthComment)}`),
          createRow("ヒールカウンター", scoreToLabel("heelCounter", normalizedInput.shoe.heelCounter)),
          createRow("接地安定性", scoreToLabel("landingStability", normalizedInput.shoe.landingStability)),
          createRow("固定性", scoreToLabel("fixation", normalizedInput.shoe.fixation)),
          createRow("トーション", scoreToLabel("torsion", normalizedInput.shoe.torsion)),
          createRow("シャンク", scoreToLabel("shank", normalizedInput.shoe.shank)),
          createRow("屈曲位置", scoreToLabel("flexPoint", normalizedInput.shoe.flexPoint)),
          createRow("トゥスプリング", scoreToLabel("toeSpring", normalizedInput.shoe.toeSpring)),
          createRow("ロッカー", scoreToLabel("rocker", normalizedInput.shoe.rocker)),
          createRow("重量", scoreToLabel("weight", normalizedInput.shoe.weight)),
          createRow(
            "前足部オーバーラップ確認",
            overlapJudgement,
            `靴の前足部内幅 ${safe(normalizedInput.shoe.shoeForefootInnerWidth)} mm / 患者前足部幅 ${safe(normalizedInput.shoe.patientForefootWidth)} mm`
          ),
        ].join("")
      )}

      ${createSection(
        "2. 足部評価",
        `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
            <div style="border:1px solid #e5e7eb; border-radius:14px; padding:14px;">
              <div style="font-size:14px; font-weight:700; margin-bottom:10px; color:#111827;">右足</div>
              ${createRow("非荷重 足囲", `${normalizedInput.foot.right.nonWeightBearing.girth} mm`)}
              ${createRow("非荷重 足幅", `${normalizedInput.foot.right.nonWeightBearing.width} mm`)}
              ${createRow("立位 足長", `${normalizedInput.foot.right.bilateralWeightBearing.footLength} mm`)}
              ${createRow("立位 足囲", `${normalizedInput.foot.right.bilateralWeightBearing.girth} mm`)}
              ${createRow("立位 足幅", `${normalizedInput.foot.right.bilateralWeightBearing.width} mm`)}
              ${createRow("足部タイプ", result.foot.right.footType)}
              ${createRow("柔軟性タイプ", result.foot.right.flexibilityType)}
              ${createRow("柔軟性変化量", `${result.foot.right.flexibilitySpread} mm`)}
            </div>
            <div style="border:1px solid #e5e7eb; border-radius:14px; padding:14px;">
              <div style="font-size:14px; font-weight:700; margin-bottom:10px; color:#111827;">左足</div>
              ${createRow("非荷重 足囲", `${normalizedInput.foot.left.nonWeightBearing.girth} mm`)}
              ${createRow("非荷重 足幅", `${normalizedInput.foot.left.nonWeightBearing.width} mm`)}
              ${createRow("立位 足長", `${normalizedInput.foot.left.bilateralWeightBearing.footLength} mm`)}
              ${createRow("立位 足囲", `${normalizedInput.foot.left.bilateralWeightBearing.girth} mm`)}
              ${createRow("立位 足幅", `${normalizedInput.foot.left.bilateralWeightBearing.width} mm`)}
              ${createRow("足部タイプ", result.foot.left.footType)}
              ${createRow("柔軟性タイプ", result.foot.left.flexibilityType)}
              ${createRow("柔軟性変化量", `${result.foot.left.flexibilitySpread} mm`)}
            </div>
          </div>
          <div style="margin-top:14px; display:grid; gap:8px;">
            ${createRow("左右足長差", `${result.foot.leftRightDifference.footLengthDiff} mm`)}
            ${createRow("左右柔軟性差", `${result.foot.leftRightDifference.flexibilityDiff} mm`)}
          </div>
        `
      )}

      ${createSection(
        "3. 身体評価",
        [
          createRow("足関節背屈（膝伸展）", `${input.body.ankleDorsiflexionKneeExtended}°`),
          createRow("足関節背屈（膝屈曲）", `${input.body.ankleDorsiflexionKneeFlexed}°`),
          createRow("母趾伸展", `${input.body.halluxExtension}°`),
          createRow("足首不安定性", input.body.ankleInstability),
          createRow("後足部アライメント", input.body.rearfootAlignment),
        ].join("")
      )}

      ${createSection(
        "4. 歩行評価",
        [
          createRow("IC〜LR", input.gait.icLr, "回内の量とタイミング、後足部制御をみるフェーズ"),
          createRow("MS", input.gait.mst, "近位代償が足部由来か股関節由来かを切り分けるフェーズ"),
          createRow("TSt", input.gait.tst, "前足部剛性と推進効率をみるフェーズ"),
          createRow("PSw", input.gait.pswInterpretation || "TStの結果として解釈", "toe off の質を最終確認するフェーズ"),
        ].join("")
      )}

      ${createSection(
        "5. 解釈と靴選定の方向性",
        [
          createRow("捨て寸の目安", `${requirement.insoleLength.min}〜${requirement.insoleLength.max} mm`),
          createRow("ドロップの目安", `${requirement.drop.min}〜${requirement.drop.max} mm`),
          createRow("優先する構造", requirement.reason.replace("評価結果に基づいた靴要件：", "") || "標準的な安定性を優先"),
        ].join("")
      )}

      ${createSection(
        "6. 推奨靴候補",
        `
          <div style="font-size:13px; line-height:1.8; color:#4b5563;">同カテゴリの登録靴から、構造・サイズ条件を優先して候補を抽出しています。</div>
          ${fullMatchHtml}
          ${partialMatchHtml}
          ${!fullMatches.length && !partialMatches.length ? `<div style="margin-top:12px; font-size:13px; color:#6b7280;">候補靴が未登録です。靴データベースの追加が必要です。</div>` : ""}
        `
      )}

      ${createSection(
        "7. 患者さんへの説明",
        `
          <div style="font-size:13px; line-height:1.9; color:#374151;">
            今回は、靴の構造、足の特徴、歩き方をまとめて確認しました。靴はサイズだけでなく、踵の安定性や中足部の支え方で負荷が変わります。まずは候補靴を実際に履き、歩いたときの安定感と前足部の余裕を一緒に確認してください。
          </div>
        `
      )}

      <footer style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #d1d5db; font-size: 11px; color: #6b7280; line-height: 1.8;">
        このレポートは臨床評価結果を患者説明用に整理したものです。必要に応じて再評価のうえ靴選定を行ってください。
      </footer>
    </div>
  `;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-20000px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.style.background = "#ffffff";
  container.innerHTML = reportHtml;

  const filename = `足部評価レポート_${safe(patientName || input.patientName || "患者名未入力").replace(/[\\/:*?"<>|]/g, "_")}_${formatDate().replace(/\//g, "-")}.pdf`;
  await renderElementToPdf(container, filename);
}
