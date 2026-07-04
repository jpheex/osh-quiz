// 真實案例照片庫（含法規對應語音講解腳本）
// 圖片來源：NIOSH / Wikimedia Commons（美國聯邦政府作品，Public Domain）
// 熱點座標參考 Open edX xblock-image-explorer 的百分比定位方式

export const PHOTO_CASE_LIBRARY = [
  {
    id: "fall-no-harness-niosh",
    topics: ["墜落災害", "職業安全衛生法", "法規", "專業課程", "個人防護具"],
    keywords: ["二公尺", "安全帶", "墜落", "高處", "護欄", "防墜", "鋼構", "鷹架"],
    image: "assets/cases/photos/fall-no-harness.jpg",
    credit: "NIOSH／Wikimedia Commons（Public Domain）",
    text: "美國高樓鋼構工地，兩名工人站立於狹窄工字梁上協助吊放鋼梁。右側工人未配戴安全帶，左側雖有背負式安全帶但未掛勾，作業面亦無護欄與安全網。",
    regulation: "《職業安全衛生設施規則》第238條",
    hotspots: [
      {
        x: 60,
        y: 40,
        w: 17,
        h: 30,
        type: "bad",
        label: "未配戴安全帶",
        detail: "右側工人站立於高處工字梁，身上未見安全帶與掛勾。雇主應使勞工於高處作業使用安全帶等防墜具。",
        regulation: "《職業安全衛生設施規則》第238條",
      },
      {
        x: 26,
        y: 38,
        w: 17,
        h: 32,
        type: "bad",
        label: "安全帶未掛勾",
        detail: "左側工人雖穿戴背負式安全帶，但未連接掛鉤與錨點，等同未落實防墜保護。",
        regulation: "《職業安全衛生設施規則》第238條",
      },
      {
        x: 8,
        y: 56,
        w: 84,
        h: 14,
        type: "bad",
        label: "作業面缺護欄",
        detail: "狹窄工字梁邊緣未設置護欄、安全網或水平生命線，勞工一旦失足將直接墜落。",
        regulation: "《職業安全衛生設施規則》第238條",
      },
    ],
  },
  {
    id: "fall-rebar-beijing-niosh",
    topics: ["墜落災害", "專業課程", "職業安全衛生法", "法規"],
    keywords: ["二公尺", "鷹架", "鋼筋", "安全帶", "護欄", "墜落", "平台"],
    image: "assets/cases/photos/fall-rebar-beijing.jpg",
    credit: "NIOSH／Wikimedia Commons（Public Domain）",
    text: "北京工地，兩名工人蹲坐在狹窄木板上綁紮鋼筋，約三層樓高。兩人均未使用安全帶，平台無護欄，且僅以兩塊木板作為工作面。",
    regulation: "《職業安全衛生設施規則》第238條",
    hotspots: [
      {
        x: 30,
        y: 40,
        w: 40,
        h: 30,
        type: "bad",
        label: "高處未使用安全帶",
        detail: "兩名工人於約三層樓高處作業，均未配戴並使用安全帶，違反高處作業防墜規定。",
        regulation: "《職業安全衛生設施規則》第238條",
      },
      {
        x: 14,
        y: 50,
        w: 72,
        h: 12,
        type: "bad",
        label: "平台缺護欄",
        detail: "工作平台邊緣未設上欄杆、中欄杆及腳趾板，勞工易失足墜落。",
        regulation: "《職業安全衛生設施規則》第238條",
      },
      {
        x: 18,
        y: 58,
        w: 64,
        h: 18,
        type: "bad",
        label: "工作面過窄",
        detail: "僅以兩塊窄木板作為工作面，蹲姿綁紮鋼筋時易失衡，應改善平台寬度與穩固性。",
        regulation: "《職業安全衛生設施規則》第238條",
      },
    ],
  },
];

function scorePhotoCase(question, entry) {
  let score = 0;
  if (entry.topics.includes(question.topic)) score += 3;
  entry.keywords.forEach((kw) => {
    if (question.text.includes(kw)) score += 2;
  });
  return score;
}

export function pickPhotoCasesForQuestion(question, limit = 2) {
  const ranked = PHOTO_CASE_LIBRARY.map((entry) => ({
    entry,
    score: scorePhotoCase(question, entry),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return [];

  return ranked.slice(0, limit).map(({ entry }) => ({
    id: entry.id,
    text: entry.text,
    image: entry.image,
    credit: entry.credit,
    regulation: entry.regulation,
    hotspots: entry.hotspots,
  }));
}

export function photoCaseToNarrationScript(caseItem) {
  const parts = [caseItem.text];
  (caseItem.hotspots || []).forEach((h) => {
    const lead = h.type === "good" ? "正確示範" : "缺失部位";
    parts.push(`${lead}：${h.label}。${h.detail}法規依據：${h.regulation || caseItem.regulation}。`);
  });
  return parts.join(" ");
}
