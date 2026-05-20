import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  demoInput,
  runAssessment,
  type Category,
  type FullAssessmentInput,
  type GaitAssessmentInput,
  type ShoeScoreValue,
} from "@/lib/assessment";
import { insoleOverlapTestDescription, shoeScoreCriteria } from "@/lib/assessment-criteria";
import { gaitFramework, gaitInterpretationGuide } from "@/lib/gait-framework";
import { generatePDFContent, downloadMarkdown } from "@/lib/pdf-generator";
import { generatePDFReport } from "@/lib/pdf-report-generator";
import { DEFAULT_SHOES } from "@/lib/shoe-database";
import { generateShoeRequirements, matchMultipleShoes } from "@/lib/shoe-matching";

/*
Design reminder for this file:
- Design philosophy: Japanese Clinical Editorial.
- Use asymmetry, paper-like surfaces, restrained color contrast, and precise clinical hierarchy.
- Every visual choice should reinforce 評価→解釈→説明→行動.
*/

const heroImage =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663224790744/iVFD8N6EhCPFNrANwtmbyH/hero-foot-shoe-editorial_5b879dd9.jpg";
const dashboardImage =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663224790744/iVFD8N6EhCPFNrANwtmbyH/assessment-dashboard-art_82fce281.png";
const recommendationImage =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663224790744/iVFD8N6EhCPFNrANwtmbyH/recommendation-cards-illustration_d90a0287.jpg";

const shoeScoreFields: Array<{ key: keyof FullAssessmentInput["shoe"]; label: string; hint: string; description: string }> = [
  { key: "heelCounter", label: "ヒールカウンター", hint: "踵の崩れに強いか", description: "踵部の硬度と形状。内側・外側への倒れ込みを防ぎ、安定した着地をサポート。" },
  { key: "landingStability", label: "接地安定性", hint: "接地が明確でぶれないか", description: "初期接地時の安定性。ぶれのない明確な接地が、その後の歩行を決定する。" },
  { key: "fixation", label: "固定性", hint: "紐・ベルトで締められるか", description: "紐やベルトによる足の固定度。足が靴内で遊ぶと、すべてが崩れる。" },
  { key: "torsion", label: "トーション", hint: "ねじれすぎないか", description: "靴全体のねじれやすさ。適度な剛性が、足部の過度な動きを制限する。" },
  { key: "drop", label: "ドロップ", hint: "前後差の扱いやすさ", description: "踵と前足部の高さ差。患者の歩行パターンに合わせた選択が重要。" },
  { key: "shank", label: "シャンク", hint: "中足部の支え", description: "中足部（MTP付近）の支持性。シャンク補強で前足部の過度な動きを抑制。" },
  { key: "flexPoint", label: "屈曲位置", hint: "MTPで適切に曲がるか", description: "靴の屈曲点がMTP関節と一致しているか。ずれると歩行効率が低下。" },
  { key: "toeSpring", label: "トゥスプリング", hint: "前足部の返り", description: "つま先の上向き角度。蹴り出しを助け、歩行効率を向上させる。" },
  { key: "rocker", label: "ロッカー", hint: "前進を助けるか", description: "靴底の曲線形状。スムーズな前進をサポートし、筋疲労を軽減。" },
  { key: "weight", label: "重量", hint: "扱いやすい重さか", description: "靴全体の重さ。軽すぎると支持性が低下、重すぎると疲労が増加。" },
];

const gaitOptions: Record<keyof GaitAssessmentInput, string[]> = {
  icLr: ["正常", "早期回内", "強い回内", "外側接地"],
  mst: ["正常", "内側倒れ込み", "骨盤下垂", "骨盤回旋増加"],
  tst: ["正常", "アーチ形成不良", "早期離地", "接地時間延長", "外側逃げ"],
  pswInterpretation: ["正常", "toe off不明確", "足が引きずる"],
};

const defaultScoreLabels: Record<ShoeScoreValue, string> = {
  0: "低 / 弱",
  1: "標準 / 中",
  2: "高 / 強",
};

