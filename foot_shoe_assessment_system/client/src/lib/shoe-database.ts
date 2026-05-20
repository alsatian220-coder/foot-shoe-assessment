/*
Design reminder for this file:
- Provides a comprehensive shoe database with multiple brands and models.
- Used for matching assessment results with recommended shoes.
*/

export interface ShoeSpec {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: "婦人" | "紳士" | "子ども";
  size: string;
  insoleLength: number;
  heelHeight: number;
  drop: number;
  heelCounterScore: 0 | 1 | 2;
  landingStabilityScore: 0 | 1 | 2;
  fixationScore: 0 | 1 | 2;
  torsionScore: 0 | 1 | 2;
  shankScore: 0 | 1 | 2;
  flexPointScore: 0 | 1 | 2;
  toeSpringScore: 0 | 1 | 2;
  rockerScore: 0 | 1 | 2;
  weightScore: 0 | 1 | 2;
  notes: string;
  createdAt: string;
}

// Default shoe database with multiple brands
export const DEFAULT_SHOES: ShoeSpec[] = [
  // ASICS - Women
  {
    id: "shoe-asics-001",
    name: "ウォーキングシューズ",
    brand: "ASICS",
    model: "GEL-MISSION",
    category: "婦人",
    size: "23.5",
    insoleLength: 240,
    heelHeight: 30,
    drop: 12,
    heelCounterScore: 2,
    landingStabilityScore: 2,
    fixationScore: 2,
    torsionScore: 1,
    shankScore: 1,
    flexPointScore: 2,
    toeSpringScore: 1,
    rockerScore: 2,
    weightScore: 2,
    notes: "安定性重視の設計。回内足に適している。",
    createdAt: "2026-04-01",
  },
  {
    id: "shoe-asics-002",
    name: "ランニングシューズ",
    brand: "ASICS",
    model: "GEL-KAYANO",
    category: "婦人",
    size: "23.5",
    insoleLength: 235,
    heelHeight: 28,
    drop: 10,
    heelCounterScore: 2,
    landingStabilityScore: 2,
    fixationScore: 2,
    torsionScore: 2,
    shankScore: 2,
    flexPointScore: 2,
    toeSpringScore: 2,
    rockerScore: 2,
    weightScore: 1,
    notes: "高機能ランニングシューズ。前足部剛性が高い。",
    createdAt: "2026-04-01",
  },

  // New Balance - Women
  {
    id: "shoe-nb-001",
    name: "ウォーキングシューズ",
    brand: "New Balance",
    model: "WW928",
    category: "婦人",
    size: "23.5",
    insoleLength: 238,
    heelHeight: 32,
    drop: 12,
    heelCounterScore: 2,
    landingStabilityScore: 2,
    fixationScore: 2,
    torsionScore: 1,
    shankScore: 1,
    flexPointScore: 1,
    toeSpringScore: 1,
    rockerScore: 1,
    weightScore: 2,
    notes: "幅広設計。横広タイプの足に適している。",
    createdAt: "2026-04-01",
  },
  {
    id: "shoe-nb-002",
    name: "スニーカー",
    brand: "New Balance",
    model: "574",
    category: "婦人",
    size: "23.5",
    insoleLength: 242,
    heelHeight: 26,
    drop: 8,
    heelCounterScore: 1,
    landingStabilityScore: 1,
    fixationScore: 1,
    torsionScore: 1,
    shankScore: 0,
    flexPointScore: 1,
    toeSpringScore: 0,
    rockerScore: 1,
    weightScore: 1,
    notes: "カジュアル向け。クッション性重視。",
    createdAt: "2026-04-01",
  },

  // Mizuno - Women
  {
    id: "shoe-mizuno-001",
    name: "ウォーキングシューズ",
    brand: "Mizuno",
    model: "LD40",
    category: "婦人",
    size: "23.5",
    insoleLength: 237,
    heelHeight: 31,
    drop: 11,
    heelCounterScore: 2,
    landingStabilityScore: 2,
    fixationScore: 2,
    torsionScore: 2,
    shankScore: 1,
    flexPointScore: 2,
    toeSpringScore: 1,
    rockerScore: 2,
    weightScore: 2,
    notes: "日本人の足に合わせた設計。安定性が高い。",
    createdAt: "2026-04-01",
  },

  // ASICS - Men
  {
    id: "shoe-asics-m001",
    name: "ウォーキングシューズ",
    brand: "ASICS",
    model: "GEL-MISSION",
    category: "紳士",
    size: "26.5",
    insoleLength: 270,
    heelHeight: 30,
    drop: 12,
    heelCounterScore: 2,
    landingStabilityScore: 2,
    fixationScore: 2,
    torsionScore: 1,
    shankScore: 1,
    flexPointScore: 2,
    toeSpringScore: 1,
    rockerScore: 2,
    weightScore: 2,
    notes: "安定性重視の設計。回内足に適している。",
    createdAt: "2026-04-01",
  },

  // New Balance - Men
  {
    id: "shoe-nb-m001",
    name: "ウォーキングシューズ",
    brand: "New Balance",
    model: "MW928",
    category: "紳士",
    size: "26.5",
    insoleLength: 268,
    heelHeight: 32,
    drop: 12,
    heelCounterScore: 2,
    landingStabilityScore: 2,
    fixationScore: 2,
    torsionScore: 1,
    shankScore: 1,
    flexPointScore: 1,
    toeSpringScore: 1,
    rockerScore: 1,
    weightScore: 2,
    notes: "幅広設計。横広タイプの足に適している。",
    createdAt: "2026-04-01",
  },
];

// Get shoes by category
export function getShoesByCategory(category: "婦人" | "紳士" | "子ども", shoes: ShoeSpec[]): ShoeSpec[] {
  return shoes.filter((shoe) => shoe.category === category);
}

// Get shoes by brand
export function getShoesByBrand(brand: string, shoes: ShoeSpec[]): ShoeSpec[] {
  return shoes.filter((shoe) => shoe.brand === brand);
}

// Get unique brands
export function getUniqueBrands(shoes: ShoeSpec[]): string[] {
  return Array.from(new Set(shoes.map((shoe) => shoe.brand))).sort();
}

// Calculate total shoe score
export function calculateShoeScore(shoe: ShoeSpec): number {
  return (
    shoe.heelCounterScore +
    shoe.landingStabilityScore +
    shoe.fixationScore +
    shoe.torsionScore +
    shoe.shankScore +
    shoe.flexPointScore +
    shoe.toeSpringScore +
    shoe.rockerScore +
    shoe.weightScore
  );
}
