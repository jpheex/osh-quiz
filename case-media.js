const TOPIC_IMAGES = {
  職業安全衛生法: "assets/cases/regulation.svg",
  墜落災害: "assets/cases/fall.svg",
  感電災害: "assets/cases/electric.svg",
  火災爆炸: "assets/cases/fire.svg",
  化學品管理: "assets/cases/chemical.svg",
  機械安全: "assets/cases/machine.svg",
  風險評估: "assets/cases/risk.svg",
  職業災害調查: "assets/cases/investigation.svg",
  教育訓練: "assets/cases/training.svg",
  個人防護具: "assets/cases/ppe.svg",
  作業環境: "assets/cases/environment.svg",
  OSH管理系統: "assets/cases/management.svg",
  共同科目: "assets/cases/ethics.svg",
  法規: "assets/cases/regulation.svg",
  專業課程: "assets/cases/site-work.svg",
  管理計畫: "assets/cases/emergency.svg",
  學科題型: "assets/cases/exam.svg",
  術科題型: "assets/cases/exam.svg",
};

const KEYWORD_IMAGES = [
  { kw: "八小時", image: "assets/cases/regulation.svg" },
  { kw: "二公尺", image: "assets/cases/fall.svg" },
  { kw: "局限空間", image: "assets/cases/confined.svg" },
  { kw: "安全資料表", image: "assets/cases/chemical.svg" },
  { kw: "SDS", image: "assets/cases/chemical.svg" },
  { kw: "承攬", image: "assets/cases/site-work.svg" },
  { kw: "上鎖", image: "assets/cases/electric.svg" },
  { kw: "護罩", image: "assets/cases/machine.svg" },
  { kw: "噪音", image: "assets/cases/noise.svg" },
  { kw: "粉塵", image: "assets/cases/fire.svg" },
  { kw: "搬運", image: "assets/cases/manual-lift.svg" },
  { kw: "焊接", image: "assets/cases/welding.svg" },
  { kw: "風險評估", image: "assets/cases/risk.svg" },
  { kw: "教育訓練", image: "assets/cases/training.svg" },
  { kw: "緊急應變", image: "assets/cases/emergency.svg" },
  { kw: "缺氧", image: "assets/cases/confined.svg" },
  { kw: "吊掛", image: "assets/cases/crane.svg" },
  { kw: "中暑", image: "assets/cases/heat.svg" },
];

const DEFAULT_IMAGE = "assets/cases/default.svg";

// 每張示意圖的「缺失標註」區域。座標為 viewBox（400×240）換算之百分比。
// 換算：x%=x/4, y%=y/2.4, w%=w/4, h%=h/2.4
// type: "bad"＝缺失／危害部位（紅框）、"good"＝正確示範（綠框）。
const IMAGE_HOTSPOTS = {
  "assets/cases/fall.svg": [
    { x: 74.5, y: 21.7, w: 13, h: 34.2, type: "bad", label: "未使用安全帶", detail: "作業人員位於高處卻未繫安全帶與掛鉤，一旦失足將直接墜落。" },
    { x: 9.5, y: 28.3, w: 43.8, h: 24.2, type: "bad", label: "平台缺護欄", detail: "鷹架工作平台邊緣未設置護欄與安全網，屬重大墜落風險。" },
  ],
  "assets/cases/electric.svg": [
    { x: 30, y: 12.5, w: 40, h: 75, type: "bad", label: "帶電檢修", detail: "未斷電即開啟配電箱檢修，接觸帶電部位造成感電。" },
    { x: 43.8, y: 60.4, w: 12.5, h: 20.8, type: "bad", label: "缺能量隔離", detail: "沒有執行斷電、上鎖、掛牌等能量隔離程序。" },
  ],
  "assets/cases/fire.svg": [
    { x: 31.3, y: 24.2, w: 37.5, h: 31.3, type: "bad", label: "點火源與粉塵", detail: "可燃粉塵或蒸氣累積遇點火源引發爆炸，作業區未清除粉塵、未管制火源。" },
  ],
  "assets/cases/chemical.svg": [
    { x: 19.5, y: 20, w: 61.3, h: 52.1, type: "bad", label: "標示不清／混放", detail: "化學品未依規定標示，不同性質化學品混放，且未提供安全資料表。" },
  ],
  "assets/cases/machine.svg": [
    { x: 40.5, y: 38.3, w: 19, h: 31.7, type: "bad", label: "危險轉動部位", detail: "機械危險轉動部位未加裝護罩或連動裝置，易造成捲夾。" },
    { x: 14.5, y: 24.2, w: 13.5, h: 60, type: "good", label: "護罩（正確）", detail: "左側綠色護罩為正確防護，應保持裝設，不得為趕工任意拆除。" },
  ],
  "assets/cases/confined.svg": [
    { x: 42, y: 11.7, w: 16, h: 71.7, type: "bad", label: "局限空間", detail: "進入局限空間前未檢測氧氣與有害氣體、未辦理許可，恐缺氧或中毒。" },
  ],
  "assets/cases/noise.svg": [
    { x: 36.3, y: 45, w: 27.5, h: 35.4, type: "bad", label: "高噪音暴露", detail: "長期暴露於高噪音卻未配戴防音防護具，導致聽力損失。" },
  ],
  "assets/cases/manual-lift.svg": [
    { x: 36.3, y: 36.7, w: 27.5, h: 39.6, type: "bad", label: "彎腰搬運", detail: "彎腰直腿搬運重物，脊椎受力過大，易造成下背部傷害。" },
  ],
  "assets/cases/welding.svg": [
    { x: 34.5, y: 34.2, w: 31, h: 45, type: "bad", label: "焊接火花", detail: "焊接火花與強光四散，附近未清除可燃物、人員未防護。" },
  ],
  "assets/cases/crane.svg": [
    { x: 29.5, y: 20, w: 41.3, h: 52.1, type: "bad", label: "吊掛物下方", detail: "人員位於吊掛物下方或搭乘吊具，一旦鋼索斷裂即造成災害。" },
  ],
  "assets/cases/heat.svg": [
    { x: 37, y: 15.8, w: 26, h: 68.8, type: "bad", label: "高溫環境", detail: "高溫作業未調整作息與補充水分，易熱危害中暑。" },
  ],
  "assets/cases/ppe.svg": [
    { x: 38.8, y: 34.2, w: 22.5, h: 32.5, type: "good", label: "個人防護具", detail: "防護具為最後防線，應依危害選用並確實佩戴、定期檢查。" },
  ],
  "assets/cases/ethics.svg": [
    { x: 32.5, y: 30, w: 35, h: 36.7, type: "good", label: "誠實揭露", detail: "如實揭露作業風險、不隱匿危害，是建立安全文化的基礎。" },
  ],
};

export function resolveCaseImage(question) {
  if (question.caseImage) return question.caseImage;
  const kwHit = KEYWORD_IMAGES.find((item) => question.text.includes(item.kw));
  if (kwHit) return kwHit.image;
  return TOPIC_IMAGES[question.topic] || DEFAULT_IMAGE;
}

export function resolveHotspots(image) {
  return IMAGE_HOTSPOTS[image] || [];
}

export function buildCase(text, question, imageOverride) {
  const image = imageOverride || resolveCaseImage(question);
  return {
    text,
    image,
    hotspots: resolveHotspots(image),
  };
}
