// 技能檢定共同科目 90006～90009（107 年起，甲級各 4 題／4 分）

export const COMMON_90006_MC = [
  { subjectCode: "90006", topic: "職業安全衛生", text: "事業單位對於勞工負有防止職業災害之責任，得推諉給承攬人。", answer: false, explain: "雇主不得因外包而免除防止職業災害責任。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "勞工對於工作場所立即危險，得在不危及其他工作者安全下自行撤離。", answer: true, explain: "緊急避難權應受保障，不得不利處分。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "職業安全衛生教育訓練紀錄保存與管理，與法遵無關。", answer: false, explain: "訓練紀錄為查核重要文件。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "雇主提供個人防護具後，即視為已完成該危害之工程控制。", answer: false, explain: "PPE 為最後防線，不能取代源頭改善。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "新進勞工、換崗勞工應接受安全衛生教育訓練後，始得從事作業。", answer: true, explain: "三新訓練為法定義務。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "115 年 7 月 1 日職安法修正後，職場霸凌防治納入法定範疇。", answer: true, explain: "新增第二章之一霸凌防治專章。", law2026: true },
  { subjectCode: "90006", topic: "職業安全衛生", text: "事業單位執行風險評估後，無須將結果告知受影響勞工。", answer: false, explain: "風評結果應告知並採取措施。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "承攬作業時，事業單位與承攬人就職安事項仍負防止災害責任。", answer: true, explain: "承攬管理不得完全免責。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "化學品危害資訊主要揭露文件為安全資料表（SDS）。", answer: true, explain: "GHS 標示與 SDS 為化學品管理核心。" },
  { subjectCode: "90006", topic: "職業安全衛生", text: "機械護罩可為保養方便而長期拆除運轉。", answer: false, explain: "不得任意移除防護裝置。" },
];

export const COMMON_90006_MS = [
  {
    subjectCode: "90006",
    topic: "職業安全衛生",
    text: "事業單位防止職業災害之基本義務包括？",
    options: ["實施教育訓練", "提供必要防護", "執行風險評估", "僅追求產能"],
    answer: [0, 1, 2],
    explain: "雇主須訓練、防護、風評等，不能僅追求產能。",
  },
  {
    subjectCode: "90006",
    topic: "職業安全衛生",
    text: "115 年修法後，雇主應規劃採行之危害預防措施包括？",
    options: ["肌肉骨骼疾病預防", "異常工作負荷促發疾病預防", "不法侵害（含霸凌）預防", "取消健康檢查"],
    answer: [0, 1, 2],
    explain: "第 6 條第二項新增三大面向預防措施。",
    law2026: true,
  },
  {
    subjectCode: "90006",
    topic: "職業安全衛生",
    text: "勞工安全衛生權利包括？",
    options: ["知悉危害", "參與改善", "緊急避難", "放棄拒絕危險作業權"],
    answer: [0, 1, 2],
    explain: "勞工享有知悉、參與、避難等權利。",
  },
];

export const COMMON_90007_MC = [
  { subjectCode: "90007", topic: "工作倫理", text: "從業人員不得隱匿重大職業安全衛生危害。", answer: true, explain: "誠信揭露為工作倫理核心。" },
  { subjectCode: "90007", topic: "工作倫理", text: "為達業績，可要求勞工未受訓即從事高風險作業。", answer: false, explain: "不得違反安全規定強迫冒險作業。" },
  { subjectCode: "90007", topic: "工作倫理", text: "職場霸凌申訴人不得因申訴受不利處分。", answer: true, explain: "115 年修法明定保護申訴人。", law2026: true },
  { subjectCode: "90007", topic: "工作倫理", text: "管理階層可要求下屬偽造安全檢查紀錄以通過稽核。", answer: false, explain: "偽造紀錄違反誠信與法規。" },
  { subjectCode: "90007", topic: "工作倫理", text: "發現同事未依 SOP 作業，基於安全應適時提醒或反映。", answer: true, explain: "安全文化需互相提醒。" },
  { subjectCode: "90007", topic: "工作倫理", text: "職業安全衛生管理師執業時，應誠實報備並維持專業獨立。", answer: true, explain: "管理師有報備及專業倫理義務。" },
  { subjectCode: "90007", topic: "工作倫理", text: "雇主知悉職場霸凌後，得解僱申訴人以維持團隊和諧。", answer: false, explain: "不得對申訴人不利處分。", law2026: true, trap: true },
  { subjectCode: "90007", topic: "工作倫理", text: "專業人員發現立即危隴情況，應優先保障人員安全再論產能。", answer: true, explain: "人命安全優先於產能。" },
  { subjectCode: "90007", topic: "工作倫理", text: "職災調查時，管理師得隱匿對雇主不利之證據。", answer: false, explain: "不得隱匿重大危害或調查證據。" },
  { subjectCode: "90007", topic: "工作倫理", text: "高階主管未出席復工審查，僅派基層代理，符合減災行動計畫精神。", answer: false, explain: "115 年減災計畫要求高階主管出席復工審查。", disaster2026: true, trap: true },
];

export const COMMON_90007_MS = [
  {
    subjectCode: "90007",
    topic: "工作倫理",
    text: "工作倫理與職業道德在職安領域之實踐包括？",
    options: ["誠實揭露危害", "保障申訴人", "偽造紀錄以通過稽核", "維護專業獨立"],
    answer: [0, 1, 3],
    explain: "誠信、保護申訴人、專業獨立為核心；偽造紀錄違反倫理。",
  },
  {
    subjectCode: "90007",
    topic: "工作倫理",
    text: "115 年修法職場霸凌防治，雇主知悉申訴後應？",
    options: ["避免申訴人再度受霸凌", "對申訴人不利解僱", "調查事件", "銷毀申訴紀錄"],
    answer: [0, 2],
    explain: "應防再發生並調查，不得不利處分或銷毀紀錄。",
    law2026: true,
  },
  {
    subjectCode: "90007",
    topic: "工作倫理",
    text: "建立安全文化，管理階層應？",
    options: ["帶頭遵守 SOP", "處罰通報危害者", "支持改善提案", "默許趕工省略防護"],
    answer: [0, 2],
    explain: "主管應以身作則並支持改善，不懲罰通報者。",
  },
];

export const COMMON_90008_MC = [
  { subjectCode: "90008", topic: "環境保護", text: "環境保護措施可能同時有助於降低職業危害風險。", answer: true, explain: "如減量、廢棄物管理可減少暴露。" },
  { subjectCode: "90008", topic: "環境保護", text: "事業單位可將有害廢液直接排入雨水下水道以節省成本。", answer: false, explain: "違反環保法規且危害勞工與環境。" },
  { subjectCode: "90008", topic: "環境保護", text: "化學品洩漏時，應依應變計畫圍堵並通報，避免擴大污染。", answer: true, explain: "環境與職安應變應整合。" },
  { subjectCode: "90008", topic: "環境保護", text: "職安與環保完全無關，無須整合管理。", answer: false, explain: "共同科目要求理解兩者關聯。" },
  { subjectCode: "90008", topic: "環境保護", text: "選用低毒性、低污染之原物料，可能同時減少勞工暴露。", answer: true, explain: "源頭減量為最佳策略。" },
  { subjectCode: "90008", topic: "環境保護", text: "事業單位對於廢棄物分類，僅為環保議題，與職安無涉。", answer: false, explain: "分類不當可能造成火災、化學危害。" },
  { subjectCode: "90008", topic: "環境保護", text: "改善通風除可減少化學暴露，亦有助於改善作業環境品質。", answer: true, explain: "工程控制具職安與環境雙重效益。" },
  { subjectCode: "90008", topic: "環境保護", text: "115 年職災檢討中，民間工程占營造職災比例高，與環境管理無關。", answer: false, explain: "工地管理、廢棄物、污染控制與職安相關。", disaster2026: true },
  { subjectCode: "90008", topic: "環境保護", text: "事業單位應依環保法規申報並管理有害事業廢棄物。", answer: true, explain: "廢棄物管理為環保法定義務。" },
  { subjectCode: "90008", topic: "環境保護", text: "為求產能，可將未分類廢棄物與一般垃圾混裝清運。", answer: false, explain: "混裝可能違法並增加災害風險。" },
];

export const COMMON_90008_MS = [
  {
    subjectCode: "90008",
    topic: "環境保護",
    text: "職安與環保整合管理之可行做法包括？",
    options: ["化學品減量", "廢棄物分類", "改善通風", "直接排放廢液"],
    answer: [0, 1, 2],
    explain: "減量、分類、通風可兼顧職安與環保；直接排放違法。",
  },
  {
    subjectCode: "90008",
    topic: "環境保護",
    text: "化學品管理同時涉及？",
    options: ["GHS 標示", "SDS 提供", "勞工暴露控制", "無須任何紀錄"],
    answer: [0, 1, 2],
    explain: "化學品管理需標示、SDS 及暴露控制。",
  },
  {
    subjectCode: "90008",
    topic: "環境保護",
    text: "環境保護與節能減碳之共同效益可能包括？",
    options: ["設備更新改善效率", "減少能源浪費", "增加不必要排放", "改善作業環境"],
    answer: [0, 1, 3],
    explain: "節能減碳常可連帶改善環境與作業條件。",
  },
];

export const COMMON_90009_MC = [
  { subjectCode: "90009", topic: "節能減碳", text: "節能減碳措施與職業安全衛生管理完全無關。", answer: false, explain: "115 學科共同科目要求理解其關聯。" },
  { subjectCode: "90009", topic: "節能減碳", text: "更新老舊空調或馬達，可能同時降低能耗與改善作業環境。", answer: true, explain: "設備更新具節能與職安雙效益。" },
  { subjectCode: "90009", topic: "節能減碳", text: "為省電關閉通風設備，即使造成化學暴露超標仍屬合法節能。", answer: false, explain: "節能不能以危害勞工健康為代價。" },
  { subjectCode: "90009", topic: "節能減碳", text: "導入 LED 照明，除節電外亦可降低熱負荷改善作業舒適度。", answer: true, explain: "節能措施可能改善熱環境。" },
  { subjectCode: "90009", topic: "節能減碳", text: "事業單位訂定節能目標時，無須考量職安風險。", answer: false, explain: "節能與職安應整合評估。" },
  { subjectCode: "90009", topic: "節能減碳", text: "減少不必要的設備空轉，屬節能減碳與安全管理兼具之作法。", answer: true, explain: "空轉除耗能亦可能增加機械風險。" },
  { subjectCode: "90009", topic: "節能減碳", text: "115 年減災行動計畫僅針對罰鍰，與節能無關。", answer: false, explain: "減災計畫聚焦營造墜落等，與管理改善相關。", disaster2026: true, trap: true },
  { subjectCode: "90009", topic: "節能減碳", text: "建築物改善外殼隔熱，可能同時降低空調負荷與改善溫熱環境。", answer: true, explain: "綠建築與作業環境可相輔相成。" },
  { subjectCode: "90009", topic: "節能減碳", text: "使用再生能源，與職安管理無任何交集。", answer: false, explain: "能源轉型涉及電氣安全、屋頂作業等職安議題。" },
  { subjectCode: "90009", topic: "節能減碳", text: "節能減碳應納入事業永續與職安整合管理。", answer: true, explain: "共同科目強調跨領域整合。" },
];

export const COMMON_90009_MS = [
  {
    subjectCode: "90009",
    topic: "節能減碳",
    text: "節能減碳措施若規劃不當，可能導致之職安風險包括？",
    options: ["關閉通風致暴露增加", "老舊設備強制運轉", "未評估電氣安全", "改善照明品質"],
    answer: [0, 1, 2],
    explain: "關閉通風、超載運轉、忽略電氣安全均有職安風險。",
  },
  {
    subjectCode: "90009",
    topic: "節能減碳",
    text: "節能減碳與職安雙贏之做法包括？",
    options: ["更新高效設備", "改善通風與空調", "為省電關閉防護", "減少空轉"],
    answer: [0, 1, 3],
    explain: "設備更新、通風改善、減少空轉可兼顧兩者。",
  },
  {
    subjectCode: "90009",
    topic: "節能減碳",
    text: "事業單位推動節能減碳時，應同時檢討？",
    options: ["作業環境", "化學暴露", "機械安全", "取消所有訓練"],
    answer: [0, 1, 2],
    explain: "節能措施須同步檢討環境、暴露、機械安全。",
  },
];