function NumericInput({
  label,
  value,
  onChange,
  suffix = "mm",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">{label}</span>
      <div className="flex items-center rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 shadow-[0_12px_30px_rgba(63,55,45,0.06)] backdrop-blur">
        <input
          type="number"
          value={Number.isNaN(value) ? 0 : value}
          onChange={(event) => onChange(Number(event.target.value || 0))}
          className="w-full bg-transparent text-base text-stone-900 outline-none"
        />
        <span className="text-sm text-stone-500">{suffix}</span>
      </div>
    </label>
  );
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-0 top-full mt-2 z-50 w-48 rounded-lg border border-stone-300/50 bg-stone-900/95 p-3 text-xs text-stone-100 shadow-lg backdrop-blur">
          {content}
          <div className="absolute bottom-full left-4 h-2 w-2 rotate-45 border-t border-l border-stone-300/50 bg-stone-900/95" />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState<FullAssessmentInput>(demoInput);
  const [activeStep, setActiveStep] = useState<"intro" | "step1" | "step2" | "step3" | "result">("intro");

  const result = useMemo(() => runAssessment(form), [form]);

  const setCategory = (value: Category) => {
    setForm((prev) => ({ ...prev, category: value }));
  };

  const updateFoot = (
    side: "right" | "left",
    phase: "nonWeightBearing" | "bilateralWeightBearing",
    key: "footLength" | "girth" | "width",
    value: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      foot: {
        ...prev.foot,
        [side]: {
          ...prev.foot[side],
          [phase]: {
            ...prev.foot[side][phase],
            [key]: value,
          },
        },
      },
    }));
  };

  const updateShoe = (key: keyof FullAssessmentInput["shoe"], value: number) => {
    setForm((prev) => ({
      ...prev,
      shoe: {
        ...prev.shoe,
        [key]: value,
      },
    }));
  };

  const updateBody = (key: keyof FullAssessmentInput["body"], value: number | string) => {
    setForm((prev) => ({
      ...prev,
      body: {
        ...prev.body,
        [key]: value,
      },
    }));
  };

  const updateGait = (key: keyof GaitAssessmentInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      gait: {
        ...prev.gait,
        [key]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2e8_0%,#f1ece2_48%,#ede6dc_100%)] text-stone-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-stone-300/70">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(246,240,230,0.96)_0%,rgba(246,240,230,0.86)_44%,rgba(16,45,44,0.28)_100%)]" />
        <div className="container relative grid gap-12 px-4 py-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-center lg:py-20 xl:gap-16">
          <div className="space-y-8 pr-2 xl:pr-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-stone-400/50 bg-white/55 px-4 py-2 text-[11px] tracking-[0.28em] text-stone-700 backdrop-blur">
              JAPANESE CLINICAL EDITORIAL
            </div>
            <div className="space-y-5">
              <p className="text-sm tracking-[0.22em] text-stone-600">足を診る前に、靴を診る。</p>
              <h1 className="max-w-[8.5em] font-serif text-[3.25rem] leading-[1.08] tracking-[-0.035em] text-stone-900 md:text-[4.5rem] xl:text-[5.2rem]">
                <span className="block">統合的足部</span>
                <span className="block">評価システム</span>
                <span className="mt-4 block max-w-[12em] text-[0.34em] font-normal leading-[1.65] tracking-[0.08em] text-stone-700">靴評価・足評価・歩行評価を一つの診断体験へ。</span>
              </h1>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => setActiveStep("step1")}
                className="rounded-full bg-stone-900 px-8 py-3 text-white hover:bg-stone-800"
              >
                評価を開始
              </Button>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-stone-300/50 bg-white/40 shadow-[0_20px_60px_rgba(63,55,45,0.12)]">
            <img src={dashboardImage} alt="Dashboard" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container px-4 py-16">
        {activeStep === "intro" && (
          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-3xl tracking-[-0.02em] text-stone-900">評価フロー</h2>
              <p className="text-base leading-relaxed text-stone-700">
                このシステムは、靴評価・足部評価・身体評価・歩行評価の4つのSTEPで、患者様に最適な靴をレコメンドします。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { step: "STEP 1", title: "靴評価", desc: "現在の靴の構造を10項目で評価します" },
                { step: "STEP 2", title: "足部評価（両足・荷重分離）", desc: "右足・左足を非荷重と二脚荷重で計測します" },
                { step: "STEP 3", title: "身体・歩行評価", desc: "背屈可動域、母趾伸展、歩行パターンを評価します" },
                { step: "STEP 4", title: "結果表示", desc: "診断結果と靴レコメンドを表示します" },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur">
                  <div className="text-xs font-semibold tracking-[0.12em] text-stone-600">{item.step}</div>
                  <h3 className="mt-2 font-serif text-xl text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-stone-700">{item.desc}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setActiveStep("step1")}
              className="w-full rounded-full bg-stone-900 py-4 text-white hover:bg-stone-800"
            >
              評価を開始する
            </Button>
          </div>
        )}

        {activeStep === "step1" && (
          <div className="max-w-4xl space-y-8">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl tracking-[-0.02em] text-stone-900">STEP 1: 靴評価</h2>
              <p className="text-sm text-stone-600">現在の靴の構造を評価します。各項目を0（弱い）〜2（良い）で選択してください。項目名にマウスを乗せるとツールチップが表示されます。</p>
            </div>

            <div className="space-y-4">
              <label className="space-y-2">
                <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">患者名</span>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => setForm((prev) => ({ ...prev, patientName: e.target.value }))}
                  className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">靴のサイズ規格</span>
                <select
                  value={form.category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                >
                  <option value="婦人">婦人</option>
                  <option value="紳士">紳士</option>
                  <option value="子ども">子ども</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {shoeScoreFields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <Tooltip content={field.description}>
                    <span className="block text-sm font-medium tracking-[0.08em] text-stone-700 border-b border-dashed border-stone-400/50">
                      {field.label}
                    </span>
                  </Tooltip>
                  <p className="text-xs text-stone-600">{field.hint}</p>
                  <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 text-xs text-stone-700 space-y-1">
                    <p className="font-medium text-stone-800">判定基準</p>
                    <p>0: {(shoeScoreCriteria[field.key as string]?.levelLabels?.[0] ?? defaultScoreLabels[0])} — {(shoeScoreCriteria[field.key as string]?.criteria?.[0] ?? "")}</p>
                    <p>1: {(shoeScoreCriteria[field.key as string]?.levelLabels?.[1] ?? defaultScoreLabels[1])} — {(shoeScoreCriteria[field.key as string]?.criteria?.[1] ?? "")}</p>
                    <p>2: {(shoeScoreCriteria[field.key as string]?.levelLabels?.[2] ?? defaultScoreLabels[2])} — {(shoeScoreCriteria[field.key as string]?.criteria?.[2] ?? "")}</p>
                  </div>
                  <select
                    value={form.shoe[field.key] as ShoeScoreValue}
                    onChange={(e) => updateShoe(field.key, Number(e.target.value) as ShoeScoreValue)}
                    className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                  >
                    <option value={0}>{shoeScoreCriteria[field.key as string]?.levelLabels?.[0] ?? defaultScoreLabels[0]}</option>
                    <option value={1}>{shoeScoreCriteria[field.key as string]?.levelLabels?.[1] ?? defaultScoreLabels[1]}</option>
                    <option value={2}>{shoeScoreCriteria[field.key as string]?.levelLabels?.[2] ?? defaultScoreLabels[2]}</option>
                  </select>
                </label>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NumericInput
                label="靴の中敷き長（mm）"
                value={form.shoe.insoleLength}
                onChange={(value) => updateShoe("insoleLength", value)}
              />
            </div>

            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
              <h3 className="font-serif text-xl text-stone-900">インソール・オーバーラップテスト</h3>
              <p className="text-sm text-stone-600">ここでは厚さではなく、前足部の幅が靴内に収まるかを確認します。</p>

              <div className="space-y-4">
                <div className="rounded-lg bg-stone-100/50 p-4">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {insoleOverlapTestDescription.shoeForefootInnerWidth.label}
                  </label>
                  <p className="text-xs text-stone-600 mb-2">{insoleOverlapTestDescription.shoeForefootInnerWidth.description}</p>
                  <p className="text-xs text-stone-500 mb-3 italic">{insoleOverlapTestDescription.shoeForefootInnerWidth.hint}</p>
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <p className="text-xs text-stone-600 mb-1">参考例：</p>
                    <p className="text-xs text-stone-700">{insoleOverlapTestDescription.shoeForefootInnerWidth.example}</p>
                  </div>
                  <NumericInput
                    label=""
                    value={form.shoe.shoeForefootInnerWidth || 0}
                    onChange={(value) => updateShoe("shoeForefootInnerWidth", value)}
                  />
                </div>

                <div className="rounded-lg bg-stone-100/50 p-4">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {insoleOverlapTestDescription.patientForefootWidth.label}
                  </label>
                  <p className="text-xs text-stone-600 mb-2">{insoleOverlapTestDescription.patientForefootWidth.description}</p>
                  <p className="text-xs text-stone-500 mb-3 italic">{insoleOverlapTestDescription.patientForefootWidth.hint}</p>
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <p className="text-xs text-stone-600 mb-1">参考例：</p>
                    <p className="text-xs text-stone-700">{insoleOverlapTestDescription.patientForefootWidth.example}</p>
                  </div>
                  <NumericInput
                    label=""
                    value={form.shoe.patientForefootWidth || 0}
                    onChange={(value) => updateShoe("patientForefootWidth", value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-300/50 bg-blue-50/50 p-3">
                <p className="text-xs font-medium text-blue-900 mb-1">判定基準：</p>
                <p className="text-xs text-blue-800">{insoleOverlapTestDescription.judgment.body}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setActiveStep("intro")}
                variant="outline"
                className="flex-1 rounded-full border-stone-300/80 py-3"
              >
                戻る
              </Button>
              <Button
                onClick={() => setActiveStep("step2")}
                className="flex-1 rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800"
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {activeStep === "step2" && (
          <div className="max-w-4xl space-y-8">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl tracking-[-0.02em] text-stone-900">STEP 2: 足部評価（両足・立位）</h2>
              <p className="text-sm text-stone-600">右足・左足を非荷重と立位で計測します。足囲・足幅のウィズは立位の足長から自動算出されます。</p>
            </div>

            {(["right", "left"] as const).map((side) => (
              <div key={side} className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur">
                <h3 className="mb-6 font-serif text-2xl text-stone-900">{side === "right" ? "右足" : "左足"}</h3>

                {/* 非荷重 */}
                <div className="mb-6 space-y-4 rounded-xl border border-stone-300/30 bg-white/40 p-4">
                  <h4 className="font-medium text-stone-800">非荷重</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <NumericInput
                      label="足囲（mm）"
                      value={form.foot[side].nonWeightBearing.girth}
                      onChange={(value) => updateFoot(side, "nonWeightBearing", "girth", value)}
                    />
                    <NumericInput
                      label="足幅（mm）"
                      value={form.foot[side].nonWeightBearing.width}
                      onChange={(value) => updateFoot(side, "nonWeightBearing", "width", value)}
                    />
                  </div>
                </div>

                {/* 立位 */}
                <div className="mb-6 space-y-4 rounded-xl border border-stone-300/30 bg-stone-50/40 p-4">
                  <h4 className="font-medium text-stone-800">立位（二脚荷重）</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <NumericInput
                      label="足長（mm）"
                      value={form.foot[side].bilateralWeightBearing.footLength}
                      onChange={(value) => updateFoot(side, "bilateralWeightBearing", "footLength", value)}
                    />
                    <NumericInput
                      label="足囲（mm）"
                      value={form.foot[side].bilateralWeightBearing.girth}
                      onChange={(value) => updateFoot(side, "bilateralWeightBearing", "girth", value)}
                    />
                    <NumericInput
                      label="足幅（mm）"
                      value={form.foot[side].bilateralWeightBearing.width}
                      onChange={(value) => updateFoot(side, "bilateralWeightBearing", "width", value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <Button
                onClick={() => setActiveStep("step1")}
                variant="outline"
                className="flex-1 rounded-full border-stone-300/80 py-3"
              >
                戻る
              </Button>
              <Button
                onClick={() => setActiveStep("step3")}
                className="flex-1 rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800"
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {activeStep === "step3" && (
          <div className="max-w-4xl space-y-8">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl tracking-[-0.02em] text-stone-900">STEP 3: 身体・歩行評価</h2>
              <p className="text-sm text-stone-600">背屈可動域、母趾伸展、歩行パターンを評価します。</p>
            </div>

            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-6">
              <div>
                <h3 className="mb-4 font-serif text-xl text-stone-900">身体評価</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <NumericInput
                    label="背屈可動域（膝伸展）（度）"
                    value={form.body.ankleDorsiflexionKneeExtended}
                    onChange={(value) => updateBody("ankleDorsiflexionKneeExtended", value)}
                    suffix="°"
                  />
                  <NumericInput
                    label="背屈可動域（膝屈曲）（度）"
                    value={form.body.ankleDorsiflexionKneeFlexed}
                    onChange={(value) => updateBody("ankleDorsiflexionKneeFlexed", value)}
                    suffix="°"
                  />
                  <NumericInput
                    label="母趾伸展（度）"
                    value={form.body.halluxExtension}
                    onChange={(value) => updateBody("halluxExtension", value)}
                    suffix="°"
                  />
                  <label className="space-y-2">
                    <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">足首不安定性テスト</span>
                    <select
                      value={form.body.ankleInstability}
                      onChange={(e) => updateBody("ankleInstability", e.target.value)}
                      className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                    >
                      <option value="正常">正常</option>
                      <option value="軽度">軽度</option>
                      <option value="中等度">中等度</option>
                      <option value="重度">重度</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">後足部アライメント</span>
                    <select
                      value={form.body.rearfootAlignment}
                      onChange={(e) => updateBody("rearfootAlignment", e.target.value)}
                      className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                    >
                      <option value="内反">内反</option>
                      <option value="垂直">垂直</option>
                      <option value="外反">外反</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-serif text-xl text-stone-900">歩行評価（3軸フレーム）</h3>
                <p className="text-xs text-stone-600 mb-4">すべての歩行パターンを「回内制御」「前足部剛性」「近位代償」の3軸で解釈します。</p>
                
                <div className="space-y-4">
                  {/* IC-LR */}
                  <div className="rounded-lg border border-stone-300/30 bg-stone-50/40 p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-stone-900 mb-1">IC～LR（初期接地～立脚初期）</h4>
                      <p className="text-xs text-stone-600 mb-2">軸：回内制御（Rearfoot）</p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>見ること：</strong> 回内の「量」と「タイミング」、踵接地の明確さ
                      </p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>判定基準：</strong> 回内の制御ができているか？
                      </p>
                    </div>
                    <label className="space-y-2">
                      <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">所見を選択</span>
                      <select
                        value={form.gait.icLr}
                        onChange={(e) => updateGait("icLr", e.target.value)}
                        className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                      >
                        {gaitOptions.icLr.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.gait.icLr && gaitFramework["IC-LR"].interpretation[form.gait.icLr] && (
                      <div className="mt-3 rounded-lg bg-blue-50/50 p-3 border border-blue-200/50">
                        <p className="text-xs text-blue-900">
                          <strong>解釈：</strong> {gaitFramework["IC-LR"].interpretation[form.gait.icLr]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* MSt */}
                  <div className="rounded-lg border border-stone-300/30 bg-stone-50/40 p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-stone-900 mb-1">MSt（立脚中期）</h4>
                      <p className="text-xs text-stone-600 mb-2">軸：近位代償（Knee/Pelvis/Trunk）</p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>見ること：</strong> ラテラルスラスト、トレンデレンブルグ徴候、骨盤の安定性
                      </p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>判定基準：</strong> 足か股関節か、どちらが起点か？
                      </p>
                    </div>
                    <label className="space-y-2">
                      <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">所見を選択</span>
                      <select
                        value={form.gait.mst}
                        onChange={(e) => updateGait("mst", e.target.value)}
                        className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                      >
                        {gaitOptions.mst.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.gait.mst && gaitFramework["MSt"].interpretation[form.gait.mst] && (
                      <div className="mt-3 rounded-lg bg-blue-50/50 p-3 border border-blue-200/50">
                        <p className="text-xs text-blue-900">
                          <strong>解釈：</strong> {gaitFramework["MSt"].interpretation[form.gait.mst]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* TSt */}
                  <div className="rounded-lg border border-stone-300/30 bg-stone-50/40 p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-stone-900 mb-1">TSt（立脚終期）</h4>
                      <p className="text-xs text-stone-600 mb-2">軸：前足部剛性（Forefoot）</p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>見ること：</strong> 2・3趾アーチ、横アーチ、踵骨の向き、接地時間
                      </p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>判定基準：</strong> 推進できる足か？
                      </p>
                    </div>
                    <label className="space-y-2">
                      <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">所見を選択</span>
                      <select
                        value={form.gait.tst}
                        onChange={(e) => updateGait("tst", e.target.value)}
                        className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                      >
                        {gaitOptions.tst.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.gait.tst && gaitFramework["TSt"].interpretation[form.gait.tst] && (
                      <div className="mt-3 rounded-lg bg-blue-50/50 p-3 border border-blue-200/50">
                        <p className="text-xs text-blue-900">
                          <strong>解釈：</strong> {gaitFramework["TSt"].interpretation[form.gait.tst]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PSw */}
                  <div className="rounded-lg border border-stone-300/30 bg-stone-50/40 p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-stone-900 mb-1">PSw（前遊脚期）</h4>
                      <p className="text-xs text-stone-600 mb-2">軸：前足部剛性（Forefoot）</p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>見ること：</strong> Toe off（つま先離地）の質、足の抜け方
                      </p>
                      <p className="text-xs text-stone-700 mb-3">
                        <strong>判定基準：</strong> TStの結果を確認する
                      </p>
                    </div>
                    <label className="space-y-2">
                      <span className="block text-sm font-medium tracking-[0.08em] text-stone-700">所見を選択</span>
                      <select
                        value={form.gait.pswInterpretation || "正常"}
                        onChange={(e) => updateGait("pswInterpretation", e.target.value)}
                        className="w-full rounded-[1.25rem] border border-stone-300/80 bg-white/80 px-4 py-3 text-base text-stone-900 outline-none"
                      >
                        {gaitOptions.pswInterpretation.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.gait.pswInterpretation && gaitFramework["PSw"].interpretation[form.gait.pswInterpretation] && (
                      <div className="mt-3 rounded-lg bg-blue-50/50 p-3 border border-blue-200/50">
                        <p className="text-xs text-blue-900">
                          <strong>解釈：</strong> {gaitFramework["PSw"].interpretation[form.gait.pswInterpretation]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setActiveStep("step2")}
                variant="outline"
                className="flex-1 rounded-full border-stone-300/80 py-3"
              >
                戻る
              </Button>
              <Button
                onClick={() => setActiveStep("result")}
                className="flex-1 rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800"
              >
                結果を表示
              </Button>
            </div>
          </div>
        )}

        {activeStep === "result" && (
          <div className="max-w-4xl space-y-8">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl tracking-[-0.02em] text-stone-900">評価結果</h2>
              <p className="text-sm text-stone-600">患者様 {form.patientName}</p>
            </div>

            {/* 足部評価サマリー */}
            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">足部評価</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {(["right", "left"] as const).map((side) => {
                  const footResult = result.foot[side];
                  const nonWB = form.foot[side].nonWeightBearing;
                  const bWB = form.foot[side].bilateralWeightBearing;
                  const girthChange = bWB.girth - nonWB.girth;
                  const widthChange = bWB.width - nonWB.width;
                  return (
                    <div key={side} className="rounded-xl border border-stone-300/30 bg-white/40 p-4">
                      <h4 className="mb-4 font-medium text-stone-800">{side === "right" ? "右足" : "左足"}</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-stone-600">足長（JIS）:</span>
                          <span className="ml-2 font-medium text-stone-900">{footResult.roundedFootLength}mm</span>
                        </div>
                        <div className="rounded-lg bg-stone-100/50 p-2">
                          <p className="text-xs font-medium text-stone-700 mb-1">足囲（非荷重 → 立位）</p>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-600">{nonWB.girth}mm</span>
                            <span className="text-stone-500">→</span>
                            <span className="font-medium text-stone-900">{bWB.girth}mm</span>
                            <span className={`ml-auto text-xs font-medium ${
                              girthChange > 0 ? "text-blue-600" : "text-stone-600"
                            }`}>
                              {girthChange > 0 ? "+" : ""}{girthChange}mm
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-stone-100/50 p-2">
                          <p className="text-xs font-medium text-stone-700 mb-1">足幅（非荷重 → 立位）</p>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-600">{nonWB.width}mm</span>
                            <span className="text-stone-500">→</span>
                            <span className="font-medium text-stone-900">{bWB.width}mm</span>
                            <span className={`ml-auto text-xs font-medium ${
                              widthChange > 0 ? "text-blue-600" : "text-stone-600"
                            }`}>
                              {widthChange > 0 ? "+" : ""}{widthChange}mm
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-stone-600">足囲ウィズ:</span>
                          <span className="ml-2 font-medium text-stone-900">{footResult.girthLabel}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">足幅ウィズ:</span>
                          <span className="ml-2 font-medium text-stone-900">{footResult.widthLabel}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">足部タイプ:</span>
                          <span className="ml-2 font-medium text-stone-900">{footResult.footType}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">柔軟性:</span>
                          <span className="ml-2 font-medium text-stone-900">{footResult.flexibilityType}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">柔軟性スプレッド:</span>
                          <span className="ml-2 font-medium text-stone-900">{footResult.flexibilitySpread}mm</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {result.foot.leftRightDifference.footLengthDiff !== 0 && (
                <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3">
                  <p className="text-sm text-amber-900">
                    左右足長差: {Math.abs(result.foot.leftRightDifference.footLengthDiff)}mm
                  </p>
                </div>
              )}
              {result.foot.leftRightDifference.flexibilityDiff !== 0 && (
                <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3">
                  <p className="text-sm text-amber-900">
                    左右柔軟性差: {Math.abs(result.foot.leftRightDifference.flexibilityDiff)}mm
                  </p>
                </div>
              )}
            </div>

            {/* 靴評価サマリー */}
            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">靴評価</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-stone-300/30 bg-white/40 p-4">
                  <div className="text-sm space-y-3">
                    <div>
                      <span className="text-stone-600">構造ランク:</span>
                      <span className="ml-2 font-medium text-stone-900">{result.shoe.structureRank}</span>
                    </div>
                    <div>
                      <span className="text-stone-600">総合スコア:</span>
                      <span className="ml-2 font-medium text-stone-900">{result.shoe.totalScore}/20</span>
                    </div>
                    <div className="rounded-lg bg-stone-100/50 p-2">
                      <p className="text-xs font-medium text-stone-700 mb-1">捨て寸（基準: 8-12mm）</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-900">{result.shoe.extraLength}mm</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          result.shoe.extraLengthComment === "適正" 
                            ? "bg-green-100/50 text-green-700"
                            : "bg-amber-100/50 text-amber-700"
                        }`}>
                          {result.shoe.extraLengthComment}
                        </span>
                      </div>
                    </div>
                    {result.shoe.insoleOverlapResult && (
                      <div className={`rounded-lg p-2 ${
                        result.shoe.insoleOverlapResult.canFit
                          ? "bg-green-100/50"
                          : "bg-amber-100/50"
                      }`}>
                        <p className="text-xs font-medium text-stone-700 mb-1">インソール・オーバーラップテスト</p>
                        <p className={`text-sm font-medium ${
                          result.shoe.insoleOverlapResult.canFit
                            ? "text-green-700"
                            : "text-amber-700"
                        }`}>
                          {result.shoe.insoleOverlapResult.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 診断結果 */}
            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">診断</h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <div>
                  <p className="font-medium text-stone-800">サマリー</p>
                  <p className="mt-2 text-stone-700">{result.summary}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-800">原因</p>
                  <p className="mt-2 text-stone-700">{result.cause}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-800">対応方針</p>
                  <p className="mt-2 text-stone-700">{result.action}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-800">患者説明</p>
                  <p className="mt-2 text-stone-700">{result.explanation}</p>
                </div>
              </div>
            </div>

            {/* 靴マッチング結果 */}
            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">推奨靴候補</h3>
              <p className="text-sm text-stone-600">現在の評価から必要な靴条件を作り、同じサイズ規格の登録靴だけを候補として比較しています。</p>
              {(() => {
                const requirement = generateShoeRequirements(form, result);
                const categoryShoes = DEFAULT_SHOES.filter((shoe) => shoe.category === form.category);
                const matches = matchMultipleShoes(categoryShoes, requirement).slice(0, 5);
                const fullMatches = matches.filter((m) => m.isFullMatch);
                const partialMatches = matches.filter((m) => !m.isFullMatch);
                return (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-4 text-sm text-stone-700 space-y-1">
                      <p className="font-medium text-stone-900">今回の靴条件</p>
                      <p>捨て寸の目安: {requirement.insoleLength.min}〜{requirement.insoleLength.max}mm</p>
                      <p>ドロップの目安: {requirement.drop.min}〜{requirement.drop.max}mm</p>
                      <p>優先条件: {requirement.reason.replace("評価結果に基づいた靴要件：", "") || "標準的な安定性を優先"}</p>
                    </div>
                    {fullMatches.length === 0 && partialMatches.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-stone-600">同じサイズ規格の候補がまだありません。靴データベースへ該当カテゴリの靴を追加してください。</p>
                      </div>
                    )}
                    {fullMatches.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-700">✓ 完全マッチ（{fullMatches.length}件）</h4>
                        {fullMatches.map((match) => (
                          <div key={match.shoeId} className="rounded-lg border border-green-300/50 bg-green-50/50 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-stone-900">{match.brand} / {match.model}</h5>
                                <p className="text-xs text-stone-500 mt-1">{match.shoeName}</p>
                                <p className="text-sm text-stone-700 mt-2">{match.reason}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-700">{match.matchScore}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {partialMatches.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-amber-700">◐ 調整すれば候補になる靴（{partialMatches.length}件）</h4>
                        {partialMatches.map((match) => (
                          <div key={match.shoeId} className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-stone-900">{match.brand} / {match.model}</h5>
                                <p className="text-xs text-stone-500 mt-1">{match.shoeName}</p>
                                <p className="text-sm text-stone-700 mt-2">{match.reason}</p>
                                {match.missingRequirements.length > 0 && (
                                  <div className="mt-2 text-xs text-amber-700">
                                    <p className="font-medium">不足している条件: {match.missingRequirements.join("、")}</p>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-amber-700">{match.matchScore}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 推奨事項 */}
            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
              <h3 className="font-serif text-2xl text-stone-900">靴選定のポイント</h3>
              <div className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="rounded-xl border border-stone-300/30 bg-white/40 p-4">
                    <h4 className="font-medium text-stone-900">{rec.title}</h4>
                    <p className="mt-2 text-sm text-stone-700">{rec.reason}</p>
                    {rec.examples && (
                      <ul className="mt-3 space-y-1 text-sm text-stone-600">
                        {rec.examples.map((ex, i) => (
                          <li key={i} className="flex gap-2">
                            <span>•</span>
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PDF ダウンロードボタン */}
            <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur">
              <h3 className="font-serif text-xl text-stone-900 mb-4">レポート出力</h3>
              <div className="flex gap-3 flex-col">
                <Button
                  onClick={async () => {
                    const patientName = form.patientName?.trim() || "患者名未入力";
                    try {
                      await generatePDFReport(patientName, form, result);
                    } catch (error) {
                      console.error("PDF出力に失敗しました", error);
                      window.alert("PDF出力に失敗しました。入力内容を確認し、再度お試しください。");
                    }
                  }}
                  className="w-full rounded-full bg-green-600 py-3 text-white hover:bg-green-700"
                >
                  📄 レポートをダウンロード（PDF形式）
                </Button>
                <Button
                  onClick={() => {
                    const pdfContent = generatePDFContent(form.patientName?.trim() || "患者名未入力", form, result);
                    downloadMarkdown(pdfContent, `足部評価レポート_${new Date().toISOString().split("T")[0]}.md`);
                  }}
                  variant="outline"
                  className="w-full rounded-full py-3"
                >
                  📝 レポートをダウンロード（Markdown形式）
                </Button>
              </div>
              <p className="text-xs text-stone-600 mt-3">
                PDF形式は印刷対応です。Markdown形式はテキストエディタで編集可能です。
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setActiveStep("step3")}
                variant="outline"
                className="flex-1 rounded-full border-stone-300/80 py-3"
              >
                戻る
              </Button>
              <Button
                onClick={() => setActiveStep("intro")}
                className="flex-1 rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800"
              >
                新規評価
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
