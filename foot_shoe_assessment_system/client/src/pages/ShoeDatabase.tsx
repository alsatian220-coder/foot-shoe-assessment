import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoeSpec, DEFAULT_SHOES, getUniqueBrands } from "@/lib/shoe-database";

/*
Design reminder for this file:
- Design philosophy: Japanese Clinical Editorial.
- Shoe database is a management interface for Shō to input and manage shoe specs.
- Prioritize clarity, data integrity, and clinical relevance.
- Support multiple brands and models with search/filter capabilities.
*/

export default function ShoeDatabase() {
  const [shoes, setShoes] = useState<ShoeSpec[]>(DEFAULT_SHOES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShoeSpec>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Filter shoes based on search and filters
  const filteredShoes = shoes.filter((shoe) => {
    const matchesSearch =
      shoe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoe.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoe.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === "all" || shoe.brand === filterBrand;
    const matchesCategory = filterCategory === "all" || shoe.category === filterCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const handleAddShoe = () => {
    const newShoe: ShoeSpec = {
      id: `shoe-${Date.now()}`,
      name: "",
      brand: "",
      model: "",
      category: "婦人",
      size: "",
      insoleLength: 240,
      heelHeight: 30,
      drop: 12,
      heelCounterScore: 1,
      landingStabilityScore: 1,
      fixationScore: 1,
      torsionScore: 1,
      shankScore: 1,
      flexPointScore: 1,
      toeSpringScore: 1,
      rockerScore: 1,
      weightScore: 1,
      notes: "",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setShoes([...shoes, newShoe]);
    setEditingId(newShoe.id);
    setFormData(newShoe);
  };

  const handleEdit = (shoe: ShoeSpec) => {
    setEditingId(shoe.id);
    setFormData(shoe);
  };

  const handleSave = () => {
    if (!editingId) return;
    setShoes(shoes.map((s) => (s.id === editingId ? ({ ...formData } as ShoeSpec) : s)));
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm("この靴を削除してもよろしいですか？")) {
      setShoes(shoes.filter((s) => s.id !== id));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleInputChange = (key: keyof ShoeSpec, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const brands = getUniqueBrands(shoes);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2e8_0%,#f1ece2_48%,#ede6dc_100%)] text-stone-900">
      <div className="container px-4 py-16">
        <div className="max-w-7xl">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <h1 className="font-serif text-4xl tracking-[-0.02em] text-stone-900">靴データベース管理</h1>
            <p className="text-sm text-stone-600">推奨靴の情報を入力・管理します。診断結果とマッチングするために使用されます。</p>
          </div>

          {/* Add Button */}
          <div className="mb-8">
            <Button
              onClick={handleAddShoe}
              className="rounded-full bg-stone-900 px-8 py-3 text-white hover:bg-stone-800"
            >
              + 新しい靴を追加
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700">検索</label>
                <Input
                  type="text"
                  placeholder="靴名、ブランド、モデルで検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2 rounded-lg border border-stone-300/50 bg-white/40 px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">ブランド</label>
                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger className="mt-2 rounded-lg border border-stone-300/50 bg-white/40">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">カテゴリ</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="mt-2 rounded-lg border border-stone-300/50 bg-white/40">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="婦人">婦人</SelectItem>
                    <SelectItem value="紳士">紳士</SelectItem>
                    <SelectItem value="子ども">子ども</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-stone-600">
              {filteredShoes.length} 件の靴が見つかりました
            </div>
          </div>

          {/* Shoes Table */}
          <div className="rounded-2xl border border-stone-300/50 bg-white/60 p-6 backdrop-blur overflow-x-auto">
            {filteredShoes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-stone-600">靴がまだ登録されていません。</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-300/30">
                    <th className="px-4 py-3 text-left font-medium text-stone-700">靴名</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">ブランド</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">モデル</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">カテゴリ</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">中敷き長</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">ドロップ</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShoes.map((shoe) => (
                    <tr key={shoe.id} className="border-b border-stone-300/20 hover:bg-stone-50/30">
                      <td className="px-4 py-3 text-stone-900">{shoe.name}</td>
                      <td className="px-4 py-3 text-stone-700">{shoe.brand}</td>
                      <td className="px-4 py-3 text-stone-700">{shoe.model}</td>
                      <td className="px-4 py-3 text-stone-700">{shoe.category}</td>
                      <td className="px-4 py-3 text-stone-700">{shoe.insoleLength}mm</td>
                      <td className="px-4 py-3 text-stone-700">{shoe.drop}mm</td>
                      <td className="px-4 py-3 space-x-2">
                        <Button
                          onClick={() => handleEdit(shoe)}
                          variant="outline"
                          size="sm"
                          className="rounded-full border-stone-300/80 text-stone-700 hover:bg-stone-100"
                        >
                          編集
                        </Button>
                        <Button
                          onClick={() => handleDelete(shoe.id)}
                          variant="outline"
                          size="sm"
                          className="rounded-full border-red-300/80 text-red-700 hover:bg-red-50"
                        >
                          削除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={editingId !== null} onOpenChange={(open) => !open && handleCancel()}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>靴情報を編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700">靴名</label>
                    <Input
                      value={(formData.name as string) || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="mt-1 rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">ブランド</label>
                    <Input
                      value={(formData.brand as string) || ""}
                      onChange={(e) => handleInputChange("brand", e.target.value)}
                      className="mt-1 rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">モデル</label>
                    <Input
                      value={(formData.model as string) || ""}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      className="mt-1 rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">カテゴリ</label>
                    <Select
                      value={(formData.category as string) || "婦人"}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger className="mt-1 rounded-lg border border-stone-300/50 bg-white/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="婦人">婦人</SelectItem>
                        <SelectItem value="紳士">紳士</SelectItem>
                        <SelectItem value="子ども">子ども</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700">中敷き長（mm）</label>
                    <Input
                      type="number"
                      value={(formData.insoleLength as number) || 0}
                      onChange={(e) => handleInputChange("insoleLength", parseInt(e.target.value))}
                      className="mt-1 rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">踵高（mm）</label>
                    <Input
                      type="number"
                      value={(formData.heelHeight as number) || 0}
                      onChange={(e) => handleInputChange("heelHeight", parseInt(e.target.value))}
                      className="mt-1 rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">ドロップ（mm）</label>
                    <Input
                      type="number"
                      value={(formData.drop as number) || 0}
                      onChange={(e) => handleInputChange("drop", parseInt(e.target.value))}
                      className="mt-1 rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2"
                    />
                  </div>
                </div>

                {/* Shoe Scores */}
                <div className="space-y-2">
                  <h3 className="font-medium text-stone-700">靴スコア（0: 弱い、1: 中間、2: 良い）</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "heelCounterScore", label: "ヒールカウンター" },
                      { key: "landingStabilityScore", label: "接地安定性" },
                      { key: "fixationScore", label: "固定性" },
                      { key: "torsionScore", label: "トーション" },
                      { key: "shankScore", label: "シャンク" },
                      { key: "flexPointScore", label: "屈曲位置" },
                      { key: "toeSpringScore", label: "トゥスプリング" },
                      { key: "rockerScore", label: "ロッカー" },
                      { key: "weightScore", label: "重量" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-stone-700">{label}</label>
                        <Select
                          value={String((formData[key as keyof ShoeSpec] as number) || 1)}
                          onValueChange={(value) => handleInputChange(key as keyof ShoeSpec, parseInt(value))}
                        >
                          <SelectTrigger className="mt-1 rounded-lg border border-stone-300/50 bg-white/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-stone-700">備考</label>
                  <textarea
                    value={(formData.notes as string) || ""}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300/50 bg-white/40 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              {/* Dialog Actions */}
              <div className="flex gap-4 justify-end mt-6">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-full border-stone-300/80 text-stone-700 hover:bg-stone-100"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSave}
                  className="rounded-full bg-stone-900 text-white hover:bg-stone-800"
                >
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
